/**
 * SZEKFOGLALO - ketjatekos teruletfoglalo az iroda alaprajzan
 *
 * Ket kollega fest az irodaban. Aki kilep a sajat teruleterol, festekcsikot
 * huz maga utan. Amint a csik bezarul (a sajat teruletre vagy a SAJAT CSIKJARA
 * erve), minden olyan resz az ove lesz, amit mar csak az o szine hatarol.
 *
 * FONTOS: ez a fajl SEHOL nem olvas kontrollert, csak billentyuzetet. A
 * padgombok valodi billentyuesemenyt kuldenek. Lasd AGENTS.md.
 */

import { pads } from './gamepad.js';
import { padGate } from './pad-gate.js';
import {
  W, H, CELL, GW, GH, KOR_HOSSZ, RIADO_TOL,
  JATEKOS_SEBESSEG, NPC_SEBESSEG, PATKI_SEBESSEG, VARO_SEBESSEG, RIADO_SZORZO,
  ECSET, SERTHETETLEN,
  PAL, CSAPAT, NPC_SZIN, PATKI_SZIN, VARO_SZIN,
  URES, terKod, csikKod, rgb, mulberry32,
  GOMB, START, IRANY, gombKod,
} from './config.js';
import {
  palyaEpit, falakRajz, padloRajz, feliratRajz, szobaKozep, logoPixel,
  BAZIS, BAZIS_MERET, SZOBA_KUSZOB,
} from './palya.js';
import {
  nevsorBetolt, kepBetolt, jellemzokKerd, figuraKerd,
  SPRITE_W, SPRITE_H,
} from './karakter.js';
import { drawText } from './font.js';
import { hatterInit, hatterRajz } from './hatter.js';
import { cimkepernyo } from './splash.js';
import { karakterValaszto } from './valaszto.js';
import * as zene from './zene.js';

const PATKI_ID = 'ferenczi_balazs';
const VARO_ID = 'varjasy_gabor';
const NPC_DB = 7;

/** Utkozes utan ennyi ideig szedul a jatekos: nem mozog, csillagok forognak. */
const KABULAT = 1.7;
/** A parbaj hossza: ennyi ido alatt kell megnyomni a szines gombot. */
const PARBAJ_IDO = 2.6;
/** Ket parbaj kozott ennyi szunet, hogy ne ragadjanak ossze. */
const PARBAJ_SZUNET = 1.6;

// ---------------------------------------------------------------- billentyuk

const nyomva = new Set();
let mostNyomott = [];

document.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  nyomva.add(e.code);
  mostNyomott.push(e.code);
  if (e.isTrusted && e.code === 'KeyM') zene.nemitas(!zene.nemitva());
  if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
});
document.addEventListener('keyup', (e) => nyomva.delete(e.code));
window.addEventListener('blur', () => nyomva.clear());

// ---------------------------------------------------------------- vaszon

const canvas = document.getElementById('jatek');
canvas.width = W;
canvas.height = H;
const c = canvas.getContext('2d');
c.imageSmoothingEnabled = false;

/** A kep mindig kitolti az ablakot, aranytartoan, keret nelkul. */
function igazit() {
  const s = Math.min(window.innerWidth / W, window.innerHeight / H);
  canvas.style.width = Math.floor(W * s) + 'px';
  canvas.style.height = Math.floor(H * s) + 'px';
}
window.addEventListener('resize', igazit);
igazit();

// ---------------------------------------------------------------- palya

const { fal, szobak, padloDb } = palyaEpit();
const falCv = falakRajz(fal, szobak);
const feliratCv = feliratRajz(szobak);
let padloCv = null;          // a logo betoltese utan keszul el

const racs = new Uint8Array(GW * GH);
const csikIdo = new Float32Array(GW * GH);

const terCv = document.createElement('canvas');
terCv.width = GW;
terCv.height = GH;
const terCtx = terCv.getContext('2d');
const terKep = terCtx.createImageData(GW, GH);

const SZIN = [
  null,
  rgb(CSAPAT[0].ter), rgb(CSAPAT[1].ter),
  rgb(CSAPAT[0].csik), rgb(CSAPAT[1].csik),
];

// ---------------------------------------------------------------- allapot

let jatekosok = [];
let npck = [];
let kollegak = [];
const jellemzok = new Map();
let logoKep = null;
let logoCv = null;

let ido = 0;
let hatra = KOR_HOSSZ;
let vege = false;
let vegeAnim = 0;
let riado = false;
let uzenetek = [];
let reszek = [];             // robbanas-darabkak
let kave = null;
let kaveIdo = 6;
let kihivas = null;
let kihivasIdo = 10;
let parbaj = null;
let parbajSzunet = 0;
let szobaDb = [0, 0];
let rezges = 0;

const rng = mulberry32(7);

// ---------------------------------------------------------------- segedek

const cellaIdx = (gx, gy) => gy * GW + gx;
const cellaAt = (x, y) => {
  const gx = (x / CELL) | 0;
  const gy = (y / CELL) | 0;
  if (gx < 0 || gy < 0 || gx >= GW || gy >= GH) return -1;
  return gy * GW + gx;
};

function szabad(x, y, r) {
  for (const [dx, dy] of [[-r, -r], [r, -r], [-r, r], [r, r], [0, 0]]) {
    const i = cellaAt(x + dx, y + dy);
    if (i < 0 || fal[i]) return false;
  }
  return true;
}

function uzenet(szoveg, szin, tartam = 1.8) {
  uzenetek.push({ szoveg: szoveg.toUpperCase(), szin, t: tartam });
}

/** Robbanas: darabkak szetrepulnek egy pontbol. */
function bumm(x, y, szin, db = 18, ero = 1) {
  for (let i = 0; i < db; i++) {
    const sz = rng() * Math.PI * 2;
    const v = (50 + rng() * 150) * ero;
    reszek.push({
      x, y,
      vx: Math.cos(sz) * v,
      vy: Math.sin(sz) * v,
      t: 0.35 + rng() * 0.45,
      max: 0.8,
      m: 2 + ((rng() * 3) | 0),
      szin,
    });
  }
  rezges = Math.max(rezges, 7 * ero);
}

// ---------------------------------------------------------------- terulet

function bazisRak(i) {
  const b = BAZIS[i];
  const kod = terKod(i);
  for (let gy = b.y - BAZIS_MERET; gy <= b.y + BAZIS_MERET; gy++) {
    for (let gx = b.x - BAZIS_MERET; gx <= b.x + BAZIS_MERET; gx++) {
      if (gx < 0 || gy < 0 || gx >= GW || gy >= GH) continue;
      const k = cellaIdx(gx, gy);
      if (!fal[k]) racs[k] = kod;
    }
  }
}

function pacni(i, x, y) {
  const kod = csikKod(i);
  const enyem = terKod(i);
  const gx = (x / CELL) | 0;
  const gy = (y / CELL) | 0;
  const r = Math.ceil(ECSET);
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > ECSET * ECSET + 0.35) continue;
      const cx = gx + dx;
      const cy = gy + dy;
      if (cx < 0 || cy < 0 || cx >= GW || cy >= GH) continue;
      const k = cellaIdx(cx, cy);
      if (fal[k] || racs[k] === enyem || racs[k] === kod) continue;
      racs[k] = kod;
      csikIdo[k] = ido;
      jatekosok[i].csik.push(k);
    }
  }
}

function ecsetel(i, x0, y0, x1, y1) {
  const t = Math.hypot(x1 - x0, y1 - y0);
  const n = Math.max(1, Math.ceil(t / (CELL * 0.5)));
  for (let s = 1; s <= n; s++) {
    pacni(i, x0 + (x1 - x0) * (s / n), y0 + (y1 - y0) * (s / n));
  }
}

function csikTorol(i) {
  const kod = csikKod(i);
  for (const k of jatekosok[i].csik) if (racs[k] === kod) racs[k] = URES;
  jatekosok[i].csik = [];
}

const elert = new Uint8Array(GW * GH);
const verem = new Int32Array(GW * GH);

/**
 * A csik bezarasa.
 *
 * A csik eloszor teruletté valik, utana a palya szelerol indulo arasztassal
 * megkeressuk, mi az, ami MAR NEM erheto el a jatekos szinet megkerulve.
 * Minden ilyen resz az ove lesz. Igy mindegy, hogy a sajat teruletere vagy a
 * sajat csikjara ert vissza: ami korbe van kerítve, az bejon.
 *
 * A FAL atjarhato az arasztasnak: kulonben minden szoba magatol bezarodna.
 */
function kitolt(i) {
  const enyem = terKod(i);
  const kod = csikKod(i);
  for (const k of jatekosok[i].csik) if (racs[k] === kod) racs[k] = enyem;
  jatekosok[i].csik = [];

  elert.fill(0);
  let vn = 0;
  const tol = (x, y) => {
    if (x < 0 || y < 0 || x >= GW || y >= GH) return;
    const k = y * GW + x;
    if (elert[k] || racs[k] === enyem) return;
    elert[k] = 1;
    verem[vn++] = k;
  };
  for (let x = 0; x < GW; x++) { tol(x, 0); tol(x, GH - 1); }
  for (let y = 0; y < GH; y++) { tol(0, y); tol(GW - 1, y); }

  while (vn > 0) {
    const k = verem[--vn];
    const x = k % GW;
    const y = (k / GW) | 0;
    tol(x - 1, y); tol(x + 1, y); tol(x, y - 1); tol(x, y + 1);
  }

  let szerzett = 0;
  for (let k = 0; k < racs.length; k++) {
    if (elert[k] || fal[k] || racs[k] === enyem) continue;
    racs[k] = enyem;
    szerzett++;
  }

  // Ha a masik jatekos csikjat elnyeltuk, az ő csikja elszakad.
  const masik = 1 - i;
  const mkod = csikKod(masik);
  if (jatekosok[masik].csik.some((k) => racs[k] !== mkod)) {
    csikTorol(masik);
    uzenet(jatekosok[masik].kollega.becenev + ' csikja elszakadt', CSAPAT[masik].jel, 1.4);
  }

  if (szerzett > 0) {
    zene.hangKitolt();
    const j = jatekosok[i];
    bumm(j.x, j.y, CSAPAT[i].csik, 10, 0.6);
  }
  szobaEllenoriz(i);
  return szerzett;
}

function szobaEllenoriz(i) {
  const enyem = terKod(i);
  for (const sz of szobak) {
    if (sz.teljes === i) continue;
    let db = 0;
    for (const k of sz.cellak) if (racs[k] === enyem) db++;
    if (db / sz.db < SZOBA_KUSZOB) continue;
    for (const k of sz.cellak) racs[k] = enyem;
    if (sz.teljes >= 0) szobaDb[sz.teljes]--;
    sz.teljes = i;
    szobaDb[i]++;
    zene.hangSzoba();
    const kp = szobaKozep(sz);
    bumm(kp.x, kp.y, CSAPAT[i].jel, 26, 1.1);
    uzenet(sz.felirat + ' elfoglalva', CSAPAT[i].jel, 2.2);
  }
}

function allas() {
  let a = 0;
  let b = 0;
  for (let k = 0; k < racs.length; k++) {
    if (racs[k] === 1) a++;
    else if (racs[k] === 2) b++;
  }
  return [a / padloDb, b / padloDb];
}

// ---------------------------------------------------------------- szereplok

function jatekosLetrehoz(i, kollega) {
  const b = BAZIS[i];
  const t = jellemzok.get(kollega.id);
  return {
    i,
    kollega,
    jell: t,
    figura: figuraKerd(t, kollega.id, CSAPAT[i].ter),
    x: b.x * CELL + CELL / 2,
    y: b.y * CELL + CELL / 2,
    r: 7,
    csik: [],
    kint: false,
    kabult: 0,
    serthetetlen: 0,
    gyors: 0,
    lassu: 0,
    jar: 0,
  };
}

function npcLetrehoz(kollega, fajta, kezd) {
  const szin = fajta === 'patki' ? PATKI_SZIN : fajta === 'varo' ? VARO_SZIN : NPC_SZIN[(rng() * NPC_SZIN.length) | 0];
  const t = jellemzok.get(kollega.id);
  return {
    kollega,
    fajta,
    szin,
    figura: figuraKerd(t, kollega.id, szin),
    x: kezd.x,
    y: kezd.y,
    r: 6,
    dx: rng() < 0.5 ? -1 : 1,
    dy: 0,
    cel: null,
    valt: 0,
    jar: 0,
  };
}

// ---------------------------------------------------------------- mozgas

function mozog(e, dx, dy, seb, dt) {
  const t = Math.hypot(dx, dy);
  if (t < 0.001) return false;
  dx /= t; dy /= t;
  const lx = dx * seb * dt;
  const ly = dy * seb * dt;
  let mozdult = false;
  if (szabad(e.x + lx, e.y, e.r)) { e.x += lx; mozdult = true; }
  if (szabad(e.x, e.y + ly, e.r)) { e.y += ly; mozdult = true; }
  if (mozdult) { e.dx = dx; e.dy = dy; e.jar += seb * dt; }
  return mozdult;
}

function jatekosLep(j, dt) {
  if (j.kabult > 0) { j.kabult -= dt; return; }
  if (j.serthetetlen > 0) j.serthetetlen -= dt;
  if (j.gyors > 0) j.gyors -= dt;
  if (j.lassu > 0) j.lassu -= dt;
  if (parbaj) return;                      // parbaj alatt mindenki all

  const ir = IRANY[j.i];
  let dx = 0;
  let dy = 0;
  if (nyomva.has(ir.bal)) dx -= 1;
  if (nyomva.has(ir.jobb)) dx += 1;
  if (nyomva.has(ir.fel)) dy -= 1;
  if (nyomva.has(ir.le)) dy += 1;

  let seb = JATEKOS_SEBESSEG;
  if (j.gyors > 0) seb *= 1.45;
  if (j.lassu > 0) seb *= 0.6;

  const x0 = j.x;
  const y0 = j.y;
  mozog(j, dx, dy, seb, dt);

  const alatt = cellaAt(j.x, j.y);
  if (alatt < 0) return;
  const enyem = terKod(j.i);
  const sajatCsik = csikKod(j.i);

  if (racs[alatt] === enyem) {
    // Sajat teruletre ert: ha volt csik, most zarul be.
    if (j.kint && j.csik.length) kitolt(j.i);
    j.kint = false;
    return;
  }

  // A SAJAT CSIKJARA ert vissza: a hurok bezarult, ez is kitoltes.
  if (racs[alatt] === sajatCsik && j.csik.length > 12 && ido - csikIdo[alatt] > 0.45) {
    kitolt(j.i);
    j.kint = false;
    return;
  }

  j.kint = true;
  ecsetel(j.i, x0, y0, j.x, j.y);
}

// ---------------------------------------------------------------- NPC

function npcLep(n, dt) {
  const szorzo = riado ? RIADO_SZORZO : 1;
  n.valt -= dt;

  if (n.fajta === 'patki') {
    const cel = patkiCel();
    if (cel) {
      const dx = cel.x - n.x;
      const dy = cel.y - n.y;
      if (!mozog(n, dx, dy, PATKI_SEBESSEG * szorzo, dt)) mozog(n, -dy, dx, PATKI_SEBESSEG * szorzo, dt);
      return;
    }
  }

  if (n.fajta === 'varo') {
    if (!n.cel || n.valt <= 0) {
      const sz = szobak[(rng() * szobak.length) | 0];
      const a = sz.ajto || sz.ajto2;
      if (a) {
        const eszaki = sz.y2 < 41;
        n.cel = { x: a.x * CELL, y: (eszaki ? 39.5 : 49.5) * CELL };
      }
      n.valt = 3 + rng() * 4;
    }
    if (n.cel) {
      const dx = n.cel.x - n.x;
      const dy = n.cel.y - n.y;
      if (Math.hypot(dx, dy) > CELL) {
        if (!mozog(n, dx, dy, VARO_SEBESSEG * szorzo, dt)) mozog(n, -dy, dx, VARO_SEBESSEG * szorzo, dt);
      }
      return;
    }
  }

  if (n.valt <= 0) {
    const szog = rng() * Math.PI * 2;
    n.dx = Math.cos(szog);
    n.dy = Math.sin(szog);
    n.valt = 1 + rng() * 2.5;
  }
  if (!mozog(n, n.dx, n.dy, NPC_SEBESSEG * szorzo, dt)) n.valt = 0;
}

function patkiCel() {
  const a = allas();
  const vezet = a[0] >= a[1] ? 0 : 1;
  const j = jatekosok[vezet];
  if (!j) return null;
  if (j.csik.length) {
    const k = j.csik[(j.csik.length * 0.5) | 0];
    return { x: (k % GW) * CELL, y: ((k / GW) | 0) * CELL };
  }
  return { x: j.x, y: j.y };
}

// ---------------------------------------------------------------- utkozes

function csikAlatt(x, y) {
  const k = cellaAt(x, y);
  if (k < 0) return -1;
  if (racs[k] === 3) return 0;
  if (racs[k] === 4) return 1;
  return -1;
}

/** Elvagtak a csikot: a jatekos HELYBEN marad, de egy ideig szedul. */
function elvag(i, ki, szin) {
  const j = jatekosok[i];
  csikTorol(i);
  j.kint = false;
  j.kabult = KABULAT;
  j.serthetetlen = KABULAT + SERTHETETLEN;
  zene.hangVagas();
  bumm(j.x, j.y, szin, 22, 1);
  uzenet(ki, szin, 1.6);
}

function utkozesek(dt) {
  if (parbajSzunet > 0) parbajSzunet -= dt;

  // NPC elvagja a csikot
  for (const n of npck) {
    const i = csikAlatt(n.x, n.y);
    if (i < 0) continue;
    if (jatekosok[i].serthetetlen > 0 || jatekosok[i].kabult > 0) continue;
    elvag(i, n.kollega.becenev + ' keresztbetett', n.szin);
  }

  // A masik jatekos elvagja a csikot
  for (const j of jatekosok) {
    const i = csikAlatt(j.x, j.y);
    if (i < 0 || i === j.i) continue;
    if (jatekosok[i].serthetetlen > 0 || jatekosok[i].kabult > 0) continue;
    elvag(i, j.kollega.becenev + ' atvagta', CSAPAT[j.i].jel);
  }

  // Ha a ket jatekos egymasnak megy: parbaj
  if (!parbaj && parbajSzunet <= 0 && !vege) {
    const [a, b] = jatekosok;
    if (a.kabult <= 0 && b.kabult <= 0 && Math.hypot(a.x - b.x, a.y - b.y) < 26) {
      const nevek = Object.keys(GOMB);
      parbaj = {
        gomb: nevek[(rng() * nevek.length) | 0],
        t: PARBAJ_IDO,
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
      };
      zene.hangKihivas();
    }
  }
}

/** A parbaj: aki eloszor megnyomja a jo szinu gombot, megutheti a masikat. */
function parbajLep(dt) {
  if (!parbaj) return;
  parbaj.t -= dt;

  for (let i = 0; i < 2; i++) {
    for (const g of Object.keys(GOMB)) {
      if (!mostNyomott.includes(gombKod(i, g))) continue;
      if (g === parbaj.gomb) parbajVege(i);
      else parbajVege(1 - i, true);
      return;
    }
  }

  if (parbaj.t <= 0) {
    // Senki nem talalta el: szetlokjuk oket, hogy ne ragadjanak ossze.
    szetlok();
    parbaj = null;
    parbajSzunet = PARBAJ_SZUNET;
  }
}

function parbajVege(gyoztes, rosszGomb = false) {
  const vesztes = 1 - gyoztes;
  const v = jatekosok[vesztes];
  v.kabult = KABULAT * 1.3;
  v.serthetetlen = KABULAT * 1.3 + SERTHETETLEN;
  csikTorol(vesztes);
  v.kint = false;
  jatekosok[gyoztes].gyors = 3;
  zene.hangJo();
  bumm(parbaj.x, parbaj.y, CSAPAT[gyoztes].jel, 30, 1.4);
  uzenet(
    jatekosok[gyoztes].kollega.becenev + (rosszGomb ? ' nyert, rossz gomb' : ' behuzott egyet'),
    CSAPAT[gyoztes].jel, 1.8,
  );
  szetlok();
  parbaj = null;
  parbajSzunet = PARBAJ_SZUNET;
}

/** A ket jatekost ellokjuk egymastol, hogy ne induljon azonnal uj parbaj. */
function szetlok() {
  const [a, b] = jatekosok;
  let dx = a.x - b.x;
  let dy = a.y - b.y;
  const t = Math.hypot(dx, dy) || 1;
  dx /= t; dy /= t;
  for (const [e, jel] of [[a, 1], [b, -1]]) {
    const nx = e.x + dx * jel * 22;
    const ny = e.y + dy * jel * 22;
    if (szabad(nx, e.y, e.r)) e.x = nx;
    if (szabad(e.x, ny, e.r)) e.y = ny;
  }
}

// ---------------------------------------------------------------- kave

const konyha = szobak.find((s) => s.id === 'konyha');

function kaveLep(dt) {
  if (!kave) {
    kaveIdo -= dt;
    if (kaveIdo <= 0) {
      const k = konyha.cellak[(rng() * konyha.cellak.length) | 0];
      kave = { x: (k % GW) * CELL + CELL / 2, y: ((k / GW) | 0) * CELL + CELL / 2, t: 0 };
    }
    return;
  }
  kave.t += dt;
  for (const j of jatekosok) {
    if (j.kabult > 0) continue;
    if (Math.hypot(j.x - kave.x, j.y - kave.y) < 16) {
      j.gyors = 4.5;
      zene.hangKave();
      bumm(kave.x, kave.y, '#E8B21F', 12, 0.7);
      kave = null;
      kaveIdo = 7 + rng() * 5;
      uzenet(j.kollega.becenev + ' kavet ivott', CSAPAT[j.i].jel, 1.4);
      return;
    }
  }
}

// ---------------------------------------------------------------- villamkerdes

const GOMB_NEVEK = Object.keys(GOMB);

function kihivasLep(dt) {
  if (parbaj) return;
  if (kihivas) {
    kihivas.t -= dt;
    if (kihivas.t <= 0) { kihivas = null; kihivasIdo = 9 + rng() * 6; return; }
    for (let i = 0; i < 2; i++) {
      for (const g of GOMB_NEVEK) {
        if (!mostNyomott.includes(gombKod(i, g))) continue;
        if (g === kihivas.gomb) {
          jatekosok[i].gyors = 5;
          zene.hangJo();
          uzenet(jatekosok[i].kollega.becenev + ' megszerezte', GOMB[g].szin, 1.6);
        } else {
          jatekosok[i].lassu = 3;
          zene.hangRossz();
          uzenet(jatekosok[i].kollega.becenev + ' rosszat nyomott', PAL.riado, 1.6);
        }
        kihivas = null;
        kihivasIdo = 9 + rng() * 6;
        return;
      }
    }
    return;
  }
  kihivasIdo -= dt;
  if (kihivasIdo <= 0) {
    kihivas = { gomb: GOMB_NEVEK[(rng() * GOMB_NEVEK.length) | 0], t: 3.5 };
    zene.hangKihivas();
  }
}

// ---------------------------------------------------------------- kor

function ujKor() {
  racs.fill(URES);
  csikIdo.fill(0);
  for (const sz of szobak) sz.teljes = -1;
  szobaDb = [0, 0];
  for (let i = 0; i < 2; i++) {
    bazisRak(i);
    const b = BAZIS[i];
    const j = jatekosok[i];
    j.x = b.x * CELL + CELL / 2;
    j.y = b.y * CELL + CELL / 2;
    j.csik = [];
    j.kint = false;
    j.kabult = 0;
    j.serthetetlen = SERTHETETLEN;
    j.gyors = 0;
    j.lassu = 0;
  }
  for (const n of npck) {
    const sz = szobak[(rng() * szobak.length) | 0];
    const k = szobaKozep(sz);
    n.x = k.x;
    n.y = k.y;
    n.cel = null;
    n.valt = 0;
  }
  hatra = KOR_HOSSZ;
  vege = false;
  vegeAnim = 0;
  riado = false;
  zene.riado(false);
  kave = null;
  kaveIdo = 6;
  kihivas = null;
  kihivasIdo = 10;
  parbaj = null;
  parbajSzunet = 0;
  uzenetek = [];
  reszek = [];
  nyomva.clear();
}

function lepes(dt) {
  ido += dt;
  if (rezges > 0) rezges = Math.max(0, rezges - dt * 40);

  for (const u of uzenetek) u.t -= dt;
  uzenetek = uzenetek.filter((u) => u.t > 0);

  for (const p of reszek) {
    p.t -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.92;
    p.vy *= 0.92;
  }
  reszek = reszek.filter((p) => p.t > 0);

  if (vege) {
    vegeAnim += dt;
    if (vegeAnim > 1.2 && START.some((k) => nyomva.has(k))) ujKor();
    return;
  }

  hatra -= dt;
  if (hatra <= 0) {
    hatra = 0;
    vege = true;
    for (const j of jatekosok) if (j.csik.length) csikTorol(j.i);
    kihivas = null;
    parbaj = null;
    kave = null;
    uzenetek = [];
    zene.hangVege();
    return;
  }

  if (!riado && hatra <= RIADO_TOL) {
    riado = true;
    zene.riado(true);
    zene.hangSziren();
    uzenet('TUZRIADO! MINDENKI PANIKOL', PAL.riado, 2.6);
  }

  parbajLep(dt);
  for (const j of jatekosok) jatekosLep(j, dt);
  for (const n of npck) npcLep(n, dt);
  utkozesek(dt);
  kaveLep(dt);
  kihivasLep(dt);
}

// ---------------------------------------------------------------- rajzolas

function teruletRajz() {
  const p = terKep.data;
  for (let k = 0; k < racs.length; k++) {
    const v = racs[k];
    const i = k * 4;
    if (v === URES) { p[i + 3] = 0; continue; }
    const sz = SZIN[v];
    p[i] = sz[0]; p[i + 1] = sz[1]; p[i + 2] = sz[2];
    // A terulet atlatszo, hogy az iroda butorai atszurodjenek rajta.
    p[i + 3] = v >= 3 ? 255 : 178;
  }
  terCtx.putImageData(terKep, 0, 0);
  c.drawImage(terCv, 0, 0, W, H);
}

/** Szines gombjelzes: egy nagy kor a gomb szineben. Betu nincs rajta. */
function gombKor(x, y, r, szin, lukt) {
  const s = r * (1 + Math.sin(lukt * 7) * 0.06);
  c.fillStyle = 'rgba(8,10,14,0.55)';
  c.beginPath();
  c.arc(x, y + 3, s + 7, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#0f1218';
  c.beginPath();
  c.arc(x, y, s + 5, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = szin;
  c.beginPath();
  c.arc(x, y, s, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.35)';
  c.beginPath();
  c.arc(x - s * 0.3, y - s * 0.32, s * 0.28, 0, Math.PI * 2);
  c.fill();
}

/** Szedules: forgo csillagok a fej folott. */
function csillagok(e) {
  const n = 3;
  for (let i = 0; i < n; i++) {
    const a = ido * 6 + (i * Math.PI * 2) / n;
    const x = e.x + Math.cos(a) * 16;
    const y = e.y - 32 + Math.sin(a) * 5;
    c.fillStyle = '#E8B21F';
    c.fillRect(Math.round(x) - 2, Math.round(y) - 2, 5, 5);
    c.fillRect(Math.round(x) - 4, Math.round(y), 9, 1);
    c.fillRect(Math.round(x), Math.round(y) - 4, 1, 9);
  }
}

function figuraRajz(e, jatekos) {
  const kepek = e.figura;
  const kep = kepek[e.kabult > 0 ? 0 : (((e.jar / 14) | 0) % 2)];
  const sw = SPRITE_W * 2;
  const sh = SPRITE_H * 2;
  const x = Math.round(e.x - sw / 2);
  const y = Math.round(e.y - sh + 8);

  // arnyek
  c.fillStyle = 'rgba(0,0,0,0.28)';
  c.fillRect(x + 5, Math.round(e.y) + 2, sw - 10, 5);

  const villog = jatekos && e.serthetetlen > 0 && e.kabult <= 0 && ((ido * 12) | 0) % 2 === 0;
  if (!villog) {
    if (e.kabult > 0) {
      c.save();
      c.translate(e.x, e.y);
      c.rotate(Math.sin(ido * 9) * 0.16);
      c.drawImage(kep, 0, 0, SPRITE_W, SPRITE_H, -sw / 2, -sh + 8, sw, sh);
      c.restore();
    } else {
      c.drawImage(kep, 0, 0, SPRITE_W, SPRITE_H, x, y, sw, sh);
    }
  }
  if (e.kabult > 0) csillagok(e);
}

/** A nev a figura ALATT. A ket fo zavaro sajat szinnel es jellel. */
function nevRajz(e, jatekos) {
  const y = Math.round(e.y) + 10;
  if (jatekos) {
    drawText(c, e.kollega.becenev.toUpperCase(), e.x, y, {
      scale: 2, color: CSAPAT[e.i].jel, shadow: '#0b0d12', outline: '#0b0d12', align: 'center',
    });
    return;
  }
  const fo = e.fajta !== 'seta';
  drawText(c, e.kollega.becenev.toUpperCase(), e.x, y, {
    scale: fo ? 2 : 1,
    color: fo ? e.szin : PAL.feliratVil,
    shadow: '#0b0d12',
    outline: fo ? '#0b0d12' : null,
    align: 'center',
  });
  if (fo) {
    // felkialtojel a feje folott, hogy messzirol lassek, ki a veszelyes
    const bx = Math.round(e.x);
    const by = Math.round(e.y) - 46 + Math.sin(ido * 4) * 2;
    c.fillStyle = e.szin;
    c.fillRect(bx - 2, by, 4, 9);
    c.fillRect(bx - 2, by + 11, 4, 4);
  }
}

function hudRajz() {
  const a = allas();
  const ossz = Math.max(0.0001, a[0] + a[1]);

  // felso sav
  const savX = 300;
  const savW = W - 600;
  const savY = 16;
  const savH = 20;
  c.fillStyle = '#0f1218';
  c.fillRect(savX - 4, savY - 4, savW + 8, savH + 8);
  c.fillStyle = CSAPAT[0].ter;
  const b1 = Math.round(savW * (a[0] / ossz));
  c.fillRect(savX, savY, b1, savH);
  c.fillStyle = CSAPAT[1].ter;
  c.fillRect(savX + b1, savY, savW - b1, savH);
  c.fillStyle = '#0f1218';
  c.fillRect(savX + b1 - 2, savY, 4, savH);

  // ido
  const idoSzin = riado ? (((ido * 6) | 0) % 2 ? PAL.riado : '#FFD0D0') : PAL.feliratVil;
  drawText(c, String(Math.ceil(hatra)), W / 2, savY + savH + 10, { scale: 5, color: idoSzin, shadow: '#0b0d12', outline: '#0b0d12', align: 'center' });

  // jatekosok
  for (let i = 0; i < 2; i++) {
    const j = jatekosok[i];
    const bal = i === 0;
    const fx = bal ? 18 : W - 18 - 48;
    c.drawImage(j.figura[0], 0, 0, SPRITE_W, SPRITE_H, fx, 16, 44, 55);

    const tx = bal ? 76 : W - 76;
    const align = bal ? 'left' : 'right';
    drawText(c, Math.round(a[i] * 100) + '%', tx, 14, { scale: 5, color: CSAPAT[i].jel, shadow: '#0b0d12', outline: '#0b0d12', align });
    drawText(c, j.kollega.becenev.toUpperCase(), tx, 64, { scale: 2, color: PAL.feliratVil, shadow: '#0b0d12', outline: '#0b0d12', align });
    if (szobaDb[i]) drawText(c, szobaDb[i] + ' SZOBA', tx, 88, { scale: 2, color: CSAPAT[i].jel, shadow: '#0b0d12', outline: '#0b0d12', align });
  }

  // villamkerdes: kor a gomb szineben
  if (kihivas && !parbaj) {
    const g = GOMB[kihivas.gomb];
    gombKor(W / 2, 168, 30, g.szin, ido);
    drawText(c, 'NYOMD MEG!', W / 2, 212, { scale: 2, color: g.szin, shadow: '#0b0d12', outline: '#0b0d12', align: 'center' });
  }

  // parbaj
  if (parbaj) {
    const g = GOMB[parbaj.gomb];
    c.fillStyle = 'rgba(8,10,14,0.45)';
    c.fillRect(0, 0, W, H);
    gombKor(parbaj.x, parbaj.y - 54, 34, g.szin, ido);
    drawText(c, 'ELSOKENT NYOMD MEG!', W / 2, H / 2 - 150, { scale: 3, color: g.szin, shadow: '#0b0d12', outline: '#0b0d12', align: 'center' });
    drawText(c, 'AKI NYER, BEHUZ EGYET', W / 2, H / 2 - 112, { scale: 2, color: PAL.feliratVil, shadow: '#0b0d12', align: 'center' });
  }

  // uzenetek
  uzenetek.slice(-3).forEach((u, i) => {
    c.globalAlpha = Math.min(1, u.t / 0.4);
    drawText(c, u.szoveg, W / 2, H - 120 + i * 34, { scale: 3, color: u.szin, shadow: '#0b0d12', outline: '#0b0d12', align: 'center' });
    c.globalAlpha = 1;
  });
}

function vegKepRajz() {
  const a = allas();
  const dontetlen = a[0] === a[1];
  const gy = a[0] > a[1] ? 0 : 1;

  c.fillStyle = 'rgba(10,12,17,' + Math.min(0.88, vegeAnim * 1.2) + ')';
  c.fillRect(0, 0, W, H);
  if (vegeAnim < 0.35) return;

  if (logoCv) {
    c.globalAlpha = 0.16;
    c.drawImage(logoCv, W / 2 - 120, H / 2 - 150, 240, 240);
    c.globalAlpha = 1;
  }

  const cim = dontetlen ? 'DONTETLEN' : jatekosok[gy].kollega.becenev.toUpperCase() + ' NYERT';
  const ugras = Math.max(0, Math.sin(Math.min(1, vegeAnim) * Math.PI) * 14);
  drawText(c, cim, W / 2, 120 - ugras, {
    scale: 8, color: dontetlen ? PAL.feliratVil : CSAPAT[gy].jel, shadow: '#07090d', outline: '#0b0d12', align: 'center',
  });

  for (let i = 0; i < 2; i++) {
    const x = W / 2 + (i === 0 ? -200 : 200);
    const j = jatekosok[i];
    const m = 7;
    c.drawImage(j.figura[0], 0, 0, SPRITE_W, SPRITE_H, x - (SPRITE_W * m) / 2, 250, SPRITE_W * m, SPRITE_H * m);
    drawText(c, (a[i] * 100).toFixed(1) + '%', x, 408, { scale: 5, color: CSAPAT[i].jel, shadow: '#07090d', outline: '#0b0d12', align: 'center' });
    drawText(c, j.kollega.nev.toUpperCase(), x, 456, { scale: 2, color: PAL.feliratVil, shadow: '#07090d', align: 'center' });
    drawText(c, szobaDb[i] + ' SZOBA', x, 484, { scale: 2, color: PAL.felirat, shadow: null, align: 'center' });
  }

  if (vegeAnim > 1.2 && Math.floor(ido * 1.8) % 2 === 0) {
    drawText(c, 'START: UJ KOR', W / 2, 570, { scale: 4, color: PAL.feliratVil, shadow: '#07090d', outline: '#0b0d12', align: 'center' });
  }
}

function rajzol() {
  c.save();
  if (rezges > 0.2) c.translate((rng() - 0.5) * rezges, (rng() - 0.5) * rezges);

  c.fillStyle = PAL.hatter;
  c.fillRect(-20, -20, W + 40, H + 40);
  if (padloCv) c.drawImage(padloCv, 0, 0);
  teruletRajz();
  c.drawImage(falCv, 0, 0);
  c.drawImage(feliratCv, 0, 0);

  // kave
  if (kave) {
    const p = Math.sin(kave.t * 5) * 2;
    c.fillStyle = PAL.fal;
    c.fillRect(kave.x - 7, kave.y - 8 + p, 14, 13);
    c.fillStyle = '#5C3A22';
    c.fillRect(kave.x - 5, kave.y - 6 + p, 10, 4);
    c.fillStyle = PAL.fal;
    c.fillRect(kave.x + 7, kave.y - 5 + p, 3, 6);
  }

  // szereplok, felulrol lefele, hogy a lentebbi takarjon
  const mind = [...npck.map((n) => ({ e: n, j: false })), ...jatekosok.map((j) => ({ e: j, j: true }))];
  mind.sort((a, b) => a.e.y - b.e.y);
  for (const { e, j } of mind) figuraRajz(e, j);
  for (const { e, j } of mind) nevRajz(e, j);

  // robbanasdarabkak
  for (const p of reszek) {
    c.globalAlpha = Math.max(0, Math.min(1, p.t / 0.35));
    c.fillStyle = p.szin;
    c.fillRect(Math.round(p.x), Math.round(p.y), p.m, p.m);
  }
  c.globalAlpha = 1;

  if (riado && !vege) {
    c.fillStyle = 'rgba(214,40,40,' + (0.05 + Math.abs(Math.sin(ido * 4)) * 0.09) + ')';
    c.fillRect(0, 0, W, H);
  }

  c.restore();

  hudRajz();
  if (vege) vegKepRajz();
}

let utolso = performance.now();
let fut = false;
function kepkocka(most) {
  if (!fut) return;
  requestAnimationFrame(kepkocka);
  let dt = (most - utolso) / 1000;
  utolso = most;
  if (dt > 0.25) dt = 0.25;
  lepes(dt);
  rajzol();
  mostNyomott = [];
}

// ---------------------------------------------------------------- indulas

function toltoKep(kesz, ossz, ido2) {
  hatterRajz(c, ido2);
  drawText(c, 'SZEKFOGLALO', W / 2, 250, { scale: 8, color: CSAPAT[0].jel, shadow: '#07090d', outline: '#0b0d12', align: 'center' });
  drawText(c, 'BETOLTES', W / 2, 380, { scale: 3, color: PAL.szonyegVil, shadow: null, align: 'center' });
  const sw = 520;
  const sx = W / 2 - sw / 2;
  c.fillStyle = '#0f1218';
  c.fillRect(sx - 3, 424, sw + 6, 26);
  c.fillStyle = CSAPAT[1].ter;
  c.fillRect(sx, 427, Math.round((sw * kesz) / Math.max(1, ossz)), 20);
  drawText(c, kesz + ' / ' + ossz, W / 2, 468, { scale: 2, color: PAL.felirat, shadow: null, align: 'center' });
}

async function jellemzokElore(lista) {
  let kesz = 0;
  let fut2 = true;
  const rajz = (t) => { if (fut2) { toltoKep(kesz, lista.length, t / 1000); requestAnimationFrame(rajz); } };
  requestAnimationFrame(rajz);

  for (const k of lista) {
    try {
      jellemzok.set(k.id, await jellemzokKerd(k));
    } catch { /* egy hianyzo fej ne allitsa meg a jatekot */ }
    kesz++;
  }
  fut2 = false;
}

async function indul() {
  kollegak = await nevsorBetolt();

  try {
    logoKep = await kepBetolt('img/logo.png');
  } catch { logoKep = null; }
  hatterInit(logoKep);
  if (logoKep) {
    logoCv = document.createElement('canvas');
    logoCv.width = 240;
    logoCv.height = 240;
    logoPixel(logoCv.getContext('2d'), logoKep, 0, 0, 240, CSAPAT[0].jel);
  }
  padloCv = padloRajz(fal, szobak, logoKep);

  await jellemzokElore(kollegak);

  pads.init({ slots: 2, keyboard: false });

  const teszt = new URLSearchParams(location.search).has('teszt');

  if (teszt) {
    pads.keyboard(true);
    zene.indit();
  } else {
    await new Promise((ok) => {
      padGate({
        players: 2,
        title: 'SZEKFOGLALO',
        subtitle: 'Két USB kontroller, két kolléga, egy iroda. Nyomj egy gombot mindkét paden.',
        allowKeyboard: true,
        onClose: () => { pads.keyboard(true); nyomva.clear(); ok(); },
      });
    });
    zene.indit();
    zene.zeneIndul();
    await cimkepernyo({ ctx: c, kollegak, jellemzok, logoKep, hatterRajz });
  }

  const valasztott = teszt
    ? [kollegak[0], kollegak[3]]
    : await karakterValaszto({ ctx: c, kollegak, jellemzok, kiemelt: [PATKI_ID, VARO_ID], hatterRajz });

  jatekosok = valasztott.map((k, i) => jatekosLetrehoz(i, k));

  const foglalt = new Set(valasztott.map((k) => k.id));
  const npcLista = [];
  for (const [id, fajta] of [[PATKI_ID, 'patki'], [VARO_ID, 'varo']]) {
    const k = kollegak.find((x) => x.id === id);
    if (k && !foglalt.has(id)) { npcLista.push({ k, fajta }); foglalt.add(id); }
  }
  const maradek = kollegak.filter((k) => !foglalt.has(k.id));
  while (npcLista.length < NPC_DB && maradek.length) {
    const k = maradek.splice((rng() * maradek.length) | 0, 1)[0];
    npcLista.push({ k, fajta: 'seta' });
  }
  npck = npcLista.map(({ k, fajta }, i) => npcLetrehoz(k, fajta, szobaKozep(szobak[(i * 3 + 2) % szobak.length])));

  zene.indit();
  zene.zeneIndul();

  ujKor();
  utolso = performance.now();
  fut = true;
  requestAnimationFrame(kepkocka);

  // Fejlesztes kozben a konzolbol lepesenkent is futtathato:
  //   jatek.nyomva.add('KeyD'); for (let i=0;i<60;i++) jatek.lepes(1/60);
  window.jatek = {
    get allas() { return allas(); },
    jatekosok, npck, szobak, racs, ujKor, lepes, rajzol, nyomva,
    get hatra() { return hatra; },
    set hatra(v) { hatra = v; },
    get vege() { return vege; },
    get parbaj() { return parbaj; },
  };
}

indul().catch((e) => {
  hatterRajz(c, 0);
  drawText(c, 'HIBA', W / 2, 280, { scale: 6, color: PAL.riado, shadow: '#07090d', align: 'center' });
  drawText(c, String(e.message).toUpperCase().slice(0, 44), W / 2, 360, { scale: 2, color: PAL.feliratVil, shadow: null, align: 'center' });
  console.error(e);
});

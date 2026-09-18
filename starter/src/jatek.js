/**
 * IRODAFOGLALO - ketjatekos teruletfoglalo az iroda alaprajzan
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
  W, H, CELL, GW, GH, KOR_HOSSZ, RIADO_TOL, CIM, SZABALY,
  JATEKOS_SEBESSEG, NPC_SEBESSEG, PATKI_SEBESSEG, VARO_SEBESSEG,
  RIADO_SZORZO, PATKI_RIADO_SZORZO, PATKI_SZUNET,
  ECSET, SERTHETETLEN, VISSZASZAMLALAS, PARBAJ_IDO, KIHIVAS_ALAP, KIHIVAS_SZORAS,
  PAL, CSAPAT, SZINEK, NPC_SZIN, PATKI_SZIN, VARO_SZIN,
  URES, terKod, csikKod, rgb, mulberry32,
  GOMB, START, IRANY, gombKod,
} from './config.js';
import {
  palyaEpit, falakRajz, padloRajz, fugaRajz, feliratRajz, szobaKozep, logoPixel,
  butorokEpit, butorRajz,
  KEZDOHELYEK, BAZIS_MERET, SZOBA_KUSZOB,
} from './palya.js';
import {
  nevsorBetolt, kepBetolt, jellemzokKerd, figuraKerd,
  SPRITE_W, SPRITE_H,
} from './karakter.js';
import { drawText, textWidth } from './font.js';
import { hatterInit, hatterRajz } from './hatter.js';
import { cimkepernyo } from './splash.js';
import { karakterValaszto } from './valaszto.js';
import * as zene from './zene.js';

const PATKI_ID = 'ferenczi_balazs';
const VARO_ID = 'varjasy_gabor';

/** Ennyi kollega zavar a palyan. */
const NPC_DB = 10;

/** A figura ekkorara nagyitva jelenik meg: 16x20 art keppont -> 48x60. */
const NAGYITAS = 3;
const RAJZ_W = SPRITE_W * NAGYITAS;
const RAJZ_H = SPRITE_H * NAGYITAS;

/** Utkozes utan ennyi ideig szedul a jatekos: nem mozog, csillagok forognak. */
const KABULAT = 1.6;

/**
 * Az NPC-fajtak. Mint a Pacmanben, mindegyiknek mas a logikaja, es ettol lesz
 * kiszamithatatlan a palya. MINDEGYIK LASSABB A JATEKOSNAL, tuzriado alatt is.
 */
const NPC_FAJTA = {
  patki: { seb: PATKI_SEBESSEG, riado: PATKI_RIADO_SZORZO, szin: PATKI_SZIN, fo: true },
  varo: { seb: VARO_SEBESSEG, riado: 1.2, szin: VARO_SZIN, fo: true },
  kerget: { seb: 124, riado: RIADO_SZORZO },
  lesben: { seb: 118, riado: RIADO_SZORZO },
  folyoso: { seb: 110, riado: RIADO_SZORZO },
  bolyong: { seb: NPC_SEBESSEG, riado: RIADO_SZORZO },
};

/** A szines gombbal megszerezheto bonuszok. */
const BONUSZ = [
  { id: 'gyors', nev: 'GYORSASÁG' },
  { id: 'immunis', nev: 'SÉRTHETETLENSÉG' },
  { id: 'szeles', nev: 'SZÉLES ECSET' },
  { id: 'lassit', nev: 'A MÁSIK LELASSUL' },
];

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

function igazit() {
  const s = Math.min(window.innerWidth / W, window.innerHeight / H);
  canvas.style.width = Math.floor(W * s) + 'px';
  canvas.style.height = Math.floor(H * s) + 'px';
}
window.addEventListener('resize', igazit);
igazit();

// ---------------------------------------------------------------- palya

const { fal, belso, kulso, szobak, padloDb } = palyaEpit();
const falCv = falakRajz(fal, belso, kulso, szobak);
const feliratCv = feliratRajz(szobak);
const padloCv = padloRajz(fal, belso, szobak);
const fugaCv = fugaRajz(belso, szobak, fal);

/** A falak piros valtozata: a tuzriado a FALAKON lüktet, a padlohoz nem nyul. */
const falRiadoCv = (() => {
  const cv = document.createElement('canvas');
  cv.width = falCv.width;
  cv.height = falCv.height;
  const x = cv.getContext('2d');
  x.drawImage(falCv, 0, 0);
  x.globalCompositeOperation = 'source-atop';
  x.fillStyle = PAL.riado;
  x.fillRect(0, 0, cv.width, cv.height);
  return cv;
})();

/** A butorok. Tolhatok, ezert minden korben ujragenerlodnak. */
let butorok = butorokEpit(szobak, fal);

const racs = new Uint8Array(GW * GH);
const csikIdo = new Float32Array(GW * GH);

const terCv = document.createElement('canvas');
terCv.width = GW;
terCv.height = GH;
const terCtx = terCv.getContext('2d');
const terKep = terCtx.createImageData(GW, GH);

/** A racskodokhoz tartozo RGB. A valasztott szinek utan frissitjuk. */
const SZIN = [null, null, null, null, null];
function szinekFrissit() {
  SZIN[1] = rgb(jatekosok[0].szin.ter);
  SZIN[2] = rgb(jatekosok[1].szin.ter);
  SZIN[3] = rgb(jatekosok[0].szin.csik);
  SZIN[4] = rgb(jatekosok[1].szin.csik);
}

// ---------------------------------------------------------------- allapot

let jatekosok = [];
let npck = [];
let kollegak = [];
const jellemzok = new Map();
let logoKep = null;
let logoCv = null;

/** 'vissza' | 'jatek' | 'szunet' | 'vege' */
let mod = 'vissza';
let vissza = VISSZASZAMLALAS;
let ido = 0;
let hatra = KOR_HOSSZ;
let vegeAnim = 0;
let riado = false;
let uzenetek = [];
let reszek = [];
let kave = null;
let kaveIdo = 6;
let kihivas = null;
let kihivasIdo = 6;
let parbaj = null;
let parbajSzunet = 0;
let szobaDb = [0, 0];
let rezges = 0;
let kilepes = null;          // a kor vegen ide jon a dontes: 'ujra' | 'menu'

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

function bumm(x, y, szin, db = 18, ero = 1) {
  for (let i = 0; i < db; i++) {
    const sz = rng() * Math.PI * 2;
    const v = (50 + rng() * 150) * ero;
    reszek.push({
      x, y, vx: Math.cos(sz) * v, vy: Math.sin(sz) * v,
      t: 0.35 + rng() * 0.45, m: 2 + ((rng() * 3) | 0), szin,
    });
  }
}

// ---------------------------------------------------------------- terulet

function bazisRak(i, gx, gy) {
  const kod = terKod(i);
  for (let y = gy - BAZIS_MERET; y <= gy + BAZIS_MERET; y++) {
    for (let x = gx - BAZIS_MERET; x <= gx + BAZIS_MERET; x++) {
      if (x < 0 || y < 0 || x >= GW || y >= GH) continue;
      const k = cellaIdx(x, y);
      if (!fal[k]) racs[k] = kod;
    }
  }
}

function pacni(i, x, y) {
  const j = jatekosok[i];
  const kod = csikKod(i);
  const enyem = terKod(i);
  const e = ECSET * j.ecset;
  const gx = (x / CELL) | 0;
  const gy = (y / CELL) | 0;
  const r = Math.ceil(e);
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > e * e + 0.35) continue;
      const cx = gx + dx;
      const cy = gy + dy;
      if (cx < 0 || cy < 0 || cx >= GW || cy >= GH) continue;
      const k = cellaIdx(cx, cy);
      if (fal[k] || racs[k] === enyem || racs[k] === kod) continue;
      racs[k] = kod;
      csikIdo[k] = ido;
      j.csik.push(k);
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
 * A csik bezarasa. A csik teruletté valik, majd a palya szelerol indulo
 * arasztassal megkeressuk, mi az, amit mar csak a jatekos szine hatarol.
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

  const masik = 1 - i;
  const mkod = csikKod(masik);
  if (jatekosok[masik].csik.some((k) => racs[k] !== mkod)) {
    csikTorol(masik);
    uzenet(jatekosok[masik].kollega.becenev + ' csíkja elszakadt', jatekosok[masik].szin.jel, 1.4);
  }

  if (szerzett > 0) {
    zene.hangKitolt();
    const j = jatekosok[i];
    // Minel nagyobb a falat, annal nagyobbat rang a kamera.
    rezges = Math.max(rezges, Math.min(30, 3 + szerzett / 14));
    bumm(j.x, j.y, j.szin.csik, Math.min(40, 8 + ((szerzett / 40) | 0)), 0.6 + Math.min(1.4, szerzett / 700));
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
    rezges = Math.max(rezges, 16);
    bumm(kp.x, kp.y, jatekosok[i].szin.jel, 26, 1.1);
    uzenet(sz.felirat + ' elfoglalva', jatekosok[i].szin.jel, 2.2);
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

function jatekosLetrehoz(i, kollega, szin) {
  return {
    i, kollega, szin,
    jell: jellemzok.get(kollega.id),
    figura: figuraKerd(jellemzok.get(kollega.id), kollega.id, szin.ter),
    x: 0, y: 0, r: 8,
    csik: [], kint: false,
    kabult: 0, serthetetlen: 0,
    gyors: 0, lassu: 0, immunis: 0, ecset: 1,
    jar: 0,
  };
}

function npcLetrehoz(kollega, fajta, kezd) {
  const f = NPC_FAJTA[fajta];
  const szin = f.szin || NPC_SZIN[(rng() * NPC_SZIN.length) | 0];
  return {
    kollega, fajta, szin, f,
    figura: figuraKerd(jellemzok.get(kollega.id), kollega.id, szin),
    x: kezd.x, y: kezd.y, r: 7,
    dx: rng() < 0.5 ? -1 : 1, dy: 0,
    cel: null, valt: 0, szunet: 0, jar: 0,
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

/** Elfer-e a butor ezen a helyen: mind a negy sarka padlon van-e. */
function butorSzabad(b, x, y) {
  const fx = b.w / 2 - 2;
  const fy = b.h / 2 - 2;
  for (const [dx, dy] of [[-fx, -fy], [fx, -fy], [-fx, fy], [fx, fy]]) {
    const i = cellaAt(x + dx, y + dy);
    if (i < 0 || fal[i]) return false;
  }
  return true;
}

/**
 * Butorutkozes. A JATEKOS tolja maga elott az asztalt es a szeket, az NPC
 * csak megall elotte. Amit nem lehet elmozditani (pult, lepcso), az fal.
 */
function butorUtkozes(e, tolhat) {
  for (const b of butorok) {
    if (b.atjar) continue;          // lepcso, noveny: at lehet rajta menni
    const dx = e.x - b.x;
    const dy = e.y - b.y;
    const ox = b.w / 2 + e.r - Math.abs(dx);
    const oy = b.h / 2 + e.r - Math.abs(dy);
    if (ox <= 0 || oy <= 0) continue;
    if (ox < oy) {
      const jel = dx < 0 ? -1 : 1;
      if (b.tol && tolhat && butorSzabad(b, b.x - jel * ox, b.y)) { b.x -= jel * ox; continue; }
      e.x += jel * ox;
    } else {
      const jel = dy < 0 ? -1 : 1;
      if (b.tol && tolhat && butorSzabad(b, b.x, b.y - jel * oy)) { b.y -= jel * oy; continue; }
      e.y += jel * oy;
    }
  }
}

function jatekosLep(j, dt) {
  if (j.kabult > 0) { j.kabult -= dt; return; }
  if (j.serthetetlen > 0) j.serthetetlen -= dt;
  if (j.gyors > 0) j.gyors -= dt;
  if (j.lassu > 0) j.lassu -= dt;
  if (j.immunis > 0) { j.immunis -= dt; if (j.immunis <= 0) j.immunis = 0; }
  if (j.ecsetIdo > 0) { j.ecsetIdo -= dt; if (j.ecsetIdo <= 0) j.ecset = 1; }

  const ir = IRANY[j.i];
  let dx = 0;
  let dy = 0;
  if (nyomva.has(ir.bal)) dx -= 1;
  if (nyomva.has(ir.jobb)) dx += 1;
  if (nyomva.has(ir.fel)) dy -= 1;
  if (nyomva.has(ir.le)) dy += 1;

  let seb = JATEKOS_SEBESSEG;
  if (j.gyors > 0) seb *= 1.4;
  if (j.lassu > 0) seb *= 0.62;

  const x0 = j.x;
  const y0 = j.y;
  mozog(j, dx, dy, seb, dt);
  butorUtkozes(j, true);

  const alatt = cellaAt(j.x, j.y);
  if (alatt < 0) return;
  const enyem = terKod(j.i);
  const sajatCsik = csikKod(j.i);

  if (racs[alatt] === enyem) {
    if (j.kint && j.csik.length) kitolt(j.i);
    j.kint = false;
    return;
  }
  if (racs[alatt] === sajatCsik && j.csik.length > 12 && ido - csikIdo[alatt] > 0.45) {
    kitolt(j.i);
    j.kint = false;
    return;
  }
  j.kint = true;
  ecsetel(j.i, x0, y0, j.x, j.y);
}

// ---------------------------------------------------------------- NPC

/** A legkozelebbi jatekos. */
function kozelebbi(n) {
  const [a, b] = jatekosok;
  return Math.hypot(a.x - n.x, a.y - n.y) <= Math.hypot(b.x - n.x, b.y - n.y) ? a : b;
}

function npcLep(n, dt) {
  const szorzo = riado ? n.f.riado : 1;
  const seb = n.f.seb * szorzo;
  n.valt -= dt;
  if (n.szunet > 0) n.szunet -= dt;

  // Patki a talalat utan egy ideig bekén hagy mindenkit: csak bolyong.
  const vadaszhat = n.szunet <= 0;

  if (n.fajta === 'patki' && vadaszhat) {
    const cel = patkiCel();
    if (cel) {
      const dx = cel.x - n.x;
      const dy = cel.y - n.y;
      if (!mozog(n, dx, dy, seb, dt)) mozog(n, -dy, dx, seb, dt);
      butorUtkozes(n, false);
      return;
    }
  }

  if (n.fajta === 'kerget' && vadaszhat) {
    const j = kozelebbi(n);
    const dx = j.x - n.x;
    const dy = j.y - n.y;
    if (!mozog(n, dx, dy, seb, dt)) mozog(n, -dy, dx, seb, dt);
    return;
  }

  if (n.fajta === 'lesben' && vadaszhat) {
    // Nem oda megy, ahol a jatekos van, hanem ele: igy elvagja az utat.
    const j = kozelebbi(n);
    const cx = j.x + j.dx * 150;
    const cy = j.y + j.dy * 150;
    const dx = cx - n.x;
    const dy = cy - n.y;
    if (!mozog(n, dx, dy, seb, dt)) mozog(n, -dy, dx, seb, dt);
    return;
  }

  if (n.fajta === 'varo') {
    if (!n.cel || n.valt <= 0) {
      const sz = szobak[(rng() * szobak.length) | 0];
      const a = sz.ajto || sz.ajto2;
      if (a) {
        const eszaki = sz.y2 < 45;
        n.cel = { x: a.x * CELL, y: (eszaki ? sz.y2 + 2 : sz.y1 - 2) * CELL };
      }
      n.valt = 3 + rng() * 4;
    }
    if (n.cel) {
      const dx = n.cel.x - n.x;
      const dy = n.cel.y - n.y;
      if (Math.hypot(dx, dy) > CELL) {
        if (!mozog(n, dx, dy, seb, dt)) mozog(n, -dy, dx, seb, dt);
      }
      return;
    }
  }

  if (n.fajta === 'folyoso') {
    // Vegigjarja a folyosot oda-vissza, a kozepso savban.
    const cy = 44 * CELL;
    const dy = cy - n.y;
    if (!mozog(n, n.dx, Math.abs(dy) > CELL * 2 ? Math.sign(dy) * 0.6 : 0, seb, dt)) n.dx = -n.dx;
    return;
  }

  if (n.valt <= 0) {
    const szog = rng() * Math.PI * 2;
    n.dx = Math.cos(szog);
    n.dy = Math.sin(szog);
    n.valt = 1 + rng() * 2.5;
  }
  if (!mozog(n, n.dx, n.dy, seb, dt)) n.valt = 0;
  butorUtkozes(n, false);
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

/** A jatekos megsérul: elveszti a csikot, es helyben szedul. Nincs teleport. */
function kabit(i, ki, szin) {
  const j = jatekosok[i];
  csikTorol(i);
  j.kint = false;
  j.kabult = KABULAT;
  j.serthetetlen = KABULAT + SERTHETETLEN;
  zene.hangVagas();
  rezges = Math.max(rezges, 12);
  bumm(j.x, j.y, szin, 24, 1);
  uzenet(ki, szin, 1.6);
}

function utkozesek(dt) {
  if (parbajSzunet > 0) parbajSzunet -= dt;

  // A jatekos NEKIMEGY egy kolleganak. Forditva NEM szamit: ha egy NPC setal
  // at a csikon, az nem baj. Igy a hiba mindig a jatekose, nem a veletlene.
  for (const j of jatekosok) {
    if (j.serthetetlen > 0 || j.kabult > 0 || j.immunis > 0) continue;
    for (const n of npck) {
      if (Math.hypot(j.x - n.x, j.y - n.y) > j.r + n.r + 2) continue;
      kabit(j.i, j.kollega.becenev + ' nekiment: ' + n.kollega.becenev, n.szin);
      if (n.fajta === 'patki') n.szunet = PATKI_SZUNET;
      else n.szunet = 2.5;
      break;
    }
  }

  // A masik jatekos csikjaba beleszaladni: annak a csikja szakad el.
  for (const j of jatekosok) {
    const i = csikAlatt(j.x, j.y);
    if (i < 0 || i === j.i) continue;
    const m = jatekosok[i];
    if (m.serthetetlen > 0 || m.kabult > 0 || !m.csik.length) continue;
    csikTorol(i);
    m.kint = false;
    zene.hangVagas();
    bumm(j.x, j.y, j.szin.jel, 16, 0.8);
    uzenet(j.kollega.becenev + ' átvágta ' + m.kollega.becenev + ' csíkját', j.szin.jel, 1.6);
  }

  // Ha a ket jatekos osszefut: felajanlunk egy szines gombot. NEM allitja meg
  // a jatekot, es nem kotelezo megnyomni: aki elkapja, behuz egyet.
  if (!parbaj && parbajSzunet <= 0 && mod === 'jatek') {
    const [a, b] = jatekosok;
    if (a.kabult <= 0 && b.kabult <= 0 && Math.hypot(a.x - b.x, a.y - b.y) < 30) {
      const nevek = Object.keys(GOMB);
      parbaj = { gomb: nevek[(rng() * nevek.length) | 0], t: PARBAJ_IDO, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      zene.hangKihivas();
    }
  }
}

function parbajLep(dt) {
  if (!parbaj) return;
  parbaj.t -= dt;
  const [a, b] = jatekosok;
  parbaj.x = (a.x + b.x) / 2;
  parbaj.y = (a.y + b.y) / 2;

  for (let i = 0; i < 2; i++) {
    for (const g of Object.keys(GOMB)) {
      if (!mostNyomott.includes(gombKod(i, g))) continue;
      if (g === parbaj.gomb) parbajVege(i);
      else parbajVege(1 - i, true);
      return;
    }
  }
  if (parbaj.t <= 0) { parbaj = null; parbajSzunet = 2.2; }
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
  rezges = Math.max(rezges, 18);
  bumm(parbaj.x, parbaj.y, jatekosok[gyoztes].szin.jel, 30, 1.4);
  uzenet(
    jatekosok[gyoztes].kollega.becenev + (rosszGomb ? ' nyert, rossz gomb' : ' behúzott egyet'),
    jatekosok[gyoztes].szin.jel, 1.8,
  );
  parbaj = null;
  parbajSzunet = 2.2;
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
    if (Math.hypot(j.x - kave.x, j.y - kave.y) < 18) {
      j.gyors = 4.5;
      zene.hangKave();
      bumm(kave.x, kave.y, '#E8B21F', 12, 0.7);
      kave = null;
      kaveIdo = 7 + rng() * 5;
      uzenet(j.kollega.becenev + ' kávét ivott', j.szin.jel, 1.4);
      return;
    }
  }
}

// ---------------------------------------------------------------- villamkerdes

const GOMB_NEVEK = Object.keys(GOMB);

function bonuszAd(i, b) {
  const j = jatekosok[i];
  if (b.id === 'gyors') j.gyors = 5;
  else if (b.id === 'immunis') { j.immunis = 6; j.serthetetlen = Math.max(j.serthetetlen, 6); }
  else if (b.id === 'szeles') { j.ecset = 2; j.ecsetIdo = 6; }
  else if (b.id === 'lassit') jatekosok[1 - i].lassu = 4;
}

function kihivasLep(dt) {
  if (kihivas) {
    kihivas.t -= dt;
    if (kihivas.t <= 0) { kihivas = null; kihivasIdo = KIHIVAS_ALAP + rng() * KIHIVAS_SZORAS; return; }
    for (let i = 0; i < 2; i++) {
      for (const g of GOMB_NEVEK) {
        if (!mostNyomott.includes(gombKod(i, g))) continue;
        if (g === kihivas.gomb) {
          bonuszAd(i, kihivas.bonusz);
          zene.hangJo();
          uzenet(jatekosok[i].kollega.becenev + ': ' + kihivas.bonusz.nev, GOMB[g].szin, 1.8);
        } else {
          jatekosok[i].lassu = 3;
          zene.hangRossz();
          uzenet(jatekosok[i].kollega.becenev + ' rosszat nyomott', PAL.riado, 1.6);
        }
        kihivas = null;
        kihivasIdo = KIHIVAS_ALAP + rng() * KIHIVAS_SZORAS;
        return;
      }
    }
    return;
  }
  kihivasIdo -= dt;
  if (kihivasIdo <= 0) {
    kihivas = {
      gomb: GOMB_NEVEK[(rng() * GOMB_NEVEK.length) | 0],
      bonusz: BONUSZ[(rng() * BONUSZ.length) | 0],
      t: 3.2,
    };
    zene.hangKihivas();
  }
}

// ---------------------------------------------------------------- kor

/** Ket tavoli kezdohely sorsolasa, hogy ne mindig ugyanonnan induljanak. */
function kezdohelyek() {
  let a = KEZDOHELYEK[(rng() * KEZDOHELYEK.length) | 0];
  let b = a;
  let proba = 0;
  while ((b === a || Math.hypot(a.x - b.x, a.y - b.y) < 70) && proba++ < 60) {
    b = KEZDOHELYEK[(rng() * KEZDOHELYEK.length) | 0];
  }
  return rng() < 0.5 ? [a, b] : [b, a];
}

function ujKor() {
  racs.fill(URES);
  csikIdo.fill(0);
  for (const sz of szobak) sz.teljes = -1;
  szobaDb = [0, 0];

  const helyek = kezdohelyek();
  for (let i = 0; i < 2; i++) {
    const h = helyek[i];
    bazisRak(i, h.x, h.y);
    const j = jatekosok[i];
    j.x = h.x * CELL + CELL / 2;
    j.y = h.y * CELL + CELL / 2;
    j.csik = [];
    j.kint = false;
    j.kabult = 0;
    j.serthetetlen = SERTHETETLEN;
    j.gyors = 0; j.lassu = 0; j.immunis = 0; j.ecset = 1; j.ecsetIdo = 0;
  }
  for (const n of npck) {
    const sz = szobak[(rng() * szobak.length) | 0];
    const k = szobaKozep(sz);
    n.x = k.x;
    n.y = k.y;
    n.cel = null;
    n.valt = 0;
    n.szunet = 0;
  }
  butorok = butorokEpit(szobak, fal);
  hatra = KOR_HOSSZ;
  vissza = VISSZASZAMLALAS;
  mod = 'vissza';
  vegeAnim = 0;
  riado = false;
  zene.riado(false);
  kave = null;
  kaveIdo = 6;
  kihivas = null;
  kihivasIdo = 6;
  parbaj = null;
  parbajSzunet = 0;
  uzenetek = [];
  reszek = [];
  nyomva.clear();
}

function lepes(dt) {
  ido += dt;
  if (rezges > 0) rezges = Math.max(0, rezges - dt * 34);

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

  // --- visszaszamlalas
  if (mod === 'vissza') {
    vissza -= dt;
    if (vissza <= 0) { mod = 'jatek'; nyomva.clear(); }
    return;
  }

  // --- szunet
  if (mod === 'szunet') {
    if (START.some((k) => mostNyomott.includes(k))) { mod = 'jatek'; nyomva.clear(); }
    return;
  }

  // --- kor vege
  if (mod === 'vege') {
    vegeAnim += dt;
    if (vegeAnim > 0.9) {
      for (let i = 0; i < 2; i++) {
        if (mostNyomott.includes(gombKod(i, 'b'))) { kilepes = 'ujra'; return; }
        if (mostNyomott.includes(gombKod(i, 'a'))) { kilepes = 'menu'; return; }
      }
    }
    return;
  }

  // --- jatek
  if (START.some((k) => mostNyomott.includes(k))) { mod = 'szunet'; return; }

  hatra -= dt;
  if (hatra <= 0) {
    hatra = 0;
    mod = 'vege';
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
    uzenet('TŰZRIADÓ! MINDENKI PÁNIKOL', PAL.riado, 2.6);
  }

  parbajLep(dt);
  for (const j of jatekosok) jatekosLep(j, dt);
  for (const n of npck) npcLep(n, dt);
  utkozesek(dt);
  kaveLep(dt);
  kihivasLep(dt);
}

// ---------------------------------------------------------------- rajzolas

/**
 * A bejatszott terulet, a fugaracs, az elfoglalt szobak kerete es a csikok.
 *
 * A terulet kis felbontasu kepkent megy ki (14400 cella, ez gyors), a csik
 * viszont teljes felbontasban rajzolodik, mert ott kell a reszlet: a FRISS
 * csik sakktablas, jelezve, hogy a sajat figura meg atmehet rajta.
 */
function teruletRajz() {
  const p = terKep.data;
  for (let k = 0; k < racs.length; k++) {
    const v = racs[k];
    const i = k * 4;
    if (v !== 1 && v !== 2) { p[i + 3] = 0; continue; }
    const sz = SZIN[v];
    p[i] = sz[0]; p[i + 1] = sz[1]; p[i + 2] = sz[2];
    p[i + 3] = 186;
  }
  terCtx.putImageData(terKep, 0, 0);
  c.drawImage(terCv, 0, 0, W, H);

  // A fugaracs a szin FOLE megy: igy latszik, hany cella van meg hatra.
  c.drawImage(fugaCv, 0, 0);

  // Elfoglalt szoba: keret a tulajdonos szineben, kulonben egy elfoglalt
  // szoba ugyanugy nezne ki, mint egy majdnem elfoglalt.
  for (const sz of szobak) {
    if (sz.teljes < 0) continue;
    c.strokeStyle = jatekosok[sz.teljes].szin.jel;
    c.lineWidth = 3;
    c.strokeRect(sz.x1 * CELL + 1.5, sz.y1 * CELL + 1.5, (sz.x2 - sz.x1 + 1) * CELL - 3, (sz.y2 - sz.y1 + 1) * CELL - 3);
  }

  // Csikok teljes felbontasban.
  for (let i = 0; i < 2; i++) {
    const j = jatekosok[i];
    if (!j || !j.csik.length) continue;
    c.fillStyle = j.szin.csik;
    for (const k of j.csik) {
      if (racs[k] !== csikKod(i)) continue;
      const gx = k % GW;
      const gy = (k / GW) | 0;
      // friss csik: sakktablas, mert azon a sajat figura meg atmehet
      if (ido - csikIdo[k] < 0.45 && ((gx + gy) & 1)) continue;
      c.fillRect(gx * CELL, gy * CELL, CELL, CELL);
    }
  }
}

/** Szines gombjelzes: egy nagy kor a gomb szineben. Betu nincs rajta. */
function gombKor(x, y, r, szin, lukt) {
  const s = r * (1 + Math.sin(lukt * 7) * 0.07);
  c.fillStyle = 'rgba(8,10,14,0.5)';
  c.beginPath();
  c.arc(x, y + 3, s + 8, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#0f1218';
  c.beginPath();
  c.arc(x, y, s + 5, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = szin;
  c.beginPath();
  c.arc(x, y, s, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.32)';
  c.beginPath();
  c.arc(x - s * 0.3, y - s * 0.32, s * 0.28, 0, Math.PI * 2);
  c.fill();
}

function csillagok(e) {
  for (let i = 0; i < 3; i++) {
    const a = ido * 6 + (i * Math.PI * 2) / 3;
    const x = e.x + Math.cos(a) * 20;
    const y = e.y - RAJZ_H + 14 + Math.sin(a) * 6;
    c.fillStyle = '#E8B21F';
    c.fillRect(Math.round(x) - 2, Math.round(y) - 2, 5, 5);
    c.fillRect(Math.round(x) - 5, Math.round(y), 11, 1);
    c.fillRect(Math.round(x), Math.round(y) - 5, 1, 11);
  }
}

function figuraRajz(e, jatekos) {
  const kep = e.figura[e.kabult > 0 ? 0 : (((e.jar / 16) | 0) % 2)];
  const x = Math.round(e.x - RAJZ_W / 2);
  const y = Math.round(e.y - RAJZ_H + 10);

  c.fillStyle = 'rgba(0,0,0,0.26)';
  c.fillRect(x + 8, Math.round(e.y) + 2, RAJZ_W - 16, 5);

  const villog = jatekos && e.serthetetlen > 0 && e.kabult <= 0 && ((ido * 12) | 0) % 2 === 0;
  if (!villog) {
    if (e.kabult > 0) {
      c.save();
      c.translate(e.x, e.y);
      c.rotate(Math.sin(ido * 9) * 0.16);
      c.drawImage(kep, 0, 0, SPRITE_W, SPRITE_H, -RAJZ_W / 2, -RAJZ_H + 10, RAJZ_W, RAJZ_H);
      c.restore();
    } else {
      c.drawImage(kep, 0, 0, SPRITE_W, SPRITE_H, x, y, RAJZ_W, RAJZ_H);
    }
  }
  // serthetetlenseg: vilagos gyuru a lab korul
  if (jatekos && e.immunis > 0) {
    c.strokeStyle = e.szin.jel;
    c.lineWidth = 3;
    c.beginPath();
    c.ellipse(e.x, e.y + 3, 22, 9, 0, 0, Math.PI * 2);
    c.stroke();
  }
  if (e.kabult > 0) csillagok(e);
}

function nevRajz(e, jatekos) {
  const y = Math.round(e.y) + 10;
  if (jatekos) {
    drawText(c, e.kollega.becenev.toUpperCase(), e.x, y, {
      scale: 2, color: e.szin.jel, shadow: '#0b0d12', outline: '#0b0d12', align: 'center',
    });
    return;
  }
  const fo = !!e.f.fo;
  drawText(c, e.kollega.becenev.toUpperCase(), e.x, y, {
    scale: fo ? 2 : 1,
    color: fo ? e.szin : PAL.feliratVil,
    shadow: '#0b0d12',
    outline: fo ? '#0b0d12' : null,
    align: 'center',
  });
  if (fo) {
    const bx = Math.round(e.x);
    const by = Math.round(e.y) - RAJZ_H + 2 + Math.sin(ido * 4) * 2;
    c.fillStyle = e.szin;
    c.fillRect(bx - 2, by, 4, 9);
    c.fillRect(bx - 2, by + 11, 4, 4);
  }
}

function hudRajz() {
  const a = allas();
  const ossz = Math.max(0.0001, a[0] + a[1]);

  const savX = 300;
  const savW = W - 600;
  const savY = 16;
  const savH = 20;
  c.fillStyle = '#0f1218';
  c.fillRect(savX - 4, savY - 4, savW + 8, savH + 8);
  c.fillStyle = jatekosok[0].szin.ter;
  const b1 = Math.round(savW * (a[0] / ossz));
  c.fillRect(savX, savY, b1, savH);
  c.fillStyle = jatekosok[1].szin.ter;
  c.fillRect(savX + b1, savY, savW - b1, savH);
  c.fillStyle = '#0f1218';
  c.fillRect(savX + b1 - 2, savY, 4, savH);

  const idoSzin = riado ? (((ido * 6) | 0) % 2 ? PAL.riado : '#FFD0D0') : PAL.feliratVil;
  drawText(c, String(Math.ceil(hatra)), W / 2, savY + savH + 10, { scale: 5, color: idoSzin, shadow: '#0b0d12', outline: '#0b0d12', align: 'center' });

  for (let i = 0; i < 2; i++) {
    const j = jatekosok[i];
    const bal = i === 0;
    const fx = bal ? 18 : W - 18 - 44;
    c.drawImage(j.figura[0], 0, 0, SPRITE_W, SPRITE_H, fx, 16, 44, 55);
    const tx = bal ? 76 : W - 76;
    const align = bal ? 'left' : 'right';
    drawText(c, Math.round(a[i] * 100) + '%', tx, 14, { scale: 5, color: j.szin.jel, shadow: '#0b0d12', outline: '#0b0d12', align });
    drawText(c, j.kollega.becenev.toUpperCase(), tx, 64, { scale: 2, color: PAL.feliratVil, shadow: '#0b0d12', outline: '#0b0d12', align });
    if (szobaDb[i]) drawText(c, szobaDb[i] + ' SZOBA', tx, 88, { scale: 2, color: j.szin.jel, shadow: '#0b0d12', outline: '#0b0d12', align });
  }

  if (kihivas) {
    const g = GOMB[kihivas.gomb];
    gombKor(W / 2, 168, 28, g.szin, ido);
    drawText(c, kihivas.bonusz.nev, W / 2, 208, { scale: 2, color: g.szin, shadow: '#0b0d12', outline: '#0b0d12', align: 'center' });
  }

  if (parbaj) {
    const g = GOMB[parbaj.gomb];
    const y = Math.max(70, parbaj.y - RAJZ_H - 30);
    gombKor(parbaj.x, y, 26, g.szin, ido);
    drawText(c, 'AKI ELŐBB NYOMJA, ÜT', parbaj.x, y + 34, { scale: 2, color: g.szin, shadow: '#0b0d12', outline: '#0b0d12', align: 'center' });
  }

  uzenetek.slice(-3).forEach((u, i) => {
    c.globalAlpha = Math.min(1, u.t / 0.4);
    drawText(c, u.szoveg, W / 2, H - 116 + i * 34, { scale: 3, color: u.szin, shadow: '#0b0d12', outline: '#0b0d12', align: 'center' });
    c.globalAlpha = 1;
  });
}

function visszaRajz() {
  c.fillStyle = 'rgba(10,12,17,0.72)';
  c.fillRect(0, 0, W, H);
  const n = Math.ceil(vissza);
  const p = 1 - (vissza - Math.floor(vissza));
  const m = 10 + (1 - p) * 6;
  drawText(c, CIM, W / 2, 130, { scale: 5, color: PAL.feliratVil, shadow: '#07090d', outline: '#0b0d12', align: 'center' });
  drawText(c, SZABALY, W / 2, 210, { scale: 3, color: jatekosok[0].szin.jel, shadow: '#07090d', align: 'center' });
  drawText(c, String(n), W / 2, H / 2 - 20, { scale: m, color: PAL.feliratVil, shadow: '#07090d', outline: '#0b0d12', align: 'center' });
  drawText(c, 'START: SZÜNET    M: NÉMÍTÁS', W / 2, H - 90, { scale: 2, color: PAL.szonyegVil, shadow: '#07090d', align: 'center' });
}

function szunetRajz() {
  c.fillStyle = 'rgba(10,12,17,0.78)';
  c.fillRect(0, 0, W, H);
  drawText(c, 'SZÜNET', W / 2, 200, { scale: 9, color: PAL.feliratVil, shadow: '#07090d', outline: '#0b0d12', align: 'center' });
  drawText(c, SZABALY, W / 2, 330, { scale: 2, color: PAL.szonyegVil, shadow: '#07090d', align: 'center' });
  if (Math.floor(ido * 1.8) % 2 === 0) {
    drawText(c, 'START: FOLYTATÁS', W / 2, 420, { scale: 4, color: jatekosok[0].szin.jel, shadow: '#07090d', outline: '#0b0d12', align: 'center' });
  }
}

function vegKepRajz() {
  const a = allas();
  const dontetlen = a[0] === a[1];
  const gy = a[0] > a[1] ? 0 : 1;

  c.fillStyle = 'rgba(10,12,17,' + Math.min(0.88, vegeAnim * 1.4) + ')';
  c.fillRect(0, 0, W, H);
  if (vegeAnim < 0.3) return;

  if (logoCv) {
    c.globalAlpha = 0.14;
    c.drawImage(logoCv, W / 2 - 120, H / 2 - 160, 240, 240);
    c.globalAlpha = 1;
  }

  const cim = dontetlen ? 'DÖNTETLEN' : jatekosok[gy].kollega.becenev.toUpperCase() + ' NYERT';
  const ugras = Math.max(0, Math.sin(Math.min(1, vegeAnim) * Math.PI) * 14);
  drawText(c, cim, W / 2, 96 - ugras, {
    scale: 8, color: dontetlen ? PAL.feliratVil : jatekosok[gy].szin.jel, shadow: '#07090d', outline: '#0b0d12', align: 'center',
  });

  for (let i = 0; i < 2; i++) {
    const x = W / 2 + (i === 0 ? -210 : 210);
    const j = jatekosok[i];
    const m = 7;
    c.drawImage(j.figura[0], 0, 0, SPRITE_W, SPRITE_H, x - (SPRITE_W * m) / 2, 216, SPRITE_W * m, SPRITE_H * m);
    drawText(c, (a[i] * 100).toFixed(1) + '%', x, 376, { scale: 5, color: j.szin.jel, shadow: '#07090d', outline: '#0b0d12', align: 'center' });
    drawText(c, j.kollega.nev.toUpperCase(), x, 424, { scale: 2, color: PAL.feliratVil, shadow: '#07090d', align: 'center' });
    drawText(c, szobaDb[i] + ' SZOBA', x, 450, { scale: 2, color: PAL.felirat, shadow: null, align: 'center' });
  }

  if (vegeAnim < 0.9) return;

  // sarga: ujra ugyanezekkel, piros: vissza a karaktervalasztoba
  const y = 540;
  gombKor(W / 2 - 300, y, 17, GOMB.b.szin, ido);
  drawText(c, 'ÚJRA UGYANÍGY', W / 2 - 270, y - 10, { scale: 3, color: PAL.feliratVil, shadow: '#07090d', outline: '#0b0d12' });
  gombKor(W / 2 + 90, y, 17, GOMB.a.szin, ido + 1);
  drawText(c, 'ÚJ KARAKTER', W / 2 + 120, y - 10, { scale: 3, color: PAL.feliratVil, shadow: '#07090d', outline: '#0b0d12' });
}

function rajzol() {
  c.save();
  if (rezges > 0.3) c.translate((rng() - 0.5) * rezges, (rng() - 0.5) * rezges);

  c.fillStyle = PAL.hatter;
  c.fillRect(-40, -40, W + 80, H + 80);
  c.drawImage(padloCv, 0, 0);
  teruletRajz();
  for (const b of butorok) butorRajz(c, b);
  c.drawImage(falCv, 0, 0);
  // A tuzriado a FALAKON lüktet, a padlohoz nem nyul: a padlo a jatekallas.
  if (riado && mod !== 'vege') {
    c.globalAlpha = 0.35 + Math.abs(Math.sin(ido * 4)) * 0.45;
    c.drawImage(falRiadoCv, 0, 0);
    c.globalAlpha = 1;
  }
  c.drawImage(feliratCv, 0, 0);

  if (kave) {
    const p = Math.sin(kave.t * 5) * 2;
    c.fillStyle = PAL.fal;
    c.fillRect(kave.x - 8, kave.y - 9 + p, 16, 15);
    c.fillStyle = '#5C3A22';
    c.fillRect(kave.x - 6, kave.y - 7 + p, 12, 5);
    c.fillStyle = PAL.fal;
    c.fillRect(kave.x + 8, kave.y - 5 + p, 4, 7);
  }

  const mind = [...npck.map((n) => ({ e: n, j: false })), ...jatekosok.map((j) => ({ e: j, j: true }))];
  mind.sort((a, b) => a.e.y - b.e.y);
  for (const { e, j } of mind) figuraRajz(e, j);
  for (const { e, j } of mind) nevRajz(e, j);

  for (const p of reszek) {
    c.globalAlpha = Math.max(0, Math.min(1, p.t / 0.35));
    c.fillStyle = p.szin;
    c.fillRect(Math.round(p.x), Math.round(p.y), p.m, p.m);
  }
  c.globalAlpha = 1;

  c.restore();

  hudRajz();
  if (mod === 'vissza') visszaRajz();
  else if (mod === 'szunet') szunetRajz();
  else if (mod === 'vege') vegKepRajz();
}

// ---------------------------------------------------------------- futas

let utolso = performance.now();

/** Egy meccs. Akkor ter vissza, ha a jatekos uj karaktert valasztana. */
function jatekFut() {
  return new Promise((kesz) => {
    kilepes = null;
    ujKor();
    utolso = performance.now();
    const kepkocka = (most) => {
      let dt = (most - utolso) / 1000;
      utolso = most;
      if (dt > 0.25) dt = 0.25;
      lepes(dt);
      rajzol();
      mostNyomott = [];
      if (kilepes === 'menu') { kesz('menu'); return; }
      if (kilepes === 'ujra') { kilepes = null; ujKor(); }
      requestAnimationFrame(kepkocka);
    };
    requestAnimationFrame(kepkocka);
  });
}

// ---------------------------------------------------------------- indulas

function toltoKep(kesz, ossz, t) {
  hatterRajz(c, t);
  drawText(c, CIM, W / 2, 240, { scale: 8, color: CSAPAT[0].jel, shadow: '#07090d', outline: '#0b0d12', align: 'center' });
  drawText(c, 'BETÖLTÉS', W / 2, 372, { scale: 3, color: PAL.szonyegVil, shadow: null, align: 'center' });
  const sw = 520;
  const sx = W / 2 - sw / 2;
  c.fillStyle = '#0f1218';
  c.fillRect(sx - 3, 420, sw + 6, 26);
  c.fillStyle = CSAPAT[1].ter;
  c.fillRect(sx, 423, Math.round((sw * kesz) / Math.max(1, ossz)), 20);
  drawText(c, kesz + ' / ' + ossz, W / 2, 464, { scale: 2, color: PAL.felirat, shadow: null, align: 'center' });
}

async function jellemzokElore(lista) {
  let kesz = 0;
  let fut = true;
  const rajz = (t) => { if (fut) { toltoKep(kesz, lista.length, t / 1000); requestAnimationFrame(rajz); } };
  requestAnimationFrame(rajz);
  for (const k of lista) {
    try { jellemzok.set(k.id, await jellemzokKerd(k)); } catch { /* hianyzo fej nem allitja meg */ }
    kesz++;
  }
  fut = false;
}

/** A ket jatekos es a zavaro kollegak felallitasa a valasztas utan. */
function csapatFelallit(valasztott) {
  jatekosok = valasztott.map((v, i) => jatekosLetrehoz(i, v.kollega, v.szin));
  szinekFrissit();

  const foglalt = new Set(valasztott.map((v) => v.kollega.id));
  const lista = [];

  // A ket fogonosz szerepe MINDIG betoltodik. Alapbol Patki es Varo, de ha
  // valamelyiket eppen egy jatekos valasztotta, akkor helyette veletlenszeruen
  // beugrik valaki mas. Jatekos karaktere sosem lesz NPC.
  for (const [id, fajta] of [[PATKI_ID, 'patki'], [VARO_ID, 'varo']]) {
    let k = kollegak.find((x) => x.id === id);
    if (!k || foglalt.has(id)) {
      const jelolt = kollegak.filter((x) => !foglalt.has(x.id));
      if (!jelolt.length) continue;
      k = jelolt[(rng() * jelolt.length) | 0];
    }
    lista.push({ k, fajta });
    foglalt.add(k.id);
  }
  const tobbi = ['kerget', 'lesben', 'folyoso', 'bolyong', 'kerget', 'bolyong', 'lesben', 'bolyong'];
  const maradek = kollegak.filter((k) => !foglalt.has(k.id));
  let n = 0;
  while (lista.length < NPC_DB && maradek.length) {
    const k = maradek.splice((rng() * maradek.length) | 0, 1)[0];
    lista.push({ k, fajta: tobbi[n++ % tobbi.length] });
  }
  npck = lista.map(({ k, fajta }, i) => npcLetrehoz(k, fajta, szobaKozep(szobak[(i * 3 + 2) % szobak.length])));
}

async function indul() {
  kollegak = await nevsorBetolt();

  try { logoKep = await kepBetolt('img/logo.png'); } catch { logoKep = null; }
  hatterInit(logoKep);
  if (logoKep) {
    logoCv = document.createElement('canvas');
    logoCv.width = 240;
    logoCv.height = 240;
    logoPixel(logoCv.getContext('2d'), logoKep, 0, 0, 240, CSAPAT[0].jel);
  }

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
        title: CIM,
        subtitle: 'Két USB kontroller, két kolléga, egy iroda. Nyomj egy gombot mindkét paden.',
        allowKeyboard: true,
        onClose: () => { pads.keyboard(true); nyomva.clear(); ok(); },
      });
    });
    zene.indit();
    zene.zeneIndul();
    await cimkepernyo({ ctx: c, kollegak, jellemzok, logoKep, hatterRajz });
  }

  // A meccs vegen vagy uj kor indul ugyanezekkel, vagy vissza a valasztoba.
  for (;;) {
    const valasztott = teszt
      ? [{ kollega: kollegak[0], szin: SZINEK[0] }, { kollega: kollegak[3], szin: SZINEK[1] }]
      : await karakterValaszto({ ctx: c, kollegak, jellemzok, kiemelt: [PATKI_ID, VARO_ID], hatterRajz });

    csapatFelallit(valasztott);
    zene.indit();
    zene.zeneIndul();

    window.jatek = {
      get allas() { return allas(); },
      jatekosok, npck, szobak, racs, ujKor, lepes, rajzol, nyomva,
      get hatra() { return hatra; },
      set hatra(v) { hatra = v; },
      get mod() { return mod; },
      set mod(v) { mod = v; },
      get parbaj() { return parbaj; },
    };

    await jatekFut();
    if (teszt) break;
  }
}

indul().catch((e) => {
  hatterRajz(c, 0);
  drawText(c, 'HIBA', W / 2, 280, { scale: 6, color: PAL.riado, shadow: '#07090d', align: 'center' });
  drawText(c, String(e.message).toUpperCase().slice(0, 44), W / 2, 360, { scale: 2, color: PAL.feliratVil, shadow: null, align: 'center' });
  console.error(e);
});

/**
 * AZ IRODA ALAPRAJZA
 *
 * A valodi alaprajz kovetese, nem egy szabalyos racs: az epulet korvonala
 * szabalytalan sokszog, a szobak melysege kulonbozo, es a szobak kozott is
 * vannak atjarok.
 *
 * A LEGFONTOSABB SZABALY (latvanyterv): a padlo nem diszlet, hanem a
 * jatektabla. Minden cellanak van allapota (semleges / valakie / csik), es azt
 * mozgas kozben, fel masodperc alatt olvasni kell tudni. A hitelesseg csak
 * ezutan jon. Ezert:
 *
 *   - a semleges szonyeg alacsony kontrasztu, halk szemcsevel es fugaraccsal,
 *   - az akcentus lapok (bordo, sotetszurke) csak 3-3%-ban szorodnak el,
 *   - a fugaracs a rafestett szin FOLE kerul, tehat atut rajta: igy latszik,
 *     hany cella van meg hatra,
 *   - a konyha vinyl padlojan NINCS fuga, ezert tajekozodasi pont.
 *
 * A butor kulon reteg, es TOLHATO: az asztalokat es a szekeket a jatekosok
 * maguk elott tolhatjak, igy utat lehet vele zarni vagy nyitni.
 */

import { GW, GH, CELL, PAL, mulberry32 } from './config.js';
import { drawText } from './font.js';

/** A szoba akkor telik be teljesen, ha ennyi hanyadat mar birtokolja valaki. */
export const SZOBA_KUSZOB = 0.8;

const idx = (x, y) => y * GW + x;

// ---------------------------------------------------------------- korvonal

const EPULET = [
  [26, 3], [95, 3], [95, 7], [103, 7], [103, 2], [119, 2], [119, 7],
  [129, 7], [129, 4], [157, 4], [157, 86], [15, 86], [2, 63], [2, 34],
];

function bent(px, py) {
  const x = px + 0.5;
  const y = py + 0.5;
  let be = false;
  for (let i = 0, j = EPULET.length - 1; i < EPULET.length; j = i++) {
    const [xi, yi] = EPULET[i];
    const [xj, yj] = EPULET[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) be = !be;
  }
  return be;
}

// ---------------------------------------------------------------- szobalista

export const SZOBAK = [
  { id: 'iroda_e1', tipus: 'iroda', felirat: 'IRODA', x1: 3, y1: 5, x2: 28, y2: 38, ajto: { x: 16, w: 6 } },
  { id: 'targyalo_1', tipus: 'targyalo', felirat: 'TÁRGYALÓ', x1: 30, y1: 5, x2: 43, y2: 34, ajto: { x: 36, w: 5 } },
  { id: 'targyalo_2', tipus: 'targyalo', felirat: 'TÁRGYALÓ', x1: 45, y1: 5, x2: 58, y2: 34, ajto: { x: 51, w: 5 } },
  { id: 'targyalo_3', tipus: 'targyalo', felirat: 'TÁRGYALÓ', x1: 60, y1: 5, x2: 74, y2: 34, ajto: { x: 67, w: 5 } },
  { id: 'konyha', tipus: 'konyha', felirat: 'KONYHA / ÉTKEZŐ', x1: 76, y1: 9, x2: 101, y2: 38, ajto: { x: 88, w: 8 } },
  { id: 'lepcsohaz', tipus: 'lepcso', felirat: 'LÉPCSŐHÁZ', x1: 104, y1: 4, x2: 118, y2: 36, ajto: { x: 111, w: 5 } },
  { id: 'iroda_e2', tipus: 'iroda', felirat: 'IRODA', x1: 120, y1: 6, x2: 155, y2: 38, ajto: { x: 138, w: 6 } },

  { id: 'open_office', tipus: 'open', felirat: 'OPEN OFFICE', x1: 3, y1: 51, x2: 38, y2: 84, ajto: { x: 14, w: 6 }, ajto2: { x: 31, w: 6 } },
  { id: 'targyalo_4', tipus: 'targyalo', felirat: 'TÁRGYALÓ', x1: 40, y1: 53, x2: 52, y2: 66, ajto: { x: 46, w: 5 } },
  { id: 'targyalo_5', tipus: 'targyalo', felirat: 'TÁRGYALÓ', x1: 40, y1: 68, x2: 52, y2: 84 },
  { id: 'iroda_d1', tipus: 'iroda', felirat: 'IRODA', x1: 54, y1: 51, x2: 75, y2: 84, ajto: { x: 64, w: 6 } },
  { id: 'iroda_d2', tipus: 'iroda', felirat: 'IRODA', x1: 77, y1: 53, x2: 96, y2: 84, ajto: { x: 86, w: 6 } },
  { id: 'iroda_d3', tipus: 'iroda', felirat: 'IRODA', x1: 98, y1: 51, x2: 120, y2: 84, ajto: { x: 109, w: 6 } },
  { id: 'iroda_d4', tipus: 'iroda', felirat: 'IRODA', x1: 122, y1: 53, x2: 155, y2: 84, ajto: { x: 138, w: 6 } },
];

const ATJARO = [
  { x1: 29, y1: 12, x2: 29, y2: 18 },
  { x1: 44, y1: 22, x2: 44, y2: 28 },
  { x1: 59, y1: 12, x2: 59, y2: 18 },
  { x1: 75, y1: 22, x2: 75, y2: 28 },
  { x1: 102, y1: 14, x2: 102, y2: 22 },
  { x1: 119, y1: 14, x2: 119, y2: 22 },
  { x1: 39, y1: 72, x2: 39, y2: 78 },
  { x1: 40, y1: 67, x2: 52, y2: 67 },
  { x1: 53, y1: 58, x2: 53, y2: 64 },
  { x1: 76, y1: 70, x2: 76, y2: 76 },
  { x1: 97, y1: 60, x2: 97, y2: 66 },
  { x1: 121, y1: 70, x2: 121, y2: 76 },
];

export const KEZDOHELYEK = [
  { szoba: 'open_office', x: 14, y: 68 },
  { szoba: 'open_office', x: 30, y: 78 },
  { szoba: 'iroda_e1', x: 14, y: 20 },
  { szoba: 'iroda_e2', x: 138, y: 22 },
  { szoba: 'iroda_d4', x: 138, y: 70 },
  { szoba: 'iroda_d1', x: 64, y: 70 },
  { szoba: 'konyha', x: 88, y: 24 },
  { szoba: 'iroda_d3', x: 109, y: 70 },
  { szoba: 'targyalo_2', x: 51, y: 20 },
];

export const BAZIS_MERET = 7;

// ---------------------------------------------------------------- felepites

export function palyaEpit() {
  const fal = new Uint8Array(GW * GH).fill(1);
  const belso = new Uint8Array(GW * GH);

  for (let y = 0; y < GH; y++) {
    for (let x = 0; x < GW; x++) {
      if (!bent(x, y)) continue;
      belso[idx(x, y)] = 1;
      fal[idx(x, y)] = 0;
    }
  }

  const falRak = (x, y) => {
    if (x < 0 || y < 0 || x >= GW || y >= GH) return;
    if (!belso[idx(x, y)]) return;
    fal[idx(x, y)] = 1;
  };
  for (const sz of SZOBAK) {
    for (let x = sz.x1 - 1; x <= sz.x2 + 1; x++) { falRak(x, sz.y1 - 1); falRak(x, sz.y2 + 1); }
    for (let y = sz.y1 - 1; y <= sz.y2 + 1; y++) { falRak(sz.x1 - 1, y); falRak(sz.x2 + 1, y); }
  }

  const kivag = (x1, y1, x2, y2) => {
    for (let y = Math.max(0, y1); y <= Math.min(GH - 1, y2); y++) {
      for (let x = Math.max(0, x1); x <= Math.min(GW - 1, x2); x++) {
        if (belso[idx(x, y)]) fal[idx(x, y)] = 0;
      }
    }
  };
  for (const sz of SZOBAK) {
    const eszaki = sz.y2 < 45;
    for (const a of [sz.ajto, sz.ajto2]) {
      if (!a) continue;
      const bal = a.x - ((a.w / 2) | 0);
      if (eszaki) kivag(bal, sz.y2 + 1, bal + a.w - 1, sz.y2 + 1);
      else kivag(bal, sz.y1 - 1, bal + a.w - 1, sz.y1 - 1);
    }
  }
  for (const a of ATJARO) kivag(a.x1, a.y1, a.x2, a.y2);

  const szobak = SZOBAK.map((sz) => {
    const cellak = [];
    for (let y = sz.y1; y <= sz.y2; y++) {
      for (let x = sz.x1; x <= sz.x2; x++) if (!fal[idx(x, y)]) cellak.push(idx(x, y));
    }
    return { ...sz, cellak, db: cellak.length, teljes: -1 };
  });

  const kulso = new Uint8Array(GW * GH);
  for (let y = 0; y < GH; y++) {
    for (let x = 0; x < GW; x++) {
      if (belso[idx(x, y)]) continue;
      let kozel = false;
      for (let dy = -2; dy <= 2 && !kozel; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
          if (belso[idx(nx, ny)]) { kozel = true; break; }
        }
      }
      if (kozel) kulso[idx(x, y)] = 1;
    }
  }

  let padloDb = 0;
  for (let i = 0; i < fal.length; i++) if (!fal[i]) padloDb++;

  return { fal, belso, kulso, szobak, padloDb };
}

export function szobaKozep(sz) {
  return { x: ((sz.x1 + sz.x2) / 2) * CELL, y: ((sz.y1 + sz.y2) / 2) * CELL };
}

function pxHatar(sz) {
  return { x: sz.x1 * CELL, y: sz.y1 * CELL, w: (sz.x2 - sz.x1 + 1) * CELL, h: (sz.y2 - sz.y1 + 1) * CELL };
}

// ---------------------------------------------------------------- butor
//
// A butor kulon reteg es TOLHATO. A padlo alatta is festheto: a butor csak
// rajta all. Az asztalok es a szekek mozgathatok, a pult es a lepcso nem.

/**
 * Egy butordarab: x,y a KOZEPPONTJA pixelben.
 *
 *   tol    - tolhato-e a jatekos elott
 *   atjar  - ATJARHATO-e: ha igen, nem utkozik vele senki, csak ralep.
 *            A lepcso ilyen: rajta kell tudni menni, es a lepcsohazban
 *            mindig legyen annyi hely, hogy a jatekos elferjen.
 */
function butor(tipus, x, y, w, h, tol = true, atjar = false) {
  return { tipus, x, y, w, h, tol, atjar, vx: 0, vy: 0 };
}

/**
 * Legeneralja a butorokat a szobak alapjan. Csak oda kerul butor, ahol
 * tenylegesen padlo van: a ferde homlokzatu szobaknal a teglalap egy resze
 * mar az epuleten kivul esik.
 */
export function butorokEpit(szobak, fal) {
  const rng = mulberry32(31415);
  const ki = [];
  const padloE = (x, y) => {
    const gx = (x / CELL) | 0;
    const gy = (y / CELL) | 0;
    if (gx < 1 || gy < 1 || gx >= GW - 1 || gy >= GH - 1) return false;
    return !fal[idx(gx, gy)];
  };
  const rak = (b) => {
    if (!padloE(b.x, b.y)) return;
    if (!padloE(b.x - b.w / 2, b.y) || !padloE(b.x + b.w / 2, b.y)) return;
    if (!padloE(b.x, b.y - b.h / 2) || !padloE(b.x, b.y + b.h / 2)) return;
    ki.push(b);
  };

  for (const sz of szobak) {
    const b = pxHatar(sz);

    if (sz.tipus === 'targyalo') {
      const aw = Math.max(40, Math.round(b.w * 0.5));
      const ah = Math.max(34, Math.round(b.h * 0.42));
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      rak(butor('asztal', cx, cy, aw, ah));
      const oldalt = Math.max(2, Math.round(ah / 36));
      for (let i = 0; i < oldalt; i++) {
        const sy = cy - ah / 2 + (ah / (oldalt + 1)) * (i + 1);
        rak(butor('szek', cx - aw / 2 - 11, sy, 13, 13));
        rak(butor('szek', cx + aw / 2 + 11, sy, 13, 13));
      }
      for (let i = 0; i < 2; i++) {
        const sx = cx - aw / 2 + (aw / 3) * (i + 1);
        rak(butor('szek', sx, cy - ah / 2 - 11, 13, 13));
        rak(butor('szek', sx, cy + ah / 2 + 11, 13, 13));
      }
      continue;
    }

    if (sz.tipus === 'iroda') {
      const aw = 66;
      const ah = 30;
      for (const ay of [b.y + 34, b.y + b.h - 34]) {
        const db = Math.max(1, Math.floor((b.w - 30) / (aw + 26)));
        for (let i = 0; i < db; i++) {
          const ax = b.x + 26 + i * (aw + 26) + aw / 2;
          rak(butor('asztal', ax, ay, aw, ah));
          rak(butor('szek', ax, ay + ah / 2 + 13, 15, 15));
        }
      }
      continue;
    }

    if (sz.tipus === 'open') {
      const aw = 58;
      const ah = 26;
      for (let sor = 0; sor < 3; sor++) {
        const ay = b.y + 36 + sor * ((b.h - 70) / 3);
        for (let osz = 0; osz < 3; osz++) {
          const ax = b.x + 30 + osz * ((b.w - 56) / 3) + aw / 2;
          rak(butor('asztal', ax, ay, aw, ah));
          rak(butor('szek', ax, ay + ah / 2 + 12, 14, 14));
        }
      }
      continue;
    }

    if (sz.tipus === 'konyha') {
      // A pult FIX: a fal menten all, nem lehet eltolni.
      rak(butor('pult', b.x + b.w / 2, b.y + 18, b.w - 24, 22, false));
      const ky = b.y + b.h * 0.6;
      for (const kx of [b.x + b.w * 0.3, b.x + b.w * 0.7]) {
        rak(butor('kerekasztal', kx, ky, 34, 34));
        rak(butor('bárszék', kx - 26, ky, 12, 12));
        rak(butor('bárszék', kx + 26, ky, 12, 12));
        rak(butor('bárszék', kx, ky - 26, 12, 12));
        rak(butor('bárszék', kx, ky + 26, 12, 12));
      }
      continue;
    }

    if (sz.tipus === 'lepcso') {
      rak(butor('lepcso', b.x + b.w / 2, b.y + b.h / 2, b.w - 26, b.h - 34, false, true));
      continue;
    }
  }

  // nehany noveny a sarkokba, diszitesnek
  for (const sz of szobak) {
    if (rng() < 0.5) continue;
    const b = pxHatar(sz);
    rak(butor('noveny', b.x + 14, b.y + 14, 14, 14, false, true));
  }

  return ki;
}

/** Egy butordarab kirajzolasa. */
export function butorRajz(c, b) {
  const x = Math.round(b.x - b.w / 2);
  const y = Math.round(b.y - b.h / 2);
  const w = Math.round(b.w);
  const h = Math.round(b.h);

  if (b.tipus === 'szek' || b.tipus === 'bárszék') {
    c.fillStyle = '#1E1E20';
    c.fillRect(x, y, w, h);
    c.fillStyle = b.tipus === 'bárszék' ? '#8E2028' : '#3A3A3E';
    c.fillRect(x + 2, y + 2, w - 4, h - 5);
    return;
  }

  if (b.tipus === 'noveny') {
    c.fillStyle = '#6B4A2E';
    c.fillRect(x + 3, y + h - 6, w - 6, 6);
    c.fillStyle = '#2E7D32';
    c.fillRect(x + 1, y, w - 2, h - 6);
    c.fillStyle = '#45A049';
    c.fillRect(x + 3, y + 2, 4, 4);
    return;
  }

  if (b.tipus === 'lepcso') {
    c.fillStyle = PAL.falVonal;
    c.fillRect(x, y, w, h);
    for (let i = 0; i * 14 < h - 6; i++) {
      c.fillStyle = i % 2 ? PAL.fal : PAL.asztal;
      c.fillRect(x + 3, y + 3 + i * 14, w - 6, 11);
    }
    c.fillStyle = '#2A2A2C';
    c.fillRect(x, y, 3, h);
    c.fillRect(x + w - 3, y, 3, h);
    return;
  }

  if (b.tipus === 'pult') {
    c.fillStyle = PAL.falVonal;
    c.fillRect(x, y, w, h);
    c.fillStyle = PAL.asztal;
    c.fillRect(x, y, w, h - 4);
    c.fillStyle = '#2A2A2C';
    c.fillRect(x + 22, y + 5, 18, 12);
    c.fillRect(x + 62, y + 5, 14, 12);
    c.fillStyle = PAL.asztalKek;
    c.fillRect(x + w - 40, y + 4, 18, 14);
    return;
  }

  if (b.tipus === 'kerekasztal') {
    c.fillStyle = PAL.falVonal;
    c.fillRect(x, y, w, h);
    c.fillStyle = PAL.asztal;
    c.fillRect(x, y, w, h - 4);
    c.fillStyle = '#E3E3E1';
    c.fillRect(x + 4, y + 4, w - 8, h - 12);
    return;
  }

  // asztal: lap + arnyek + monitor
  c.fillStyle = PAL.falVonal;
  c.fillRect(x, y, w, h);
  c.fillStyle = PAL.asztal;
  c.fillRect(x, y, w, h - 4);
  if (w > 40) {
    c.fillStyle = '#2A2A2C';
    c.fillRect(x + 8, y + 4, 18, 11);
    c.fillStyle = PAL.uveg;
    c.fillRect(x + 10, y + 6, 14, 7);
    c.fillStyle = '#DDDDDB';
    c.fillRect(x + w - 20, y + 6, 12, 8);
  }
}

// ---------------------------------------------------------------- rajzolas

function vaszon() {
  const cv = document.createElement('canvas');
  cv.width = GW * CELL;
  cv.height = GH * CELL;
  const c = cv.getContext('2d');
  c.imageSmoothingEnabled = false;
  return { cv, c };
}

/** Melyik cella tartozik a konyhahoz: ott vinyl van, fuga nelkul. */
function konyhaMaszk(szobak, fal) {
  const m = new Uint8Array(GW * GH);
  const k = szobak.find((s) => s.tipus === 'konyha');
  if (!k) return m;
  for (const cella of k.cellak) m[cella] = 1;
  return m;
}

/**
 * A padlo: semleges szonyeg halk szemcsevel, 3-3% bordo es sotetszurke
 * akcentus lappal, plusz a konyha vinylje. A teruletszinek ALATT van.
 */
export function padloRajz(fal, belso, szobak) {
  const { cv, c } = vaszon();
  const rng = mulberry32(20260918);
  const konyha = konyhaMaszk(szobak, fal);

  for (let y = 0; y < GH; y++) {
    for (let x = 0; x < GW; x++) {
      const k = idx(x, y);
      if (!belso[k]) continue;
      const px = x * CELL;
      const py = y * CELL;

      if (konyha[k]) {
        // vinyl: hidegebb, sotetebb, fuga nelkul
        const r = rng();
        c.fillStyle = r < 0.2 ? PAL.konyhaVil : PAL.konyhaPadlo;
        c.fillRect(px, py, CELL, CELL);
        continue;
      }

      const r = rng();
      let szin = PAL.szonyeg;
      if (r < 0.012) szin = PAL.akcentBordo;         // bordo akcentus lap
      else if (r < 0.026) szin = PAL.akcentSzurke;   // sotetszurke akcentus lap
      else if (r < 0.12) szin = PAL.szonyegVil;
      else if (r < 0.2) szin = PAL.szonyegSot;
      c.fillStyle = szin;
      c.fillRect(px, py, CELL, CELL);
    }
  }
  return cv;
}

/**
 * A fugaracs KULON vasznon, mert a teruletszinek FOLE kerul: igy a rafestett
 * szinen is latszanak a cellahatarok, es meg lehet szamolni, hany cella van
 * hatra. A konyhaban nincs fuga.
 */
export function fugaRajz(belso, szobak, fal) {
  const { cv, c } = vaszon();
  const konyha = konyhaMaszk(szobak, fal);
  c.fillStyle = 'rgba(40,42,44,0.24)';
  for (let y = 0; y < GH; y++) {
    for (let x = 0; x < GW; x++) {
      const k = idx(x, y);
      if (!belso[k] || konyha[k]) continue;
      c.fillRect(x * CELL, y * CELL, CELL, 1);
      c.fillRect(x * CELL, y * CELL, 1, CELL);
    }
  }
  return cv;
}

export function logoPixel(c, kep, x, y, meret, szin) {
  const n = 26;
  const seged = document.createElement('canvas');
  seged.width = n;
  seged.height = n;
  const sc = seged.getContext('2d', { willReadFrequently: true });
  sc.imageSmoothingEnabled = true;
  sc.drawImage(kep, 0, 0, n, n);
  const d = sc.getImageData(0, 0, n, n).data;
  const lep = meret / n;
  c.fillStyle = szin;
  for (let gy = 0; gy < n; gy++) {
    for (let gx = 0; gx < n; gx++) {
      if (d[(gy * n + gx) * 4 + 3] < 130) continue;
      c.fillRect(Math.round(x + gx * lep), Math.round(y + gy * lep), Math.ceil(lep), Math.ceil(lep));
    }
  }
}

/**
 * A falak. A targyalok fala uveges. A menekulesi tabla a folyoso falain.
 */
export function falakRajz(fal, belso, kulso, szobak) {
  const { cv, c } = vaszon();
  const latszik = (x, y) => {
    if (x < 0 || y < 0 || x >= GW || y >= GH) return false;
    const k = idx(x, y);
    return (belso[k] && fal[k]) || kulso[k] === 1;
  };

  const uveges = new Uint8Array(GW * GH);
  for (const sz of szobak) {
    if (sz.tipus !== 'targyalo') continue;
    for (let y = sz.y1 - 1; y <= sz.y2 + 1; y++) {
      for (let x = sz.x1 - 1; x <= sz.x2 + 1; x++) {
        if (x < 0 || y < 0 || x >= GW || y >= GH) continue;
        if (fal[idx(x, y)]) uveges[idx(x, y)] = 1;
      }
    }
  }

  for (let y = 0; y < GH; y++) {
    for (let x = 0; x < GW; x++) {
      if (!latszik(x, y)) continue;
      const k = idx(x, y);
      const px = x * CELL;
      const py = y * CELL;
      c.fillStyle = uveges[k] && belso[k] ? PAL.uveg : PAL.fal;
      c.fillRect(px, py, CELL, CELL);
      c.fillStyle = PAL.falEl;
      if (!latszik(x, y - 1)) c.fillRect(px, py, CELL, 2);
      if (!latszik(x, y + 1)) c.fillRect(px, py + CELL - 2, CELL, 2);
      if (!latszik(x - 1, y)) c.fillRect(px, py, 2, CELL);
      if (!latszik(x + 1, y)) c.fillRect(px + CELL - 2, py, 2, CELL);
    }
  }

  // menekulesi tablak a folyoso falan, mint a valodi alaprajzon
  const tablak = [30, 52, 74, 96, 118, 140];
  for (const tx of tablak) {
    for (const ty of [39, 50]) {
      if (!latszik(tx, ty)) continue;
      c.fillStyle = '#1F7A3A';
      c.fillRect(tx * CELL, ty * CELL + 2, 14, 8);
      c.fillStyle = '#E8F5E9';
      c.fillRect(tx * CELL + 3, ty * CELL + 4, 4, 4);
      c.fillRect(tx * CELL + 8, ty * CELL + 5, 4, 2);
    }
  }
  return cv;
}

export function feliratRajz(szobak) {
  const { cv, c } = vaszon();
  for (const sz of szobak) {
    const kx = ((sz.x1 + sz.x2) / 2) * CELL;
    const ky = sz.y1 * CELL + 8;
    c.globalAlpha = 0.9;
    drawText(c, sz.felirat, kx, ky, {
      scale: 2, color: PAL.szobaNev, shadow: PAL.fal, align: 'center',
    });
    c.globalAlpha = 1;
  }
  return cv;
}

/**
 * AZ IRODA ALAPRAJZA
 *
 * A valodi alaprajz arcade valtozata: egy hosszu kozepso folyoso, folotte es
 * alatta szobasor. A falak akadalyok, az ajtok a folyosorol nyilnak.
 *
 * A butorok NEM akadalyok: a padloba vannak rajzolva, es a festek atszurodik
 * rajtuk. A dolguk az, hogy a szoba ranezesre felismerheto legyen: a
 * targyaloban nagy asztal all szekekkel, az irodaban iroasztalok monitorral,
 * a konyhaban pult es kerek asztalok, a lepcsohazban lepcsofokok.
 */

import { GW, GH, CELL, PAL, mulberry32 } from './config.js';
import { drawText } from './font.js';

/** A szoba akkor telik be teljesen, ha ennyi hanyadat mar birtokolja valaki. */
export const SZOBA_KUSZOB = 0.8;

const idx = (x, y) => y * GW + x;

// ---------------------------------------------------------------- szobalista

export const FOLYOSO = { x1: 3, y1: 41, x2: 156, y2: 48 };

export const SZOBAK = [
  // eszaki sor, a folyoso folott
  { id: 'iroda_e1', tipus: 'iroda', felirat: 'IRODA', x1: 3, y1: 4, x2: 28, y2: 38, ajto: { x: 15, w: 6 } },
  { id: 'targyalo_1', tipus: 'targyalo', felirat: 'TÁRGYALÓ', x1: 31, y1: 4, x2: 44, y2: 38, ajto: { x: 37, w: 5 } },
  { id: 'targyalo_2', tipus: 'targyalo', felirat: 'TÁRGYALÓ', x1: 47, y1: 4, x2: 60, y2: 38, ajto: { x: 53, w: 5 } },
  { id: 'targyalo_3', tipus: 'targyalo', felirat: 'TÁRGYALÓ', x1: 63, y1: 4, x2: 76, y2: 38, ajto: { x: 69, w: 5 } },
  { id: 'konyha', tipus: 'konyha', felirat: 'KONYHA', x1: 79, y1: 4, x2: 103, y2: 38, ajto: { x: 91, w: 7 } },
  { id: 'lepcsohaz', tipus: 'lepcso', felirat: 'LÉPCSŐHÁZ', x1: 106, y1: 4, x2: 119, y2: 38, ajto: { x: 112, w: 5 } },
  { id: 'iroda_e2', tipus: 'iroda', felirat: 'IRODA', x1: 122, y1: 4, x2: 156, y2: 38, ajto: { x: 139, w: 6 } },

  // deli sor, a folyoso alatt
  { id: 'open_office', tipus: 'open', felirat: 'OPEN OFFICE', x1: 3, y1: 51, x2: 38, y2: 85, ajto: { x: 14, w: 6 }, ajto2: { x: 30, w: 6 } },
  { id: 'targyalo_4', tipus: 'targyalo', felirat: 'TÁRGYALÓ', x1: 41, y1: 51, x2: 52, y2: 66, ajto: { x: 46, w: 5 } },
  { id: 'targyalo_5', tipus: 'targyalo', felirat: 'TÁRGYALÓ', x1: 41, y1: 69, x2: 52, y2: 85 },
  { id: 'iroda_d1', tipus: 'iroda', felirat: 'IRODA', x1: 55, y1: 51, x2: 76, y2: 85, ajto: { x: 65, w: 6 } },
  { id: 'iroda_d2', tipus: 'iroda', felirat: 'IRODA', x1: 79, y1: 51, x2: 97, y2: 85, ajto: { x: 88, w: 6 } },
  { id: 'iroda_d3', tipus: 'iroda', felirat: 'IRODA', x1: 100, y1: 51, x2: 121, y2: 85, ajto: { x: 110, w: 6 } },
  { id: 'iroda_d4', tipus: 'iroda', felirat: 'IRODA', x1: 124, y1: 51, x2: 156, y2: 85, ajto: { x: 140, w: 6 } },
];

/** Szobak kozotti atjarok, hogy ne csak a folyosorol lehessen kozlekedni. */
const EXTRA_AJTO = [
  { x1: 41, y1: 67, x2: 52, y2: 68 },     // targyalo_4 -> targyalo_5
  { x1: 39, y1: 74, x2: 40, y2: 80 },     // targyalo_5 -> open_office
  { x1: 104, y1: 16, x2: 105, y2: 24 },   // konyha -> lepcsohaz
  { x1: 120, y1: 16, x2: 121, y2: 24 },   // lepcsohaz -> iroda_e2
];

/** A ket jatekos kezdo bazisa: a szoba id-je es a bazisnegyzet kozepe cellaban. */
export const BAZIS = [
  { szoba: 'open_office', x: 20, y: 68 },
  { szoba: 'iroda_e2', x: 139, y: 21 },
];

/** A bazisnegyzet fel oldala cellaban. */
export const BAZIS_MERET = 7;

// ---------------------------------------------------------------- felepites

export function palyaEpit() {
  const fal = new Uint8Array(GW * GH).fill(1);

  const kivag = (x1, y1, x2, y2) => {
    for (let y = Math.max(0, y1); y <= Math.min(GH - 1, y2); y++) {
      for (let x = Math.max(0, x1); x <= Math.min(GW - 1, x2); x++) fal[idx(x, y)] = 0;
    }
  };

  kivag(FOLYOSO.x1, FOLYOSO.y1, FOLYOSO.x2, FOLYOSO.y2);

  for (const sz of SZOBAK) {
    kivag(sz.x1, sz.y1, sz.x2, sz.y2);
    const eszaki = sz.y2 < FOLYOSO.y1;
    for (const a of [sz.ajto, sz.ajto2]) {
      if (!a) continue;
      const bal = a.x - ((a.w / 2) | 0);
      if (eszaki) kivag(bal, sz.y2 + 1, bal + a.w - 1, FOLYOSO.y1 - 1);
      else kivag(bal, FOLYOSO.y2 + 1, bal + a.w - 1, sz.y1 - 1);
    }
  }

  for (const a of EXTRA_AJTO) kivag(a.x1, a.y1, a.x2, a.y2);

  const szobak = SZOBAK.map((sz) => {
    const cellak = [];
    for (let y = sz.y1; y <= sz.y2; y++) {
      for (let x = sz.x1; x <= sz.x2; x++) if (!fal[idx(x, y)]) cellak.push(idx(x, y));
    }
    return { ...sz, cellak, db: cellak.length, teljes: -1 };
  });

  let padloDb = 0;
  for (let i = 0; i < fal.length; i++) if (!fal[i]) padloDb++;

  return { fal, szobak, padloDb };
}

/** Egy szoba kozeppontja pixelben. */
export function szobaKozep(sz) {
  return { x: ((sz.x1 + sz.x2) / 2) * CELL, y: ((sz.y1 + sz.y2) / 2) * CELL };
}

/** Egy szoba hatarai pixelben. */
function pxHatar(sz) {
  return { x: sz.x1 * CELL, y: sz.y1 * CELL, w: (sz.x2 - sz.x1 + 1) * CELL, h: (sz.y2 - sz.y1 + 1) * CELL };
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

/**
 * A padlo es a butorok. Ez a teruletszinek ALATT van, es a festek atszurodik
 * rajta, tehat az iroda a bejatszott reszeken is latszik.
 */
export function padloRajz(fal, szobak, logoKep) {
  const { cv, c } = vaszon();
  const rng = mulberry32(20260918);

  // --- szonyeg mindenhol
  c.fillStyle = PAL.szonyeg;
  c.fillRect(0, 0, cv.width, cv.height);

  // szemcses szonyegmintazat, cellankent
  for (let y = 0; y < GH; y++) {
    for (let x = 0; x < GW; x++) {
      if (fal[idx(x, y)]) continue;
      const r = rng();
      if (r < 0.14) { c.fillStyle = PAL.szonyegVil; c.fillRect(x * CELL, y * CELL, CELL, CELL); }
      else if (r < 0.26) { c.fillStyle = PAL.szonyegSot; c.fillRect(x * CELL, y * CELL, CELL, CELL); }
    }
  }

  // --- folyoso: bordo futoszonyeg a ket szelen
  c.fillStyle = PAL.szonyegBordo;
  c.fillRect(FOLYOSO.x1 * CELL, FOLYOSO.y1 * CELL, (FOLYOSO.x2 - FOLYOSO.x1 + 1) * CELL, CELL);
  c.fillRect(FOLYOSO.x1 * CELL, (FOLYOSO.y2 - 0) * CELL, (FOLYOSO.x2 - FOLYOSO.x1 + 1) * CELL, CELL);

  // --- ceges logo a folyoso kozepen, szonyegberakaskent
  if (logoKep) {
    const m = 52;
    const kx = Math.round(((FOLYOSO.x1 + FOLYOSO.x2) / 2) * CELL - m / 2);
    const ky = Math.round(((FOLYOSO.y1 + FOLYOSO.y2) / 2) * CELL - m / 2);
    // vilagos alap a logo ala, mint egy beragasztott szonyegmezo
    c.fillStyle = PAL.fal;
    c.fillRect(kx - 8, ky - 6, m + 16, m + 12);
    c.fillStyle = PAL.falVonal;
    c.fillRect(kx - 8, ky - 6, m + 16, 2);
    c.fillRect(kx - 8, ky + m + 4, m + 16, 2);
    logoPixel(c, logoKep, kx, ky, m, PAL.asztalKek);
  }

  // --- szobankent a butorzat
  for (const sz of szobak) {
    const b = pxHatar(sz);
    if (sz.tipus === 'targyalo') targyaloRajz(c, b);
    else if (sz.tipus === 'iroda') irodaRajz(c, b, rng);
    else if (sz.tipus === 'konyha') konyhaRajz(c, b, sz, fal);
    else if (sz.tipus === 'lepcso') lepcsoRajz(c, b);
    else if (sz.tipus === 'open') openOfficeRajz(c, b);
  }

  return cv;
}

/** A logo darabos, egyszinu pixelvaltozata. */
export function logoPixel(c, kep, x, y, meret, szin) {
  const n = 26;                               // ennyi art keppont szelesen
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
      const i = (gy * n + gx) * 4;
      if (d[i + 3] < 130) continue;
      c.fillRect(Math.round(x + gx * lep), Math.round(y + gy * lep), Math.ceil(lep), Math.ceil(lep));
    }
  }
}

/** Targyalo: nagy kozepso asztal, korulotte szekek. Errol lehet felismerni. */
function targyaloRajz(c, b) {
  const aw = Math.round(b.w * 0.56);
  const ah = Math.round(b.h * 0.42);
  const ax = Math.round(b.x + (b.w - aw) / 2);
  const ay = Math.round(b.y + (b.h - ah) / 2);

  // szekek koruljarva, mielott az asztal rakerul
  c.fillStyle = PAL.szek;
  const szDb = 3;
  for (let i = 0; i < szDb; i++) {
    const sy = ay + Math.round((ah / (szDb + 1)) * (i + 1)) - 5;
    c.fillRect(ax - 14, sy, 10, 10);
    c.fillRect(ax + aw + 4, sy, 10, 10);
  }
  for (let i = 0; i < 2; i++) {
    const sx = ax + Math.round((aw / 3) * (i + 1)) - 5;
    c.fillRect(sx, ay - 14, 10, 10);
    c.fillRect(sx, ay + ah + 4, 10, 10);
  }

  // asztallap
  c.fillStyle = PAL.asztal;
  c.fillRect(ax, ay, aw, ah);
  c.fillStyle = PAL.falVonal;
  c.fillRect(ax, ay, aw, 3);
  c.fillRect(ax, ay + ah - 3, aw, 3);
  // kivetito / kijelzo a rovid oldalon
  c.fillStyle = PAL.asztalKek;
  c.fillRect(ax + Math.round(aw / 2) - 12, ay + Math.round(ah / 2) - 5, 24, 10);
}

/** Iroda: iroasztalok a falak menten, monitorral es szekkel. */
function irodaRajz(c, b, rng) {
  const aw = 54;
  const ah = 22;
  const sorok = [b.y + 18, b.y + b.h - 18 - ah];
  for (const ay of sorok) {
    const db = Math.max(1, Math.floor((b.w - 24) / (aw + 18)));
    for (let i = 0; i < db; i++) {
      const ax = Math.round(b.x + 16 + i * (aw + 18));
      if (ax + aw > b.x + b.w - 10) continue;
      c.fillStyle = PAL.szek;                       // szek
      c.fillRect(ax + Math.round(aw / 2) - 5, ay + ah + 4, 10, 10);
      c.fillStyle = PAL.asztal;                     // asztallap
      c.fillRect(ax, ay, aw, ah);
      c.fillStyle = PAL.falVonal;
      c.fillRect(ax, ay + ah - 3, aw, 3);
      c.fillStyle = PAL.asztalKek;                  // monitor
      c.fillRect(ax + 8, ay + 3, 18, 12);
      c.fillStyle = PAL.uveg;
      c.fillRect(ax + 10, ay + 5, 14, 8);
      if (rng() < 0.5) {                            // papirkupac
        c.fillStyle = PAL.fal;
        c.fillRect(ax + aw - 16, ay + 6, 10, 8);
      }
    }
  }
}

/** Konyha: mas burkolat, pult a fal menten, kerek asztalok. */
function konyhaRajz(c, b, sz, fal) {
  // mas padlo
  c.fillStyle = PAL.konyhaPadlo;
  c.fillRect(b.x, b.y, b.w, b.h);
  c.fillStyle = PAL.konyhaVil;
  for (let y = 0; y < b.h; y += 16) {
    for (let x = ((y / 16) % 2) * 16; x < b.w; x += 32) c.fillRect(b.x + x, b.y + y, 16, 16);
  }

  // pult a felso fal menten
  c.fillStyle = PAL.asztal;
  c.fillRect(b.x + 10, b.y + 8, b.w - 20, 20);
  c.fillStyle = PAL.falVonal;
  c.fillRect(b.x + 10, b.y + 25, b.w - 20, 3);
  c.fillStyle = PAL.szek;                            // mosogato es gepek
  c.fillRect(b.x + 24, b.y + 12, 16, 12);
  c.fillRect(b.x + 64, b.y + 12, 12, 12);
  c.fillStyle = PAL.asztalKek;                       // kavegep
  c.fillRect(b.x + b.w - 44, b.y + 10, 16, 16);

  // kerek asztalok szekekkel
  const kx = [b.x + Math.round(b.w * 0.3), b.x + Math.round(b.w * 0.7)];
  const ky = b.y + Math.round(b.h * 0.62);
  for (const x of kx) {
    c.fillStyle = PAL.szek;
    c.fillRect(x - 26, ky - 5, 9, 9);
    c.fillRect(x + 18, ky - 5, 9, 9);
    c.fillRect(x - 5, ky - 26, 9, 9);
    c.fillRect(x - 5, ky + 18, 9, 9);
    c.fillStyle = PAL.asztal;
    c.fillRect(x - 15, ky - 15, 30, 30);
    c.fillStyle = PAL.falVonal;
    c.fillRect(x - 15, ky + 12, 30, 3);
  }
}

/** Lepcsohaz: lepcsofokok. */
function lepcsoRajz(c, b) {
  const x = b.x + 14;
  const w = b.w - 28;
  for (let i = 0; i < 12; i++) {
    const y = b.y + 22 + i * 16;
    if (y + 12 > b.y + b.h - 16) break;
    c.fillStyle = i % 2 ? PAL.fal : PAL.asztal;
    c.fillRect(x, y, w, 12);
    c.fillStyle = PAL.falVonal;
    c.fillRect(x, y + 12, w, 2);
  }
  // korlat
  c.fillStyle = PAL.szek;
  c.fillRect(x - 5, b.y + 20, 3, b.h - 44);
  c.fillRect(x + w + 2, b.y + 20, 3, b.h - 44);
}

/** Open office: iroasztalok sorokban, szigetekben. */
function openOfficeRajz(c, b) {
  const aw = 46;
  const ah = 20;
  for (let sor = 0; sor < 3; sor++) {
    const ay = b.y + 24 + sor * Math.round((b.h - 56) / 3);
    for (let osz = 0; osz < 4; osz++) {
      const ax = b.x + 16 + osz * Math.round((b.w - 40) / 4);
      if (ax + aw > b.x + b.w - 8) continue;
      c.fillStyle = PAL.szek;
      c.fillRect(ax + Math.round(aw / 2) - 4, ay + ah + 3, 9, 9);
      c.fillStyle = PAL.asztal;
      c.fillRect(ax, ay, aw, ah);
      c.fillStyle = PAL.falVonal;
      c.fillRect(ax, ay + ah - 3, aw, 3);
      c.fillStyle = PAL.asztalKek;
      c.fillRect(ax + 6, ay + 3, 16, 11);
      c.fillStyle = PAL.uveg;
      c.fillRect(ax + 8, ay + 5, 12, 7);
    }
  }
}

/**
 * A falak kulon vasznon. Ez a teruletszinek FOLE kerul, tehat a fal sosem
 * szinezodik at, es a szobahatarok vegig latszanak.
 *
 * A targyalok fala uveges: vilagosabb kek csik jelzi.
 */
export function falakRajz(fal, szobak) {
  const { cv, c } = vaszon();
  const van = (x, y) => (x < 0 || y < 0 || x >= GW || y >= GH ? 1 : fal[idx(x, y)]);

  // melyik falcella tartozik uveges szobahoz
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
      const k = idx(x, y);
      if (!fal[k]) continue;
      const px = x * CELL;
      const py = y * CELL;
      c.fillStyle = uveges[k] ? PAL.uveg : PAL.fal;
      c.fillRect(px, py, CELL, CELL);
      // A szabad oldalakon sotetebb kontur: ettol lesz eles, pixeles a fal.
      c.fillStyle = PAL.falVonal;
      if (!van(x, y - 1)) c.fillRect(px, py, CELL, 2);
      if (!van(x, y + 1)) c.fillRect(px, py + CELL - 2, CELL, 2);
      if (!van(x - 1, y)) c.fillRect(px, py, 2, CELL);
      if (!van(x + 1, y)) c.fillRect(px + CELL - 2, py, 2, CELL);
    }
  }
  return cv;
}

/**
 * A szobanevek kulon vasznon, pixelbetuvel. A falak fole kerul, halvanyan,
 * hogy a festek alatt is olvashato maradjon, melyik helyiseg melyik.
 */
export function feliratRajz(szobak) {
  const { cv, c } = vaszon();
  for (const sz of szobak) {
    const kx = ((sz.x1 + sz.x2) / 2) * CELL;
    const ky = sz.y1 * CELL + 10;
    // Sotet betu vilagos vetett arnyekkal: a szurke szonyegen es a rafestett
    // szinen is olvashato marad. Konturt nem teszunk ra, mert ekkora
    // pixelbetut betemet.
    c.globalAlpha = 0.9;
    drawText(c, sz.felirat, kx, ky, {
      scale: 2, color: PAL.szonyegSzurke, shadow: PAL.fal, align: 'center',
    });
    c.globalAlpha = 1;
  }
  return cv;
}

/**
 * KOLLEGA -> PIXELEMBERKE
 *
 * NEM a fotot pixelesitjuk. A fotobol csak nehany JELLEMZOT olvasunk ki
 * (borszin, hajszin, kopaszsag, szakall, szemuveg), es abbol KODBOL rajzolunk
 * egy darabos pixelfigurat, a "Dol a fa" stilusaban.
 *
 * Igy minden karakter ugyanabbol a keves szinbol epul, egysegesen nez ki, es
 * eppen csak annyira hasonlit, hogy felismerhetd. A nevuk ugyis ki van irva.
 *
 * A szerver cime SEHOL nem szerepel: minden kep a helyi img/ mappabol jon.
 */

export const SPRITE_W = 16;
export const SPRITE_H = 20;

// ---------------------------------------------------------------- palettak
//
// Keves, fix szin. A fotobol kiolvasott atlagot a legkozelebbi ilyenre
// kerekitjuk, igy a figurak egy keszletnek latszanak.

const BOR = ['#F5D8BC', '#EBC4A2', '#DCA87E', '#C68C60', '#A06D46', '#7C5133'];
const HAJ = [
  '#241E1B', // fekete
  '#3E2C20', // sotetbarna
  '#5C412B', // barna
  '#7E5A34', // vilagosbarna
  '#A87C3E', // sotetszoke
  '#D2B26A', // szoke
  '#E6DCC0', // vilagosszoke
  '#9A9A98', // oszes
  '#E4E4E2', // feher
  '#8E3A20', // vorses
];

const NADRAG = ['#2A2A2C', '#1F3F7A', '#3A3A3E', '#4A4038'];

/** A legkozelebbi szin a listabol, egyszeru RGB tavolsaggal. */
function legkozelebb(lista, r, g, b) {
  let jo = lista[0];
  let d = Infinity;
  for (const hex of lista) {
    const n = parseInt(hex.slice(1), 16);
    const dr = ((n >> 16) & 255) - r;
    const dg = ((n >> 8) & 255) - g;
    const db = (n & 255) - b;
    const t = dr * dr + dg * dg + db * db;
    if (t < d) { d = t; jo = hex; }
  }
  return jo;
}

function hexRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Egy hexszin sotetebb valtozata. */
export function sotetit(hex, arany) {
  const [r, g, b] = hexRgb(hex);
  const f = (v) => Math.max(0, Math.round(v * arany));
  return '#' + ((1 << 24) | (f(r) << 16) | (f(g) << 8) | f(b)).toString(16).slice(1);
}

// ---------------------------------------------------------------- jellemzok

function vaszon(w, h) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const c = cv.getContext('2d', { willReadFrequently: true });
  c.imageSmoothingEnabled = false;
  return { cv, c };
}

export function kepBetolt(url) {
  return new Promise((ok, hiba) => {
    const k = new Image();
    k.onload = () => ok(k);
    k.onerror = () => hiba(new Error('nem toltott be: ' + url));
    k.src = url;
  });
}

/** Egy teglalap atlagszine es fedettsege. A koordinatak 0..1 aranyban. */
function atlag(d, w, h, x1, y1, x2, y2) {
  let r = 0, g = 0, b = 0, n = 0, ossz = 0;
  const ax = Math.round(x1 * w), bx = Math.round(x2 * w);
  const ay = Math.round(y1 * h), by = Math.round(y2 * h);
  for (let y = ay; y < by; y++) {
    for (let x = ax; x < bx; x++) {
      ossz++;
      const i = (y * w + x) * 4;
      if (d[i + 3] < 200) continue;
      r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;
    }
  }
  if (!n) return { r: 0, g: 0, b: 0, n: 0, fedes: 0 };
  return { r: r / n, g: g / n, b: b / n, n, fedes: n / Math.max(1, ossz) };
}

const vilagossag = (c) => (c.r * 0.299 + c.g * 0.587 + c.b * 0.114);
const tavolsag = (a, b) => Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);

/**
 * Kiolvassa a jellemzoket egy fejkepbol.
 *
 * A fejek szabvanya szerint a fej kozepen all, es az arc (homlok-all) a vaszon
 * magassaganak 40%-a. Ebbol adodnak a mintavetel helyei.
 */
export function jellemzokKiolvas(kep) {
  const m = 128;                         // ekkora mintan dolgozunk, boven eleg
  const { c } = vaszon(m, m);
  c.drawImage(kep, 0, 0, m, m);
  const d = c.getImageData(0, 0, m, m).data;

  const hajMinta = atlag(d, m, m, 0.34, 0.17, 0.66, 0.26);
  const homlok = atlag(d, m, m, 0.42, 0.33, 0.58, 0.39);
  const arcBal = atlag(d, m, m, 0.33, 0.50, 0.42, 0.59);
  const arcJobb = atlag(d, m, m, 0.58, 0.50, 0.67, 0.59);
  const szemSav = atlag(d, m, m, 0.34, 0.42, 0.66, 0.49);
  const all = atlag(d, m, m, 0.43, 0.63, 0.57, 0.72);
  const ingMinta = atlag(d, m, m, 0.28, 0.88, 0.72, 0.99);

  const arc = {
    r: (arcBal.r + arcJobb.r) / 2,
    g: (arcBal.g + arcJobb.g) / 2,
    b: (arcBal.b + arcJobb.b) / 2,
  };

  const bor = legkozelebb(BOR, arc.r, arc.g, arc.b);
  const haj = legkozelebb(HAJ, hajMinta.r, hajMinta.g, hajMinta.b);

  // Kopasz: a fejtetp mintaja alig van (kevés nem atlatszo pont), vagy szinben
  // nagyon kozel all a homlokhoz.
  const kopasz = hajMinta.fedes < 0.45 || tavolsag(hajMinta, homlok) < 26;

  // Szakall: az all savja erezhetoen sotetebb az arcnal.
  const szakall = vilagossag(all) < vilagossag(arc) - 26;

  // Szemuveg: a szem savja sokkal sotetebb, mint az arc. Ovatos kuszob, mert
  // egy rossz szemuveg jobban zavar, mint a hianyzo.
  const szemuveg = vilagossag(szemSav) < vilagossag(arc) - 46;

  const ing = ingMinta.fedes > 0.25
    ? '#' + ((1 << 24) | (Math.round(ingMinta.r) << 16) | (Math.round(ingMinta.g) << 8) | Math.round(ingMinta.b)).toString(16).slice(1)
    : null;

  return { bor, haj, kopasz, szakall, szemuveg, ingFoto: ing };
}

// ---------------------------------------------------------------- rajzolas

/**
 * A pixelfigura. 16x20 art keppont, darabos, keves szinnel.
 *
 *   t      - a jellemzok (bor, haj, kopasz, szakall, szemuveg)
 *   ing    - az ing szine: jatekosnal a csapatszin, NPC-nel irodai szurke
 *   lepes  - 0 vagy 1, a ket jarasi kepkocka
 */
export function figuraEpit(t, ing, lepes = 0) {
  const { cv, c } = vaszon(SPRITE_W, SPRITE_H);
  const borSotet = sotetit(t.bor, 0.78);
  const hajSotet = sotetit(t.haj, 0.7);
  const ingSotet = sotetit(ing, 0.68);
  const nadrag = NADRAG[(t.bor.charCodeAt(1) + t.haj.charCodeAt(2)) % NADRAG.length];

  const R = (x, y, w, h, szin) => { c.fillStyle = szin; c.fillRect(x, y, w, h); };

  // --- fej
  R(4, 2, 8, 8, t.bor);
  R(11, 3, 1, 7, borSotet);              // jobb perem arnyeka
  R(4, 9, 8, 1, borSotet);               // allkapocs

  // --- haj
  if (t.kopasz) {
    R(3, 4, 1, 4, t.haj);                // csak oldalt maradt
    R(12, 4, 1, 4, t.haj);
    R(4, 2, 8, 1, sotetit(t.bor, 0.92)); // fenyes fejtetp
  } else {
    R(4, 0, 8, 1, t.haj);
    R(3, 1, 10, 3, t.haj);
    R(3, 4, 1, 4, t.haj);
    R(12, 4, 1, 4, t.haj);
    R(3, 1, 10, 1, sotetit(t.haj, 1));
    R(12, 1, 1, 3, hajSotet);            // jobb oldal arnyekban
  }

  // --- szem es szemuveg
  if (t.szemuveg) {
    R(5, 5, 3, 3, '#2A2A2C');
    R(8, 6, 1, 1, '#2A2A2C');
    R(9, 5, 3, 3, '#2A2A2C');
    R(6, 6, 1, 1, '#CFE0E6');
    R(10, 6, 1, 1, '#CFE0E6');
  } else {
    R(6, 6, 1, 1, '#2A2A2C');
    R(9, 6, 1, 1, '#2A2A2C');
  }

  // --- szaj vagy szakall
  if (t.szakall) {
    R(4, 8, 8, 2, hajSotet);
    R(5, 7, 1, 1, hajSotet);
    R(10, 7, 1, 1, hajSotet);
    R(7, 8, 2, 1, sotetit(t.haj, 0.45));
  } else {
    R(7, 8, 2, 1, borSotet);
  }

  // --- nyak
  R(7, 10, 2, 1, borSotet);

  // --- test
  R(3, 11, 10, 6, ing);
  R(2, 12, 1, 4, ing);                   // bal kar
  R(13, 12, 1, 4, ing);                  // jobb kar
  R(6, 11, 4, 1, ingSotet);              // gallér
  R(3, 16, 10, 1, ingSotet);             // also arnyek
  R(12, 11, 1, 6, ingSotet);             // jobb oldal arnyekban
  R(2, 16, 1, 1, t.bor);                 // bal kez
  R(13, 16, 1, 1, t.bor);                // jobb kez

  // --- lab, ket jarasi kepkockaval
  const balH = lepes ? 3 : 2;
  const jobbH = lepes ? 2 : 3;
  R(4, 17, 3, balH, nadrag);
  R(9, 17, 3, jobbH, nadrag);
  R(4, 17 + balH - 1, 3, 1, '#2A2A2C');
  R(9, 17 + jobbH - 1, 3, 1, '#2A2A2C');

  return cv;
}

/** Egy kis vaszon kinagyitva, simitas nelkul. Listakhoz, kartyakhoz jo. */
export function nagyit(cv, n) {
  const ki = vaszon(cv.width * n, cv.height * n);
  ki.c.drawImage(cv, 0, 0, ki.cv.width, ki.cv.height);
  return ki.cv;
}

// ---------------------------------------------------------------- nevsor

/** Beolvassa a helyi manifestet. A halozatot nem hasznaljuk. */
export async function nevsorBetolt() {
  const v = await fetch('img/kollegak.json');
  if (!v.ok) throw new Error('nincs img/kollegak.json');
  const j = await v.json();
  return j.kollegak;
}

/** Ekezet nelkuli, kisbetus alak a keresehez. */
export function egyszerusit(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Ekezet nelkuli NAGYBETUS alak a pixelfonthoz, ami csak nagybetut ismer. */
export function nagybetu(s) {
  return s.toUpperCase();
}

// ---------------------------------------------------------------- gyorsitotar

const tar = new Map();

/** Egy kollega jellemzoi, egyszer kiolvasva. */
export async function jellemzokKerd(k) {
  if (tar.has(k.id)) return tar.get(k.id);
  const kep = await kepBetolt(k.kep);
  const t = jellemzokKiolvas(kep);
  tar.set(k.id, t);
  return t;
}

/** Egy kollega ket jarasi kepkockaja adott ingszinnel. */
const figuraTar = new Map();
export function figuraKerd(t, id, ing) {
  const kulcs = id + '|' + ing;
  if (figuraTar.has(kulcs)) return figuraTar.get(kulcs);
  const par = [figuraEpit(t, ing, 0), figuraEpit(t, ing, 1)];
  figuraTar.set(kulcs, par);
  return par;
}

/**
 * KOLLEGA -> PIXELEMBERKE
 *
 * NEM a fotot pixelesitjuk. A fotobol JELLEMZOKET olvasunk ki, es abbol
 * KODBOL rajzolunk darabos pixelfigurat.
 *
 * Amit a kepbol kiszedunk:
 *   borszin, hajszin, hajhossz, kopaszsag, homlokbeszogeles,
 *   arcszorzet (borosta / bajusz / kecskeszakall / teljes szakall),
 *   szemuveg.
 *
 * Ebbol all ossze a figura. A hajviselet, a gallér es az ingmintazat tovabbi
 * valtozatokat ad, hogy ne legyen mind egy kaptafa. A nevuk ugyis ki van irva,
 * tehat nem kell fotohuseg, csak annyi, hogy raismerj.
 *
 * A szerver cime SEHOL nem szerepel: minden kep a helyi img/ mappabol jon.
 */

/** A figura belso rajza ekkora, a kontur ezt veszi korul 1-1 keppontal. */
const BELSO_W = 16;
const BELSO_H = 20;

/** A kifele adott sprite merete, konturral egyutt. */
export const SPRITE_W = 18;
export const SPRITE_H = 22;

/** A kontur szine. Ettol valik el a figura a turkiz es a narancs padlon is. */
const KONTUR = '#15161A';

// ---------------------------------------------------------------- palettak

const BOR = ['#F5D8BC', '#EBC4A2', '#DCA87E', '#C68C60', '#A06D46', '#7C5133'];
const HAJ = [
  '#241E1B', '#3E2C20', '#5C412B', '#7E5A34',
  '#A87C3E', '#D2B26A', '#E6DCC0', '#9A9A98',
  '#E4E4E2', '#8E3A20',
];
const NADRAG = ['#2A2A2C', '#1F3F7A', '#3A3A3E', '#4A4038', '#2E3A2E'];

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

export function sotetit(hex, arany) {
  const [r, g, b] = hexRgb(hex);
  const f = (v) => Math.max(0, Math.round(v * arany));
  return '#' + ((1 << 24) | (f(r) << 16) | (f(g) << 8) | f(b)).toString(16).slice(1);
}

export function vilagosit(hex, arany) {
  const [r, g, b] = hexRgb(hex);
  const f = (v) => Math.min(255, Math.round(v + (255 - v) * arany));
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

const vil = (c) => (c.r * 0.299 + c.g * 0.587 + c.b * 0.114);
const tav = (a, b) => Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);

/**
 * Kiolvassa a jellemzoket. A fejek szabvanya szerint a fej kozepen all, es az
 * arc (homlok-all) a vaszon magassaganak 40%-a: ebbol adodnak a mintahelyek.
 */
export function jellemzokKiolvas(kep, id) {
  const m = 128;
  const { c } = vaszon(m, m);
  c.drawImage(kep, 0, 0, m, m);
  const d = c.getImageData(0, 0, m, m).data;

  const fejtetp = atlag(d, m, m, 0.38, 0.14, 0.62, 0.22);
  const hajOldal = atlag(d, m, m, 0.24, 0.30, 0.33, 0.44);
  const hajHosszMinta = atlag(d, m, m, 0.20, 0.58, 0.30, 0.76);
  const halantek = atlag(d, m, m, 0.30, 0.26, 0.38, 0.33);
  const homlok = atlag(d, m, m, 0.43, 0.32, 0.57, 0.39);
  const arcBal = atlag(d, m, m, 0.33, 0.50, 0.42, 0.58);
  const arcJobb = atlag(d, m, m, 0.58, 0.50, 0.67, 0.58);
  const szemSav = atlag(d, m, m, 0.35, 0.425, 0.65, 0.475);
  const szemKozott = atlag(d, m, m, 0.47, 0.43, 0.53, 0.47);
  const bajuszSav = atlag(d, m, m, 0.44, 0.575, 0.56, 0.615);
  const allSav = atlag(d, m, m, 0.43, 0.655, 0.57, 0.72);
  const ingMinta = atlag(d, m, m, 0.28, 0.88, 0.72, 0.99);

  const arc = {
    r: (arcBal.r + arcJobb.r) / 2,
    g: (arcBal.g + arcJobb.g) / 2,
    b: (arcBal.b + arcJobb.b) / 2,
  };
  const arcVil = vil(arc);

  const bor = legkozelebb(BOR, arc.r, arc.g, arc.b);

  // A hajszinhez azt a mintat vesszuk, amelyik tenyleg hajat lat.
  const hajForras = fejtetp.fedes > 0.5 ? fejtetp : hajOldal.fedes > 0.5 ? hajOldal : halantek;
  const haj = legkozelebb(HAJ, hajForras.r, hajForras.g, hajForras.b);

  // Kopasz: a fejtetpn alig van valami, vagy szinben a homlokkal egyezik.
  const kopasz = fejtetp.fedes < 0.42 || tav(fejtetp, homlok) < 24;
  // Kopaszodo: a fejtetp vilagos, de a halanteknal meg van haj.
  const kopaszodo = !kopasz && tav(fejtetp, homlok) < 46 && tav(halantek, homlok) > 42;
  // Hosszu haj: az arc mellett, fultol lejjebb is van nem atlatszo, hajszinu resz.
  const hosszuHaj = hajHosszMinta.fedes > 0.45 && tav(hajHosszMinta, hajForras) < 70;

  // Arcszorzet. A bajusz savja es az all savja kulon nezve.
  const bajuszSotet = vil(bajuszSav) < arcVil - 20;
  const allSotet = vil(allSav) < arcVil - 20;
  const allNagyonSotet = vil(allSav) < arcVil - 46;
  let szor = 'nincs';
  if (allNagyonSotet && bajuszSotet) szor = 'teljes';
  else if (allSotet && bajuszSotet) szor = 'borosta';
  else if (bajuszSotet) szor = 'bajusz';
  else if (allSotet) szor = 'kecske';

  // Szemuveg: SZIGORU kuszob. Nem eleg, hogy a szem savja sotetebb (az a
  // szemtol is igy van), a szemek KOZOTTI resznek is sotetnek kell lennie,
  // mert ott csak a szemuveg hidja lehet.
  const szemuveg = vil(szemSav) < arcVil - 52 && vil(szemKozott) < arcVil - 34;

  const ingFoto = ingMinta.fedes > 0.25
    ? '#' + ((1 << 24) | (Math.round(ingMinta.r) << 16) | (Math.round(ingMinta.g) << 8) | Math.round(ingMinta.b)).toString(16).slice(1)
    : null;

  // Valtozatok, amiket a kep nem dont el: az id-bol sorsoljuk, de mindig
  // ugyanugy, hogy egy kollega mindig ugyanugy nezzen ki.
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;

  return {
    bor, haj, kopasz, kopaszodo, hosszuHaj, szor, szemuveg,
    ingFoto,
    gallér: h % 3,                 // 0 poloe, 1 inggallér, 2 kapucnis
    mintazat: (h >> 3) % 4,        // 0 sima, 1 csikos, 2 ketszinu, 3 zsebes
    nadrag: NADRAG[(h >> 6) % NADRAG.length],
    magas: ((h >> 9) % 3) === 0,   // kicsit magasabb figura
  };
}

// ---------------------------------------------------------------- rajzolas

/**
 * A pixelfigura. 16x20 art keppont.
 *
 *   t      - a jellemzok
 *   ing    - az ing szine
 *   lepes  - 0 vagy 1, a ket jarasi kepkocka
 */
function figuraBelso(t, ing, lepes) {
  const { cv, c } = vaszon(BELSO_W, BELSO_H);
  const borSotet = sotetit(t.bor, 0.78);
  const hajSotet = sotetit(t.haj, 0.7);
  const hajVil = vilagosit(t.haj, 0.22);
  const ingSotet = sotetit(ing, 0.68);
  const ingVil = vilagosit(ing, 0.2);

  const R = (x, y, w, h, szin) => { c.fillStyle = szin; c.fillRect(x, y, w, h); };

  const fejY = t.magas ? 1 : 2;      // magasabb figuranal feljebb ul a fej

  // --- hosszu haj a fej MOGE, hogy a valla erjen
  if (t.hosszuHaj && !t.kopasz) {
    R(2, fejY + 2, 2, 9, t.haj);
    R(12, fejY + 2, 2, 9, t.haj);
    R(12, fejY + 6, 2, 5, hajSotet);
  }

  // --- fej
  R(4, fejY, 8, 8, t.bor);
  R(11, fejY + 1, 1, 7, borSotet);
  R(4, fejY + 7, 8, 1, borSotet);

  // --- haj
  if (t.kopasz) {
    R(4, fejY, 8, 1, vilagosit(t.bor, 0.16));
    R(3, fejY + 2, 1, 4, t.haj);
    R(12, fejY + 2, 1, 4, t.haj);
  } else if (t.kopaszodo) {
    R(3, fejY, 2, 3, t.haj);
    R(11, fejY, 2, 3, t.haj);
    R(3, fejY + 2, 1, 4, t.haj);
    R(12, fejY + 2, 1, 4, t.haj);
    R(5, fejY, 6, 1, vilagosit(t.bor, 0.16));
  } else {
    R(4, fejY - 2, 8, 1, t.haj);
    R(3, fejY - 1, 10, 3, t.haj);
    R(3, fejY + 2, 1, 4, t.haj);
    R(12, fejY + 2, 1, 4, t.haj);
    R(4, fejY - 2, 8, 1, hajVil);
    R(12, fejY - 1, 1, 3, hajSotet);
  }

  // --- szem es szemuveg
  const szemY = fejY + 3;
  if (t.szemuveg) {
    R(5, szemY - 1, 3, 3, '#2A2A2C');
    R(8, szemY, 1, 1, '#2A2A2C');
    R(9, szemY - 1, 3, 3, '#2A2A2C');
    R(6, szemY, 1, 1, '#CFE0E6');
    R(10, szemY, 1, 1, '#CFE0E6');
  } else {
    R(6, szemY, 1, 1, '#2A2A2C');
    R(9, szemY, 1, 1, '#2A2A2C');
  }

  // --- arcszorzet
  const szajY = fejY + 6;
  if (t.szor === 'teljes') {
    R(4, szajY, 8, 2, hajSotet);
    R(5, szajY - 1, 1, 1, hajSotet);
    R(10, szajY - 1, 1, 1, hajSotet);
    R(7, szajY, 2, 1, sotetit(t.haj, 0.45));
  } else if (t.szor === 'borosta') {
    R(4, szajY, 8, 2, sotetit(t.bor, 0.62));
    R(7, szajY, 2, 1, borSotet);
  } else if (t.szor === 'bajusz') {
    R(6, szajY - 1, 4, 1, hajSotet);
    R(7, szajY + 1, 2, 1, borSotet);
  } else if (t.szor === 'kecske') {
    R(7, szajY, 2, 2, hajSotet);
    R(6, szajY, 1, 1, borSotet);
  } else {
    R(7, szajY, 2, 1, borSotet);
  }

  // --- nyak
  R(7, fejY + 8, 2, 1, borSotet);

  // --- test
  const testY = fejY + 9;
  R(3, testY, 10, BELSO_H - testY - 3, ing);
  R(2, testY + 1, 1, 4, ing);
  R(13, testY + 1, 1, 4, ing);
  R(12, testY, 1, BELSO_H - testY - 3, ingSotet);
  R(3, BELSO_H - 4, 10, 1, ingSotet);
  R(2, testY + 5, 1, 1, t.bor);
  R(13, testY + 5, 1, 1, t.bor);

  // gallér
  if (t.gallér === 0) {
    R(6, testY, 4, 1, ingSotet);
  } else if (t.gallér === 1) {
    R(5, testY, 2, 2, ingVil);
    R(9, testY, 2, 2, ingVil);
    R(7, testY, 2, 1, borSotet);
  } else {
    R(4, testY, 8, 2, ingVil);
    R(7, testY + 1, 2, 1, ingSotet);
  }

  // mintazat
  if (t.mintazat === 1) {
    R(3, testY + 3, 10, 1, ingSotet);
    R(3, testY + 5, 10, 1, ingSotet);
  } else if (t.mintazat === 2) {
    R(3, testY + 4, 10, BELSO_H - testY - 7, ingVil);
  } else if (t.mintazat === 3) {
    R(4, testY + 4, 3, 2, ingSotet);
  }

  // --- lab, ket jarasi kepkockaval
  const labY = BELSO_H - 3;
  const balH = lepes ? 3 : 2;
  const jobbH = lepes ? 2 : 3;
  R(4, labY, 3, balH, t.nadrag);
  R(9, labY, 3, jobbH, t.nadrag);
  R(4, labY + balH - 1, 3, 1, '#2A2A2C');
  R(9, labY + jobbH - 1, 3, 1, '#2A2A2C');

  return cv;
}

/**
 * A kesz figura: a belso rajz korul egy keppontnyi sotet kontur.
 *
 * Enelkul a sotet ruhas kollega beleolvadna a lila vagy kek padloba, a
 * vilagos pedig a sargaba. A kontur garantalja, hogy minden szinen elvaljon.
 */
export function figuraEpit(t, ing, lepes = 0) {
  const belso = figuraBelso(t, ing, lepes);

  // a sziluett sotet valtozata
  const arny = vaszon(SPRITE_W, SPRITE_H);
  arny.c.drawImage(belso, 1, 1);
  arny.c.globalCompositeOperation = 'source-in';
  arny.c.fillStyle = KONTUR;
  arny.c.fillRect(0, 0, SPRITE_W, SPRITE_H);

  const { cv, c } = vaszon(SPRITE_W, SPRITE_H);
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    c.drawImage(arny.cv, dx, dy);
  }
  c.drawImage(belso, 1, 1);
  return cv;
}

/** Egy kis vaszon kinagyitva, simitas nelkul. */
export function nagyit(cv, n) {
  const ki = vaszon(cv.width * n, cv.height * n);
  ki.c.drawImage(cv, 0, 0, ki.cv.width, ki.cv.height);
  return ki.cv;
}

// ---------------------------------------------------------------- nevsor

export async function nevsorBetolt() {
  const v = await fetch('img/kollegak.json');
  if (!v.ok) throw new Error('nincs img/kollegak.json');
  const j = await v.json();
  return j.kollegak;
}

export function egyszerusit(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

// ---------------------------------------------------------------- gyorsitotar

const tar = new Map();

export async function jellemzokKerd(k) {
  if (tar.has(k.id)) return tar.get(k.id);
  const kep = await kepBetolt(k.kep);
  const t = jellemzokKiolvas(kep, k.id);
  tar.set(k.id, t);
  return t;
}

const figuraTar = new Map();
/** Egy kollega ket jarasi kepkockaja adott ingszinnel. */
export function figuraKerd(t, id, ing) {
  const kulcs = id + '|' + ing;
  if (figuraTar.has(kulcs)) return figuraTar.get(kulcs);
  const par = [figuraEpit(t, ing, 0), figuraEpit(t, ing, 1)];
  figuraTar.set(kulcs, par);
  return par;
}

/**
 * SZEKFOGLALO - kozos beallitasok es paletta.
 *
 * A paletta a VALODI iroda szineibol jon: szurke szonyeg, feher falak, uveges
 * targyalok. A ket jatekos szine erre ul ra, telt turkiz es narancs.
 */

/** A vaszon belso merete. A kep mindig kitolti az ablakot, aranytartoan. */
export const W = 1280;
export const H = 720;

/** Egy racscella oldala pixelben. A festes es a teruletszamitas ezen a racson megy. */
export const CELL = 8;
export const GW = W / CELL;   // 160
export const GH = H / CELL;   // 90

/** Egy kor hossza masodpercben. A feladat kemeny feltetele: egy percen belul dol el. */
export const KOR_HOSSZ = 60;

/** Az utolso ennyi masodpercben szol a tuzriado: az NPC-k pankiba esnek. */
export const RIADO_TOL = 15;

// ---------------------------------------------------------------- sebesseg

export const JATEKOS_SEBESSEG = 182;   // px / masodperc
export const NPC_SEBESSEG = 92;
export const PATKI_SEBESSEG = 168;     // vadaszik, de lassabb a jatekosnal
export const VARO_SEBESSEG = 78;       // ajtokban acsorog
export const RIADO_SZORZO = 1.5;       // tuzriado alatt ennyiszer gyorsabb minden NPC

/** A festekcsik vastagsaga cellaban (sugar). 1.2 -> kb. 2 cella szeles nyom. */
export const ECSET = 1.2;

/** Utkozes utan ennyi ideig serthetetlen es villog a jatekos. */
export const SERTHETETLEN = 1.2;

/** Utkozes utan ennyi ideig nem tud mozogni (megtorpan, de HELYBEN marad). */
export const TORPEDES = 0.35;

// ---------------------------------------------------------------- paletta
//
// Ezek a szinek az iroda fenykepeirol lettek levéve.

export const PAL = {
  // padlo: szurke szonyeg
  szonyeg: '#9A9A98',
  szonyegVil: '#A8A8A6',
  szonyegSot: '#7D7E7C',
  szonyegBordo: '#A32330',
  szonyegSzurke: '#5C5F61',

  // konyha: mas burkolat
  konyhaPadlo: '#6E7072',
  konyhaVil: '#7A7C7E',

  // falak es uveg
  fal: '#ECECEA',
  falVonal: '#B9B9B7',
  uveg: '#CFE0E6',

  // butor
  asztal: '#F2F2F0',
  asztalKek: '#1F3F7A',
  szek: '#2A2A2C',

  riado: '#D62828',

  // kepernyo korul es feliratok
  hatter: '#14161c',
  felirat: '#5C5F61',
  feliratVil: '#ECECEA',
};

/** A ket jatekos szine: terulet, festekcsik, es a keret/kiemeles. */
export const CSAPAT = [
  { nev: '1. JÁTÉKOS', ter: '#1B8E93', csik: '#3BE0E0', jel: '#66F0F0' },
  { nev: '2. JÁTÉKOS', ter: '#C46A18', csik: '#FFA92E', jel: '#FFC866' },
];

/** Az NPC-k ingszine. A ket fo zavaro kap sajat, veszelyt jelzo szint. */
export const NPC_SZIN = ['#5C5F61', '#7D7E7C', '#1F3F7A', '#2A2A2C', '#6E7072'];
export const PATKI_SZIN = '#A32330';
export const VARO_SZIN = '#C46A18';

// ---------------------------------------------------------------- racs kodok

export const URES = 0;
export const P1 = 1;
export const P2 = 2;
export const P1_CSIK = 3;
export const P2_CSIK = 4;

/** A jatekos szamabol (0/1) a racs kodja. */
export const terKod = (i) => (i === 0 ? P1 : P2);
export const csikKod = (i) => (i === 0 ? P1_CSIK : P2_CSIK);

/** Kis determinisztikus veletlen, hogy a palya mindig ugyanugy nezzen ki. */
export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** #rrggbb -> [r,g,b] */
export function rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Egy hexszin sotetebb vagy vilagosabb valtozata. */
export function arnyal(hex, arany) {
  const [r, g, b] = rgb(hex);
  const f = (v) => Math.max(0, Math.min(255, Math.round(arany < 1 ? v * arany : v + (255 - v) * (arany - 1))));
  return '#' + ((1 << 24) | (f(r) << 16) | (f(g) << 8) | f(b)).toString(16).slice(1);
}

// ---------------------------------------------------------------- gombok
//
// A paden a negy arcgombot SZINNEL nevezzuk meg, nem betuvel: a jatekosok a
// szint latjak a kontrolleren, a betu csak zavar.

export const GOMB = {
  y: { nev: 'ZÖLD', szin: '#3FBF5F', kod: ['KeyF', 'KeyJ'] },
  x: { nev: 'KÉK', szin: '#3B7FD6', kod: ['KeyT', 'KeyI'] },
  a: { nev: 'PIROS', szin: '#D62828', kod: ['KeyH', 'KeyL'] },
  b: { nev: 'SÁRGA', szin: '#E8B21F', kod: ['KeyG', 'KeyK'] },
};

/** A ket pad START gombja. Barmelyik indit uj kort. */
export const START = ['KeyV', 'Space'];

/** A ket pad SELECT gombja. */
export const SELECT = ['KeyC', 'Enter'];

/** Iranybillentyuk jatekosonkent. Ez az elsodleges bemenet: a D-pad. */
export const IRANY = [
  { fel: 'KeyW', le: 'KeyS', bal: 'KeyA', jobb: 'KeyD' },
  { fel: 'ArrowUp', le: 'ArrowDown', bal: 'ArrowLeft', jobb: 'ArrowRight' },
];

/** Egy adott jatekos adott szinu gombjanak billentyukodja. */
export const gombKod = (jatekos, gomb) => GOMB[gomb].kod[jatekos];

/**
 * IRODAFOGLALO - kozos beallitasok es paletta.
 *
 * A paletta a VALODI iroda szineibol jon: szurke szonyeg, feher falak, uveges
 * targyalok. A ket jatekos szine erre ul ra, telt turkiz es narancs.
 */

/** A jatek neve. Egy helyen all, hogy barhol atirhato legyen. */
export const CIM = 'IRODAFOGLALÓ';

/** Egysoros szabaly: ezt latja a jatekos a visszaszamlalasnal es a szunetben. */
export const SZABALY = 'FESD BE A NITRO IRODA MINÉL NAGYOBB RÉSZÉT EGY PERC ALATT';

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

// A JATEKOS MINDIG GYORSABB MINDEN NPC-NEL, a tuzriado alatt is. Ez szabaly:
// el lehessen menekulni barki elol, kulonben a jatek igazsagtalannak erzodik.
export const JATEKOS_SEBESSEG = 196;   // px / masodperc
export const NPC_SEBESSEG = 96;
export const PATKI_SEBESSEG = 150;     // vadaszik, de lassabb a jatekosnal
export const VARO_SEBESSEG = 82;       // ajtokban acsorog
export const RIADO_SZORZO = 1.45;      // tuzriado alatt ennyiszer gyorsabb a setalo NPC
/** Patki a riado alatt sem gyorsul: igy sosem eri utol a jatekost. */
export const PATKI_RIADO_SZORZO = 1;

/** Ha Patki elkapott valakit, ennyi ideig bekén hagyja. */
export const PATKI_SZUNET = 6.5;

/** A festekcsik vastagsaga cellaban (sugar). 1.2 -> kb. 2 cella szeles nyom. */
export const ECSET = 1.2;

/** Utkozes utan ennyi ideig serthetetlen es villog a jatekos. */
export const SERTHETETLEN = 1.2;

/** Visszaszamlalas hossza a kor elott. */
export const VISSZASZAMLALAS = 3;

/** A ket jatekos talalkozasakor ennyi ideig lehet lecsapni a masikra. */
export const PARBAJ_IDO = 2.6;

/** Villamkerdes: ennyi masodpercenkent bukkan fel, plusz veletlen. */
export const KIHIVAS_ALAP = 5.5;
export const KIHIVAS_SZORAS = 4;

// ---------------------------------------------------------------- paletta
//
// Ezek a szinek az iroda fenykepeirol lettek levéve.

export const PAL = {
  // padlo: szurke szonyeg
  szonyeg: '#9A9A98',
  szonyegVil: '#A3A3A1',
  szonyegSot: '#8E8F8D',
  szonyegBordo: '#A32330',
  szonyegSzurke: '#5C5F61',
  fuga: '#7A7B79',
  akcentBordo: '#8A4A50',
  szobaNev: '#3C4042',
  akcentSzurke: '#6E7072',

  // konyha: mas burkolat
  konyhaPadlo: '#6E7072',
  konyhaVil: '#7A7C7E',

  // falak es uveg
  fal: '#ECECEA',
  falVonal: '#B9B9B7',
  falEl: '#54585B',
  uveg: '#CFE0E6',

  // butor
  asztal: '#F2F2F0',
  asztalKek: '#1F3F7A',
  szek: '#2A2A2C',

  riado: '#8C121F',
  riadoVil: '#D62828',

  // kepernyo korul es feliratok
  hatter: '#14161c',
  felirat: '#5C5F61',
  feliratVil: '#ECECEA',
};

/**
 * Valaszthato festekszinek. A karaktervalasztoban a FEL-LE nyillal lehet
 * lapozni koztuk, uj karakter valasztasakor pedig sorsolunk egyet.
 *
 *   ter  - a bejatszott terulet szine
 *   csik - a huzott festekcsik, vilagosabb
 *   jel  - felirat es kiemeles, a legvilagosabb
 */
export const SZINEK = [
  { nev: 'TÜRKIZ', ter: '#1B8E93', csik: '#3BE0E0', jel: '#66F0F0' },
  { nev: 'NARANCS', ter: '#C46A18', csik: '#FFA92E', jel: '#FFC866' },
  { nev: 'LILA', ter: '#6B3FA0', csik: '#B681F0', jel: '#CDA9FF' },
  { nev: 'ZÖLD', ter: '#2E7D32', csik: '#66DD70', jel: '#9BF0A2' },
  { nev: 'PINK', ter: '#B02A6B', csik: '#FF6FB0', jel: '#FFA3CC' },
  { nev: 'KÉK', ter: '#1F4FA8', csik: '#5B9BFF', jel: '#96C2FF' },
  { nev: 'SÁRGA', ter: '#B8860B', csik: '#FFD644', jel: '#FFE98A' },
  { nev: 'PIROS', ter: '#B02020', csik: '#FF5A5A', jel: '#FF9A9A' },
];

/** A ket jatekos alapszine es neve. A szint a valasztoban felul lehet irni. */
export const CSAPAT = [
  // A nev a kiterjesztes UTAN all, kulonben a szin neve irna felul.
  { ...SZINEK[0], nev: '1. JÁTÉKOS' },
  { ...SZINEK[1], nev: '2. JÁTÉKOS' },
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
  a: { nev: 'PIROS', szin: '#E03A3A', kod: ['KeyH', 'KeyL'] },
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

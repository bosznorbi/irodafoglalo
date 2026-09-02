/**
 * KETJATEKOS ALAP
 *
 * Ez egy allvany, nem jatek. Annyit tud, amennyi a minimum feltetelekhez kell:
 * ket jatekos ket kontrollerrel, egy percen belul eldol a gyoztes, es a kor
 * ujraindithato a lap ujratoltese nelkul.
 *
 * A ti dolgotok az, ami ebbol jatek lesz. Ezt a fajlt nyugodtan irjatok at
 * teljesen, vagy dobjatok ki: a kontrollert a masik ket fajl intezi.
 *
 * A LENYEG, AMIT ERDEMES ESZREVENNI: ez a fajl SEHOL nem olvas kontrollert.
 * Csak billentyuzetet. A padgombok valodi billentyuesemenyt kuldenek, tehat
 * ugy irjatok a jatekot, mintha billentyuzetes ketjatekos jatek lenne.
 */

import { pads } from './gamepad.js';
import { padGate } from './pad-gate.js';

// ---------------------------------------------------------------- billentyuk
//
// Ket jatekos, ket keszlet. Pontosan ezek a billentyuk erkeznek a padrol is.
// Ha mast szeretnetek, a gamepad.js DEFAULT_KEYS tablajat kell atirni.

const P1 = { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' };
const P2 = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };

// A ket pad START gombja KULON billentyut ad: az elso KeyV-t, a masodik
// Space-t. Az ujraindulast mindketto elfogadja.
const START = ['KeyV', 'Space'];

const nyomva = new Set();

// A figyelo a document-en ul, ahogy a legtobb jatekban. A padrol jovo
// szintetikus esemeny ugyanezt az utat jarja be, mint egy valodi billentyu.
document.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  nyomva.add(e.code);
  // A nyilak es a Space gorgetik a lapot, ha nem allitjuk meg.
  if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
});
document.addEventListener('keyup', (e) => nyomva.delete(e.code));

// Ablakvaltaskor nem jon "felengedes", tehat kezzel kell uriteni, kulonben
// egy irany lenyomva ragad.
window.addEventListener('blur', () => nyomva.clear());

// ---------------------------------------------------------------- jatek
const canvas = document.getElementById('jatek');
const c = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

const KOR_HOSSZ = 60;          // masodperc: ennyin belul eldol a gyoztes
const SEBESSEG = 260;          // pixel masodpercenkent
const MERET = 34;              // a jatekos negyzet oldala
const ERME = 14;               // az osszeszedheto pont sugara

const jatekosok = [
  { szin: '#6fb4ff', keys: P1, x: W * 0.25, y: H / 2, pont: 0, nev: '1. JÁTÉKOS' },
  { szin: '#ff7a7a', keys: P2, x: W * 0.75, y: H / 2, pont: 0, nev: '2. JÁTÉKOS' },
];

let ermek = [];
let hatra = KOR_HOSSZ;
let vege = false;

function ujKor() {
  jatekosok[0].x = W * 0.25; jatekosok[0].y = H / 2; jatekosok[0].pont = 0;
  jatekosok[1].x = W * 0.75; jatekosok[1].y = H / 2; jatekosok[1].pont = 0;
  ermek = [];
  for (let i = 0; i < 6; i++) ujErme();
  hatra = KOR_HOSSZ;
  vege = false;
}

function ujErme() {
  ermek.push({
    x: ERME * 2 + Math.random() * (W - ERME * 4),
    y: ERME * 2 + Math.random() * (H - ERME * 4),
  });
}

function lepes(dt) {
  if (vege) {
    // A kor vegen barmelyik pad START gombja ujat indit.
    if (START.some((k) => nyomva.has(k))) { nyomva.clear(); ujKor(); }
    return;
  }

  hatra -= dt;
  if (hatra <= 0) { hatra = 0; vege = true; return; }

  for (const j of jatekosok) {
    let dx = 0, dy = 0;
    if (nyomva.has(j.keys.left)) dx -= 1;
    if (nyomva.has(j.keys.right)) dx += 1;
    if (nyomva.has(j.keys.up)) dy -= 1;
    if (nyomva.has(j.keys.down)) dy += 1;

    // Atlosan se legyen gyorsabb.
    if (dx && dy) { dx *= 0.7071; dy *= 0.7071; }

    j.x = Math.max(MERET / 2, Math.min(W - MERET / 2, j.x + dx * SEBESSEG * dt));
    j.y = Math.max(MERET / 2, Math.min(H - MERET / 2, j.y + dy * SEBESSEG * dt));

    // Ermeszedes
    for (let i = ermek.length - 1; i >= 0; i--) {
      const e = ermek[i];
      if (Math.hypot(e.x - j.x, e.y - j.y) < MERET / 2 + ERME) {
        ermek.splice(i, 1);
        j.pont++;
        ujErme();
      }
    }
  }
}

function rajzol() {
  c.fillStyle = '#1d212b';
  c.fillRect(0, 0, W, H);

  // ermek
  c.fillStyle = '#f5d76e';
  for (const e of ermek) {
    c.beginPath();
    c.arc(e.x, e.y, ERME, 0, Math.PI * 2);
    c.fill();
  }

  // jatekosok
  for (const j of jatekosok) {
    c.fillStyle = j.szin;
    c.fillRect(j.x - MERET / 2, j.y - MERET / 2, MERET, MERET);
  }

  // fejlec: pontok es ido
  c.font = '600 24px ui-sans-serif, system-ui, sans-serif';
  c.textBaseline = 'top';
  c.fillStyle = jatekosok[0].szin;
  c.textAlign = 'left';
  c.fillText(jatekosok[0].nev + '  ' + jatekosok[0].pont, 20, 18);
  c.fillStyle = jatekosok[1].szin;
  c.textAlign = 'right';
  c.fillText(jatekosok[1].pont + '  ' + jatekosok[1].nev, W - 20, 18);
  c.fillStyle = '#e8ecf4';
  c.textAlign = 'center';
  c.fillText(Math.ceil(hatra) + ' mp', W / 2, 18);

  if (!vege) return;

  // zarokep
  c.fillStyle = 'rgba(10,12,16,0.82)';
  c.fillRect(0, 0, W, H);
  const a = jatekosok[0].pont, b = jatekosok[1].pont;
  const dontetlen = a === b;
  const gy = a > b ? jatekosok[0] : jatekosok[1];

  c.textAlign = 'center';
  c.font = '700 56px ui-sans-serif, system-ui, sans-serif';
  c.fillStyle = dontetlen ? '#e8ecf4' : gy.szin;
  c.fillText(dontetlen ? 'DÖNTETLEN' : gy.nev + ' NYERT', W / 2, H / 2 - 70);

  c.font = '600 30px ui-sans-serif, system-ui, sans-serif';
  c.fillStyle = '#8b93a7';
  c.fillText(a + ' - ' + b, W / 2, H / 2 + 4);

  c.font = '600 20px ui-sans-serif, system-ui, sans-serif';
  c.fillText('START a kontrolleren: új kör', W / 2, H / 2 + 60);
}

let utolso = performance.now();
function kepkocka(most) {
  requestAnimationFrame(kepkocka);
  let dt = (most - utolso) / 1000;
  utolso = most;
  if (dt > 0.25) dt = 0.25;      // ablakvaltas utan ne ugorjon egy nagyot
  lepes(dt);
  rajzol();
}

// ---------------------------------------------------------------- indulas
//
// 1. A padkezeles elindul, de a billentyu-emulacio MEG KI VAN KAPCSOLVA:
//    kulonben a kapun a kivalaszto gombnyomasok mar a jatekba szolnanak bele.
// 2. Jon a kontroller-kapu.
// 3. Amikor bezarul, bekapcsoljuk az emulaciot, es indul a jatek.

pads.init({ slots: 2, keyboard: false });

ujKor();
requestAnimationFrame(kepkocka);

// Fejlesztes kozben jol jon: a bongeszo konzoljabol (F12) bele lehet nezni a
// jatek allapotaba, es kezzel is lehet uj kort inditani.
//   jatek.jatekosok[0].pont = 9
//   jatek.ujKor()
window.jatek = {
  jatekosok,
  ujKor,
  get ermek() { return ermek; },
  get hatra() { return hatra; },
  get vege() { return vege; },
  get nyomva() { return nyomva; },
};

padGate({
  players: 2,
  title: 'KÉTJÁTÉKOS ALAP',
  subtitle: 'Dugd be a két USB kontrollert, és nyomj meg rajtuk egy gombot.',
  onClose: () => {
    pads.keyboard(true);         // innentol a padgombok billentyut kuldenek
    nyomva.clear();
    ujKor();
  },
});

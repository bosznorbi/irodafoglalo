/**
 * BITES ZENE ES HANGOK
 *
 * Minden hang a Web Audio API-val keszul, menet kozben. Nincs hangfajl, tehat
 * nincs mit letolteni, es a jatek a bemutaton halozat nelkul is szol.
 *
 * A bongeszo csak felhasznaloi gombnyomas UTAN enged hangot, ezert az
 * indit() hivast a kapu bezarasahoz kotjuk.
 */

let ac = null;
let fo = null;          // fo hangero
let zeneKi = null;      // a zene sava
let jar = false;
let nemit = false;
let idozito = null;
let lepes = 0;
let riadoMod = false;

const BPM = 132;

/** Nyolcad hossza masodpercben. */
const nyolcad = () => 30 / (riadoMod ? BPM * 1.18 : BPM);

/** MIDI hangmagassag -> frekvencia. */
const hz = (n) => 440 * Math.pow(2, (n - 69) / 12);

// Am - F - C - G, nyolcadonkent nyolc lepes egy akkordra.
const AKKORD = [
  { alap: 45, hangok: [57, 60, 64] },   // Am
  { alap: 41, hangok: [53, 57, 60] },   // F
  { alap: 48, hangok: [55, 60, 64] },   // C
  { alap: 43, hangok: [55, 59, 62] },   // G
];

/** A vezetoszolam mintaja egy akkordon belul, indexek a hangok tombbe. */
const DALLAM = [0, 2, 1, 2, 0, 1, 2, 1];

function hangSav(tipus, freq, t, hossz, csucs, cel) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = tipus;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(csucs, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + hossz);
  o.connect(g);
  g.connect(cel);
  o.start(t);
  o.stop(t + hossz + 0.02);
}

function zorej(t, hossz, csucs, cel) {
  const n = Math.floor(ac.sampleRate * hossz);
  const puffer = ac.createBuffer(1, n, ac.sampleRate);
  const d = puffer.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const f = ac.createBufferSource();
  f.buffer = puffer;
  const g = ac.createGain();
  g.gain.setValueAtTime(csucs, t);
  f.connect(g);
  g.connect(cel);
  f.start(t);
}

/** Egy nyolcad lejatszasa. */
function utem() {
  if (!ac || nemit) { lepes++; return; }
  const t = ac.currentTime + 0.02;
  const akk = AKKORD[(lepes >> 3) % AKKORD.length];
  const belso = lepes % 8;

  // basszus: minden masodik nyolcadon
  if (belso % 2 === 0) hangSav('triangle', hz(akk.alap), t, nyolcad() * 1.6, 0.20, zeneKi);

  // vezetoszolam
  const h = akk.hangok[DALLAM[belso]];
  hangSav('square', hz(h + 12), t, nyolcad() * 0.85, 0.075, zeneKi);

  // dob: lab az 1. es 5. nyolcadon, lábcin minden masodikon
  if (belso === 0 || belso === 4) hangSav('sine', 68, t, 0.13, 0.32, zeneKi);
  if (belso % 2 === 1) zorej(t, 0.035, 0.05, zeneKi);

  lepes++;
}

/** Elinditja a hangrendszert. Csak valodi gombnyomas utan mukodik. */
export function indit() {
  if (ac) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ac = new AC();
  fo = ac.createGain();
  fo.gain.value = 0.5;
  fo.connect(ac.destination);
  zeneKi = ac.createGain();
  zeneKi.gain.value = 0.55;
  zeneKi.connect(fo);
}

/** Elinditja a zenei hurkot. */
export function zeneIndul() {
  if (!ac || jar) return;
  if (ac.state === 'suspended') ac.resume();
  jar = true;
  lepes = 0;
  const utes = () => {
    utem();
    idozito = setTimeout(utes, nyolcad() * 1000);
  };
  utes();
}

export function zeneAll() {
  jar = false;
  if (idozito) clearTimeout(idozito);
  idozito = null;
}

/** Tuzriado alatt gyorsabb es feszultebb a zene. */
export function riado(be) { riadoMod = be; }

export function nemitas(be) {
  nemit = be;
  if (fo) fo.gain.value = be ? 0 : 0.5;
}

export function nemitva() { return nemit; }

// ---------------------------------------------------------------- effektek

function effekt(hangok) {
  if (!ac || nemit) return;
  let t = ac.currentTime + 0.01;
  for (const [tipus, n, hossz, csucs] of hangok) {
    hangSav(tipus, hz(n), t, hossz, csucs, fo);
    t += hossz * 0.75;
  }
}

/** Sikeres teruletfoglalas: felfele futo arpeggio. */
export const hangKitolt = () => effekt([['square', 72, 0.07, 0.18], ['square', 76, 0.07, 0.18], ['square', 79, 0.1, 0.2]]);

/** Elvagtak a csikot: lefele csuszo, csalodott hang. */
export const hangVagas = () => effekt([['sawtooth', 62, 0.1, 0.2], ['sawtooth', 57, 0.1, 0.2], ['sawtooth', 50, 0.18, 0.22]]);

/** Egy egesz szoba megvan: diadalmas. */
export const hangSzoba = () => effekt([['square', 72, 0.08, 0.2], ['square', 79, 0.08, 0.2], ['square', 84, 0.16, 0.24]]);

/** Kave. */
export const hangKave = () => effekt([['square', 84, 0.05, 0.16], ['square', 88, 0.09, 0.18]]);

/** Villamkerdes felugrik. */
export const hangKihivas = () => effekt([['square', 88, 0.06, 0.16], ['square', 88, 0.06, 0.16]]);

/** Villamkerdes: jo gomb. */
export const hangJo = () => effekt([['square', 79, 0.06, 0.2], ['square', 86, 0.12, 0.22]]);

/** Villamkerdes: rossz gomb. */
export const hangRossz = () => effekt([['sawtooth', 48, 0.18, 0.22]]);

/** Kor vege. */
export const hangVege = () => effekt([['square', 72, 0.12, 0.2], ['square', 67, 0.12, 0.2], ['square', 60, 0.28, 0.24]]);

/** Menuben lepkedes. */
export const hangLepes = () => effekt([['square', 80, 0.035, 0.1]]);

/** Menuben valasztas. */
export const hangValaszt = () => effekt([['square', 76, 0.05, 0.16], ['square', 83, 0.09, 0.18]]);

/** Tuzriado sziren: ket valtakozo hang. */
export function hangSziren() {
  if (!ac || nemit) return;
  let t = ac.currentTime + 0.01;
  for (let i = 0; i < 4; i++) {
    hangSav('sawtooth', hz(i % 2 ? 69 : 64), t, 0.22, 0.2, fo);
    t += 0.22;
  }
}

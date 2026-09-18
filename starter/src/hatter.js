/**
 * ANIMALT HATTER
 *
 * A cimkepernyo es a karaktervalaszto mogott fut. Sotet irodai alap, rajta
 * lassan uszo, ferde savok a ceg kekjeben, es lebego pixel logok. A tetejen
 * halvany scanline, hogy regi arcade gep kepernyojenek erezzuk.
 */

import { W, H, PAL, CSAPAT, mulberry32 } from './config.js';
import { logoPixel } from './palya.js';

let logoKep = null;
let logoKicsi = null;
const rng = mulberry32(4242);

/** Lebego logok kiindulo helye es sebessege. */
const USZO = Array.from({ length: 7 }, () => ({
  x: rng() * W,
  y: rng() * H,
  m: 26 + rng() * 44,
  seb: 6 + rng() * 14,
  forg: rng() * 6.28,
}));

/** Egyszer lerajzoljuk a logot kis vaszonra, hogy ne kelljen kepkockankent. */
export function hatterInit(kep) {
  logoKep = kep;
  if (!kep) return;
  const cv = document.createElement('canvas');
  cv.width = 64;
  cv.height = 64;
  const c = cv.getContext('2d');
  c.imageSmoothingEnabled = false;
  logoPixel(c, kep, 0, 0, 64, '#1F3F7A');
  logoKicsi = cv;
}

let scanline = null;
function scanlineKesz() {
  if (scanline) return scanline;
  const cv = document.createElement('canvas');
  cv.width = 4;
  cv.height = 4;
  const c = cv.getContext('2d');
  c.fillStyle = 'rgba(0,0,0,0.22)';
  c.fillRect(0, 2, 4, 2);
  scanline = cv;
  return scanline;
}

export function hatterRajz(ctx, ido) {
  // alap
  ctx.fillStyle = '#10131a';
  ctx.fillRect(0, 0, W, H);

  // ferde savok, lassan uszva
  const savSzeles = 120;
  const tol = (ido * 26) % (savSzeles * 2);
  ctx.save();
  ctx.globalAlpha = 0.5;
  for (let x = -H - savSzeles * 2; x < W + savSzeles; x += savSzeles * 2) {
    ctx.fillStyle = '#161b26';
    ctx.beginPath();
    ctx.moveTo(x + tol, H);
    ctx.lineTo(x + tol + H, 0);
    ctx.lineTo(x + tol + H + savSzeles, 0);
    ctx.lineTo(x + tol + savSzeles, H);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // lebego logok
  if (logoKicsi) {
    ctx.save();
    for (const u of USZO) {
      const y = (u.y + ido * u.seb) % (H + 120) - 60;
      const x = u.x + Math.sin(ido * 0.4 + u.forg) * 26;
      ctx.globalAlpha = 0.09;
      ctx.drawImage(logoKicsi, Math.round(x), Math.round(y), u.m, u.m);
    }
    ctx.restore();
  }

  // ket szinu fenycsik alul es felul, a ket jatekos szineben
  const g1 = ctx.createLinearGradient(0, 0, W, 0);
  g1.addColorStop(0, CSAPAT[0].ter);
  g1.addColorStop(0.5, '#10131a');
  g1.addColorStop(1, CSAPAT[1].ter);
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, W, 5);
  ctx.fillRect(0, H - 5, W, 5);
  ctx.globalAlpha = 1;

  // scanline
  const s = ctx.createPattern(scanlineKesz(), 'repeat');
  ctx.fillStyle = s;
  ctx.fillRect(0, 0, W, H);
}

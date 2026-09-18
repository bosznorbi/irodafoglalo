/**
 * CIMKEPERNYO
 *
 * Animalt arcade splash: hullamzo cim, a ceg logoja pixelesen, es ket
 * kollega, akik festekcsikot huzva setalnak at a kepernyo aljan.
 *
 * Barmelyik pad START gombja (vagy ENTER / SPACE) viszi tovabb.
 */

import { W, H, PAL, CSAPAT, CIM as JATEK_CIM } from './config.js';
import { drawText, textWidth } from './font.js';
import { figuraKerd, SPRITE_W, SPRITE_H } from './karakter.js';
import { logoPixel } from './palya.js';
import { hangValaszt } from './zene.js';

const CIM = JATEK_CIM;

export function cimkepernyo({ ctx, kollegak, jellemzok, logoKep, hatterRajz }) {
  return new Promise((kesz) => {
    let fut = true;
    let ido = 0;

    // ket veletlen kollega setal at a kepernyon
    const setalo = [0, 1].map((i) => {
      const k = kollegak[(Math.random() * kollegak.length) | 0];
      return {
        k,
        i,
        x: i === 0 ? -80 : W + 80,
        y: H - 150 + i * 46,
        seb: (i === 0 ? 1 : -1) * (54 + i * 12),
        nyom: [],
      };
    });

    // a logo egyszer, pixelesen
    const logoCv = document.createElement('canvas');
    logoCv.width = 96;
    logoCv.height = 96;
    if (logoKep) logoPixel(logoCv.getContext('2d'), logoKep, 0, 0, 96, '#2E5C8A');

    function gomb(e) {
      if (!fut) return;
      // Barmilyen gomb tovabbvisz: a pad barmelyik gombja es a billentyuzet is.
      // A modositobillentyuk (Shift, Ctrl, Alt) nem szamitanak, mert azokat
      // veletlenul is le lehet nyomni.
      if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return;
      e.preventDefault();
      fut = false;
      hangValaszt();
      document.removeEventListener('keydown', gomb, true);
      kesz();
    }
    document.addEventListener('keydown', gomb, true);

    let utolso = performance.now();
    function kepkocka(most) {
      if (!fut) return;
      requestAnimationFrame(kepkocka);
      const dt = Math.min(0.05, (most - utolso) / 1000);
      utolso = most;
      ido += dt;

      hatterRajz(ctx, ido);

      // --- setalo kollegak festekcsikkal
      for (const s of setalo) {
        s.x += s.seb * dt;
        if (s.seb > 0 && s.x > W + 100) { s.x = -100; s.nyom = []; }
        if (s.seb < 0 && s.x < -100) { s.x = W + 100; s.nyom = []; }
        s.nyom.push({ x: s.x, y: s.y + SPRITE_H * 3 });
        if (s.nyom.length > 240) s.nyom.shift();

        ctx.fillStyle = CSAPAT[s.i].ter;
        ctx.globalAlpha = 0.5;
        for (const p of s.nyom) ctx.fillRect(Math.round(p.x) - 14, Math.round(p.y) - 5, 28, 10);
        ctx.globalAlpha = 1;
      }
      for (const s of setalo) {
        const t = jellemzok.get(s.k.id);
        if (!t) continue;
        const par = figuraKerd(t, s.k.id, CSAPAT[s.i].ter);
        const kep = par[((ido * 7) | 0) % 2];
        ctx.drawImage(kep, 0, 0, SPRITE_W, SPRITE_H, Math.round(s.x - SPRITE_W * 1.5), Math.round(s.y), SPRITE_W * 3, SPRITE_H * 3);
      }

      // --- logo
      ctx.drawImage(logoCv, Math.round(W / 2 - 48), 74);

      // --- hullamzo cim, betunkent
      const meret = 9;
      const betuW = textWidth('A', meret) + meret * 1;
      const teljes = CIM.length * betuW;
      let x = W / 2 - teljes / 2;
      for (let i = 0; i < CIM.length; i++) {
        const y = 206 + Math.sin(ido * 3 + i * 0.5) * 10;
        const arany = i / (CIM.length - 1);
        const szin = arany < 0.5 ? CSAPAT[0].jel : CSAPAT[1].jel;
        drawText(ctx, CIM[i], x, y, { scale: meret, color: szin, shadow: '#07090d', outline: '#0b0d12' });
        x += betuW;
      }

      drawText(ctx, 'TERÜLETFOGLALÓ AZ IRODÁBAN', W / 2, 330, { scale: 3, color: PAL.szonyegVil, shadow: '#07090d', align: 'center' });
      drawText(ctx, 'KÉT JÁTÉKOS  -  KÉT KONTROLLER  -  EGY PERC', W / 2, 376, { scale: 2, color: PAL.felirat, shadow: null, align: 'center' });

      // --- villogo felhivas
      if (Math.floor(ido * 1.6) % 2 === 0) {
        drawText(ctx, 'NYOMJ MEG BÁRMILYEN GOMBOT', W / 2, 452, { scale: 4, color: PAL.feliratVil, shadow: '#07090d', align: 'center' });
      }

      drawText(ctx, 'M: NÉMÍTÁS    F11: TELJES KÉPERNYŐ', W / 2, H - 46, { scale: 1, color: PAL.felirat, shadow: null, align: 'center' });
    }
    requestAnimationFrame(kepkocka);
  });
}

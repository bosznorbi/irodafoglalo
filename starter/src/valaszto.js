/**
 * KARAKTERVALASZTO - osztott kepernyo
 *
 * Mindket jatekos a SAJAT kontrollerevel valaszt, egymastol fuggetlenul:
 *
 *   BAL / JOBB   masik kollega. Ilyenkor uj festekszint is sorsolunk neki.
 *   FEL / LE     festekszin lapozasa
 *   SARGA gomb   (vagy START) rogziti a valasztast
 *   billentyuzet nevre kereses, abba az oldalba, amelyik eppen "kapja"
 *
 * A padrol erkezo billentyu SZINTETIKUS esemeny (isTrusted === false), ezert a
 * gepeles csak a valodi billentyuzetet fogadja el, es a pad D-padja nem ir be
 * betuket.
 */

import { W, H, CSAPAT, SZINEK, IRANY, START, SELECT, GOMB, PAL, SZABALY } from './config.js';
import { drawText, textWidth } from './font.js';
import { egyszerusit, figuraKerd, SPRITE_W, SPRITE_H } from './karakter.js';
import { hangLepes, hangValaszt } from './zene.js';

const FEL = W / 2;

/** Pixeles nyil: balra (-1) vagy jobbra (+1) mutat. */
function nyil(ctx, x, y, irany, szin, m) {
  ctx.fillStyle = szin;
  for (let i = 0; i < 5; i++) {
    const w = m;
    const h = (i + 1) * 2 * m;
    const px = x + irany * i * m - (irany < 0 ? 0 : 0);
    ctx.fillRect(Math.round(px - (irany < 0 ? 0 : w)), Math.round(y - h / 2), w, h);
  }
}

export function karakterValaszto({ ctx, kollegak, jellemzok, kiemelt = [], hatterRajz }) {
  return new Promise((kesz) => {
    const veletlenSzin = () => (Math.random() * SZINEK.length) | 0;
    const allapot = [0, 1].map((i) => ({
      mutat: 0, szures: '', kesz: false, val: null, szin: i, villan: 0,
    }));
    let gepel = 0;
    let ido = 0;
    let fut = true;

    function lista(i) {
      const masik = allapot[1 - i].val;
      const alap = kollegak.filter((k) => !masik || k.id !== masik.id);
      const q = egyszerusit(allapot[i].szures.trim());
      if (!q) return alap;
      const talalt = alap.filter((k) => egyszerusit(k.nev).includes(q) || egyszerusit(k.becenev).includes(q) || k.id.includes(q));
      return talalt.length ? talalt : alap;
    }

    /** Masik kollega. Uj karakterhez uj szin is jar, hogy ne kelljen keresgelni. */
    function lep(i, d) {
      const l = lista(i);
      if (!l.length) return;
      allapot[i].mutat = (allapot[i].mutat + d + l.length) % l.length;
      allapot[i].szin = veletlenSzin();
      allapot[i].villan = 0.25;
      hangLepes();
    }

    function szinLep(i, d) {
      allapot[i].szin = (allapot[i].szin + d + SZINEK.length) % SZINEK.length;
      hangLepes();
    }

    function valaszt(i) {
      const l = lista(i);
      const k = l[allapot[i].mutat % l.length];
      if (!k) return;
      allapot[i].val = k;
      allapot[i].kesz = true;
      hangValaszt();
      if (allapot[0].kesz && allapot[1].kesz) {
        fut = false;
        document.removeEventListener('keydown', gomb, true);
        kesz([0, 1].map((n) => ({ kollega: allapot[n].val, szin: SZINEK[allapot[n].szin] })));
      } else if (gepel === i) {
        gepel = 1 - i;
      }
    }

    function gomb(e) {
      const valodi = e.isTrusted;

      if (!valodi) {
        for (let i = 0; i < 2; i++) {
          if (allapot[i].kesz) continue;
          const ir = IRANY[i];
          if (e.code === ir.bal) { lep(i, -1); e.preventDefault(); return; }
          if (e.code === ir.jobb) { lep(i, 1); e.preventDefault(); return; }
          if (e.code === ir.fel) { szinLep(i, -1); e.preventDefault(); return; }
          if (e.code === ir.le) { szinLep(i, 1); e.preventDefault(); return; }
          if (e.code === START[i] || e.code === GOMB.b.kod[i]) { valaszt(i); e.preventDefault(); return; }
          if (e.code === SELECT[i]) { gepel = i; e.preventDefault(); return; }
        }
        return;
      }

      if (e.code === 'Tab') { gepel = 1 - gepel; e.preventDefault(); return; }
      const i = allapot[gepel].kesz ? 1 - gepel : gepel;
      if (allapot[i].kesz) return;

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        allapot[i].szures += e.key;
        allapot[i].mutat = 0;
        e.preventDefault();
        return;
      }
      if (e.code === 'Backspace') {
        allapot[i].szures = allapot[i].szures.slice(0, -1);
        allapot[i].mutat = 0;
        e.preventDefault();
        return;
      }
      if (e.code === 'ArrowLeft') { lep(i, -1); e.preventDefault(); return; }
      if (e.code === 'ArrowRight') { lep(i, 1); e.preventDefault(); return; }
      if (e.code === 'ArrowUp') { szinLep(i, -1); e.preventDefault(); return; }
      if (e.code === 'ArrowDown') { szinLep(i, 1); e.preventDefault(); return; }
      if (e.code === 'Enter') { valaszt(i); e.preventDefault(); }
    }

    document.addEventListener('keydown', gomb, true);

    // ------------------------------------------------------------ rajzolas

    function figura(k, szinHex, meret, x, y, alfa) {
      const t = jellemzok.get(k.id);
      if (!t) return;
      const kep = figuraKerd(t, k.id, szinHex)[0];
      ctx.globalAlpha = alfa;
      ctx.drawImage(kep, 0, 0, SPRITE_W, SPRITE_H,
        Math.round(x - (SPRITE_W * meret) / 2), Math.round(y), SPRITE_W * meret, SPRITE_H * meret);
      ctx.globalAlpha = 1;
    }

    function oldal(i) {
      const cx = i === 0 ? FEL / 2 : FEL + FEL / 2;
      const a = allapot[i];
      const sz = SZINEK[a.szin];
      const l = lista(i);
      const k = l[a.mutat % l.length];

      drawText(ctx, CSAPAT[i].nev, cx, 78, { scale: 3, color: sz.jel, shadow: '#0b0d12', align: 'center' });

      if (a.kesz) {
        drawText(ctx, 'KÉSZ', cx, 118, { scale: 3, color: PAL.feliratVil, shadow: '#0b0d12', align: 'center' });
      } else if (gepel === i) {
        drawText(ctx, 'IDE GÉPELEK', cx, 122, { scale: 2, color: PAL.szonyegVil, shadow: '#0b0d12', align: 'center' });
      }

      if (!k) return;

      // nyilak a figura ket oldalan
      if (!a.kesz) {
        const lukt = 1 + Math.sin(ido * 5) * 0.12;
        nyil(ctx, cx - 132, 250, -1, sz.jel, 4 * lukt);
        nyil(ctx, cx + 132, 250, 1, sz.jel, 4 * lukt);
      }

      // talapzat a valasztott szinben
      ctx.fillStyle = a.kesz ? sz.ter : '#1b1f28';
      ctx.fillRect(Math.round(cx - 86), 358, 172, 10);

      const leb = a.kesz ? 0 : Math.sin(ido * 2.4 + i) * 4;
      figura(k, sz.ter, 9, cx, 178 + leb, a.villan > 0 ? 0.55 : 1);
      if (a.villan > 0) a.villan -= 1 / 60;

      drawText(ctx, k.becenev.toUpperCase(), cx, 386, { scale: 4, color: sz.jel, shadow: '#0b0d12', align: 'center' });
      drawText(ctx, k.nev.toUpperCase(), cx, 434, { scale: 2, color: PAL.szonyegVil, shadow: '#0b0d12', align: 'center' });

      if (kiemelt.includes(k.id)) {
        drawText(ctx, 'EZ EGY ZAVARÓ KOLLÉGA', cx, 462, { scale: 1, color: PAL.riado, shadow: null, align: 'center' });
      }

      if (a.kesz) return;

      // --- festekszin sor
      const szy = 490;
      ctx.fillStyle = sz.ter;
      ctx.fillRect(Math.round(cx - 150), szy, 24, 24);
      ctx.fillStyle = sz.csik;
      ctx.fillRect(Math.round(cx - 150), szy + 16, 24, 8);
      drawText(ctx, sz.nev, cx - 112, szy + 4, { scale: 2, color: sz.jel, shadow: '#0b0d12' });
      drawText(ctx, 'FEL-LE: SZÍN', cx + 92, szy + 6, { scale: 1, color: PAL.felirat, shadow: null, align: 'center' });

      // --- kereso
      const doboz = { x: cx - 210, y: 528, w: 420, h: 42 };
      ctx.fillStyle = '#0f1218';
      ctx.fillRect(doboz.x, doboz.y, doboz.w, doboz.h);
      ctx.fillStyle = gepel === i ? sz.jel : '#2a3140';
      ctx.fillRect(doboz.x, doboz.y, doboz.w, 3);
      ctx.fillRect(doboz.x, doboz.y + doboz.h - 3, doboz.w, 3);
      ctx.fillRect(doboz.x, doboz.y, 3, doboz.h);
      ctx.fillRect(doboz.x + doboz.w - 3, doboz.y, 3, doboz.h);

      const q = a.szures.toUpperCase();
      drawText(ctx, 'KERESÉS:', doboz.x + 12, doboz.y + 14, { scale: 2, color: PAL.felirat, shadow: null });
      const qx = doboz.x + 12 + textWidth('KERESÉS: ', 2);
      drawText(ctx, q, qx, doboz.y + 14, { scale: 2, color: PAL.feliratVil, shadow: null });
      if (gepel === i && Math.floor(ido * 2) % 2 === 0) {
        ctx.fillStyle = sz.jel;
        ctx.fillRect(qx + textWidth(q, 2) + 2, doboz.y + 15, 10, 14);
      }

      // --- egyetlen sugo: sarga gombbal ok
      const gy = GOMB.b.szin;
      ctx.fillStyle = '#0f1218';
      ctx.beginPath();
      ctx.arc(cx - 52, 600, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = gy;
      ctx.beginPath();
      ctx.arc(cx - 52, 600, 11, 0, Math.PI * 2);
      ctx.fill();
      drawText(ctx, 'GOMBBAL OK', cx + 40, 592, { scale: 2, color: PAL.feliratVil, shadow: '#0b0d12', align: 'center' });
    }

    function kepkocka(most) {
      if (!fut) return;
      requestAnimationFrame(kepkocka);
      ido = most / 1000;

      hatterRajz(ctx, ido);

      drawText(ctx, 'VÁLASSZ KARAKTERT ÉS SZÍNT', W / 2, 20, { scale: 4, color: PAL.feliratVil, shadow: '#0b0d12', align: 'center' });
      drawText(ctx, SZABALY, W / 2, 660, { scale: 2, color: PAL.szonyegVil, shadow: '#0b0d12', align: 'center' });

      ctx.fillStyle = '#2a3140';
      ctx.fillRect(FEL - 2, 64, 4, H - 130);

      oldal(0);
      oldal(1);
    }
    requestAnimationFrame(kepkocka);
  });
}

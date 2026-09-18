/**
 * KARAKTERVALASZTO - osztott kepernyo
 *
 * Mindket jatekos a SAJAT kontrollerevel valaszt, egymastol fuggetlenul:
 * a D-pad jobbra-balra lapoz, a START valaszt. Nincs listazas, egyszerre egy
 * karakter all a kozeppontban, alatta a neve.
 *
 * Keresni a billentyuzetrol lehet. Egyszerre egy oldal "kapja" a billentyuzetet:
 * a paden a SELECT gombbal (vagy TAB-bal) lehet atvenni, a kepernyo jelzi is.
 *
 * A padrol erkezo billentyu SZINTETIKUS esemeny (isTrusted === false), ezert a
 * gepeles csak a valodi billentyuzetet fogadja el, es a pad D-padja nem ir be
 * betuket.
 */

import { W, H, CSAPAT, IRANY, START, SELECT, PAL } from './config.js';
import { drawText, textWidth } from './font.js';
import { egyszerusit, figuraKerd, SPRITE_W, SPRITE_H } from './karakter.js';
import { hangLepes, hangValaszt } from './zene.js';

const FEL = W / 2;

export function karakterValaszto({ ctx, kollegak, jellemzok, kiemelt = [], hatterRajz }) {
  return new Promise((kesz) => {
    const allapot = [0, 1].map(() => ({ mutat: 0, szures: '', kesz: false, val: null, ugras: 0 }));
    let gepel = 0;            // melyik oldal kapja a billentyuzetet
    let ido = 0;
    let fut = true;

    // --- szurt lista jatekosonkent
    function lista(i) {
      const masik = allapot[1 - i].val;
      const alap = kollegak.filter((k) => !masik || k.id !== masik.id);
      const q = egyszerusit(allapot[i].szures.trim());
      if (!q) return alap;
      const talalt = alap.filter((k) => egyszerusit(k.nev).includes(q) || egyszerusit(k.becenev).includes(q) || k.id.includes(q));
      return talalt.length ? talalt : alap;
    }

    function lep(i, d) {
      const l = lista(i);
      if (!l.length) return;
      allapot[i].mutat = (allapot[i].mutat + d + l.length) % l.length;
      allapot[i].ugras = d;
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
        kesz([allapot[0].val, allapot[1].val]);
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
          if (e.code === ir.fel) { lep(i, -5); e.preventDefault(); return; }
          if (e.code === ir.le) { lep(i, 5); e.preventDefault(); return; }
          if (e.code === START[i]) { valaszt(i); e.preventDefault(); return; }
          if (e.code === SELECT[i]) { gepel = i; e.preventDefault(); return; }
        }
        return;
      }

      // --- valodi billentyuzet: az eppen aktiv oldalra dolgozik
      if (e.code === 'Tab') {
        gepel = 1 - gepel;
        e.preventDefault();
        return;
      }
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
      if (e.code === 'Enter') { valaszt(i); e.preventDefault(); }
    }

    document.addEventListener('keydown', gomb, true);

    // ------------------------------------------------------------ rajzolas

    function figura(k, i, meret, x, y, alfa) {
      const t = jellemzok.get(k.id);
      if (!t) return;
      const par = figuraKerd(t, k.id, CSAPAT[i].ter);
      const kep = par[0];
      ctx.globalAlpha = alfa;
      ctx.drawImage(kep, 0, 0, SPRITE_W, SPRITE_H, Math.round(x - (SPRITE_W * meret) / 2), Math.round(y), SPRITE_W * meret, SPRITE_H * meret);
      ctx.globalAlpha = 1;
    }

    function oldal(i) {
      const cx = i === 0 ? FEL / 2 : FEL + FEL / 2;
      const a = allapot[i];
      const szin = CSAPAT[i].jel;
      const l = lista(i);
      const k = l[a.mutat % l.length];

      // fejlec
      drawText(ctx, CSAPAT[i].nev, cx, 86, { scale: 3, color: szin, shadow: '#0b0d12', align: 'center' });

      if (a.kesz) {
        drawText(ctx, 'KÉSZ', cx, 128, { scale: 2, color: PAL.feliratVil, shadow: '#0b0d12', align: 'center' });
      } else if (gepel === i) {
        drawText(ctx, 'BILLENTYŰZET ITT', cx, 130, { scale: 1, color: PAL.szonyegVil, shadow: '#0b0d12', align: 'center' });
      }

      if (!k) return;

      // elozo es kovetkezo halvanyan
      if (l.length > 1 && !a.kesz) {
        figura(l[(a.mutat - 1 + l.length) % l.length], i, 4, cx - 190, 232, 0.28);
        figura(l[(a.mutat + 1) % l.length], i, 4, cx + 190, 232, 0.28);
      }

      // a kivalasztott nagyban, finom lebegessel
      const leb = a.kesz ? 0 : Math.sin(ido * 2.4 + i) * 4;
      const m = 9;
      // talapzat
      ctx.fillStyle = a.kesz ? CSAPAT[i].ter : '#1b1f28';
      ctx.fillRect(Math.round(cx - 86), 366, 172, 10);
      figura(k, i, m, cx, 190 + leb, 1);

      // nev
      drawText(ctx, k.becenev.toUpperCase(), cx, 396, { scale: 4, color: szin, shadow: '#0b0d12', align: 'center' });
      drawText(ctx, k.nev.toUpperCase(), cx, 444, { scale: 2, color: PAL.szonyegVil, shadow: '#0b0d12', align: 'center' });

      if (kiemelt.includes(k.id)) {
        drawText(ctx, 'FIGYELEM, EZ EGY ZAVARÓ', cx, 472, { scale: 1, color: PAL.riado, shadow: '#0b0d12', align: 'center' });
      }

      if (a.kesz) return;

      // kereso
      const doboz = { x: cx - 220, y: 506, w: 440, h: 46 };
      ctx.fillStyle = '#0f1218';
      ctx.fillRect(doboz.x, doboz.y, doboz.w, doboz.h);
      ctx.fillStyle = gepel === i ? szin : '#2a3140';
      ctx.fillRect(doboz.x, doboz.y, doboz.w, 3);
      ctx.fillRect(doboz.x, doboz.y + doboz.h - 3, doboz.w, 3);
      ctx.fillRect(doboz.x, doboz.y, 3, doboz.h);
      ctx.fillRect(doboz.x + doboz.w - 3, doboz.y, 3, doboz.h);

      const q = a.szures.toUpperCase();
      drawText(ctx, 'KERESÉS:', doboz.x + 14, doboz.y + 15, { scale: 2, color: PAL.felirat, shadow: null });
      const qx = doboz.x + 14 + textWidth('KERESÉS: ', 2);
      drawText(ctx, q, qx, doboz.y + 15, { scale: 2, color: PAL.feliratVil, shadow: null });
      // A kurzort rajzolt teglalap adja: a pixelfontban nincs alahuzas jel.
      if (gepel === i && Math.floor(ido * 2) % 2 === 0) {
        ctx.fillStyle = szin;
        ctx.fillRect(qx + textWidth(q, 2) + 2, doboz.y + 16, 10, 16);
      }

      // szamlalo es sugo
      drawText(ctx, (a.mutat % l.length + 1) + ' / ' + l.length, cx, 566, { scale: 1, color: PAL.felirat, shadow: null, align: 'center' });
      drawText(ctx, 'D-PAD: LAPOZ', cx, 606, { scale: 2, color: PAL.szonyegVil, shadow: '#0b0d12', align: 'center' });
      drawText(ctx, 'START: VÁLASZT', cx, 636, { scale: 2, color: szin, shadow: '#0b0d12', align: 'center' });
      drawText(ctx, 'SELECT: IDE GÉPELEK', cx, 668, { scale: 1, color: PAL.felirat, shadow: null, align: 'center' });
    }

    function kepkocka(most) {
      if (!fut) return;
      requestAnimationFrame(kepkocka);
      ido = most / 1000;

      hatterRajz(ctx, ido);

      // cim
      drawText(ctx, 'VÁLASSZ KARAKTERT', W / 2, 24, { scale: 4, color: PAL.feliratVil, shadow: '#0b0d12', align: 'center' });

      // valasztovonal
      ctx.fillStyle = '#2a3140';
      ctx.fillRect(FEL - 2, 70, 4, H - 110);

      oldal(0);
      oldal(1);
    }
    requestAnimationFrame(kepkocka);
  });
}

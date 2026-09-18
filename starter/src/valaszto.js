/**
 * KARAKTERVALASZTO - osztott kepernyo
 *
 * Mindket jatekos a SAJAT kontrollerevel valaszt, egymastol fuggetlenul:
 *
 *   BAL / JOBB   masik kollega. Ilyenkor uj festekszint is sorsolunk neki.
 *   FEL / LE     festekszin lapozasa
 *   SARGA gomb   rogziti a valasztast (lakat kerul ra)
 *   PIROS gomb   feloldja a rogzitest
 *
 * Amikor mindketten rogzitettek, meg van egy rovid ablak, amikor a PIROS
 * gombbal vissza lehet lepni: csak utana indul a jatek.
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

/** Ennyi ideig lehet meg meggondolni magad, miutan mindketten rogzitettetek. */
const INDULAS_ABLAK = 1.6;

/**
 * Vizszintes pixelnyil. A HEGYE van az (x,y) pontban, a teste onnan hatrafele
 * szelesedik: irany = -1 balra mutat, +1 jobbra.
 */
function nyilVizszintes(ctx, x, y, irany, szin, m) {
  ctx.fillStyle = szin;
  for (let i = 0; i < 5; i++) {
    const h = (i + 1) * 2 * m;
    const px = x - irany * i * m;
    const rx = irany < 0 ? px : px - m;
    ctx.fillRect(Math.round(rx), Math.round(y - h / 2), Math.ceil(m), Math.round(h));
  }
}

/** Fuggoleges pixelnyil. irany = -1 felfele mutat, +1 lefele. */
function nyilFuggoleges(ctx, x, y, irany, szin, m) {
  ctx.fillStyle = szin;
  for (let i = 0; i < 4; i++) {
    const w = (i + 1) * 2 * m;
    const py = y - irany * i * m;
    const ry = irany < 0 ? py : py - m;
    ctx.fillRect(Math.round(x - w / 2), Math.round(ry), Math.round(w), Math.ceil(m));
  }
}

/** Pixeles lakat. Azt jelzi, hogy ez a valasztas rogzitve van. */
function lakat(ctx, x, y, m, szin) {
  ctx.fillStyle = szin;
  ctx.fillRect(x - 2 * m, y - 6 * m, 4 * m, m);        // kengyel teteje
  ctx.fillRect(x - 3 * m, y - 5 * m, m, 3 * m);        // kengyel bal szara
  ctx.fillRect(x + 2 * m, y - 5 * m, m, 3 * m);        // kengyel jobb szara
  ctx.fillRect(x - 4 * m, y - 2 * m, 8 * m, 6 * m);    // test
  ctx.fillStyle = '#0f1218';
  ctx.fillRect(x - m, y, 2 * m, 3 * m);                // kulcslyuk
}

export function karakterValaszto({ ctx, kollegak, jellemzok, kiemelt = [], hatterRajz }) {
  return new Promise((kesz) => {
    const veletlenSzin = () => (Math.random() * SZINEK.length) | 0;
    // A ket oldal NE ugyanazzal a kollegaval induljon: a masodik tavolabbrol
    // kezd, kulonben elsore ugyanaz az arc nez vissza mindket oldalrol.
    const allapot = [0, 1].map((i) => ({
      mutat: i === 0 ? 0 : Math.min(7, kollegak.length - 1),
      szures: '', kesz: false, val: null, szin: i, villan: 0,
    }));
    let gepel = 0;
    let ido = 0;
    let fut = true;
    let indul = 0;              // visszaszamlalo, ha mindketten rogzitettek

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

    /** SARGA: rogzites. */
    function rogzit(i) {
      const l = lista(i);
      const k = l[allapot[i].mutat % l.length];
      if (!k) return;
      allapot[i].val = k;
      allapot[i].kesz = true;
      hangValaszt();
      if (allapot[0].kesz && allapot[1].kesz) indul = INDULAS_ABLAK;
      else if (gepel === i) gepel = 1 - i;
    }

    /** PIROS: a rogzites feloldasa. Az indulast is megallitja. */
    function felold(i) {
      if (!allapot[i].kesz) return;
      allapot[i].kesz = false;
      allapot[i].val = null;
      indul = 0;
      hangLepes();
    }

    function gomb(e) {
      const valodi = e.isTrusted;

      if (!valodi) {
        for (let i = 0; i < 2; i++) {
          // A PIROS gomb rogzitett allapotban is el: azzal lehet visszalepni.
          if (e.code === GOMB.a.kod[i]) { felold(i); e.preventDefault(); return; }
          if (allapot[i].kesz) continue;
          const ir = IRANY[i];
          if (e.code === ir.bal) { lep(i, -1); e.preventDefault(); return; }
          if (e.code === ir.jobb) { lep(i, 1); e.preventDefault(); return; }
          if (e.code === ir.fel) { szinLep(i, -1); e.preventDefault(); return; }
          if (e.code === ir.le) { szinLep(i, 1); e.preventDefault(); return; }
          if (e.code === START[i] || e.code === GOMB.b.kod[i]) { rogzit(i); e.preventDefault(); return; }
          if (e.code === SELECT[i]) { gepel = i; e.preventDefault(); return; }
        }
        return;
      }

      if (e.code === 'Tab') { gepel = 1 - gepel; e.preventDefault(); return; }
      if (e.code === 'Escape') { felold(gepel); felold(1 - gepel); e.preventDefault(); return; }
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
      if (e.code === 'Enter') { rogzit(i); e.preventDefault(); }
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
      const k = a.val || l[a.mutat % l.length];

      drawText(ctx, CSAPAT[i].nev, cx, 70, { scale: 3, color: sz.jel, shadow: '#0b0d12', align: 'center' });

      if (!a.kesz && gepel === i) {
        drawText(ctx, 'IDE GÉPELEK', cx, 108, { scale: 2, color: PAL.szonyegVil, shadow: '#0b0d12', align: 'center' });
      }

      if (!k) return;

      // lapozo nyilak a figura ket oldalan
      if (!a.kesz) {
        const lukt = 1 + Math.sin(ido * 5) * 0.12;
        nyilVizszintes(ctx, cx - 142, 238, -1, sz.jel, 4 * lukt);
        nyilVizszintes(ctx, cx + 142, 238, 1, sz.jel, 4 * lukt);
      }

      ctx.fillStyle = a.kesz ? sz.ter : '#1b1f28';
      ctx.fillRect(Math.round(cx - 86), 344, 172, 10);

      const leb = a.kesz ? 0 : Math.sin(ido * 2.4 + i) * 4;
      figura(k, sz.ter, 9, cx, 150 + leb, a.villan > 0 ? 0.55 : 1);
      if (a.villan > 0) a.villan -= 1 / 60;

      drawText(ctx, k.becenev.toUpperCase(), cx, 368, { scale: 4, color: sz.jel, shadow: '#0b0d12', align: 'center' });
      drawText(ctx, k.nev.toUpperCase(), cx, 412, { scale: 2, color: PAL.szonyegVil, shadow: '#0b0d12', align: 'center' });

      if (kiemelt.includes(k.id)) {
        drawText(ctx, 'EZ EGY ZAVARÓ KOLLÉGA', cx, 438, { scale: 1, color: PAL.riado, shadow: null, align: 'center' });
      }

      // --- rogzitve: lakat, es hogy pirossal feloldhato
      if (a.kesz) {
        lakat(ctx, cx, 500, 4, sz.jel);
        ctx.fillStyle = '#0f1218';
        ctx.beginPath();
        ctx.arc(cx - 52, 596, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = GOMB.a.szin;
        ctx.beginPath();
        ctx.arc(cx - 52, 596, 11, 0, Math.PI * 2);
        ctx.fill();
        drawText(ctx, 'VISSZA', cx + 34, 588, { scale: 2, color: PAL.feliratVil, shadow: '#0b0d12', align: 'center' });
        return;
      }

      // --- festekszin: fole es ala nyil, kozte a szinminta. Nev nem kell.
      const szy = 496;
      nyilFuggoleges(ctx, cx, szy - 26, -1, sz.jel, 4);
      ctx.fillStyle = '#0f1218';
      ctx.fillRect(Math.round(cx - 22), szy - 16, 44, 32);
      ctx.fillStyle = sz.ter;
      ctx.fillRect(Math.round(cx - 19), szy - 13, 38, 26);
      ctx.fillStyle = sz.csik;
      ctx.fillRect(Math.round(cx - 19), szy + 3, 38, 10);
      nyilFuggoleges(ctx, cx, szy + 42, 1, sz.jel, 4);

      // --- kereso
      const doboz = { x: cx - 210, y: 552, w: 420, h: 40 };
      ctx.fillStyle = '#0f1218';
      ctx.fillRect(doboz.x, doboz.y, doboz.w, doboz.h);
      ctx.fillStyle = gepel === i ? sz.jel : '#2a3140';
      ctx.fillRect(doboz.x, doboz.y, doboz.w, 3);
      ctx.fillRect(doboz.x, doboz.y + doboz.h - 3, doboz.w, 3);
      ctx.fillRect(doboz.x, doboz.y, 3, doboz.h);
      ctx.fillRect(doboz.x + doboz.w - 3, doboz.y, 3, doboz.h);

      const q = a.szures.toUpperCase();
      drawText(ctx, 'KERESÉS:', doboz.x + 12, doboz.y + 13, { scale: 2, color: PAL.felirat, shadow: null });
      const qx = doboz.x + 12 + textWidth('KERESÉS: ', 2);
      drawText(ctx, q, qx, doboz.y + 13, { scale: 2, color: PAL.feliratVil, shadow: null });
      if (gepel === i && Math.floor(ido * 2) % 2 === 0) {
        ctx.fillStyle = sz.jel;
        ctx.fillRect(qx + textWidth(q, 2) + 2, doboz.y + 14, 10, 14);
      }

      // --- sarga kor + OK
      ctx.fillStyle = '#0f1218';
      ctx.beginPath();
      ctx.arc(cx - 34, 632, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = GOMB.b.szin;
      ctx.beginPath();
      ctx.arc(cx - 34, 632, 11, 0, Math.PI * 2);
      ctx.fill();
      drawText(ctx, 'OK', cx + 16, 624, { scale: 3, color: PAL.feliratVil, shadow: '#0b0d12', align: 'center' });
    }

    function kepkocka(most) {
      if (!fut) return;
      requestAnimationFrame(kepkocka);
      const elozo = ido;
      ido = most / 1000;
      const dt = Math.min(0.05, Math.max(0, ido - elozo));

      if (indul > 0) {
        indul -= dt;
        if (indul <= 0) {
          fut = false;
          document.removeEventListener('keydown', gomb, true);
          kesz([0, 1].map((n) => ({ kollega: allapot[n].val, szin: SZINEK[allapot[n].szin] })));
          return;
        }
      }

      hatterRajz(ctx, ido);

      drawText(ctx, 'VÁLASSZ KARAKTERT ÉS SZÍNT', W / 2, 18, { scale: 4, color: PAL.feliratVil, shadow: '#0b0d12', align: 'center' });

      ctx.fillStyle = '#2a3140';
      ctx.fillRect(FEL - 2, 58, 4, H - 120);

      oldal(0);
      oldal(1);

      if (indul > 0 && Math.floor(ido * 6) % 2 === 0) {
        drawText(ctx, 'INDULÁS', W / 2, 676, { scale: 4, color: PAL.feliratVil, shadow: '#0b0d12', outline: '#0b0d12', align: 'center' });
      } else {
        drawText(ctx, SZABALY, W / 2, 684, { scale: 2, color: PAL.szonyegVil, shadow: '#0b0d12', align: 'center' });
      }
    }
    requestAnimationFrame(kepkocka);
  });
}

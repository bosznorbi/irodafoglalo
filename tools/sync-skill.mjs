// Ez a csomag ket helyen tart ugyanabbol a tartalombol masolatot, mert a
// skill/ mappa onmagaban is kiemelheto, es mert nem mindenki Claude Code-ot
// fog hasznalni. Egy forras van, a tobbi masolat, es ez a szkript tartja oket
// szinkronban:
//
//   1. Kodfajlok:  starter/src/*.js          ->  skill/<skill>/*.js
//   2. Utasitasok: skill/*/SKILL.md          ->  AGENTS.md (a projekt gyokereben)
//
//   node tools/sync-skill.mjs           - ellenorzes, nem ir semmit
//   node tools/sync-skill.mjs --write   - a forrasbol frissiti a masolatokat

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKILL_DIR = join(ROOT, 'skill');
const AGENTS_MD = join(ROOT, 'AGENTS.md');
const MCP_JSON = join(ROOT, '.mcp.json');

// ---------------------------------------------------------------- a skillek
//
// A skillek sorrendje az AGENTS.md-ben ez a lista: eloszor a kotelezo
// kontroller-resz, utana az opcionalis kollegafejek. Uj skill: vegy fel ide
// egy sort. Ha kimarad a listabol, attol meg bekerul az AGENTS.md-be, csak a
// vegere, es a szkript szol rola.
//
//   nev      - a skill mappaja a skill/ alatt (ott all a SKILL.md)
//   masol    - a skill mappajaba masolt fajlok:  celfajl -> forras a gyokertol
//   bevezeto - amit az AGENTS.md fejlecebe ir errol a skillrol; a SKILL.md
//              torzse a skill mappajahoz kepest beszel a fajlokrol, a gyokerben
//              allo AGENTS.md olvasojanak viszont a valodi hely kell

const SKILLS = [
  {
    nev: 'snes-kontroller',
    masol: {
      'gamepad.js': 'starter/src/gamepad.js',
      'pad-gate.js': 'starter/src/pad-gate.js',
    },
    bevezeto: [
      'A két bekötendő fájl helye ebben a csomagban: `starter/src/gamepad.js` és',
      '`starter/src/pad-gate.js`. A starterben már be van kötve mindkettő.',
    ],
  },
  {
    nev: 'kollegafejek',
    bevezeto: [
      'A második rész a kollégafejekről szól: opcionális, és csak kifejezett',
      'kérésre kerül a játékba.',
    ],
  },
];

const FEJLEC_ELEJE = [
  '<!--',
  '  Ez a fájl a skill/*/SKILL.md fájlokból készül.',
  '  Ne ezt szerkeszd: futtasd a  node tools/sync-skill.mjs --write  parancsot.',
  '-->',
  '',
  '> **Ez a projekt utasításfájlja.** Ha a szerkesztőd magától beolvassa, jó. Ha',
  '> nem, olvasd el, mielőtt a játékhoz hozzákezdesz.',
];

const write = process.argv.includes('--write');
let drift = 0; // amit a --write megjavit
let baj = 0; // amit kezzel kell megjavitani

/** A skillek a fenti sorrendben; ami a skill/ alatt van, de a listabol kimaradt, a vegere kerul. */
function skillek() {
  const mappak = readdirSync(SKILL_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(SKILL_DIR, d.name, 'SKILL.md')))
    .map((d) => d.name)
    .sort();

  const felvett = [];
  for (const skill of SKILLS) {
    if (mappak.includes(skill.nev)) felvett.push(skill);
    else {
      baj++;
      console.log('  HIÁNYZIK  skill/' + skill.nev + '/SKILL.md — a SKILLS listában szerepel, de nincs meg');
    }
  }

  const kimaradt = mappak.filter((nev) => !SKILLS.some((s) => s.nev === nev));
  for (const nev of kimaradt) {
    console.log('  ÚJ SKILL  skill/' + nev + ' — a lista végére került. A helyét a tools/sync-skill.mjs SKILLS listájában állítsd be.');
  }

  return [...felvett, ...kimaradt.map((nev) => ({ nev }))];
}

/** Osszehasonlitas, es --write eseten iras. */
function egyeztet(utvonal, tartalom) {
  const label = utvonal.slice(ROOT.length + 1);
  const cur = existsSync(utvonal) ? readFileSync(utvonal, 'utf8') : null;
  if (cur === tartalom) {
    console.log('  azonos    ' + label);
    return;
  }
  drift++;
  if (write) {
    mkdirSync(dirname(utvonal), { recursive: true });
    writeFileSync(utvonal, tartalom);
    console.log('  frissítve ' + label);
  } else {
    console.log('  ELTÉR     ' + label);
  }
}

/** A SKILL.md torzse a YAML fejlec nelkul (a fejlec a masodik '---' sorig tart). */
function torzs(skillMd) {
  const raw = readFileSync(skillMd, 'utf8');
  const m = /^---\r?\n[\s\S]*?\r?\n---\r?\n/.exec(raw);
  return (m ? raw.slice(m[0].length) : raw).trim();
}

const LISTA = skillek();

// ------------------------------------------------------------- 1. kodfajlok
//
// A skill mappajaban allo js-ek masolatok: a valodi forras a starter/src, mert
// a jatek azt futtatja. Igy nem fordulhat elo, hogy a skill mast tanit, mint
// amit a starter csinal.

for (const skill of LISTA) {
  for (const [cel, forras] of Object.entries(skill.masol ?? {})) {
    egyeztet(join(SKILL_DIR, skill.nev, cel), readFileSync(join(ROOT, forras), 'utf8'));
  }
}

// -------------------------------------------------------------- 2. AGENTS.md
//
// A SKILL.md a Claude Code sajat formatuma: YAML fejlec, es a .claude/skills/
// alol toltodik be magatol. Mas eszkozok ezt nem ismerik, viszont egyre tobb
// olvassa a projekt gyokereben allo AGENTS.md-t.
//
// Ugyanaz a szoveg megy mindkettobe, hogy ne csusszanak szet: a YAML fejlecet
// levagjuk, a skillek torzse a fenti sorrendben, vizszintes vonallal
// elvalasztva. Ele kerul egy rovid utbaigazitas: minden skill bevezetoje egy
// idezet-bekezdes, mert az AGENTS.md olvasoja nem a skill mappajabol dolgozik.

{
  const fejlec = [...FEJLEC_ELEJE];
  for (const skill of LISTA) {
    if (!skill.bevezeto) continue;
    fejlec.push('>', ...skill.bevezeto.map((sor) => (sor ? '> ' + sor : '>')));
  }

  const test = fejlec.join('\n') + '\n\n' +
    LISTA.map((s) => torzs(join(SKILL_DIR, s.nev, 'SKILL.md'))).join('\n\n---\n\n') + '\n';

  egyeztet(AGENTS_MD, test);

  // Az MCP-szerverek cimet ket helyen irjuk le: a gyokerben allo .mcp.json-ban
  // (ezt olvassa az eszkoz) es a skill szovegeben (ezt olvassa az ember).
  // Generalni nem generaljuk egyikbol a masikat, de ha elcsusznak, az csendes
  // hiba lenne: a doksi olyan szerverre mutatna, amit senki nem hasznal.
  if (existsSync(MCP_JSON)) {
    const mcp = JSON.parse(readFileSync(MCP_JSON, 'utf8'));
    for (const [nev, szerver] of Object.entries(mcp.mcpServers ?? {})) {
      const hol = [nev, szerver.url].filter(Boolean).every((s) => test.includes(s));
      if (hol) console.log('  azonos    .mcp.json: ' + nev + ' szerepel az AGENTS.md-ben');
      else {
        baj++;
        console.log('  ELTÉR     .mcp.json: a(z) ' + nev + ' szerver (' + szerver.url + ') nincs benne az AGENTS.md-ben.');
        console.log('            Írd bele a szervert használó skill SKILL.md-jébe, aztán futtasd újra.');
      }
    }
  }
}

// ---------------------------------------------------------------- osszegzes

if (baj) {
  console.log('\n  ' + baj + ' dolgot kézzel kell megjavítani (lásd fent).');
  process.exit(1);
}
if (!write && drift) {
  console.log('\n  ' + drift + ' fájl eltér. Futtasd: node tools/sync-skill.mjs --write');
  process.exit(1);
}
console.log('\n  minden másolat naprakész');

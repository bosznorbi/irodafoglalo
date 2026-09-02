// A padkezelo konyvtar KET helyen el ebben a csomagban, mert a skill mappat
// onmagaban is ki lehet emelni. Egy forras van, a tobbi masolat:
//
//   forras:   starter/src/gamepad.js, starter/src/pad-gate.js
//   masolat:  skill/snes-kontroller/
//
// Ezen kivul a SKILL.md-bol keszul az AGENTS.md is: ugyanaz a tartalom, csak
// eszkozfuggetlen alakban, mert nem mindenki Claude Code-ot fog hasznalni.
//
//   node tools/sync-skill.mjs           - ellenorzes, nem ir semmit
//   node tools/sync-skill.mjs --write   - a forrasbol frissiti a masolatokat

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'starter', 'src');
const SKILL = join(ROOT, 'skill', 'snes-kontroller');

const FILES = ['gamepad.js', 'pad-gate.js'];

const write = process.argv.includes('--write');
let drift = 0;

for (const name of FILES) {
  const src = readFileSync(join(SRC, name), 'utf8');
  const dst = join(SKILL, name);
  const label = dst.slice(ROOT.length + 1);
  const cur = existsSync(dst) ? readFileSync(dst, 'utf8') : null;
  if (cur === src) { console.log('  azonos    ' + label); continue; }
  drift++;
  if (write) {
    mkdirSync(dirname(dst), { recursive: true });
    writeFileSync(dst, src);
    console.log('  frissítve ' + label);
  } else {
    console.log('  ELTÉR     ' + label);
  }
}

// ------------------------------------------------------------------ AGENTS.md
//
// A SKILL.md a Claude Code sajat formatuma: YAML fejlec, es a .claude/skills/
// alol toltodik be magatol. Mas eszkozok ezt nem ismerik, viszont egyre tobb
// olvassa a projekt gyokereben allo AGENTS.md-t.
//
// Ugyanaz a szoveg megy mindkettobe, hogy ne csusszanak szet: a fejlecet
// levagjuk, es teszunk ele egy rovid utbaigazitast a fajlok helyerol.

const SKILL_MD = join(SKILL, 'SKILL.md');
const AGENTS_MD = join(ROOT, 'AGENTS.md');

const FEJLEC = `<!--
  Ez a fájl a skill/snes-kontroller/SKILL.md-ből készül.
  Ne ezt szerkeszd: futtasd a  node tools/sync-skill.mjs --write  parancsot.
-->

> **Ez a projekt utasításfájlja.** Ha a szerkesztőd magától beolvassa, jó. Ha
> nem, olvasd el, mielőtt a játékhoz hozzákezdesz.
>
> A két bekötendő fájl helye ebben a csomagban: \`starter/src/gamepad.js\` és
> \`starter/src/pad-gate.js\`. A starterben már be van kötve mindkettő.

`;

{
  const raw = readFileSync(SKILL_MD, 'utf8');
  // A YAML fejlec a masodik '---' sorig tart.
  const m = /^---\r?\n[\s\S]*?\r?\n---\r?\n/.exec(raw);
  const test = FEJLEC + (m ? raw.slice(m[0].length) : raw).replace(/^\s+/, '');
  const cur = existsSync(AGENTS_MD) ? readFileSync(AGENTS_MD, 'utf8') : null;
  const label = AGENTS_MD.slice(ROOT.length + 1);
  if (cur === test) console.log('  azonos    ' + label);
  else {
    drift++;
    if (write) { writeFileSync(AGENTS_MD, test); console.log('  frissítve ' + label); }
    else console.log('  ELTÉR     ' + label);
  }
}

if (!write && drift) {
  console.log('\n  ' + drift + ' fájl eltér. Futtasd: node tools/sync-skill.mjs --write');
  process.exit(1);
}
console.log('\n  minden másolat naprakész');

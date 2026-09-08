# Kontroller csomag

Két USB SNES gamepad, két játékos, egy gép. A kontroller kezelése kész van:
nem kell drivert telepíteni, és nem kell kódot írni hozzá.

Három lépés, ebből kettő egy-egy bemásolt prompt.

## 1. Előkészítés

Nyisd meg ezt a mappát az AI-jal, és másold be ezt:

```
Ebben a mappában egy kész kontroller-csomag van két USB SNES gamepadhez.
Készítsd elő a projektet:

- Olvasd el az AGENTS.md fájlt, és tartsd magad hozzá a továbbiakban.
- Ha a szerkesztőnek, amiben futsz, van projekt-szintű utasításhelye (Claude
  Code: .claude/skills/, Cursor: .cursor/rules/, Copilot:
  .github/copilot-instructions.md), tedd be oda is, hogy később is emlékezz
  rá. A kész skillek a skill/ mappában vannak, egy almappa egy skill. Ha
  nincs ilyen helye, csak jelezd, és a fontos részeket majd emlékeztetőül
  bemásolom.
- Ha nem Claude Code vagy, és a szerkesztődnek van MCP-konfig helye (Cursor:
  .cursor/mcp.json, VS Code: .vscode/mcp.json), tedd be oda a gyökérben lévő
  .mcp.json nitro-fejek szerverét is. A formátum a skill/kollegafejek/SKILL.md
  fájlban van. Ez opcionális dolog, kérés nélkül ne használd.
- Nyisd meg a kontroller-teszt.html fájlt a böngészőmben. Közvetlenül
  fájlként nyisd meg, ne kiszolgálón keresztül: az a fájl önmagában is
  működik, nem kell hozzá semmi.

Utána szólj egy mondatban, és megyek kipróbálni a két kontrollert.
```

Ha a Claude Code indulásnál rákérdez, hogy engedélyezed-e a projekt
`nitro-fejek` MCP-szerverét, mondj igent. Ez a kollégafejek forrása (lásd
lent), és csak akkor csinál bármit, ha kéritek.

## 2. Teszteld a kontrollereket

Dugd be mindkettőt, és nyomd végig az összes gombot mindkét paden. Amikor a
teszt kiírja, hogy **MINDEN RENDBEN**, mehettek tovább. Két perc.

A böngésző csak az első gombnyomás után látja meg a padet, tehát ha elsőre
nem jelenik meg, nyomj rajta valamit.

> A `kontroller-teszt.html` **magában is működik**, bármelyik gépen: dupla
> kattintás, és kész. Nem kell hozzá se kiszolgáló, se Node, se AI.

## 3. Kezdjétek a játékot

Amikor a teszt zöld, jöhet ez a prompt. A végét ti írjátok tovább:

```
Írjunk egy játékot a két USB SNES kontrollerre.

Indítsd el a starter/server.js kiszolgálót a háttérben, és írd ki, milyen
címen érem el. A starter már fut és játszható: azt alakítjuk tovább.

A kontroller kezelését NE írd újra, az kész van: az AGENTS.md leírja, hogyan
működik. Ha nem emlékszel rá, olvasd el újra.

HÁROM KEMÉNY FELTÉTEL. Ezek nem alku tárgyai, és minden későbbi döntésnél
tartsd magad hozzájuk:

1. Két játékos, egy gépen. Mindkét kontroller irányítson valamit.
2. Egy percen belül dőljön el, ki a győztes.
3. A kör legyen újraindítható a lap újratöltése nélkül.

Ezen kívül minden szabad: téma, grafika, mechanika, hangulat. Ezekről a
következő körökben beszélgetünk, most még ne tervezz túl, és ne írj kódot,
amíg nem tisztáztuk az ötletet.

A játék ötlete:
```

## Kollégafejek

Opcionális. A csomag tud egy MCP-szerverről, amiből az AI a kollégák
kivágott, átlátszó hátterű fejét kéri le, és beteszi a játékba: játékosnak,
ellenfélnek, célpontnak, bárminek. Az AI kérés nélkül nem nyúl hozzá; amikor
a kinézetről beszélgettek, egy mondatban megemlíti, a többi rajtatok áll. Ha
kéritek, elég ennyi:

```
Tegyétek be a kollégák fejét a játékba. Az 1. játékos Tibi legyen, a 2. Patki.
```

## Mi van a mappában

| | |
|---|---|
| `kontroller-teszt.html` | Önálló kontroller-teszt. Semmit nem kell telepíteni hozzá. |
| `starter/` | Kész, futó kétjátékos alap. Innen indul a fejlesztés. |
| `AGENTS.md` | A projekt utasításfájlja az AI-nak. Sok szerkesztő magától beolvassa. |
| `skill/snes-kontroller/` | Ugyanaz Claude Code formátumban, a `.claude/skills/` alá. |
| `skill/kollegafejek/` | A kollégafejek beépítése: opcionális. Az `AGENTS.md`-ben is benne van. |
| `.mcp.json` | A `nitro-fejek` MCP-szerver címe. Claude Code magától felajánlja. |
| `FELADAT.md` | A feladat és a szabályok. |

## Bármilyen AI-eszközzel megy

Nem kell Claude-ot használnotok. A `skill/` mappa a Claude Code saját
formátuma, de ugyanaz a tartalom ott van az `AGENTS.md`-ben is, amit egyre
több szerkesztő magától beolvas. Ha a tiéd nem ismeri egyiket sem, az első
prompt akkor is működik: az AI egyszerűen elolvassa a fájlt.

**A starter pedig eszköz nélkül is fut.** A kontroller kezelése kész kód a
`starter/src/` mappában, nem az AI írja meg. Akkor is működik, ha egy sort sem
promptoltok.

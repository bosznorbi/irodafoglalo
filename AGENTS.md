<!--
  Ez a fájl a skill/*/SKILL.md fájlokból készül.
  Ne ezt szerkeszd: futtasd a  node tools/sync-skill.mjs --write  parancsot.
-->

> **Ez a projekt utasításfájlja.** Ha a szerkesztőd magától beolvassa, jó. Ha
> nem, olvasd el, mielőtt a játékhoz hozzákezdesz.
>
> A két bekötendő fájl helye ebben a csomagban: `starter/src/gamepad.js` és
> `starter/src/pad-gate.js`. A starterben már be van kötve mindkettő.
>
> A második rész a kollégafejekről szól: opcionális, és csak kifejezett
> kérésre kerül a játékba.

# Két USB SNES kontroller bekötése

## A lényeg

**A játékot billentyűzetes kétjátékos játékként kell megírni. A kontroller
magától működni fog.**

A könyvtár valódi `keydown` és `keyup` eseményt küld a lapnak, tehát a játék
kódja nem tud a kontrollerről, és nem is kell tudnia. Ebből következik, hogy
**mindegy, milyen technológia**: vanilla JS, React, Phaser, Three.js, p5.

Két kész fájl van a csomagban. Ezeket **másold be a projektbe, ne írd újra**:

| Fájl | Mire való |
|---|---|
| `gamepad.js` | A könyvtár. Padolvasás, eszközprofil, billentyű-emuláció, kalibrálás. |
| `pad-gate.js` | Kezdőképernyő: megvárja a kontrollereket, és kipróbálhatóvá teszi a gombjaikat. |

## Bekötés

```js
import { pads } from './gamepad.js';
import { padGate } from './pad-gate.js';

// A kapu alatt MEG NEM kuldunk billentyut: kulonben az a gombnyomas, amivel
// a jatekos kivalasztja magat, mar a jatekba szolna bele.
pads.init({ slots: 2, keyboard: false });

padGate({
  players: 2,
  title: 'A JÁTÉK NEVE',
  onClose: () => { pads.keyboard(true); },   // innentol mennek a billentyuk
});
```

Ennyi. A játék többi része sima billentyűkezelés:

```js
const nyomva = new Set();
document.addEventListener('keydown', (e) => nyomva.add(e.code));
document.addEventListener('keyup', (e) => nyomva.delete(e.code));
window.addEventListener('blur', () => nyomva.clear());   // ne ragadjon be

if (nyomva.has('KeyA')) jatekos1.x -= 2;      // 1. pad: balra
if (nyomva.has('ArrowLeft')) jatekos2.x -= 2; // 2. pad: balra
```

## A billentyűkiosztás

Az 1. pad a billentyűzet **bal** oldalát kapja, a 2. a **jobb** oldalt. Ez a
két klasszikus kétjátékos kiosztás. Minden billentyű lenyomható egy sima
laptop billentyűzeten is, tehát kontroller nélkül is tesztelhető a játék.

| Pad gomb | 1. kontroller | 2. kontroller |
|---|---|---|
| ↑ | `KeyW` | `ArrowUp` |
| ↓ | `KeyS` | `ArrowDown` |
| ← | `KeyA` | `ArrowLeft` |
| → | `KeyD` | `ArrowRight` |
| B | `KeyG` | `KeyK` |
| A | `KeyH` | `KeyL` |
| Y | `KeyF` | `KeyJ` |
| X | `KeyT` | `KeyI` |
| L váll | `KeyQ` | `KeyU` |
| R váll | `KeyE` | `KeyO` |
| SELECT | `KeyC` | `Enter` |
| START | `KeyV` | `Space` |

A négy arcgomb mindkét padnél gyémánt alakban ül a billentyűzeten, ahogy a
paden is, a két vállgomb pedig az irányok fölött:

```
   1. pad (bal kéz)              2. pad (jobb kéz)
     Q  W  E   = L ↑ R             U  ↑  O   = L ↑ R
     A  S  D   = ← ↓ →             ←  ↓  →
        T                             I
      F   H    = X, Y és A         J   L
        G                             K
     C  V      = SELECT START      ENTER SPACE
```

**A két pad START gombja két különböző billentyű.** Ha bármelyik pad
indíthasson, mindkettőt figyeld: `KeyV` és `Space`.

Más kiosztás kell? Egy táblázatot kell átírni, nem a kódot:

```js
pads.setKeys([
  { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', b: 'Space', /* ... */ },
  { up: 'ArrowUp', /* ... */ },
]);
```

## Kezdőképernyő

A `pad-gate.js` teljes képernyős DOM-átfedés, tehát mindegy, hogy a játék
canvasra, DOM-ba vagy WebGL-be rajzol: a háttérben sötétítve látszik.

- kiírja, hány pad van bedugva és mit lát belőlük a böngésző,
- gombnyomással eldönti, melyik pad melyik játékosé,
- kirajzolja mindkét padet: az **éppen nyomott gomb élénkzöld**, a **már
  kipróbált halványzöld**, és számolja, hány van meg a 12-ből,
- a játékot a **START nyomva tartása** indítja. Így a második játékost
  kiválasztó gombnyomás nem indítja el rögtön a játékot, és a START is
  végigpróbálható gomb marad.

Beállítások: `players`, `title`, `subtitle`, `onStart`, `onClose`,
`allowKeyboard`.

## Ha közvetlenül akarod olvasni a padet

Ez a második út, csak akkor kell, ha konkrét padgombra van szükséged
billentyű helyett:

```js
pads.init({ slots: 2 });          // keyboard nelkul

function frame() {
  pads.poll();                     // a kepkocka ELEJEN, egyszer
  if (pads.down(0, 'left')) jatekos1.x -= 2;
  if (pads.pressed(0, 'b')) jatekos1.ugras();
  if (pads.anyPressed('start')) szunet();
  requestAnimationFrame(frame);
}
```

- `pads.down(slot, gomb)` - éppen le van-e nyomva
- `pads.pressed(slot, gomb)` / `released(slot, gomb)` - él, az előző `poll()` óta
- `pads.anyDown(gomb)` / `anyPressed(gomb)` - bármelyik játékos
- `pads.onButton((slot, gomb, le) => ...)` - eseményfigyelő, sosem hagy ki nyomást

Gombnevek: `up down left right  b a y x  l r  select start`

**Soha ne használd a kettőt egyszerre ugyanarra a bemenetre**, mert akkor
minden gombnyomás kétszer érkezik be.

## Buktatók

| Tünet | Ok |
|---|---|
| `getGamepads()` csupa `null`, pedig be van dugva | Még nem nyomtak rajta gombot. Ujjlenyomat-védelem, nem kerülhető meg. Ezért van a kezdőképernyő. |
| Néma, üres lap | ES modult a böngésző nem tölt be `file://` címről. Kell egy helyi kiszolgáló. |
| A pad megvan, de semmi nem reagál | Nincs `pads.keyboard(true)`, vagy a fül háttérben van. |
| Minden gomb kétszer sül el | Az emuláció és a közvetlen olvasás egyszerre fut. |
| Egy irány lenyomva ragad | A saját billentyűkezelésed nem ürül `blur`-re. |
| Rossz gomb sül el | Nem a várt pad van bedugva. Lásd: kalibrálás. |

**Háttérben lévő fülön a `requestAnimationFrame` teljesen leáll**, nem csak
lassul. A könyvtár ezt kezeli: elenged mindent, és visszatéréskor újraindul.

## Ha a motorod a saját canvasán figyel

Alapból oda megy az esemény, ahova egy valódi billentyűé is: a fókuszált
elemre, fókusz híján a `body`-ra, és onnan felbuborékol a `document`-en át a
`window`-ig. Ha a motorod fókusz nélkül figyel egy elemen:

```js
pads.init({ keyboard: true, keyTarget: document.getElementById('canvas') });
```

## Ismeretlen pad: kalibrálás

A várt eszköz kiosztása be van építve, tehát alapból nem kell semmit tenni. Ha
mégis rossz gomb sül el, a kalibrálás végigkérdezi a 12 gombot, és
eszközazonosítóhoz kötve elmenti:

```js
pads.calibrate(0, (i, gomb) => kiir(gomb), (profil) => console.log(profil));
```

A bemért értékek a beépített tábla **fölé** kerülnek, nem a helyére: egy
félbehagyott bemérés nem tesz némává gombokat.

## Rezgés

**Ez a pad nem tud rezegni**, nincs benne motor. A könyvtár tud rezgetni azon,
ami képes rá, és **csendben nem csinál semmit** a többin, tehát a játék kódját
nem kell elágaztatni:

```js
pads.rumble(slot, { duration: 180, strong: 0.9, weak: 0.4 });
```

`pads.canRumble(slot)`, `pads.stopRumble(slot)`, `pads.capabilities(slot)`.

## Ellenőrzés

`node selftest.mjs` - a könyvtár 76 önellenőrzése hamis padekkel, böngésző
nélkül. Ha ez elhasal, a `gamepad.js` sérült.

Mély részletek, bemért HID adatok: `reference/hardware.md`

---

# Kollégafejek a játékban

## A lényeg

**Opcionális.** A kollégák kivágott, átlátszó hátterű feje bekerülhet a
játékba: lehet a játékos figurája, az ellenfél, a labda, a célpont, bármi.
Nem kötelező.

**Kérés nélkül ne építsd be.** Akkor nyúlj hozzá, ha a csapat kifejezetten
kéri. Egyszer, amikor a játék ötlete már megvan és a kinézetről esik szó,
említsd meg egy mondatban, hogy van ilyen lehetőség, és hogy opcionális.
Utána a csapat dönt, és te nem hozod fel újra.

## Honnan jönnek a fejek

Egy MCP-szerver adja, a neve `nitro-fejek`. A projekt gyökerében lévő
`.mcp.json` már tartalmazza; a Claude Code az első indításnál rákérdez, és
egy igen után látod a két toolját:

| Tool | Mit ad |
|---|---|
| `kollegak` | A teljes névsor (`id`, `nev`, `becenev`, `kep`) és két kész `curl`-parancs: a manifest és az összes fej egyben. Ezzel kezdj. |
| `kollega(nev)` | Egy fej képként, hogy lásd, mit építesz be, és a saját `curl`-ja. A `nev` lehet id, teljes név vagy becenév, ékezet nélkül is. |

Ha nem látod a toolokat, a szerver nincs engedélyezve vagy nem tud
csatlakozni: Claude Code-ban `/mcp`. Más szerkesztőben ugyanez a szerver a
saját konfighelyén, Cursor: `.cursor/mcp.json`

```json
{ "mcpServers": { "nitro-fejek": { "url": "https://nitro-arcade-mcp-production.up.railway.app/mcp" } } }
```

VS Code / Copilot: `.vscode/mcp.json`

```json
{ "servers": { "nitro-fejek": { "type": "http", "url": "https://nitro-arcade-mcp-production.up.railway.app/mcp" } } }
```

## Beépítés

1. Hívd a `kollegak` toolt.
2. Futtasd a kapott két `curl`-parancsot a projekt gyökeréből, ahol a
   `starter/` mappa van. Eredmény: `starter/img/kollegak.json` és
   `starter/img/<id>.png`, 56 fej, összesen kb. 7 MB. Ha csak néhány fej
   kell, a `kollega(nev)` egy-egy fej parancsát adja.
3. A játék a **helyi fájlokat** használja: a listát az `img/kollegak.json`-ból,
   a képeket az `img/<id>.png`-ből, relatív útvonalon. A starter kiszolgálója
   ezeket már kiszolgálja.
4. Rajzolás előtt várd meg, amíg a kép betöltött. Hogy ezt hogyan, és hogyan
   rajzolod ki, a technológiádtól függ: canvas, DOM, Phaser, mindegyikben
   megy, a kód a tiéd.

**A szerver címe nem kerülhet a játék kódjába.** Építés közben van net, a
bemutatón nem biztos: a kész játék a saját mappájából fut, a szervert senki
nem hívja. Képet csak a toolból kapott parancsokkal tölts le.

## A fejek szabványa

Minden fej egyforma, ezért bármelyik cserélhető bármelyikre, újrapozicionálás
nélkül:

| | |
|---|---|
| Vászon | 512×512 px PNG, átlátszó háttér |
| Pozíció | a fej középpontja a vászon közepén |
| Lépték | az arc (homlok–áll) a vászon magasságának 40%-a |
| Alak | tojás alakú fej és nyakcsík, váll nincs |

Négyzetesen rajzold, a kívánt méretben: 40 és 120 px között is jól néz ki.
Ne nyújtsd el.

A manifest alakja:

```json
{ "kollegak": [ { "id": "szoke_tibor", "nev": "Szőke Tibor", "becenev": "Tibi", "kep": "img/szoke_tibor.png" } ] }
```

Becenév a képernyőre, teljes név a karakterválasztóba. A becenév nem egyedi
(több Bence, Tomi, Peti van), hivatkozásra az `id`-t használd.

## Buktatók

| Tünet | Ok |
|---|---|
| Nincs `kollegak` tool | A `.mcp.json` szervere nincs engedélyezve, vagy nem tud csatlakozni. Claude Code: `/mcp`. |
| A `curl` PowerShellben mást csinál | Ott a `curl` az `Invoke-WebRequest` álneve. Írj `curl.exe`-t. |
| A képek nem oda kerültek | A `curl` nem a projekt gyökeréből futott, vagy a projekt szerkezete más, mint a starter. Az `-o` útvonalat igazítsd oda, ahonnan a játék kiszolgál. |
| Első képkockán nincs fej, vagy hiba a rajzolásnál | A kép még nem töltött be. Várd meg. |
| A `kollega` tool több embert sorol | Közös becenév. Add meg az `id`-t vagy a teljes nevet. |
| A bemutatón üres a fej helye | A játék a szerverről tölt helyi fájl helyett. Csak relatív útvonal. |

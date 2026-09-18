// 5x7 pixel bitmap font, 2 sor ekezet-zonaval felette (cella: 5x9).
// A magyar ekezetes betuk az alapbetu + ekezet-overlay kombinaciojabol allnak,
// igy nem kell minden valtozatot kulon megrajzolni.

const G = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.###.'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '##..#', '#.#.#', '#..##', '#..##', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  0: ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  1: ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  3: ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  6: ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'],
  7: ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  9: ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
  '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
  '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
  '.': ['.....', '.....', '.....', '.....', '.....', '.....', '..#..'],
  ',': ['.....', '.....', '.....', '.....', '.....', '..#..', '.#...'],
  ':': ['.....', '..#..', '..#..', '.....', '..#..', '..#..', '.....'],
  '-': ['.....', '.....', '.....', '.###.', '.....', '.....', '.....'],
  '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
  '/': ['....#', '....#', '...#.', '..#..', '.#...', '#....', '#....'],
  '(': ['...#.', '..#..', '.#...', '.#...', '.#...', '..#..', '...#.'],
  ')': ['.#...', '..#..', '...#.', '...#.', '...#.', '..#..', '.#...'],
  '=': ['.....', '.....', '#####', '.....', '#####', '.....', '.....'],
  '%': ['##..#', '##.#.', '...#.', '..#..', '.#...', '.#.##', '#..##'],
  '<': ['...#.', '..#..', '.#...', '#....', '.#...', '..#..', '...#.'],
  '>': ['.#...', '..#..', '...#.', '....#', '...#.', '..#..', '.#...'],
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
};

const ACC = {
  acute: ['...#.', '..#..'],
  umlaut: ['.#.#.', '.....'],
  dacute: ['..#.#', '.#.#.'],
};

// ekezetes betu -> [alapbetu, ekezet]
const ACCENTED = {
  'Á': ['A', 'acute'], 'É': ['E', 'acute'], 'Í': ['I', 'acute'],
  'Ó': ['O', 'acute'], 'Ö': ['O', 'umlaut'], 'Ő': ['O', 'dacute'],
  'Ú': ['U', 'acute'], 'Ü': ['U', 'umlaut'], 'Ű': ['U', 'dacute'],
};

export const CHAR_W = 5;
export const CHAR_H = 9; // 2 sor ekezet + 7 sor betu
const ADVANCE = 6;

function glyphOf(ch) {
  const acc = ACCENTED[ch];
  if (acc) return { rows: G[acc[0]] || G['?'], acc: ACC[acc[1]] };
  return { rows: G[ch] || G['?'], acc: null };
}

/** Egyetlen 5x7 karakter kirajzolasa, ikonokhoz. */
export function drawGlyph(c, ch, x, y, color) {
  const g = glyphOf(ch);
  c.fillStyle = color;
  for (let ry = 0; ry < 7; ry++) {
    for (let rx = 0; rx < CHAR_W; rx++) {
      if (g.rows[ry][rx] === '#') c.fillRect(x + rx, y + ry, 1, 1);
    }
  }
}

export function textWidth(str, scale = 1) {
  return (str.length * ADVANCE - 1) * scale;
}

const cache = new Map();

// Egy szoveget offscreen canvasra rajzol es cachel, hogy kepkockankent ne
// kelljen tobb ezer fillRect-et kiadni.
function renderToCanvas(str, scale, color, shadow, outline) {
  const pad = outline ? scale : 0;
  const w = textWidth(str, scale) + (shadow ? scale : 0) + pad * 2;
  const h = CHAR_H * scale + (shadow ? scale : 0) + pad * 2;
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, w);
  cv.height = Math.max(1, h);
  const c = cv.getContext('2d');
  c.imageSmoothingEnabled = false;

  const stamp = (dx, dy, col) => {
    c.fillStyle = col;
    for (let i = 0; i < str.length; i++) {
      const g = glyphOf(str[i]);
      const ox = pad + dx + i * ADVANCE * scale;
      if (g.acc) {
        for (let y = 0; y < 2; y++) {
          for (let x = 0; x < CHAR_W; x++) {
            if (g.acc[y][x] === '#') c.fillRect(ox + x * scale, pad + dy + y * scale, scale, scale);
          }
        }
      }
      for (let y = 0; y < 7; y++) {
        for (let x = 0; x < CHAR_W; x++) {
          if (g.rows[y][x] === '#') c.fillRect(ox + x * scale, pad + dy + (y + 2) * scale, scale, scale);
        }
      }
    }
  };

  if (outline) {
    const ring = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]];
    for (const o of ring) stamp(o[0] * scale, o[1] * scale, outline);
  }
  if (shadow) stamp(0, scale, shadow);
  stamp(0, 0, color);
  return { cv, pad };
}

export function drawText(ctx, str, x, y, o) {
  o = o || {};
  const scale = o.scale || 1;
  const color = o.color || '#f2e2c2';
  const shadow = o.shadow === undefined ? '#170f0a' : o.shadow;
  const outline = o.outline || null;
  const key = str + '|' + scale + '|' + color + '|' + shadow + '|' + outline;
  let entry = cache.get(key);
  if (!entry) {
    entry = renderToCanvas(str, scale, color, shadow, outline);
    cache.set(key, entry);
  }
  const w = textWidth(str, scale);
  let px = x;
  if (o.align === 'center') px = Math.round(x - w / 2);
  else if (o.align === 'right') px = Math.round(x - w);
  ctx.drawImage(entry.cv, Math.round(px) - entry.pad, Math.round(y) - entry.pad);
  return w;
}

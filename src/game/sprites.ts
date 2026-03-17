export const PALETTE: Record<string, string> = {
  '.': 'transparent',
  '#': '#0f172a', // Outline
  'M': '#cbd5e1', // Silver
  'S': '#fcd34d', // Skin
  'B': '#3b82f6', // Blue (Warrior)
  'P': '#a855f7', // Purple (Mage/Shadow)
  'G': '#22c55e', // Green (Archer)
  'R': '#ef4444', // Red (Assassin/Boss)
  'D': '#334155', // Dark Gray
  'Y': '#eab308', // Gold
  'O': '#16a34a', // Orc Green
  'E': '#dc2626', // Evil Eye
  'W': '#ffffff', // White
  'w': '#8b5cf6', // Shadow Eye
  'C': '#1e293b', // Cave Floor
  'c': '#334155', // Cave Detail
  'V': '#0f172a', // Cave Wall
  'v': '#475569', // Cave Wall Edge
  'T': '#44403c', // Temple Floor
  't': '#292524', // Temple Detail
  'U': '#78716c', // Temple Wall
  'u': '#57534e', // Temple Wall Edge
  'F': '#14532d', // Forest Floor
  'f': '#166534', // Forest Detail
  'L': '#064e3b', // Forest Wall
  'l': '#047857', // Forest Wall Edge
  'N': '#e0f2fe', // Snow Floor
  'n': '#bae6fd', // Snow Detail
  'I': '#7dd3fc', // Ice Wall
  'i': '#38bdf8', // Ice Wall Edge
  'H': '#450a0a', // Volcano Floor
  'h': '#7f1d1d', // Volcano Detail
  'A': '#991b1b', // Lava Wall
  'a': '#dc2626', // Lava Wall Edge
  'b': '#8b4513', // Brown (Wood)
};

export const ASCII_SPRITES: Record<string, string[]> = {
  warrior: [
    '..####..',
    '.#MMMM#.',
    '.#S##S#.',
    '##BBBB##',
    '#MBBBBM#',
    '#MBBBBM#',
    '.#B##B#.',
    '.##..##.'
  ],
  mage: [
    '...##...',
    '..#PP#..',
    '.#PPPP#.',
    '.##SS##.',
    '##PPPP##',
    '#YPPPPY#',
    '#YPPPPY#',
    '.##..##.'
  ],
  archer: [
    '..####..',
    '.#GGGG#.',
    '.#S##S#.',
    '##GGGG##',
    '#SGGGGW#',
    '#SGGGGW#',
    '.#G##G#.',
    '.##..##.'
  ],
  assassin: [
    '..####..',
    '.#DDDD#.',
    '.#R##R#.',
    '##DDDD##',
    '#MDDDDM#',
    '#MDDDDM#',
    '.#D##D#.',
    '.##..##.'
  ],
  necromancer: [
    '...##...',
    '..#DD#..',
    '.#w##w#.',
    '##PPPP##',
    '#DPPPPD#',
    '#DPPPPD#',
    '.#D##D#.',
    '.##..##.'
  ],
  slime: [
    '........',
    '........',
    '........',
    '..####..',
    '.#OOOO#.',
    '#O#OO#O#',
    '#OOOOOO#',
    '.######.'
  ],
  zombie: [
    '..####..',
    '.#OOOO#.',
    '.#E##E#.',
    '##DDDD##',
    '#ODDDDO#',
    '#ODDDDO#',
    '.#O##O#.',
    '.##..##.'
  ],
  skeleton: [
    '..####..',
    '.#WWWW#.',
    '.#E##E#.',
    '##WWWW##',
    '#WWWWWW#',
    '#WWWWWW#',
    '.#W##W#.',
    '.##..##.'
  ],
  orc: [
    '..####..',
    '.#OOOO#.',
    '.#E##E#.',
    '##BBBB##',
    '#OBBBBO#',
    '#OBBBBO#',
    '.#B##B#.',
    '.##..##.'
  ],
  knight: [
    '..####..',
    '.#MMMM#.',
    '.#M##M#.',
    '##MMMM##',
    '#MMMMMM#',
    '#MMMMMM#',
    '.#M##M#.',
    '.##..##.'
  ],
  dog: [
    '........',
    '........',
    '.##..##.',
    '#bb##bb#',
    '#E####E#',
    '##bbbb##',
    '.#b##b#.',
    '.##..##.'
  ],
  goblin: [
    '..####..',
    '.#OOOO#.',
    '.#E##E#.',
    '##DDDD##',
    '#ODDDDO#',
    '#ODDDDO#',
    '.#O##O#.',
    '.##..##.'
  ],
  bat: [
    '........',
    '#.#..#.#',
    '###..###',
    '.#E##E#.',
    '.######.',
    '..####..',
    '...##...',
    '........'
  ],
  spider: [
    '........',
    '#.#..#.#',
    '.######.',
    '##EEEE##',
    '.######.',
    '#.#..#.#',
    '#......#',
    '........'
  ],
  golem: [
    '..####..',
    '.#DDDD#.',
    '.#E##E#.',
    '##DDDD##',
    '#DDDDDD#',
    '#DDDDDD#',
    '.#D##D#.',
    '.##..##.'
  ],
  vampire: [
    '..####..',
    '.#SSSS#.',
    '.#R##R#.',
    '##DDDD##',
    '#SDDDDS#',
    '#SDDDDS#',
    '.#S##S#.',
    '.##..##.'
  ],
  demon: [
    '.#....#.',
    '#R#..#R#',
    '.#RRRR#.',
    '.#E##E#.',
    '##RRRR##',
    '#RRRRRR#',
    '.#R##R#.',
    '.##..##.'
  ],
  dragon: [
    '.#....#.',
    '#R#..#R#',
    '#RR##RR#',
    '.#E##E#.',
    '##RRRR##',
    '#RRRRRR#',
    '.#R##R#.',
    '.##..##.'
  ],
  assassin_mob: [
    '..####..',
    '.#DDDD#.',
    '.#E##E#.',
    '##DDDD##',
    '#DDDDDD#',
    '#DDDDDD#',
    '.#D##D#.',
    '.##..##.'
  ],
  hunter: [
    '..####..',
    '.#SSSS#.',
    '.#B##B#.',
    '##MMMM##',
    '#SMMMMS#',
    '#SMMMMS#',
    '.#M##M#.',
    '.##..##.'
  ],
  chest: [
    '........',
    '........',
    '.######.',
    '.#bbbb#.',
    '.#bYYb#.',
    '.#bbbb#.',
    '.######.',
    '........'
  ],
  monster: [
    '........',
    '..####..',
    '.#OOOO#.',
    '.#E##E#.',
    '##OOOO##',
    '#OOOOOO#',
    '.#O##O#.',
    '.##..##.'
  ],
  boss: [
    '.#....#.',
    '.##..##.',
    '.#RRRR#.',
    '.#E##E#.',
    '##RRRR##',
    '#RRRRRR#',
    '.#R##R#.',
    '.##..##.'
  ],
  slime_king: [
    '.#YYYY#.',
    '#Y#YY#Y#',
    '#OOOOOO#',
    '#O#OO#O#',
    '#OOOOOO#',
    '#OOOOOO#',
    '#OOOOOO#',
    '.######.'
  ],
  crystal_golem: [
    '..####..',
    '.#PPPP#.',
    '##PPPP##',
    '#PPPPPP#',
    '#PPPPPP#',
    '##PPPP##',
    '.#P##P#.',
    '.##..##.'
  ],
  vampire_lord: [
    '..####..',
    '.#DDDD#.',
    '.#S##S#.',
    '##RRRR##',
    '#DRRRRD#',
    '#DRRRRD#',
    '.#D##D#.',
    '.##..##.'
  ],
  ice_dragon: [
    '..####..',
    '.#IIII#.',
    '#I#II#I#',
    '#IIIIII#',
    '##IIII##',
    '#IIIIII#',
    '#I####I#',
    '##....##'
  ],
  lich: [
    '..####..',
    '.#WWWW#.',
    '.#W##W#.',
    '##DDDD##',
    '#DDRDDD#',
    '#DDDDDD#',
    '.#D##D#.',
    '.##..##.'
  ],
  shadow_demon: [
    '#......#',
    '.#....#.',
    '..####..',
    '.#wwww#.',
    '##DDDD##',
    '#DDDDDD#',
    '.#D##D#.',
    '.##..##.'
  ],
  mech_behemoth: [
    '..####..',
    '.#MMMM#.',
    '#M#MM#M#',
    '#MMMMMM#',
    '##MMMM##',
    '#MMMMMM#',
    '.#M##M#.',
    '.##..##.'
  ],
  seraphim: [
    '#......#',
    '.#YYYY#.',
    '..####..',
    '.#WWWW#.',
    '##WWWW##',
    '#WWWWWW#',
    '.#W##W#.',
    '.##..##.'
  ],
  ancient_knight: [
    '..####..',
    '.#DDDD#.',
    '.#D##D#.',
    '##DDDD##',
    '#MDDDDM#',
    '#MDDDDM#',
    '.#D##D#.',
    '.##..##.'
  ],
  tower_god: [
    '#Y####Y#',
    'Y#WWWW#Y',
    '##W##W##',
    '#WWWWWW#',
    '#WDDDDW#',
    '#DDDDDD#',
    '#D####D#',
    '##....##'
  ],
  shadow: [
    '........',
    '..####..',
    '.#DDDD#.',
    '.#w##w#.',
    '##PPPP##',
    '#PPPPPP#',
    '.#P##P#.',
    '.##..##.'
  ],
  warriorWeapon: [
    '........',
    '........',
    '...#....',
    '.##bYMMM',
    '...#....',
    '........',
    '........',
    '........'
  ],
  mageWeapon: [
    '........',
    '........',
    '...#....',
    '.##bYPP#',
    '...#....',
    '........',
    '........',
    '........'
  ],
  archerWeapon: [
    '...##...',
    '..#bM#..',
    '.#b..M#.',
    '.#b..M#.',
    '..#bM#..',
    '...##...',
    '........',
    '........'
  ],
  assassinWeapon: [
    '........',
    '........',
    '........',
    '..##bYMM',
    '........',
    '........',
    '........',
    '........'
  ],
  necromancerWeapon: [
    '........',
    '........',
    '...#....',
    '.##DDPP#',
    '...#....',
    '........',
    '........',
    '........'
  ],
  caveFloor: [
    'CCCCCCCC',
    'CcCCCCCC',
    'CCCCCCCC',
    'CCCCcCCC',
    'CCCCCCCC',
    'CCcCCCCC',
    'CCCCCCCC',
    'CCCCCCcC'
  ],
  caveWall: [
    'vvvvvvvv',
    'vVVVVVVV',
    'vVVVVVVV',
    'vVVVVVVV',
    'vVVVVVVV',
    'vVVVVVVV',
    'vVVVVVVV',
    'vVVVVVVV'
  ],
  templeFloor: [
    'TTTTTTTT',
    'TttTTTTT',
    'TTTTTTTT',
    'TTTTtTTT',
    'TTTTtTTT',
    'TTTTTTTT',
    'TTtTTTTT',
    'TTTTTTTT'
  ],
  templeWall: [
    'uuuuuuuu',
    'uUUUUUUU',
    'uUUUUUUU',
    'uuuuuuuu',
    'UUUUuUUU',
    'UUUUuUUU',
    'uuuuuuuu',
    'uUUUUUUU'
  ],
  forestFloor: [
    'FFFFFFFF',
    'FfFFFFFF',
    'FFFFfFFF',
    'FFFFFFFF',
    'FFfFFFFF',
    'FFFFFFFF',
    'FFFFFFfF',
    'FFFFFFFF'
  ],
  forestWall: [
    'lLLLLLLl',
    'LLLLLLLL',
    'LLLLLLLL',
    'LLLLLLLL',
    'LLLLLLLL',
    'LLLLLLLL',
    'LLLLLLLL',
    'lLLLLLLl'
  ],
  snowFloor: [
    'NNNNNNNN',
    'NnNNNNNN',
    'NNNNnNNN',
    'NNNNNNNN',
    'NNnNNNNN',
    'NNNNNNNN',
    'NNNNNNnN',
    'NNNNNNNN'
  ],
  snowWall: [
    'iIIIIIIi',
    'IIIIIIII',
    'IIIIIIII',
    'IIIIIIII',
    'IIIIIIII',
    'IIIIIIII',
    'IIIIIIII',
    'iIIIIIIi'
  ],
  volcanoFloor: [
    'HHHHHHHH',
    'HhHHHHHH',
    'HHHHhHHH',
    'HHHHHHHH',
    'HHhHHHHH',
    'HHHHHHHH',
    'HHHHHHhH',
    'HHHHHHHH'
  ],
  volcanoWall: [
    'aAAAAAAa',
    'AAAAAAAA',
    'AAAAAAAA',
    'AAAAAAAA',
    'AAAAAAAA',
    'AAAAAAAA',
    'AAAAAAAA',
    'aAAAAAAa'
  ]
};

const cache: Record<string, HTMLCanvasElement> = {};

export function getSprite(name: string, scale: number = 4): HTMLCanvasElement {
  const key = `${name}_${scale}`;
  if (cache[key]) return cache[key];

  const ascii = ASCII_SPRITES[name];
  if (!ascii) throw new Error(`Sprite ${name} not found`);

  const canvas = document.createElement('canvas');
  const size = ascii.length;
  canvas.width = size * scale;
  canvas.height = size * scale;
  const ctx = canvas.getContext('2d')!;

  const getColor = (x: number, y: number) => {
    if (y < 0 || y >= size || x < 0 || x >= size) return 'transparent';
    const char = ascii[y][x];
    return PALETTE[char] || 'transparent';
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const color = getColor(x, y);
      if (color !== 'transparent') {
        ctx.fillStyle = color;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }

  // Add a subtle inner shadow/glow to the whole sprite for polish
  ctx.globalCompositeOperation = 'source-atop';
  const gradient = ctx.createLinearGradient(0, 0, 0, size * scale);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size * scale, size * scale);
  ctx.globalCompositeOperation = 'source-over';

  cache[key] = canvas;
  return canvas;
}

export function getSpriteDataURL(name: string, scale: number = 8): string {
  return getSprite(name, scale).toDataURL();
}

// news-image-20261118 — "The World Today": one image summing up Wednesday 18 November 2026.
// Drawn 100% programmatically (own PNG encoder + own 5x7 bitmap font). No network,
// no randomness, no timestamps — running twice produces byte-identical output.
import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";

const W = 1024;
const H = 1024;

// ---------------------------------------------------------------- palette ---
const PAPER = [246, 241, 231];
const NAVY = [20, 33, 61];
const NAVY2 = [31, 48, 84];
const RED = [185, 28, 28];
const GOLD = [217, 164, 65];
const INK = [31, 41, 55];
const GRAY = [107, 114, 128];
const WHITE = [255, 255, 255];
const CARD_BORDER = [216, 210, 196];
const TEAL = [13, 110, 96];
const GREEN = [34, 120, 60];
const BLUE = [30, 90, 160];
const ORANGE = [200, 90, 20];

type RGB = [number, number, number];

// ------------------------------------------------------------- 5x7 font -----
// Every glyph is 7 rows x 5 cols, '#' = ink. All text is upper-case ASCII.
const FONT: Record<string, string[]> = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".####", "#....", "#....", "#.###", "#...#", "#...#", ".###."],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: [".###.", "..#..", "..#..", "..#..", "..#..", "..#..", ".###."],
  J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "##..#", "#.#.#", "#..##", "#..##", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  "0": [".###.", "#..##", "#.#.#", "##..#", "#...#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": [".###.", "#....", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "..#..", "..#..", ".#...", ".#..."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "....#", ".###."],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
  ".": [".....", ".....", ".....", ".....", ".....", ".##..", ".##.."],
  ",": [".....", ".....", ".....", ".....", ".##..", ".##..", ".#..."],
  ":": [".....", ".##..", ".##..", ".....", ".##..", ".##..", "....."],
  ";": [".....", ".##..", ".##..", ".....", ".##..", ".##..", ".#..."],
  "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."],
  "?": [".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#.."],
  "-": [".....", ".....", ".....", ".###.", ".....", ".....", "....."],
  "(": ["...#.", "..#..", ".#...", ".#...", ".#...", "..#..", "...#."],
  ")": [".#...", "..#..", "...#.", "...#.", "...#.", "..#..", ".#..."],
  "/": ["....#", "...#.", "...#.", "..#..", ".#...", ".#...", "#...."],
  "%": ["##..#", "##.#.", "...#.", "..#..", ".#...", "#.##.", "#..##"],
  $: ["..#..", ".####", "#.#..", ".###.", "..#.#", "####.", "..#.."],
  "&": [".##..", "#..#.", "#..#.", ".#...", "#.#.#", "#..#.", ".##.#"],
  "+": [".....", "..#..", "..#..", ".###.", "..#..", "..#..", "....."],
  "=": [".....", ".....", ".###.", ".....", ".###.", ".....", "....."],
};

// --------------------------------------------------------------- canvas -----
class Canvas {
  data = new Uint8Array(W * H * 3);
  set(x: number, y: number, c: RGB): void {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 3;
    this.data[i] = c[0];
    this.data[i + 1] = c[1];
    this.data[i + 2] = c[2];
  }
  fillRect(x: number, y: number, w: number, h: number, c: RGB): void {
    for (let j = y; j < y + h; j++)
      for (let i = x; i < x + w; i++) this.set(i, j, c);
  }
  rect(x: number, y: number, w: number, h: number, c: RGB, t = 1): void {
    this.fillRect(x, y, w, t, c);
    this.fillRect(x, y + h - t, w, t, c);
    this.fillRect(x, y, t, h, c);
    this.fillRect(x + w - t, y, t, h, c);
  }
  line(x0: number, y0: number, x1: number, y1: number, c: RGB, t = 1): void {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    let x = x0;
    let y = y0;
    for (;;) {
      this.fillRect(x - ((t / 2) | 0), y - ((t / 2) | 0), t, t, c);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  }
  // Scanline fill of a simple polygon (points as [x, y]).
  fillPoly(pts: [number, number][], c: RGB): void {
    let minY = Infinity;
    let maxY = -Infinity;
    for (const [, y] of pts) {
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    for (let y = Math.ceil(minY); y <= Math.floor(maxY); y++) {
      const xs: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const [x0, y0] = pts[i];
        const [x1, y1] = pts[(i + 1) % pts.length];
        if ((y0 <= y && y1 > y) || (y1 <= y && y0 > y)) {
          xs.push(x0 + ((y - y0) * (x1 - x0)) / (y1 - y0));
        }
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        for (let x = Math.ceil(xs[k]); x <= Math.floor(xs[k + 1]); x++)
          this.set(x, y, c);
      }
    }
  }
  fillCircle(cx: number, cy: number, r: number, c: RGB): void {
    for (let y = -r; y <= r; y++) {
      const half = Math.floor(Math.sqrt(r * r - y * y));
      for (let x = -half; x <= half; x++) this.set(cx + x, cy + y, c);
    }
  }
  circle(cx: number, cy: number, r: number, c: RGB, t = 2): void {
    for (let a = 0; a < 360; a += 2) {
      const rad = (a * Math.PI) / 180;
      const x = Math.round(cx + r * Math.cos(rad));
      const y = Math.round(cy + r * Math.sin(rad));
      this.fillRect(x - ((t / 2) | 0), y - ((t / 2) | 0), t, t, c);
    }
  }
}

// ------------------------------------------------------------ PNG encode ----
const CRC_TABLE: number[] = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t.push(c >>> 0);
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}

function encodePNG(cv: Canvas): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter: none
    raw.set(cv.data.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------------------ text ----
function textWidth(s: string, scale: number): number {
  if (s.length === 0) return 0;
  return s.length * 6 * scale - scale;
}

function drawGlyph(cv: Canvas, ch: string, x: number, y: number, scale: number, c: RGB): void {
  const g = FONT[ch];
  if (!g) return;
  for (let r = 0; r < 7; r++)
    for (let col = 0; col < 5; col++)
      if (g[r][col] === "#") cv.fillRect(x + col * scale, y + r * scale, scale, scale, c);
}

function drawText(cv: Canvas, s: string, x: number, y: number, scale: number, c: RGB): void {
  let cx = x;
  for (const ch of s) {
    drawGlyph(cv, ch, cx, y, scale, c);
    cx += 6 * scale;
  }
}

function drawTextCentered(cv: Canvas, s: string, cx: number, y: number, scale: number, c: RGB): void {
  drawText(cv, s, cx - Math.floor(textWidth(s, scale) / 2), y, scale, c);
}

// Greedy word wrap; returns lines that fit maxWidth px.
function wrapText(s: string, maxWidth: number, scale: number): string[] {
  const words = s.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const trial = cur ? cur + " " + w : w;
    if (textWidth(trial, scale) <= maxWidth) {
      cur = trial;
    } else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// ----------------------------------------------------------------- icons ----
// Each icon is drawn inside a band (bx, by, bw, bh); cx = band centre.
function iconShip(cv: Canvas, bx: number, by: number, bw: number, bh: number): void {
  const cx = bx + bw / 2;
  const cy = by + bh / 2;
  // containers
  cv.fillRect(cx - 52, cy - 26, 30, 18, RED);
  cv.fillRect(cx - 20, cy - 26, 30, 18, GOLD);
  cv.fillRect(cx + 12, cy - 26, 30, 18, NAVY2);
  cv.fillRect(cx - 36, cy - 40, 26, 14, TEAL);
  cv.fillRect(cx - 8, cy - 40, 26, 14, ORANGE);
  // funnel
  cv.fillRect(cx + 44, cy - 34, 10, 26, INK);
  // hull
  cv.fillPoly(
    [
      [cx - 66, cy - 8],
      [cx + 66, cy - 8],
      [cx + 52, cy + 14],
      [cx - 52, cy + 14],
    ],
    NAVY,
  );
  // waves
  cv.line(cx - 70, cy + 22, cx - 30, cy + 22, BLUE, 3);
  cv.line(cx - 18, cy + 22, cx + 22, cy + 22, BLUE, 3);
  cv.line(cx + 34, cy + 22, cx + 70, cy + 22, BLUE, 3);
  cv.line(cx - 58, cy + 30, cx + 58, cy + 30, BLUE, 2);
}

function iconGlobe(cv: Canvas, bx: number, by: number, bw: number, bh: number): void {
  const cx = bx + bw / 2;
  const cy = by + bh / 2;
  const r = 30;
  cv.fillCircle(cx, cy, r, [173, 216, 230]);
  cv.circle(cx, cy, r, NAVY, 3);
  // meridians (vertical ellipses approximated by polylines)
  for (const rx of [11, 22]) {
    const pts: [number, number][] = [];
    for (let a = 0; a <= 360; a += 15) {
      const rad = (a * Math.PI) / 180;
      pts.push([Math.round(cx + rx * Math.cos(rad)), Math.round(cy + r * Math.sin(rad))]);
    }
    for (let i = 0; i + 1 < pts.length; i++) cv.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], NAVY, 2);
  }
  // equator + tropics
  cv.line(cx - r, cy, cx + r, cy, NAVY, 2);
  cv.line(cx - 26, cy - 15, cx + 26, cy - 15, NAVY, 2);
  cv.line(cx - 26, cy + 15, cx + 26, cy + 15, NAVY, 2);
  // land blobs (simple green polygons)
  cv.fillPoly(
    [
      [cx - 18, cy - 8],
      [cx - 4, cy - 16],
      [cx + 4, cy - 6],
      [cx - 6, cy + 2],
      [cx - 16, cy + 2],
    ],
    GREEN,
  );
  cv.fillPoly(
    [
      [cx + 6, cy + 6],
      [cx + 18, cy + 2],
      [cx + 20, cy + 14],
      [cx + 8, cy + 18],
    ],
    GREEN,
  );
}

function iconBridge(cv: Canvas, bx: number, by: number, bw: number, bh: number): void {
  const cx = bx + bw / 2;
  const cy = by + bh / 2;
  // water
  cv.line(cx - 70, cy + 24, cx + 70, cy + 24, BLUE, 3);
  cv.line(cx - 60, cy + 30, cx + 60, cy + 30, BLUE, 2);
  // towers
  cv.fillRect(cx - 46, cy - 26, 6, 44, NAVY);
  cv.fillRect(cx + 40, cy - 26, 6, 44, NAVY);
  cv.fillRect(cx - 52, cy - 30, 18, 5, NAVY);
  cv.fillRect(cx + 34, cy - 30, 18, 5, NAVY);
  // deck
  cv.fillRect(cx - 70, cy + 12, 140, 6, INK);
  // arch between towers
  const pts: [number, number][] = [];
  for (let t = 0; t <= 20; t++) {
    const x = cx - 40 + (80 * t) / 20;
    const y = cy + 12 - Math.round(22 * Math.sin((Math.PI * t) / 20));
    pts.push([x, y]);
  }
  for (let i = 0; i + 1 < pts.length; i++) cv.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], RED, 3);
  // cables
  cv.line(cx - 43, cy - 26, cx - 40, cy + 12, NAVY, 2);
  cv.line(cx + 43, cy - 26, cx + 40, cy + 12, NAVY, 2);
  cv.line(cx - 43, cy - 26, cx, cy - 10, NAVY, 2);
  cv.line(cx + 43, cy - 26, cx, cy - 10, NAVY, 2);
  // blast mark on deck (red starburst)
  cv.fillPoly(
    [
      [cx, cy - 2],
      [cx + 4, cy + 6],
      [cx + 12, cy + 6],
      [cx + 6, cy + 12],
      [cx + 8, cy + 20],
      [cx, cy + 15],
      [cx - 8, cy + 20],
      [cx - 6, cy + 12],
      [cx - 12, cy + 6],
      [cx - 4, cy + 6],
    ],
    RED,
  );
}

function iconChip(cv: Canvas, bx: number, by: number, bw: number, bh: number): void {
  const cx = bx + bw / 2 - 18;
  const cy = by + bh / 2;
  // pins
  for (let i = -1; i <= 1; i++) {
    cv.fillRect(cx - 26, cy + i * 14 - 2, 8, 4, INK);
    cv.fillRect(cx + 18, cy + i * 14 - 2, 8, 4, INK);
    cv.fillRect(cx + i * 14 - 2, cy - 26, 4, 8, INK);
    cv.fillRect(cx + i * 14 - 2, cy + 18, 4, 8, INK);
  }
  // chip body
  cv.fillRect(cx - 18, cy - 18, 36, 36, NAVY);
  cv.rect(cx - 18, cy - 18, 36, 36, GOLD, 2);
  cv.fillRect(cx - 9, cy - 9, 18, 18, TEAL);
  cv.rect(cx - 9, cy - 9, 18, 18, WHITE, 2);
  // rising chart arrow to the right
  const ax = bx + bw / 2 + 22;
  cv.line(ax, cy + 16, ax + 14, cy + 2, GREEN, 4);
  cv.line(ax + 14, cy + 2, ax + 28, cy + 8, GREEN, 4);
  cv.line(ax + 28, cy + 8, ax + 44, cy - 14, GREEN, 4);
  cv.fillPoly(
    [
      [ax + 44, cy - 14],
      [ax + 32, cy - 16],
      [ax + 42, cy - 2],
    ],
    GREEN,
  );
}

function iconLeaf(cv: Canvas, bx: number, by: number, bw: number, bh: number): void {
  const cx = bx + bw / 2;
  const cy = by + bh / 2;
  // sun (clear of the leaf tip)
  cv.fillCircle(cx + 46, cy - 24, 8, GOLD);
  cv.circle(cx + 46, cy - 24, 8, ORANGE, 2);
  // leaf: pointed oval via two arcs
  const top: [number, number][] = [];
  const bot: [number, number][] = [];
  for (let t = 0; t <= 20; t++) {
    const x = cx - 34 + (68 * t) / 20;
    const yTop = cy - 4 - Math.round(20 * Math.sin((Math.PI * t) / 20));
    const yBot = cy - 4 + Math.round(14 * Math.sin((Math.PI * t) / 20));
    top.push([x, yTop]);
    bot.push([x, yBot]);
  }
  const leaf: [number, number][] = [...top, ...bot.reverse()];
  cv.fillPoly(leaf, GREEN);
  // vein + stem
  cv.line(cx - 30, cy - 4, cx + 32, cy - 4, [220, 240, 220], 2);
  cv.line(cx + 34, cy - 4, cx + 46, cy + 12, GREEN, 3);
}

function iconRocket(cv: Canvas, bx: number, by: number, bw: number, bh: number): void {
  const cx = bx + bw / 2;
  const cy = by + bh / 2;
  // flame
  cv.fillPoly(
    [
      [cx - 8, cy + 14],
      [cx + 8, cy + 14],
      [cx, cy + 34],
    ],
    ORANGE,
  );
  cv.fillPoly(
    [
      [cx - 4, cy + 14],
      [cx + 4, cy + 14],
      [cx, cy + 26],
    ],
    GOLD,
  );
  // fins
  cv.fillPoly(
    [
      [cx - 12, cy - 2],
      [cx - 12, cy + 16],
      [cx - 24, cy + 20],
      [cx - 12, cy + 6],
    ],
    RED,
  );
  cv.fillPoly(
    [
      [cx + 12, cy - 2],
      [cx + 12, cy + 16],
      [cx + 24, cy + 20],
      [cx + 12, cy + 6],
    ],
    RED,
  );
  // body
  cv.fillRect(cx - 12, cy - 22, 24, 38, NAVY);
  // nose
  cv.fillPoly(
    [
      [cx - 12, cy - 22],
      [cx + 12, cy - 22],
      [cx, cy - 38],
    ],
    RED,
  );
  // window
  cv.fillCircle(cx, cy - 8, 6, [173, 216, 230]);
  cv.circle(cx, cy - 8, 6, WHITE, 2);
  // motion lines
  cv.line(cx - 40, cy - 18, cx - 28, cy - 18, GRAY, 2);
  cv.line(cx + 28, cy - 26, cx + 40, cy - 26, GRAY, 2);
  cv.line(cx - 44, cy + 2, cx - 32, cy + 2, GRAY, 2);
}

// ------------------------------------------------------------------ data ----
// Six stories of Wednesday 18 November 2026, verified from news sources the
// same day (Reuters/Al Jazeera roundup, Le Monde, TechCrunch, AJP, Munich Eye).
interface Story {
  tag: string;
  tagColor: RGB;
  tint: RGB;
  headline: string;
  body: string;
  icon: (cv: Canvas, bx: number, by: number, bw: number, bh: number) => void;
}

const STORIES: Story[] = [
  {
    tag: "MIDDLE EAST",
    tagColor: RED,
    tint: [227, 237, 247],
    headline: "US SINKS FIVE IRANIAN TANKERS",
    body: "IRAN HIT SHIPS NEAR HORMUZ AND A US BASE IN JORDAN.",
    icon: iconShip,
  },
  {
    tag: "ASIA - DIPLOMACY",
    tagColor: NAVY2,
    tint: [243, 232, 211],
    headline: "XI HOSTS TRUMP AND PUTIN AT APEC",
    body: "XI WELCOMED LEADERS TO SHENZHEN AS TRUMP FLEW IN FROM MANILA.",
    icon: iconGlobe,
  },
  {
    tag: "EUROPE - WAR",
    tagColor: RED,
    tint: [232, 228, 242],
    headline: "UKRAINE HITS KERCH BRIDGE AGAIN",
    body: "KYIV STRUCK THE CRIMEA BRIDGE A SECOND NIGHT AS RUSSIA HIT BACK.",
    icon: iconBridge,
  },
  {
    tag: "TECH - MARKETS",
    tagColor: TEAL,
    tint: [221, 240, 228],
    headline: "NVIDIA REVENUE DOUBLES TO $115.8B",
    body: "AI CHIP SALES JUMPED 103% IN FIRST RESULTS SINCE HUANG QUIT AS CEO.",
    icon: iconChip,
  },
  {
    tag: "CLIMATE",
    tagColor: GREEN,
    tint: [224, 242, 236],
    headline: "COP31 TALKS ENTER DECISIVE PHASE",
    body: "ANTALYA TALKS FACED 144 DISPUTED ITEMS WITH THE SUMMIT DUE TO END FRIDAY.",
    icon: iconLeaf,
  },
  {
    tag: "ASIA - SECURITY",
    tagColor: ORANGE,
    tint: [253, 235, 208],
    headline: "NORTH KOREA FIRES MISSILE TO SEA",
    body: "PYONGYANG FIRED A BALLISTIC MISSILE INTO THE SEA OF JAPAN.",
    icon: iconRocket,
  },
];

// --------------------------------------------------------------- layout -----
function drawCard(cv: Canvas, s: Story, x: number, y: number, w: number, h: number): void {
  cv.fillRect(x, y, w, h, WHITE);
  cv.rect(x, y, w, h, CARD_BORDER, 2);
  // top colour stripe
  cv.fillRect(x, y, w, 6, s.tagColor);
  // icon band
  cv.fillRect(x + 2, y + 6, w - 4, 68, s.tint);
  s.icon(cv, x + 2, y + 6, w - 4, 68);
  // tag
  drawText(cv, s.tag, x + 16, y + 82, 2, s.tagColor);
  // headline (max 2 lines, scale 4)
  const headLines = wrapText(s.headline, w - 32, 4);
  if (headLines.length > 2) throw new Error(`Headline too long: ${s.headline}`);
  let hy = y + 102;
  for (const ln of headLines) {
    drawText(cv, ln, x + 16, hy, 4, INK);
    hy += 32;
  }
  // body (max 3 lines, scale 3)
  const bodyLines = wrapText(s.body, w - 32, 3);
  if (bodyLines.length > 3) throw new Error(`Body too long: ${s.body}`);
  let by = y + 170;
  for (const ln of bodyLines) {
    drawText(cv, ln, x + 16, by, 3, [70, 78, 90]);
    by += 25;
  }
}

function build(): Buffer {
  const cv = new Canvas();
  cv.fillRect(0, 0, W, H, PAPER);

  // ---- masthead ----
  cv.fillRect(0, 0, W, 168, NAVY);
  cv.fillRect(24, 10, W - 48, 3, GOLD);
  drawTextCentered(cv, "THE WORLD TODAY", W / 2, 26, 7, WHITE);
  drawTextCentered(cv, "WEDNESDAY 18 NOVEMBER 2026", W / 2, 90, 4, GOLD);
  drawTextCentered(cv, "SIX STORIES THAT DEFINED THE DAY", W / 2, 130, 2, [200, 205, 215]);
  cv.fillRect(24, 156, W - 48, 3, GOLD);

  // ---- grid: 2 cols x 3 rows ----
  const margin = 24;
  const gap = 16;
  const cardW = (W - margin * 2 - gap) / 2;
  const cardH = 250;
  const top = 184;
  STORIES.forEach((s, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    drawCard(cv, s, margin + col * (cardW + gap), top + row * (cardH + gap), cardW, cardH);
  });

  // ---- footer ----
  drawTextCentered(
    cv,
    "SOURCES: REUTERS - AL JAZEERA - LE MONDE - TECHCRUNCH - AJP - SOUTH KOREA JCS",
    W / 2,
    984,
    2,
    GRAY,
  );

  return encodePNG(cv);
}

function main(): void {
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, "entry.png");
  fs.writeFileSync(out, build());
  console.log(`wrote ${out}`);
}

main();

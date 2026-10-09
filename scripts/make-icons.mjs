// Draws the app icons as PNGs with no dependencies: node scripts/make-icons.mjs
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, rgba) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0)),
  ]);
}

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), 255];
const BLUE = hex("#2449d8"), PAPER = hex("#ffffff"), RED = hex("#cf2f3d"), INK = hex("#1d2230"), RULE = hex("#d6dae3");

// Signed-distance helpers in unit space (0..1).
const rrect = (x, y, cx, cy, hw, hh, r) => {
  const qx = Math.abs(x - cx) - hw + r, qy = Math.abs(y - cy) - hh + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
};
const segment = (x, y, ax, ay, bx, by) => {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(ax + t * dx - x, ay + t * dy - y);
};
// A handwritten-looking squiggle as a polyline.
const squiggle = [];
for (let i = 0; i <= 40; i++) {
  const t = i / 40;
  squiggle.push([0.36 + t * 0.32, 0.64 + Math.sin(t * Math.PI * 3) * 0.035 - t * 0.02]);
}

function shade(x, y, maskable) {
  // layers bottom to top: [colour, signed distance]
  const s = maskable ? 0.8 : 1; // keep content in the maskable safe zone
  const ux = (x - 0.5) / s + 0.5, uy = (y - 0.5) / s + 0.5;
  const layers = [];
  layers.push([BLUE, maskable ? -1 : rrect(x, y, 0.5, 0.5, 0.46, 0.46, 0.2)]);
  layers.push([PAPER, rrect(ux, uy, 0.5, 0.54, 0.29, 0.27, 0.05)]);
  // red header band clipped to the sheet
  layers.push([RED, Math.max(rrect(ux, uy, 0.5, 0.54, 0.29, 0.27, 0.05), uy - 0.38)]);
  // ring tabs
  layers.push([INK, rrect(ux, uy, 0.38, 0.27, 0.022, 0.06, 0.02)]);
  layers.push([INK, rrect(ux, uy, 0.62, 0.27, 0.022, 0.06, 0.02)]);
  // faint rule
  layers.push([RULE, segment(ux, uy, 0.3, 0.5, 0.7, 0.5) - 0.008]);
  // ink squiggle
  let d = Infinity;
  for (let i = 1; i < squiggle.length; i++) d = Math.min(d, segment(ux, uy, ...squiggle[i - 1], ...squiggle[i]));
  layers.push([INK, d - 0.022]);
  return layers;
}

function render(size, maskable) {
  const out = Buffer.alloc(size * size * 4);
  const SS = 4;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const x = (px + (sx + 0.5) / SS) / size, y = (py + (sy + 0.5) / SS) / size;
        let col = [0, 0, 0, 0];
        for (const [c, dist] of shade(x, y, maskable)) if (dist <= 0) col = c;
        r += col[0] * col[3]; g += col[1] * col[3]; b += col[2] * col[3]; a += col[3];
      }
      const i = (py * size + px) * 4;
      if (a > 0) { out[i] = r / a; out[i + 1] = g / a; out[i + 2] = b / a; }
      out[i + 3] = a / (SS * SS);
    }
  }
  return png(size, out);
}

const dir = new URL("../icons/", import.meta.url);
for (const size of [192, 512]) writeFileSync(new URL(`icon-${size}.png`, dir), render(size, false));
writeFileSync(new URL("maskable-512.png", dir), render(512, true));
writeFileSync(new URL("apple-touch-icon.png", dir), render(180, true));
console.log("icons written");

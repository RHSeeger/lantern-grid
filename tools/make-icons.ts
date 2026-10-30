import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { deflateSync } from 'node:zlib';
import type { IconShape } from './types/IconShape';

/**
 * Draws the app icons (a 3 x 3 grid of squares with a lit path, on dark blue) into src/static/icons/, as PNGs and an
 * SVG.
 *
 *   npm run build:icons
 *
 * No packages needed: a tiny rasterizer and PNG encoder. The output is committed.
 */

/** Where the icons go */
const ICON_DIR = path.resolve(__dirname, '..', 'src', 'static', 'icons');

/** The background color */
const BACKGROUND = [0x1d, 0x23, 0x40];

/** A dark square */
const DIM = [0x3a, 0x42, 0x6a];

/** A lit square */
const LIT = [0xf4, 0xa5, 0x1c];

/** Which of the 3 x 3 squares are lit (row by row) */
const LIT_SQUARES = [2, 3, 4, 6];

/** The CRC-32 lookup table PNG chunks need */
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
});

/**
 * Works out the icon's shapes, in a 1 x 1 square.
 *
 * @param scale - How big the grid is (maskable icons need it smaller, to stay inside the safe zone)
 * @returns The shapes, drawn in order
 */
function shapes(scale: number): IconShape[] {
    const cell = 0.2 * scale;
    const gap = 0.04 * scale;
    const start = 0.5 - (3 * cell + 2 * gap) / 2;
    return Array.from({ length: 9 }, (_, i) => ({
        color: LIT_SQUARES.includes(i) ? LIT : DIM,
        x: start + (i % 3) * (cell + gap),
        y: start + Math.floor(i / 3) * (cell + gap),
        w: cell,
        h: cell,
        r: cell * 0.2,
    }));
}

/**
 * Checks whether a point is inside a rounded rectangle.
 *
 * @param s - The shape
 * @param x - The point's x
 * @param y - The point's y
 * @returns True if it is inside
 */
function inside(s: IconShape, x: number, y: number): boolean {
    if (x < s.x || x > s.x + s.w || y < s.y || y > s.y + s.h) return false;
    const cx = Math.min(Math.max(x, s.x + s.r), s.x + s.w - s.r);
    const cy = Math.min(Math.max(y, s.y + s.r), s.y + s.h - s.r);
    return Math.hypot(x - cx, y - cy) <= s.r;
}

/**
 * Calculates a CRC-32.
 *
 * @param buf - The bytes
 * @returns The CRC
 */
function crc32(buf: Buffer): number {
    let c = 0xffffffff;
    for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
}

/**
 * Makes a PNG chunk.
 *
 * @param type - The chunk type (4 letters)
 * @param data - The chunk's data
 * @returns The chunk's bytes
 */
function chunk(type: string, data: Buffer): Buffer {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
}

/**
 * Encodes an image as a PNG.
 *
 * @param w - Width in pixels
 * @param h - Height in pixels
 * @param rgba - The pixels, 4 bytes each (red, green, blue, alpha), row by row
 * @returns The PNG file's bytes
 */
function encodePng(w: number, h: number, rgba: Buffer): Buffer {
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(w, 0);
    ihdr.writeUInt32BE(h, 4);
    ihdr[8] = 8; // bits per channel
    ihdr[9] = 6; // RGBA
    const raw = Buffer.alloc((w * 4 + 1) * h);
    for (let y = 0; y < h; y++) {
        raw[y * (w * 4 + 1)] = 0; // no filter
        rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
    }
    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk('IHDR', ihdr),
        chunk('IDAT', deflateSync(raw, { level: 9 })),
        chunk('IEND', Buffer.alloc(0)),
    ]);
}

/**
 * Draws the icon (4 x 4 samples per pixel, for smooth edges).
 *
 * @param size - Width and height in pixels
 * @param scale - How big the grid is
 * @returns The PNG file's bytes
 */
function render(size: number, scale = 1): Buffer {
    const list = shapes(scale);
    const px = Buffer.alloc(size * size * 4);
    const SS = 4;
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const sum = [0, 0, 0];
            for (let sy = 0; sy < SS; sy++) {
                for (let sx = 0; sx < SS; sx++) {
                    const u = (x + (sx + 0.5) / SS) / size;
                    const v = (y + (sy + 0.5) / SS) / size;
                    const col = list.find((s) => inside(s, u, v))?.color ?? BACKGROUND;
                    for (let k = 0; k < 3; k++) sum[k] += col[k];
                }
            }
            const i = (y * size + x) * 4;
            for (let k = 0; k < 3; k++) px[i + k] = sum[k] / (SS * SS);
            px[i + 3] = 255;
        }
    }
    return encodePng(size, size, px);
}

/**
 * Draws the icon as an SVG (with rounded corners, for browser tabs).
 *
 * @returns The SVG markup
 */
function toSvg(): string {
    const hex = (c: number[]): string => `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
    const f = (n: number): string => (n * 100).toFixed(2);
    const rects = shapes(1).map(
        (s) =>
            `<rect fill="${hex(s.color)}" x="${f(s.x)}" y="${f(s.y)}" width="${f(s.w)}" height="${f(s.h)}" rx="${f(s.r)}"/>`,
    );
    return (
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="18" ` +
        `fill="${hex(BACKGROUND)}"/>${rects.join('')}</svg>\n`
    );
}

/**
 * Writes all the icons.
 */
export async function main(): Promise<void> {
    await mkdir(ICON_DIR, { recursive: true });
    await writeFile(path.join(ICON_DIR, 'icon-192.png'), render(192));
    await writeFile(path.join(ICON_DIR, 'icon-512.png'), render(512));
    await writeFile(path.join(ICON_DIR, 'maskable-512.png'), render(512, 0.75));
    await writeFile(path.join(ICON_DIR, 'apple-touch-icon.png'), render(180));
    await writeFile(path.join(ICON_DIR, 'icon.svg'), toSvg());
    console.log(`Icons written to ${ICON_DIR}`);
}

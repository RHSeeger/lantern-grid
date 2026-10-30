import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';

/**
 * Reading SCOWL (Spell Checker Oriented Word Lists, http://wordlist.aspell.net/), the source of the word list: finding
 * or downloading the release, reading words up to a size, and the blocklist. Used by the build tools.
 */

/** The SCOWL release used */
export const SCOWL_VERSION = '2020.12.07';

/** Where to download it */
const SCOWL_URL = `https://sourceforge.net/projects/wordlist/files/SCOWL/${SCOWL_VERSION}/scowl-${SCOWL_VERSION}.tar.gz/download`;

/** SCOWL's size levels (bigger includes rarer words) */
const LEVELS = [10, 20, 35, 40, 50, 55, 60, 70, 80, 95];

/** The SCOWL word files used: words common to all English, and American-only words */
const CATEGORIES = ['english-words', 'american-words'];

/**
 * Reads the blocklist file.
 *
 * @param text - The file: one word per line; '#' starts a comment
 * @returns The blocked words, lowercase
 */
export function parseBlocklist(text: string): Set<string> {
    return new Set(
        text
            .split(/\r?\n/)
            .map((l) => l.replace(/#.*/, '').trim().toLowerCase())
            .filter(Boolean),
    );
}

/**
 * Reads the regular files out of a tar archive.
 *
 * @param buf - The (uncompressed) archive
 * @returns Each file's path and contents
 */
function tarEntries(buf: Buffer): { name: string; data: Buffer }[] {
    const out: { name: string; data: Buffer }[] = [];
    let off = 0;
    let longName: string | null = null;
    while (off + 512 <= buf.length) {
        const header = buf.subarray(off, off + 512);
        if (header.every((b) => b === 0)) break;
        const str = (a: number, b: number): string => header.subarray(a, b).toString('latin1').replace(/\0.*$/s, '');
        let name = str(0, 100);
        const prefix = str(345, 500);
        if (prefix) name = `${prefix}/${name}`;
        const size = parseInt(str(124, 136).trim() || '0', 8);
        const type = String.fromCharCode(header[156] || 48);
        const data = buf.subarray(off + 512, off + 512 + size);
        off += 512 + Math.ceil(size / 512) * 512;
        if (type === 'L') {
            longName = data.toString('latin1').replace(/\0.*$/s, '');
            continue;
        }
        if (longName) {
            name = longName;
            longName = null;
        }
        if (type === '0' || type === '\0') out.push({ name, data });
    }
    return out;
}

/**
 * Finds the SCOWL tarball, downloading it into tools/.cache/ the first time.
 *
 * @param root - The project's root directory
 * @param argPath - A path given with --scowl, if any
 * @returns Where it is
 */
async function ensureTarball(root: string, argPath: string | undefined): Promise<string> {
    if (argPath) return argPath;
    const cacheDir = path.join(root, 'tools', '.cache');
    const file = path.join(cacheDir, `scowl-${SCOWL_VERSION}.tar.gz`);
    try {
        await access(file);
        return file;
    } catch {
        /* not downloaded yet */
    }
    await mkdir(cacheDir, { recursive: true });
    console.log(`Downloading SCOWL ${SCOWL_VERSION}...`);
    const res = await fetch(SCOWL_URL, { headers: { 'User-Agent': 'Wget/1.21' }, redirect: 'follow' });
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) {
        throw new Error('Download was not a gzip file; pass --scowl <path> instead.');
    }
    await writeFile(file, bytes);
    return file;
}

/**
 * Loads SCOWL: finds (or downloads) the release and reads its files.
 *
 * @param root - The project's root directory
 * @param argPath - A path given with --scowl, if any
 * @returns A function that returns the raw words up to a size, and SCOWL's copyright notice
 */
export async function loadScowl(
    root: string,
    argPath: string | undefined,
): Promise<{ wordsUpTo: (size: number) => string[]; copyright: string }> {
    const files = new Map<string, Buffer>();
    for (const { name, data } of tarEntries(gunzipSync(await readFile(await ensureTarball(root, argPath))))) {
        files.set(name.replace(/^[^/]+\//, ''), data);
    }
    const wordsUpTo = (size: number): string[] => {
        const raw: string[] = [];
        for (const cat of CATEGORIES) {
            for (const lvl of LEVELS.filter((l) => l <= size)) {
                const data = files.get(`final/${cat}.${lvl}`);
                if (data)
                    raw.push(
                        ...data
                            .toString('latin1')
                            .split(/\r?\n/)
                            .map((w) => w.trim()),
                    );
            }
        }
        return raw;
    };
    return { wordsUpTo, copyright: files.get('Copyright')?.toString('latin1') ?? '' };
}

/**
 * Returns a command-line option's value.
 *
 * @param name - The option, without the dashes
 * @returns The value after it, or undefined
 */
export function arg(name: string): string | undefined {
    const i = process.argv.indexOf(`--${name}`);
    return i >= 0 ? process.argv[i + 1] : undefined;
}

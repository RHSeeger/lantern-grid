import { APP_NAME, SIZE } from './data/app';
import { FAMILY_PLAY_AVAILABLE } from './data/firebaseConfig';
import { LOGO_SVG } from './data/logo';
import { RANKS } from './data/ranks';
import {
    enterFamily,
    familyDayKey,
    initFamily,
    openFamilyDay,
    openJoinFamily,
    openPlayMode,
    readFamilyDay,
    saveMine,
    setCombined,
    switchToLocal,
} from './familyController';
import { addDays, dayKey, formatLongDate } from './gamelogic/dates';
import { lettersForDay, loadDay, newDay, parsePlayerDay, parsePuzzles, saveDay } from './gamelogic/day';
import { isValidPath, pathKey, spell } from './gamelogic/grid';
import { parseInviteLink } from './gamelogic/invites';
import {
    checkTrace,
    combineFound,
    dimmerLevels,
    listPoints,
    litSquares,
    meterReadings,
    onlyFinderCounts,
    rankIndexFor,
    readSquares,
    squareClue,
    summarize,
} from './gamelogic/play';
import { loadWordlist, solveGrid } from './gamelogic/solver';
import { getJSON, remove, setJSON } from './gamelogic/storage';
import { familyDays, familyName, isCombined, memberInfo, session, shownFound } from './session';
import type { FoundPath } from './types/FoundPath';
import type { InviteLink } from './types/InviteLink';
import type { PlayMode } from './types/PlayMode';
import type { Puzzle } from './types/Puzzle';
import type { ScoreRow } from './types/ScoreRow';
import type { Theme } from './types/Theme';
import { createBoard } from './ui/board';
import { h, icon } from './ui/dom';
import { getElement } from './ui/getElement';
import { showHelp } from './ui/help';
import { isModalOpen, closeModal, openModal } from './ui/modal';
import { renderLights, renderProgress, showRankings } from './ui/progress';
import { showScoreboard } from './ui/scoreboard';
import { showSettings } from './ui/settings';
import { showCelebration, showSplash } from './ui/splash';
import { flashMessage, showToast } from './ui/toast';
import { createWordbox } from './ui/wordbox';
import { showYesterday } from './ui/yesterday';

/**
 * The game: handles the player's tracing, keeps the screen up to date, and plays locally (saved on this device).
 * Family play is in familyController.ts; both share the state in session.ts. Started by startApp(), from index.ts.
 */

/** The messages shown for a rejected word */
const ERRORS = {
    short: 'Too short',
    unknown: 'Not in word list',
    found: 'Already found',
};

/** The board and the found-words box, made by wireUi() */
let board: ReturnType<typeof createBoard>;
let wordbox: ReturnType<typeof createWordbox>;

/** What was shown last time the screen was drawn (-1 before the first), to spot rank-ups and a fully lit grid */
let lastPoints = -1;
let lastLit = -1;

/** Dismisses the clue showing, if any, so that the next one shows straight away */
let dismissClue: (() => void) | null = null;

/** Puzzles already worked out, by day key (finding every word takes a moment) */
const puzzleCache = new Map<string, Puzzle>();

/**
 * Returns whether the game is playing with a family.
 *
 * @returns True in family play
 */
function inFamily(): boolean {
    return session.mode.kind === 'family';
}

/**
 * Returns a day's puzzle, working it out the first time.
 *
 * @param key - The day key
 * @returns The puzzle
 */
function puzzleFor(key: string): Puzzle {
    let p = puzzleCache.get(key);
    if (!p) {
        p = solveGrid(lettersForDay(key, session.puzzleLines), session.wordlist, session.everyday);
        puzzleCache.set(key, p);
    }
    return p;
}

/**
 * Switches to local play for a day: loads its play and puzzle, and redraws.
 *
 * @param key - The day key
 */
function openLocalDay(key: string): void {
    session.todayKey = key;
    session.mine = loadDay(key);
    dayChanged();
}

/**
 * Shows the day's grid and date, and redraws (after the day changes).
 */
function dayChanged(): void {
    session.puzzle = puzzleFor(session.todayKey);
    session.path = [];
    session.clueMode = false;
    lastPoints = -1;
    lastLit = -1;
    board.setLetters(session.puzzle.letters);
    getElement('date').textContent = formatLongDate(session.todayKey);
    renderAll();
}

/**
 * Takes in a new version of the family's day: the player's own play, and (once combined) everyone's.
 *
 * @param first - True when the day has just arrived
 */
function familyDataChanged(first: boolean): void {
    const uid = session.user?.uid;
    session.mine = uid ? parsePlayerDay(session.todayKey, session.family?.data?.[uid]) : newDay(session.todayKey);
    if (first) dayChanged();
    else renderAll();
}

/**
 * Draws the word being traced.
 */
function renderWord(): void {
    const word = spell(session.path, session.puzzle.letters);
    getElement('word-text').textContent = word.toUpperCase();
    getElement('word').classList.toggle('empty', !word);
}

/**
 * Draws the button that says who the player is playing with.
 */
function renderModeChip(): void {
    const chip = getElement('mode-chip');
    const name = familyName();
    chip.replaceChildren(
        h('span', { 'aria-hidden': 'true' }, name ? '👪' : '🙋'),
        h('span', { class: 'mode-name' }, name ?? 'Just me'),
        icon('chevron'),
    );
    chip.classList.toggle('offline', inFamily() && !session.online);
    chip.setAttribute('aria-label', `Playing ${name ? `with ${name}` : 'on your own'}. Change who you play with.`);
}

/**
 * Draws the button that combines everyone's work (or shows only the player's own again), in family play.
 */
function renderCombineChip(): void {
    const chip = getElement('combine-chip');
    chip.hidden = !session.family?.data;
    if (chip.hidden) return;
    if (isCombined()) {
        chip.textContent = 'Show only mine';
        return;
    }
    const mine = new Set(session.mine.found.map((f) => f.w));
    const theirs = new Set(
        Object.entries(familyDays())
            .filter(([uid]) => uid !== session.user?.uid)
            .flatMap(([, d]) => d.found.map((f) => f.w))
            .filter((w) => !mine.has(w) && session.puzzle.list.includes(w)),
    );
    chip.textContent = `Combine our work${theirs.size ? ` (+${theirs.size})` : ''}`;
}

/**
 * Redraws everything that changes during play, and celebrates rank-ups.
 *
 * @param fresh - A word just found, to flash in the list
 */
function renderAll(fresh?: string): void {
    renderModeChip();
    if (!session.puzzle) return;
    renderCombineChip();
    const found = shownFound();
    const combined = isCombined();
    const squares = SIZE * SIZE;
    const total = listPoints(session.puzzle);
    const { lit, cleared, points, spotlights } = summarize(found, session.puzzle);
    renderProgress(getElement('progress'), points, total, combined);
    renderLights(getElement('lights'), spotlights, session.puzzle.spotlights.length, cleared, lit, squares);
    const finder = combined ? (uid: string) => memberInfo(uid).color : null;
    wordbox.render(found, session.puzzle, finder, fresh);
    renderBoard();
    if (lastPoints >= 0 && points > lastPoints) celebrate(lastPoints, points, total, combined);
    if (lastLit >= 0 && lastLit < squares && lit === squares) {
        setTimeout(() => showToast('Every square is lit! Now bring them up to full.'), 500);
    }
    lastPoints = points;
    lastLit = lit;
}

/**
 * Draws the board and the word being traced (all that changes while tracing).
 */
function renderBoard(): void {
    const found = shownFound();
    const squares = SIZE * SIZE;
    let owners: string[][] | null = null;
    if (isCombined()) {
        owners = Array.from({ length: squares }, () => [] as string[]);
        for (const [uid, d] of Object.entries(familyDays())) {
            const color = memberInfo(uid).color;
            for (const sq of litSquares(d.found, session.puzzle)) owners[sq].push(color);
        }
    }
    const { through, starts } = meterReadings(found, session.puzzle);
    board.render({ levels: dimmerLevels(found, session.puzzle), path: session.path, owners, through, starts });
    const bulb = document.getElementById('btn-hints');
    bulb?.classList.toggle('active', session.clueMode);
    bulb?.setAttribute('aria-pressed', String(session.clueMode));
    renderWord();
}

/**
 * Celebrates more points: a celebration for finding the whole List, a short message for a new rank.
 *
 * @param before - The points before
 * @param after - The points now
 * @param total - All the List's points
 * @param team - Whether it is the family's combined board
 */
function celebrate(before: number, after: number, total: number, team: boolean): void {
    const r0 = rankIndexFor(before, total);
    const r1 = rankIndexFor(after, total);
    if (r1 <= r0) return;
    if (after === total) {
        setTimeout(
            () =>
                showCelebration({
                    title: `${RANKS[r1].name}!`,
                    emoji: '🏮',
                    text: team
                        ? 'Together, your family found every word on the List. The whole grid is at full!'
                        : 'You found every word on the List. The whole grid is at full!',
                }),
            700,
        );
    } else {
        const who = team ? 'Your family reached ' : 'You reached ';
        setTimeout(() => showToast(h('span', {}, who, h('b', {}, RANKS[r1].name), '!')), 500);
    }
}

/**
 * Applies the light/dark choice to the page.
 */
function applyTheme(): void {
    if (session.theme === 'auto') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = session.theme;
}

/**
 * Hides the play area and shows a message, with a button to play locally instead.
 *
 * @param text - The message
 */
function showConnecting(text: string): void {
    getElement('connecting-text').textContent = text;
    getElement('connecting').hidden = false;
    document.body.classList.add('connecting');
}

/**
 * Shows the play area again.
 */
function showReady(): void {
    getElement('connecting').hidden = true;
    document.body.classList.remove('connecting');
}

/**
 * Shows why a word was rejected, and shakes it.
 *
 * @param text - The message
 */
function reject(text: string): void {
    flashMessage(text, 'error');
    const el = getElement('word');
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
}

/**
 * Returns the praise for a word.
 *
 * @param word - The word
 * @returns The praise
 */
function praise(word: string): string {
    if (word.length >= 8) return 'Amazing!';
    if (word.length >= 6) return 'Great!';
    if (word.length === 5) return 'Nice!';
    return 'Good!';
}

/**
 * Returns the message for a word that is already found: in combined family play, says who found it.
 *
 * @param word - The word
 * @returns The message
 */
function alreadyFoundMessage(word: string): string {
    const by = shownFound().find((f) => f.w === word)?.by;
    if (!by || by === session.user?.uid) return ERRORS.found;
    return `Already found (by ${memberInfo(by).name})`;
}

/**
 * Submits a traced path: records the word if it counts, and shows how it went.
 *
 * @param path - The squares traced
 */
function submit(path: number[]): void {
    session.path = [];
    if (!session.puzzle || !isValidPath(path)) {
        renderAll();
        return;
    }
    const result = checkTrace(path, session.puzzle, shownFound());
    if (!result.ok) {
        renderAll();
        if (result.error !== 'short' || path.length > 1) {
            reject(result.error === 'found' ? alreadyFoundMessage(result.word) : ERRORS[result.error]);
        }
        return;
    }
    const entry: FoundPath = { w: result.word, p: pathKey(path), at: Date.now() };
    const before = shownFound();
    const after = [...before, entry];
    if (result.onList) {
        const cleared = summarize(after, session.puzzle).cleared - summarize(before, session.puzzle).cleared;
        const text = result.spotlight ? 'Spotlight!' : praise(result.word);
        const big = result.spotlight || result.word.length >= 7;
        flashMessage(`${text}${cleared ? ` ${cleared} cleared!` : ''}`, big ? 'big' : 'praise', result.points);
    } else {
        const readings = readSquares(after, session.puzzle).size - readSquares(before, session.puzzle).size;
        flashMessage(readings ? `Bonus word! ${readings} new readings` : 'Bonus word!', 'praise');
    }
    if (inFamily()) {
        saveMine({ [`found/${entry.p}`]: { w: entry.w, at: entry.at } });
        return;
    }
    session.mine.found.push(entry);
    saveDay(session.mine);
    renderAll(result.word);
}

/**
 * Handles the physical keyboard (for tap-tracing): Enter submits, Backspace takes back a letter, Escape clears.
 *
 * @param e - The key event
 */
function onKey(e: KeyboardEvent): void {
    if (isModalOpen() || e.metaKey || e.ctrlKey || e.altKey) return;
    if (document.body.classList.contains('connecting')) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
    if (e.key === 'Enter') {
        if (t && t.tagName === 'BUTTON') return;
        submit(session.path);
    } else if (e.key === 'Backspace') {
        session.path = session.path.slice(0, -1);
        renderBoard();
    } else if (e.key === 'Escape') {
        session.path = [];
        renderBoard();
    } else return;
    e.preventDefault();
}

/**
 * Shows a clue for a square: how long one of its missing List words is, and how it starts.
 *
 * @param square - The square tapped
 */
function showClue(square: number): void {
    const clue = squareClue(shownFound(), session.puzzle, square);
    dismissClue?.();
    dismissClue = showToast(
        clue
            ? `A ${clue.length}-letter word through here starts ${clue.start.toUpperCase()}.`
            : 'No words left through this square.',
    );
}

/**
 * Turns the bulb on or off: while it's on, tapping a square shows a clue. The first time each day, asks first, and
 * records that clues were used (the family can see it on the Compare screen).
 */
function toggleClues(): void {
    if (session.clueMode) {
        session.clueMode = false;
        renderAll();
        return;
    }
    if (!session.mine.hints) {
        const ok = confirm(
            'Use clues? Tap a square to see how long one of its missing words is, and how it starts.' +
                (inFamily() ? ' Your family will see that you used clues today.' : ''),
        );
        if (!ok) return;
        if (inFamily()) saveMine({ hints: true });
        else {
            session.mine.hints = true;
            saveDay(session.mine);
        }
    }
    session.clueMode = true;
    session.path = [];
    renderAll();
    flashMessage('Tap a square for a clue', 'praise');
}

/**
 * Combines everyone's work (asking first), or shows only the player's own again.
 */
function toggleCombined(): void {
    if (isCombined()) {
        setCombined(false);
        return;
    }
    if (confirm('Combine everyone’s work? You’ll see all the words your family found, and how you did as a team.')) {
        setCombined(true);
    }
}

/**
 * Opens the Compare screen: each family member's results today, and the family's together once combined.
 */
function openCompare(): void {
    if (!inFamily() || !session.family?.data) {
        openModal({
            title: 'Compare',
            content: [
                h('p', {}, 'Compare is for playing with your family: you each play the same grid, then compare.'),
                h(
                    'div',
                    { class: 'button-row' },
                    h(
                        'button',
                        {
                            class: 'pill primary',
                            type: 'button',
                            onclick: () => {
                                closeModal();
                                void openPlayMode();
                            },
                        },
                        'Play with your family',
                    ),
                ),
            ],
        });
        return;
    }
    const combined = isCombined();
    const days = familyDays();
    const puzzle = session.puzzle;
    const total = listPoints(puzzle);
    const shown = Object.entries(days).filter(([uid, d]) => d.found.length || session.family?.members[uid]);
    const only = onlyFinderCounts(
        shown.map(([, d]) => d.found),
        puzzle,
    );
    const rows: ScoreRow[] = shown
        .map(([uid, d], i) => {
            const s = summarize(d.found, puzzle);
            const m = memberInfo(uid);
            return {
                name: m.name,
                color: m.color,
                isMe: uid === session.user?.uid,
                values: [
                    RANKS[rankIndexFor(s.points, total)].name,
                    String(s.points),
                    String(s.words),
                    String(only[i]),
                    `${s.spotlights}/${puzzle.spotlights.length}`,
                    d.hints ? '💡' : '',
                ],
            };
        })
        .sort((a, b) => Number(b.isMe) - Number(a.isMe));
    let team: ScoreRow | null = null;
    if (combined) {
        const all = summarize(combineFound(Object.values(days).map((d) => d.found)), puzzle);
        team = {
            name: 'Together',
            color: '',
            isMe: false,
            values: [
                RANKS[rankIndexFor(all.points, total)].name,
                String(all.points),
                String(all.words),
                '',
                `${all.spotlights}/${puzzle.spotlights.length}`,
                '',
            ],
        };
    }
    showScoreboard({
        familyName: familyName() ?? 'your family',
        columns: ['Rank', 'Points', 'Words', 'Only', '★', 'Clues'],
        rows,
        team,
        combined,
        note: h(
            'p',
            { class: 'muted small' },
            `Today’s List is worth ${total} points. “Only” is the List words nobody else found; ★ is Spotlights.`,
        ),
        onCombine: () => setCombined(true),
        onUncombine: () => setCombined(false),
    });
}

/**
 * Opens Yesterday's Answers (the family's together, in family play).
 */
async function openYesterday(): Promise<void> {
    const key = addDays(session.todayKey, -1);
    const puzzle = puzzleFor(key);
    if (!inFamily()) {
        showYesterday(key, puzzle, loadDay(key).found, null);
        return;
    }
    try {
        const raw = await readFamilyDay(key);
        const found = combineFound(
            Object.entries(raw).map(([uid, v]) => parsePlayerDay(key, v).found.map((f) => ({ ...f, by: uid }))),
        );
        showYesterday(key, puzzle, found, (uid) => memberInfo(uid).color);
    } catch {
        showToast("Couldn't load yesterday's answers.");
    }
}

/**
 * Opens the welcome screen.
 */
function openSplash(): void {
    const s = summarize(session.mine.found, session.puzzle);
    const rank = RANKS[rankIndexFor(s.points, listPoints(session.puzzle))].name;
    showSplash({
        todayKey: session.todayKey,
        familyName: familyName(),
        progress: s.words ? `You're at ${rank}, with ${s.words} of ${session.puzzle.list.length} words.` : null,
        logo: LOGO_SVG,
    });
}

/**
 * Erases local play's saved days.
 */
function eraseLocal(): void {
    for (let i = 0; i < 400; i++) remove(`day:${addDays(dayKey(), -i)}`);
    if (!inFamily()) openLocalDay(dayKey());
    showToast('Your progress on this device was erased. Family play is kept with the family.');
}

/**
 * Reads an invite link in the address's `#`, and removes it straight away (so it isn't used again on reload).
 *
 * @returns The invite, if any
 */
function readHash(): InviteLink | null {
    const join = parseInviteLink(location.hash.slice(1));
    if (join) history.replaceState(null, '', location.pathname + location.search);
    return join;
}

/**
 * Moves to the new day if the date has changed while the game was open (in the family's timezone, in family play).
 */
function checkRollover(): void {
    if (!session.puzzle) return;
    if (inFamily()) {
        if (!session.family?.meta) return;
        const key = familyDayKey();
        if (key === session.todayKey) return;
        closeModal();
        openFamilyDay(key, true);
        return;
    }
    const key = dayKey();
    if (key === session.todayKey) return;
    closeModal();
    openLocalDay(key);
    openSplash();
}

/**
 * Registers the service worker (offline play), and offers a reload when a new version is ready. It is skipped on
 * localhost (so edits show up on reload) unless the address has `?sw`.
 */
function registerServiceWorker(): void {
    if (!('serviceWorker' in navigator)) return;
    if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) && !new URLSearchParams(location.search).has('sw')) {
        navigator.serviceWorker
            .getRegistrations()
            .then((regs) => regs.forEach((r) => r.unregister()))
            .catch(() => {});
        return;
    }
    // Only reload when the player asked for the update; the first install also fires controllerchange (from
    // clients.claim()) and must not reload the page
    let userAskedToUpdate = false;
    navigator.serviceWorker
        .register('sw.js')
        .then((reg) => {
            const promptUpdate = (worker: ServiceWorker): void => {
                showToast('Update available', {
                    duration: 0,
                    action: {
                        label: 'Reload',
                        onClick: () => {
                            userAskedToUpdate = true;
                            worker.postMessage('skipWaiting');
                        },
                    },
                });
            };
            if (reg.waiting && navigator.serviceWorker.controller) promptUpdate(reg.waiting);
            reg.addEventListener('updatefound', () => {
                const w = reg.installing;
                w?.addEventListener('statechange', () => {
                    if (w.state === 'installed' && navigator.serviceWorker.controller) promptUpdate(w);
                });
            });
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) reg.update().catch(() => {});
            });
        })
        .catch(() => {});
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloading || !userAskedToUpdate) return;
        reloading = true;
        location.reload();
    });
}

/**
 * Sets up the buttons, the board, the found-words box and the keyboard.
 */
function wireUi(): void {
    board = createBoard(getElement('board'), {
        onPathChange: (path) => {
            session.path = path;
            renderBoard();
        },
        onSubmit: submit,
        clueMode: () => session.clueMode,
        onClue: showClue,
    });
    wordbox = createWordbox(getElement('wordbox'));
    const toolbar: [string, Parameters<typeof icon>[0], string, () => void][] = [
        ['hints', 'hint', 'Clues', toggleClues],
        ['yesterday', 'yesterday', "Yesterday's answers", () => void openYesterday()],
        ['compare', 'stats', 'Compare with your family', openCompare],
        ['help', 'help', 'How to play', showHelp],
        [
            'menu',
            'settings',
            'Menu',
            () =>
                showSettings({
                    theme: session.theme,
                    onTheme: (t) => {
                        session.theme = t;
                        setJSON('theme', t);
                        applyTheme();
                    },
                    onErase: eraseLocal,
                }),
        ],
    ];
    for (const [id, ic, label, fn] of toolbar) {
        getElement('tools').append(
            h(
                'button',
                { id: `btn-${id}`, class: 'icon-btn', type: 'button', 'aria-label': label, title: label, onclick: fn },
                icon(ic),
            ),
        );
    }
    getElement('btn-clear').addEventListener('click', () => {
        session.path = [];
        renderBoard();
    });
    getElement('btn-enter').addEventListener('click', () => submit(session.path));
    getElement('progress').addEventListener('click', () =>
        showRankings(summarize(shownFound(), session.puzzle).points, listPoints(session.puzzle)),
    );
    getElement('combine-chip').addEventListener('click', toggleCombined);
    getElement('mode-chip').addEventListener('click', () => void openPlayMode());
    getElement('btn-play-local').addEventListener('click', () => switchToLocal('Playing on your own for now.'));
    document.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) checkRollover();
    });
    setInterval(checkRollover, 30000);
    initFamily({
        render: () => renderAll(),
        dataChanged: familyDataChanged,
        showConnecting,
        showReady,
        openSplash,
        openLocal: () => openLocalDay(dayKey()),
        flash: (text) => flashMessage(text, 'error'),
    });
}

/**
 * Starts the game: loads the word list and puzzle list, then opens today's grid (locally, or with the family the
 * player last played with) and shows the welcome screen. An invite link in the address opens the Join screen.
 */
export async function startApp(): Promise<void> {
    document.title = APP_NAME;
    session.theme = getJSON<Theme>('theme', 'auto');
    applyTheme();
    const join = readHash();
    wireUi();
    renderModeChip();
    try {
        const [wordlist, everyday, lines] = await Promise.all([
            loadWordlist('data/words.txt'),
            loadWordlist('data/everyday-words.txt'),
            fetch('data/puzzles.txt').then((r) => {
                if (!r.ok) throw new Error(`Could not load puzzles (${r.status})`);
                return r.text();
            }),
        ]);
        session.wordlist = wordlist;
        session.everyday = everyday.set;
        session.puzzleLines = parsePuzzles(lines);
    } catch (e) {
        getElement('loading').textContent = "Couldn't load the puzzle. Check your connection and reload.";
        console.error(e);
        return;
    }
    getElement('loading').remove();
    document.body.classList.add('ready');
    const savedMode = getJSON<PlayMode>('mode', { kind: 'local' });
    // Local play is opened first either way, so there's always a grid (family play replaces it once connected)
    openLocalDay(dayKey());
    if (savedMode.kind === 'family' && FAMILY_PLAY_AVAILABLE) {
        void enterFamily(savedMode.fid, { splash: !join });
    } else if (!join) openSplash();
    if (join) openJoinFamily(join);
    registerServiceWorker();
}

import { MAX_FAMILY_NAME, MAX_PLAYER_NAME, PLAYER_COLORS } from '../data/family';
import type { AuthUser } from '../types/AuthUser';
import type { FamilyListEntry } from '../types/FamilyListEntry';
import type { FamilyMember } from '../types/FamilyMember';
import type { FamilyMeta } from '../types/FamilyMeta';
import type { PlayerProfile } from '../types/PlayerProfile';
import type { PlayMode } from '../types/PlayMode';
import { h } from './dom';
import { closeModal, openModal } from './modal';
import { showToast } from './toast';

/**
 * The family play screens: choosing who to play with (on your own, or one of your families), creating a family,
 * joining one from an invite link, and a family's members and invite link.
 */

/**
 * Makes the name and color fields for a player.
 *
 * @param initial - The name and color to start with
 * @param idPrefix - Makes the fields' ids unique
 * @returns The fields, and a function that reads them (null, with an error shown, if the name is empty)
 */
function profileFields(
    initial: PlayerProfile,
    idPrefix: string,
): { el: HTMLElement; read: () => PlayerProfile | null; error: HTMLElement } {
    const name = h('input', {
        id: `${idPrefix}-name`,
        class: 'text-input',
        maxlength: String(MAX_PLAYER_NAME),
        autocomplete: 'nickname',
        value: initial.name,
        'data-autofocus': true,
    });
    const colors = h(
        'div',
        { class: 'color-picker' },
        PLAYER_COLORS.map((c) =>
            h(
                'label',
                { class: `player-${c.id}`, title: c.name },
                h('input', {
                    type: 'radio',
                    name: `${idPrefix}-color`,
                    value: c.id,
                    checked: c.id === initial.color,
                    'aria-label': c.name,
                }),
                h('span', { class: 'swatch' }),
            ),
        ),
    );
    const error = h('p', { class: 'form-error', role: 'alert' });
    const el = h(
        'div',
        {},
        h('div', { class: 'field' }, h('label', { for: `${idPrefix}-name` }, 'Your name'), name),
        h('fieldset', { class: 'field' }, h('legend', {}, 'Your color'), colors),
        error,
    );
    return {
        el,
        error,
        read: () => {
            const n = name.value.trim().slice(0, MAX_PLAYER_NAME);
            if (!n) {
                error.textContent = 'Enter your name.';
                name.focus();
                return null;
            }
            const picked = colors.querySelector<HTMLInputElement>('input:checked');
            return { name: n, color: picked?.value ?? PLAYER_COLORS[0].id };
        },
    };
}

/**
 * Runs an action from a button: disables it while it runs, and shows the error if it fails.
 *
 * @param btn - The button
 * @param error - Where to show an error
 * @param action - The action; return a message to show it as the error
 */
function busy(btn: HTMLButtonElement, error: HTMLElement, action: () => Promise<string | void>): void {
    btn.disabled = true;
    error.textContent = '';
    action()
        .then((msg) => {
            if (msg) error.textContent = msg;
        })
        .catch((e: unknown) => {
            error.textContent = e instanceof Error ? e.message : String(e);
        })
        .finally(() => {
            btn.disabled = false;
        });
}

/**
 * Opens the "Who are you playing with?" screen: on your own, one of your families, create or join a family, and
 * signing in with Google.
 *
 * @param options - Whether family play is available, who is signed in, their families, the current mode, and what the
 *   choices do
 */
export function showPlayMode(options: {
    available: boolean;
    user: AuthUser | null;
    families: FamilyListEntry[];
    mode: PlayMode;
    onChoose: (mode: PlayMode) => void;
    onFamilyInfo: (fid: string) => void;
    onCreate: () => void;
    onJoinLink: (text: string) => boolean;
    onSignInWithGoogle: () => Promise<string | void>;
    onSignOut: () => void;
}): void {
    const { available, user, families, mode } = options;
    const choice = (target: PlayMode, icon: string, title: string, sub: string): HTMLElement => {
        const current =
            target.kind === mode.kind &&
            (target.kind === 'local' || (mode.kind === 'family' && mode.fid === target.fid));
        return h(
            'li',
            {},
            h(
                'button',
                {
                    class: `choice${current ? ' current' : ''}`,
                    type: 'button',
                    'aria-pressed': String(current),
                    onclick: () => {
                        closeModal();
                        if (!current) options.onChoose(target);
                    },
                },
                h('span', { class: 'choice-icon', 'aria-hidden': 'true' }, icon),
                h(
                    'span',
                    { class: 'choice-main' },
                    h('span', { class: 'choice-title' }, title),
                    h('span', { class: 'choice-sub' }, sub),
                ),
                current && h('span', { class: 'choice-check' }, '✓ Playing'),
            ),
        );
    };
    const joinInput = h('input', {
        class: 'text-input',
        placeholder: 'Paste an invite link',
        'aria-label': 'Invite link',
    });
    const joinError = h('p', { class: 'form-error', role: 'alert' });
    const accountError = h('p', { class: 'form-error', role: 'alert' });
    const googleBtn = h('button', { class: 'pill', type: 'button' }, 'Sign in with Google');
    googleBtn.addEventListener('click', () => busy(googleBtn, accountError, options.onSignInWithGoogle));

    openModal({
        title: 'Who are you playing with?',
        content: [
            h(
                'ul',
                { class: 'choice-list' },
                choice({ kind: 'local' }, '🙋', 'Just me', 'Saved on this device only'),
                families.map((f) =>
                    choice({ kind: 'family', fid: f.fid }, '👪', f.name, 'Family game: everyone plays the same puzzle'),
                ),
            ),
            mode.kind === 'family' &&
                h(
                    'div',
                    { class: 'button-row' },
                    h(
                        'button',
                        { class: 'pill', type: 'button', onclick: () => options.onFamilyInfo(mode.fid) },
                        'Family members & invite link',
                    ),
                ),
            !available
                ? h(
                      'p',
                      { class: 'muted small' },
                      "Family play isn't set up on this site yet (it needs a Firebase project; see SETUP-FIREBASE.md).",
                  )
                : [
                      h('h3', {}, 'Play with your family'),
                      h(
                          'p',
                          { class: 'muted small' },
                          'Families are shared with Buzz Off and our other games: a family made in one shows up in all of them.',
                      ),
                      h(
                          'div',
                          { class: 'button-row' },
                          h(
                              'button',
                              { class: 'pill primary', type: 'button', onclick: options.onCreate },
                              'Create a family',
                          ),
                      ),
                      h(
                          'div',
                          { class: 'invite-box' },
                          joinInput,
                          h(
                              'button',
                              {
                                  class: 'pill',
                                  type: 'button',
                                  onclick: () => {
                                      if (!options.onJoinLink(joinInput.value)) {
                                          joinError.textContent = "That doesn't look like an invite link.";
                                      }
                                  },
                              },
                              'Join',
                          ),
                      ),
                      joinError,
                      h(
                          'div',
                          { class: 'account-box' },
                          h('h3', {}, 'Your account'),
                          !user
                              ? h(
                                    'p',
                                    { class: 'small' },
                                    "You'll play as a guest on this device. ",
                                    'Sign in with Google to use your families on all your devices.',
                                )
                              : user.isAnonymous
                                ? h(
                                      'p',
                                      { class: 'small' },
                                      'Playing as a guest: your families are saved for this browser only. Sign in with Google to keep them, and use them on other devices.',
                                  )
                                : h(
                                      'p',
                                      { class: 'small' },
                                      `Signed in with Google${user.displayName ? ` as ${user.displayName}` : ''}.`,
                                  ),
                          user && !user.isAnonymous
                              ? h(
                                    'button',
                                    {
                                        class: 'pill',
                                        type: 'button',
                                        onclick: () => {
                                            if (
                                                confirm(
                                                    'Sign out? You can sign in again any time to get your families back.',
                                                )
                                            ) {
                                                closeModal();
                                                options.onSignOut();
                                            }
                                        },
                                    },
                                    'Sign out',
                                )
                              : googleBtn,
                          accountError,
                      ),
                  ],
        ],
    });
}

/**
 * Opens the Create a Family screen.
 *
 * @param options - The name and color to start with, and what Create does (return a message to show it as an error)
 */
export function showCreateFamily(options: {
    profile: PlayerProfile;
    onCreate: (familyName: string, me: PlayerProfile) => Promise<string | void>;
}): void {
    const familyName = h('input', {
        id: 'family-name',
        class: 'text-input',
        maxlength: String(MAX_FAMILY_NAME),
        placeholder: 'e.g. The Smiths',
    });
    const fields = profileFields(options.profile, 'create');
    const createBtn = h('button', { class: 'pill primary', type: 'button' }, 'Create family');
    createBtn.addEventListener('click', () => {
        const name = familyName.value.trim().slice(0, MAX_FAMILY_NAME);
        if (!name) {
            fields.error.textContent = "Enter the family's name.";
            familyName.focus();
            return;
        }
        const me = fields.read();
        if (me) busy(createBtn, fields.error, () => options.onCreate(name, me));
    });
    openModal({
        title: 'Create a family',
        content: [
            h(
                'p',
                {},
                'Everyone in the family plays the same puzzle each day, on their own. Compare how you each did, then combine your work to see how you did as a team.',
            ),
            h('div', { class: 'field' }, h('label', { for: 'family-name' }, "Family's name"), familyName),
            fields.el,
            h('div', { class: 'button-row' }, createBtn),
        ],
    });
    familyName.focus();
}

/**
 * Opens the Join a Family screen (from an invite link).
 *
 * @param options - The name and color to start with, who is signed in, and what the buttons do (return a message to
 *   show it as an error)
 */
export function showJoinFamily(options: {
    profile: PlayerProfile;
    user: AuthUser | null;
    onJoin: (me: PlayerProfile) => Promise<string | void>;
    onSignInWithGoogle: () => Promise<string | void>;
}): void {
    const fields = profileFields(options.profile, 'join');
    const joinBtn = h('button', { class: 'pill primary', type: 'button' }, 'Join the family');
    joinBtn.addEventListener('click', () => {
        const me = fields.read();
        if (me) busy(joinBtn, fields.error, () => options.onJoin(me));
    });
    const googleBtn = h('button', { class: 'pill', type: 'button' }, 'Sign in with Google first');
    googleBtn.addEventListener('click', () => busy(googleBtn, fields.error, options.onSignInWithGoogle));
    const signedInWithGoogle = options.user && !options.user.isAnonymous;
    openModal({
        title: "You're invited to a family game",
        content: [
            h('p', {}, 'Pick the name and color the rest of the family will see next to your play.'),
            fields.el,
            h('div', { class: 'button-row' }, joinBtn, !signedInWithGoogle && googleBtn),
            !signedInWithGoogle &&
                h(
                    'p',
                    { class: 'muted small' },
                    'You can join as a guest on this device, or sign in with Google to use the family on all your devices. You can sign in later, too.',
                ),
        ],
    });
}

/**
 * Opens a family's screen: its members, the invite link, your name and color, and leaving (or, for its creator,
 * removing members, making a new link and deleting the family).
 *
 * @param options - The family, its members, who you are, the invite link, and what the buttons do
 */
export function showFamilyInfo(options: {
    meta: FamilyMeta;
    members: Record<string, FamilyMember>;
    myUid: string;
    inviteLink: () => Promise<string>;
    onShare: (link: string) => void;
    onRegenerate: () => Promise<string>;
    onRemoveMember: (uid: string) => Promise<void>;
    onSaveProfile: (me: PlayerProfile) => Promise<string | void>;
    onLeave: () => void;
    onDelete: () => void;
}): void {
    const { meta, members, myUid } = options;
    const isOwner = meta.ownerUid === myUid;
    const linkInput = h('input', {
        class: 'text-input',
        readonly: true,
        'aria-label': 'Invite link',
        value: 'Loading…',
    });
    const linkError = h('p', { class: 'form-error', role: 'alert' });
    let link = '';
    const showLink = (p: Promise<string>): void => {
        p.then((l) => {
            link = l;
            linkInput.value = l;
        }).catch(() => {
            linkInput.value = '';
            linkError.textContent = "Couldn't load the invite link.";
        });
    };
    showLink(options.inviteLink());
    const shareBtn = h(
        'button',
        { class: 'pill primary', type: 'button', onclick: () => link && options.onShare(link) },
        'Share link',
    );
    const regenBtn = h('button', { class: 'pill', type: 'button' }, 'Make a new link');
    regenBtn.addEventListener('click', () => {
        if (confirm('Make a new invite link? The old link will stop working (people already in the family stay in).')) {
            showLink(options.onRegenerate());
        }
    });
    const me = members[myUid];
    const fields = profileFields({ name: me?.name ?? '', color: me?.color ?? PLAYER_COLORS[0].id }, 'me');
    const saveBtn = h('button', { class: 'pill', type: 'button' }, 'Save');
    saveBtn.addEventListener('click', () => {
        const p = fields.read();
        if (p) {
            busy(saveBtn, fields.error, async () => {
                const msg = await options.onSaveProfile(p);
                if (!msg) showToast('Saved.');
                return msg;
            });
        }
    });
    const rows = Object.entries(members).sort(([, a], [, b]) => a.joinedAt - b.joinedAt);

    openModal({
        title: meta.name,
        content: [
            h('h3', {}, 'Members'),
            h(
                'table',
                { class: 'member-table' },
                h(
                    'tbody',
                    {},
                    rows.map(([uid, m]) =>
                        h(
                            'tr',
                            {},
                            h(
                                'td',
                                {},
                                h(
                                    'span',
                                    { class: 'who' },
                                    h('span', { class: `player-dot player-${m.color}`, 'aria-hidden': 'true' }),
                                    m.name,
                                    uid === myUid && ' (you)',
                                    uid === meta.ownerUid && h('span', { class: 'owner-tag' }, ' · created the family'),
                                ),
                            ),
                            h(
                                'td',
                                { class: 'num' },
                                isOwner &&
                                    uid !== myUid &&
                                    h(
                                        'button',
                                        {
                                            class: 'link-btn',
                                            type: 'button',
                                            onclick: (e: Event) => {
                                                if (!confirm(`Remove ${m.name} from the family?`)) return;
                                                const btn = e.currentTarget as HTMLButtonElement;
                                                options
                                                    .onRemoveMember(uid)
                                                    .then(() => btn.closest('tr')?.remove())
                                                    .catch(() => showToast(`Couldn't remove ${m.name}.`));
                                            },
                                        },
                                        'Remove',
                                    ),
                            ),
                        ),
                    ),
                ),
            ),
            h('h3', {}, 'Invite someone'),
            h(
                'p',
                { class: 'small' },
                'Send this link to anyone you want in the family. It works until a new one is made.',
            ),
            h('div', { class: 'invite-box' }, linkInput, shareBtn),
            linkError,
            isOwner && h('div', { class: 'button-row' }, regenBtn),
            h('h3', {}, 'You in this family'),
            fields.el,
            h('div', { class: 'button-row' }, saveBtn),
            h(
                'details',
                { class: 'danger-zone' },
                h('summary', {}, isOwner ? 'Leave or delete the family' : 'Leave the family'),
                h(
                    'p',
                    { class: 'small' },
                    isOwner
                        ? 'If you leave, the family carries on, but nobody can make new invite links or remove members. Deleting it removes the family and all its play, in every game, for everyone.'
                        : 'You leave it in every game (families are shared). You can rejoin later with an invite link. Your play stays with the family.',
                ),
                h(
                    'div',
                    { class: 'button-row' },
                    h(
                        'button',
                        {
                            class: 'pill danger',
                            type: 'button',
                            onclick: () => {
                                if (confirm(`Leave ${meta.name}?`)) options.onLeave();
                            },
                        },
                        'Leave the family',
                    ),
                    isOwner &&
                        h(
                            'button',
                            {
                                class: 'pill danger',
                                type: 'button',
                                onclick: () => {
                                    if (
                                        confirm(
                                            `Delete ${meta.name} and all its play, in every game (Buzz Off too), for everyone? This can't be undone.`,
                                        )
                                    ) {
                                        options.onDelete();
                                    }
                                },
                            },
                            'Delete the family',
                        ),
                ),
            ),
        ],
    });
}

/**
 * Defines the PlayMode type: who the player is playing with.
 */

/**
 * Who the player is playing with: on their own (saved on this device only), or with one of their families (saved in
 * Firebase). The game remembers it, and keeps using it every day until the player switches.
 */
export type PlayMode = { kind: 'local' } | { kind: 'family'; fid: string };

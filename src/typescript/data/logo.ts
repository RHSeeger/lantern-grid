/**
 * The game's logo, as SVG markup (drawn in the text color, with lit squares in the accent color). The app icons are
 * drawn by tools/make-icons.ts to match.
 */

/** The logo: a 3 x 3 grid with a lit path through it */
export const LOGO_SVG =
    '<svg viewBox="0 0 90 90" aria-hidden="true">' +
    '<g fill="currentColor" opacity="0.18">' +
    '<rect x="4" y="4" width="24" height="24" rx="5"/><rect x="33" y="4" width="24" height="24" rx="5"/>' +
    '<rect x="62" y="4" width="24" height="24" rx="5"/><rect x="4" y="33" width="24" height="24" rx="5"/>' +
    '<rect x="33" y="33" width="24" height="24" rx="5"/><rect x="62" y="33" width="24" height="24" rx="5"/>' +
    '<rect x="4" y="62" width="24" height="24" rx="5"/><rect x="33" y="62" width="24" height="24" rx="5"/>' +
    '<rect x="62" y="62" width="24" height="24" rx="5"/></g>' +
    '<g class="logo-lit"><rect x="4" y="62" width="24" height="24" rx="5"/>' +
    '<rect x="33" y="33" width="24" height="24" rx="5"/><rect x="62" y="33" width="24" height="24" rx="5"/>' +
    '<rect x="62" y="4" width="24" height="24" rx="5"/></g>' +
    '<polyline points="16,74 45,45 74,45 74,16" fill="none" stroke="currentColor" stroke-width="4" ' +
    'stroke-linecap="round" stroke-linejoin="round"/></svg>';

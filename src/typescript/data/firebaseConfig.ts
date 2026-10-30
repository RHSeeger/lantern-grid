/**
 * The Firebase project the game uses for family play: the same project as Buzz Off, so families (and sign-ins, since
 * the games share a web address) are shared between the games. See SETUP-FIREBASE.md. Until apiKey is filled in,
 * family play is turned off and the game only plays locally.
 *
 * These values are public by design: they only say which project to talk to. What protects the data is the security
 * rules in database.rules.json.
 */

/** The web app's Firebase config */
export const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyBxavr7V1ZdizUSAB3eRXM6zyLKK7JZXvY',
    authDomain: 'buzz-off-c4a4d.firebaseapp.com',
    databaseURL: 'https://buzz-off-c4a4d-default-rtdb.firebaseio.com',
    projectId: 'buzz-off-c4a4d',
    appId: '1:458855576735:web:7087d691f7173c7b4b5eaa',
};

/** Whether family play is available (the config above has been filled in) */
export const FAMILY_PLAY_AVAILABLE = FIREBASE_CONFIG.apiKey !== '' && FIREBASE_CONFIG.databaseURL !== '';

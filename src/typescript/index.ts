import '../css/styles.css';
import { startApp } from './app';

/**
 * The entry point for Lantern Grid. Starts the game once the page is ready (see design/code-design.md, "Folder
 * Layout").
 */

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => void startApp());
} else {
    void startApp();
}

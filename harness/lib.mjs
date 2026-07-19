// Shared launcher: isolated Chromium (Playwright-bundled, never the user's
// browser) with the UbiChr extension loaded from the repo root.
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const EXT_PATH = path.resolve(__dirname, '..');
export const PROFILE = path.join(__dirname, '.profile');

export async function launch({ headless = !!process.env.HEADLESS, freshProfile = false } = {}) {
    if (freshProfile) fs.rmSync(PROFILE, { recursive: true, force: true });
    const context = await chromium.launchPersistentContext(PROFILE, {
        headless,
        // extensions require the new headless mode shipped in the plain chromium channel
        channel: headless ? 'chromium' : undefined,
        viewport: null,
        args: [
            `--disable-extensions-except=${EXT_PATH}`,
            `--load-extension=${EXT_PATH}`,
            '--no-first-run',
            '--no-default-browser-check',
        ],
    });
    try { await context.grantPermissions(['clipboard-read', 'clipboard-write']); } catch (e) { /* best effort */ }

    let sw = context.serviceWorkers()[0];
    if (!sw) sw = await context.waitForEvent('serviceworker', { timeout: 15000 });
    const extId = new URL(sw.url()).host;
    return { context, extId };
}

// Puts custom-cmds/ubichr-custom-scripts-*.js into chrome.storage.local so the
// sandbox registers the user's custom commands (a fresh profile has none).
export async function seedCustomScripts(context, extId, file) {
    if (!file) {
        // newest dated export wins
        const dir = path.join(EXT_PATH, 'custom-cmds');
        const candidates = fs.existsSync(dir)
            ? fs.readdirSync(dir).filter(f => /^ubichr-custom-scripts-.*\.js$/.test(f)).sort()
            : [];
        if (!candidates.length) { console.warn('seedCustomScripts: no custom-cmds/ubichr-custom-scripts-*.js found'); return false; }
        file = path.join(dir, candidates[candidates.length - 1]);
    }
    if (!fs.existsSync(file)) { console.warn('seedCustomScripts: file not found:', file); return false; }
    console.log('seeding custom scripts from', path.basename(file));
    const code = fs.readFileSync(file, 'utf8');
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extId}/result.html`); // minimal extension page
    const outcome = await page.evaluate(c => new Promise(resolve => {
        chrome.storage.local.set({ customscripts: c }, () => {
            const err = chrome.runtime.lastError && chrome.runtime.lastError.message;
            chrome.storage.local.get('customscripts', v =>
                resolve({ err: err || null, written: (v.customscripts || '').length }));
        });
    }), code);
    await page.close();
    if (outcome.err || outcome.written !== code.length)
        throw new Error(`seeding custom scripts failed: ${outcome.err || 'readback ' + outcome.written + '/' + code.length + ' chars'}`);
    return true;
}

export function argValue(argv, name, dflt) {
    const a = argv.find(x => x.startsWith(`--${name}=`));
    return a ? a.slice(name.length + 3) : dflt;
}

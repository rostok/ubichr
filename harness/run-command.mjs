// Drives a single UbiChr command in popup.html (opened as a tab) and dumps
// what the preview shows — the feedback loop for inspecting one command.
//
// usage: node run-command.mjs "calc 2+2" [--exec] [--wait=ms] [--clip=text] [--target=url] [--shot=file.png] [--no-custom] [--keep]
//   --exec        press Enter after the preview (executes the command)
//   --wait=ms     how long to let the preview settle (default 3000)
//   --clip=text   put text on the clipboard before running (\n and \t are unescaped)
//   --target=url  open url in a tab and wire it as CmdUtils.active_tab (for commands
//                 acting on "the current page" — invert, mark, killcookies, ...)
//   --shot=f.png  save target-page screenshots (f-before.png / f-after.png)
//   --no-custom   don't seed custom scripts
//   --keep        leave the browser open for manual inspection (Ctrl+C to quit)
import { launch, seedCustomScripts, argValue } from './lib.mjs';

const argv = process.argv.slice(2);
const cmdline = argv.find(a => !a.startsWith('--')) || '';
if (!cmdline) { console.error('usage: node run-command.mjs "<command line>" [--exec] [--wait=ms] [--clip=text] [--keep]'); process.exit(2); }
const exec = argv.includes('--exec');
const keep = argv.includes('--keep');
const noCustom = argv.includes('--no-custom');
const wait = parseInt(argValue(argv, 'wait', '3000'), 10);
const clip = argValue(argv, 'clip', '').replaceAll('\\n', '\n').replaceAll('\\t', '\t');
const target = argValue(argv, 'target', '');
const shot = argValue(argv, 'shot', '');

const { context, extId } = await launch();
try {
    if (!noCustom) await seedCustomScripts(context, extId);
    const page = await context.newPage();
    page.on('console', m => { if (['error', 'warning'].includes(m.type())) console.log(`[popup:${m.type()}]`, m.text()); });
    page.on('pageerror', e => console.log('[popup:pageerror]', e.message));
    let tpage = null;
    if (target) {
        tpage = await context.newPage();
        await tpage.goto(target);
        await tpage.waitForTimeout(500);
    }
    await page.goto(`chrome-extension://${extId}/popup.html`);
    await page.bringToFront();
    await page.waitForTimeout(800);
    if (clip) await page.evaluate(t => navigator.clipboard.writeText(t), clip);
    if (target) {
        // opening popup.html as a tab makes IT the active tab, so wire the
        // target tab into CmdUtils.active_tab the way the real popup sees it
        const wired = await page.evaluate(u => new Promise(r => chrome.tabs.query({}, tabs => {
            const tb = tabs.find(x => x.url && x.url.startsWith(u));
            CmdUtils.active_tab = tb || null;
            r(tb ? tb.url : null);
        })), target);
        console.log('active_tab wired to:', wired);
        if (shot) await tpage.screenshot({ path: shot.replace(/\.png$/i, '') + '-before.png' });
    }

    const input = page.locator('#ubiq_input');
    await input.click();
    await input.fill('');
    await input.pressSequentially(cmdline, { delay: 40 });
    await page.waitForTimeout(wait);

    const grab = async sel => {
        try { return { text: await page.locator(sel).innerText(), html: await page.locator(sel).innerHTML() }; }
        catch (e) { return { text: '(unavailable)', html: '' }; }
    };
    const preview = await grab('#ubiq-command-preview');
    const tip = await grab('#ubiq-command-tip');
    console.log('=== PREVIEW TEXT ===\n' + preview.text);
    if (tip.text.trim()) console.log('=== TIP ===\n' + tip.text);
    console.log('=== PREVIEW HTML (first 4000 chars) ===\n' + preview.html.slice(0, 4000));

    if (exec) {
        await input.press('Enter');
        await page.waitForTimeout(wait);
        console.log('=== AFTER EXECUTE ===');
        console.log('open pages:\n  ' + context.pages().map(p => p.url()).join('\n  '));
        const clipAfter = await page.evaluate(() => navigator.clipboard.readText().catch(() => '(unreadable)'));
        console.log('clipboard now:', JSON.stringify(clipAfter));
        const previewAfter = await grab('#ubiq-command-preview');
        console.log('preview now:\n' + previewAfter.text);
    }
    if (tpage && shot) {
        await tpage.waitForTimeout(500);
        await tpage.screenshot({ path: shot.replace(/\.png$/i, '') + '-after.png' });
        console.log('screenshots saved:', shot.replace(/\.png$/i, '') + '-{before,after}.png');
    }

    if (keep) {
        console.log('\n--keep: browser stays open, Ctrl+C to quit');
        await new Promise(() => {});
    }
} finally {
    if (!keep) await context.close();
}

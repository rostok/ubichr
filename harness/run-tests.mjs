// Runs the extension's own test suite (tests.html) in an isolated Chromium
// and reports the results on stdout + harness/last-results.json.
//
// usage: node run-tests.mjs [--filter=str] [--only=n1,n2] [--batch=N] [--serial] [--parallel|--seq] [--no-custom] [--timeout=ms]
//   default       batched: N tests at a time (default 8), clipboard-writing tests
//                 one at a time (setClipboard propagates to every open popup —
//                 full parallelism produces bogus failures)
//   --filter=str  only tests whose name contains str (uses tests.html?f=...)
//   --only=...    run only the exactly named tests
//   --batch=N     batch size (default 8)
//   --serial      one test at a time (slowest, most deterministic)
//   --parallel    use tests.html '#start' (all at once — racy, see above)
//   --seq         use tests.html '#startseq' (starts staggered by 500ms)
//   --no-custom   don't seed custom scripts from custom-cmds/
//   --timeout=ms  global wait for all results (parallel/seq only; default 240000)
//   HEADLESS=1    run in new-headless mode
import { launch, seedCustomScripts, argValue } from './lib.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const only = argValue(argv, 'only', '').split(',').filter(Boolean);
const filter = argValue(argv, 'filter', ''); // maps to tests.html?f=...
const seq = argv.includes('--seq');
const parallel = argv.includes('--parallel');
const serial = argv.includes('--serial');
const batchSize = parseInt(argValue(argv, 'batch', '8'), 10);
const noCustom = argv.includes('--no-custom');
const globalTimeout = parseInt(argValue(argv, 'timeout', '240000'), 10);

const { context, extId } = await launch();
let exitCode = 0;
try {
    if (!noCustom) {
        const ok = await seedCustomScripts(context, extId);
        console.log(ok ? 'custom scripts seeded' : 'no custom scripts file found');
    }
    const page = await context.newPage();
    page.on('pageerror', e => console.error('[tests.html pageerror]', e.message));
    await page.goto(`chrome-extension://${extId}/tests.html${filter ? '?f=' + encodeURIComponent(filter) : ''}`);
    // let the sandbox eval custom scripts and extend the test list
    await page.waitForTimeout(3000);

    const scrape = async () => {
        let r = await page.$$eval('div.status', els => els.map(el => ({
            name: el.getAttribute('name'),
            icon: (el.querySelector('.resulticon') || {}).textContent || '',
            msg: ((el.querySelector('.resultmsg') || {}).textContent || '').trim(),
        })));
        if (only.length) r = r.filter(x => only.includes(x.name));
        return r;
    };

    let results = [];
    if (parallel || seq) {
        await page.click(seq ? '#startseq' : '#start');
        const deadline = Date.now() + globalTimeout;
        for (;;) {
            results = await scrape();
            if (results.length && results.every(r => r.icon)) break;
            if (Date.now() > deadline) break;
            await page.waitForTimeout(1000);
        }
    } else {
        // batched: N tests at a time (--batch=N, --serial for 1) — but tests that
        // WRITE the clipboard run one at a time, because setClipboard propagates
        // to every open popup and clobbers other clipboard-based tests mid-flight
        await page.evaluate(() => { timeoutMultiplier = 2; });
        let names = await page.$$eval('div.status', els => els.map(e => e.getAttribute('name')));
        if (only.length) {
            for (const n of only) if (!names.includes(n)) { console.error(`no such test: ${n}`); exitCode = 2; }
            names = names.filter(n => only.includes(n));
        }
        // solo tests: clipboard writers (setClipboard propagates to every popup)
        // and tab-scanners (they grep ALL open tabs, so concurrent tests pollute
        // them — and autoclose closes shared target tabs mid-test)
        const solo = n => /clip/i.test(n)
            || ['shorten-url', 'save', 'open',
                'grep', 'regexp', 'grepInnerHTML', 'links', 'links-open',
                'omnijquery', 'close-containing', 'get-urls', 'context'].includes(n);
        const size = serial ? 1 : batchSize;
        const groups = [];
        const rest = names.filter(n => !solo(n));
        for (let i = 0; i < rest.length; i += size) groups.push(rest.slice(i, i + size));
        for (const n of names.filter(solo)) groups.push([n]);

        let done = 0;
        for (const batch of groups) {
            for (const name of batch) await page.click(`div.status[name="${name}"] a.runsingle`);
            const deadline = Date.now() + 90000;
            for (;;) {
                const st = await page.$$eval('div.status', (els, batch) => batch.map(n => {
                    const el = els.find(e => e.getAttribute('name') === n);
                    const ic = el && el.querySelector('.resulticon');
                    return ic ? ic.textContent : '';
                }), batch);
                if (st.every(Boolean) || Date.now() > deadline) {
                    batch.forEach((name, i) => { done++; if (st[i] !== '✅') console.log(`  [${done}/${names.length}] ${st[i] || 'TIMEOUT'} ${name}`); });
                    break;
                }
                await page.waitForTimeout(400);
            }
        }
        results = await scrape();
    }

    const pass = results.filter(r => r.icon === '✅');
    const fail = results.filter(r => r.icon === '❌');
    const none = results.filter(r => !r.icon);
    console.log(`\n=== RESULTS: ${pass.length} passed, ${fail.length} failed, ${none.length} timed out (of ${results.length}) ===`);
    for (const r of fail) console.log(`  FAIL ${r.name}: ${r.msg}`);
    for (const r of none) console.log(`  TIMEOUT ${r.name}`);
    fs.writeFileSync(path.join(__dirname, 'last-results.json'), JSON.stringify(results, null, 2));
    if (fail.length || none.length) exitCode = 1;
} finally {
    await context.close();
}
process.exit(exitCode);

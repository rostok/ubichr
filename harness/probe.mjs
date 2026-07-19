// Diagnostic: opens popup.html, reports command counts and custom-script eval errors.
import { launch, seedCustomScripts } from './lib.mjs';

const { context, extId } = await launch();
try {
    console.log('extension id:', extId);
    await seedCustomScripts(context, extId);
    // verify from an independent page right after seeding
    const check = await context.newPage();
    await check.goto(`chrome-extension://${extId}/result.html`);
    const lenAfterSeed = await check.evaluate(() => new Promise(r => chrome.storage.local.get('customscripts', v => r((v.customscripts || '').length))));
    console.log('storage right after seed:', lenAfterSeed, 'chars');
    await check.close();
    const page = await context.newPage();
    const sandboxMsgs = [];
    page.on('console', m => { if (m.type() === 'error') sandboxMsgs.push(m.text()); });
    await page.goto(`chrome-extension://${extId}/popup.html`);
    // capture sandbox → popup protocol messages
    await page.evaluate(() => {
        window.__sbmsgs = [];
        window.addEventListener('message', e => window.__sbmsgs.push((e.data && e.data.type || '?') + (e.data && e.data.message ? ': ' + e.data.message : '')));
    });
    await page.waitForTimeout(4000);
    const storedLen = await page.evaluate(() => new Promise(r => chrome.storage.local.get('customscripts', v => r((v.customscripts || '').length))));
    console.log('customscripts in storage.local, chars:', storedLen);
    const msgs = await page.evaluate(() => window.__sbmsgs);
    console.log('sandbox messages:', JSON.stringify(msgs.filter(m => !m.startsWith('pblock')).slice(0, 20)));
    const info = await page.evaluate(() => ({
        total: CmdUtils.CommandList.length,
        custom: CmdUtils.CommandList.filter(c => !c.builtIn).map(c => c.name),
        tip: document.getElementById('ubiq-command-tip').innerText,
    }));
    console.log('total commands:', info.total);
    console.log('custom commands (' + info.custom.length + '):', info.custom.join(', ') || '(none!)');
    console.log('tip:', JSON.stringify(info.tip));
    console.log('console errors:', sandboxMsgs.slice(0, 10).join('\n') || '(none)');
} finally {
    await context.close();
}

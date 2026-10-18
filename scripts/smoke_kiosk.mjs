// Functional smoke test for the deployed Imaa kiosk via Chrome DevTools Protocol.
// Verifies real interaction: font-scale cycle, contrast toggle, sign selection.

const URL = process.argv[2] || 'https://imaa-kiosk.pages.dev/';
const CDP = process.argv[3] || 'http://127.0.0.1:9222';
const PORT = CDP;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  // Discover the page target opened by the chrome CLI.
  let target = null;
  for (let i = 0; i < 30; i++) {
    try {
      const list = await (await fetch(`${PORT}/json/list`)).json();
      target = list.find((t) => t.type === 'page' && t.url.startsWith('http'));
      if (target) break;
    } catch {}
    await sleep(500);
  }
  if (!target) throw new Error('no page target');

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });

  let id = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  };
  const send = (method, params = {}) =>
    new Promise((res) => {
      const myId = ++id;
      pending.set(myId, res);
      ws.send(JSON.stringify({ id: myId, method, params }));
    });

  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.result?.exceptionDetails) {
      throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300));
    }
    return r.result?.result?.value;
  };

  // Wait for hydration.
  for (let i = 0; i < 40; i++) {
    const ready = await evaluate(
      "document.readyState === 'complete' && !!document.querySelector('button')"
    );
    if (ready) break;
    await sleep(250);
  }

  const results = [];
  const check = (name, pass, detail) => results.push({ name, pass: !!pass, detail });

  const btnLabel = () =>
    evaluate(
      "[...document.querySelectorAll('button')].map(b=>b.textContent.trim()).find(t=>t.startsWith('A+')) || ''"
    );

  const start = await btnLabel();
  check('A+ control rendered', start.includes('100%'), start);

  await evaluate(
    "[...document.querySelectorAll('button')].find(b=>b.textContent.includes('A+')).click()"
  );
  await sleep(200);
  const mid = await btnLabel();
  check('A+ cycles to 120%', mid.includes('120%'), mid);

  await evaluate(
    "[...document.querySelectorAll('button')].find(b=>b.textContent.includes('A+')).click()"
  );
  await sleep(200);
  const max = await btnLabel();
  check('A+ cycles to 140%', max.includes('140%'), max);

  const bodyBg = await evaluate('getComputedStyle(document.body).backgroundColor');
  await evaluate(
    "[...document.querySelectorAll('button')].find(b=>b.textContent.includes('High Contrast')).click()"
  );
  await sleep(250);
  const hcBg = await evaluate('getComputedStyle(document.body).backgroundColor');
  check('High contrast changes background', bodyBg !== hcBg, `${bodyBg} -> ${hcBg}`);

  const urgencyBefore = await evaluate(
    "document.body.innerText.match(/URGENCY LEVEL:\\s*\\w+/)?.[0] || ''"
  );
  await evaluate(
    "[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Fever')).click()"
  );
  await sleep(1000);
  const urgencyAfter = await evaluate(
    "document.body.innerText.match(/URGENCY LEVEL:\\s*\\w+/)?.[0] || ''"
  );
  const codeAfter = await evaluate(
    "document.body.innerText.match(/CODE:\\s*[A-Z_]+/)?.[0] || ''"
  );
  check(
    'Sign selection updates urgency + code',
    urgencyAfter !== urgencyBefore && codeAfter.includes('FEVER'),
    `${urgencyBefore} -> ${urgencyAfter} / ${codeAfter}`
  );

  // No horizontal overflow at the current viewport.
  const overflow = await evaluate(
    'document.documentElement.scrollWidth - document.documentElement.clientWidth'
  );
  check('No horizontal overflow', overflow <= 1, `overflow=${overflow}px`);

  // Every visible button meets the 44px touch-target floor (WCAG 2.5.5).
  const smallTargets = await evaluate(`(() => {
    const bad = [];
    for (const b of document.querySelectorAll('button')) {
      const r = b.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      if (r.height < 44 || r.width < 44) bad.push((b.textContent.trim()||'?').slice(0,18) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
    }
    return bad;
  })()`);
  check('All tap targets >= 44px', smallTargets.length === 0, JSON.stringify(smallTargets));

  // Fonts actually loaded (no fallback rendering across devices).
  const fonts = await evaluate(
    "document.fonts.check(\"16px 'Noto Nastaliq Urdu'\") && document.fonts.check(\"16px 'Noto Naskh Arabic'\")"
  );
  check('Self-hosted Nastaliq + Naskh loaded', fonts === true, String(fonts));

  ws.close();

  let failed = 0;
  for (const r of results) {
    if (!r.pass) failed++;
    console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}  [${r.detail}]`);
  }
  console.log(failed === 0 ? 'ALL FUNCTIONAL CHECKS PASSED' : `${failed} CHECK(S) FAILED`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('ERROR', e.message);
  process.exit(2);
});

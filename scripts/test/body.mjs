/**
 * Request body handling: server/src/middleware/body.js. Run by `npm test`
 * against a throwaway server.
 *
 * These readers replaced express.json()/express.raw() because Vercel's runtime
 * drains the request stream before Express sees it. The stock parsers' edge
 * cases — too large, not an object, wrong charset — must still end in a clean
 * 4xx, never a 500 or a hang.
 *
 * POST /api/admin/login is the probe: it needs no data, and answers a wrong
 * email/password with 401 only if it was able to read a JSON body at all.
 */
const BASE = `http://localhost:${process.env.PORT || 4000}`;
let failures = 0;
const check = (ok, label) => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok) failures++;
};
const post = (body, headers = { 'Content-Type': 'application/json' }) =>
  fetch(`${BASE}/api/admin/login`, { method: 'POST', headers, body }).then(async (r) => ({
    status: r.status,
    body: await r.json().catch(() => null),
  }));
const wrong = JSON.stringify({ email: 'x@y.z', password: 'nope' });

console.log('\n── Ordinary JSON ──');
check((await post(wrong)).status === 401, 'a normal JSON body is read (wrong password → 401)');
check((await post(wrong, { 'Content-Type': 'application/json; charset=utf-8' })).status === 401, 'an explicit utf-8 charset is accepted');
check((await post('')).status === 401, 'an empty body is an empty object, not an error');
check((await post(undefined)).status === 401, 'no body at all is an empty object, not an error');
check((await post(JSON.stringify({ email: 'x@y.z', password: 'nö–pé' }))).status === 401, 'non-ASCII text is read as UTF-8');

console.log('\n── Things that are not a request body ──');
const text = await post(wrong, { 'Content-Type': 'text/plain' });
check(text.status === 401, 'a different content type is ignored, not parsed (and does not crash)');

console.log('\n── Rejected cleanly, never a 500 ──');
const malformed = await post('{ not json');
check(malformed.status === 400, `malformed JSON → 400 (got ${malformed.status})`);
const bare = await post('"just a string"');
check(bare.status === 400, `a bare string is not a body → 400 (got ${bare.status})`);
const num = await post('42');
check(num.status === 400, `a bare number is not a body → 400 (got ${num.status})`);
const latin = await post(wrong, { 'Content-Type': 'application/json; charset=iso-8859-1' });
check(latin.status === 415, `a non-UTF-8 charset → 415 (got ${latin.status})`);
const gz = await post(wrong, { 'Content-Type': 'application/json', 'Content-Encoding': 'gzip' });
check(gz.status === 415, `a compressed body → 415 (got ${gz.status})`);

console.log('\n── Size limit (100 KB) ──');
const justUnder = await post(JSON.stringify({ email: 'x@y.z', password: 'p'.repeat(90 * 1024) }));
check(justUnder.status === 401, `90 KB is read (got ${justUnder.status})`);
const over = await post(JSON.stringify({ email: 'x@y.z', password: 'p'.repeat(120 * 1024) }));
check(over.status === 413, `120 KB → 413 (got ${over.status})`);
check(/too large/i.test(over.body?.error || ''), 'and says so');

console.log(failures ? `\n${failures} body check(s) failed.` : '\nAll body checks passed.');
process.exit(failures ? 1 : 0);

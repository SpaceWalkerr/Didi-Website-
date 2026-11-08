/**
 * Request body readers, in place of express.json() / express.raw().
 *
 * Why not the stock body parsers: on Vercel, the Node runtime reads the whole
 * request body BEFORE the app sees it (to offer `req.body` as a convenience),
 * then replays the same bytes to anyone who listens for 'data' and 'end'. The
 * original stream is left drained, and body-parser checks `req.readable` first
 * and refuses with "stream is not readable" — so every JSON POST would fail.
 * (Found by running this app through Vercel's own runtime; see
 * scripts/test/vercel.mjs.)
 *
 * These read with nothing but `req.on('data' | 'end' | 'error')`, which works on
 * an ordinary Node request and on Vercel's replayed one alike, and they never
 * touch `req.body` until they assign it — assigning replaces Vercel's lazy
 * getter without triggering its own parse.
 *
 * Deliberately small and strict: JSON objects and arrays only, UTF-8 only, no
 * compressed request bodies (a browser never sends one to this API). The error
 * shapes match body-parser's, so the app's error handler treats them the same.
 */

const httpError = (status, type, message) => Object.assign(new Error(message), { status, type, expose: true });

/** Collects the request body, refusing anything over `limit` bytes. */
function collect(req, limit) {
  return new Promise((resolve, reject) => {
    const declared = Number(req.headers['content-length']);
    if (declared > limit) return reject(httpError(413, 'entity.too.large', 'request entity too large'));

    const chunks = [];
    let size = 0;
    let settled = false;
    const settle = (fn, value) => {
      if (settled) return;
      settled = true;
      fn(value);
    };

    req.on('data', (chunk) => {
      if (settled) return;
      size += chunk.length;
      if (size > limit) return settle(reject, httpError(413, 'entity.too.large', 'request entity too large'));
      chunks.push(chunk);
    });
    req.on('end', () => settle(resolve, Buffer.concat(chunks)));
    req.on('error', (err) => settle(reject, err));
  });
}

/** True when the request carries a body (same test as the `type-is` package). */
const hasBody = (req) => req.headers['transfer-encoding'] !== undefined || !Number.isNaN(Number(req.headers['content-length']));

/**
 * Parses `application/json` bodies into `req.body`. Anything else — a GET, a
 * POST with no body, another content type — gets `req.body = {}`, so routes can
 * destructure it without checking.
 */
export function jsonBody({ limit }) {
  return async (req, _res, next) => {
    try {
      if (req._body) return next();
      req.body = {};
      if (!hasBody(req) || !req.is('application/json')) return next();

      const encoding = String(req.headers['content-encoding'] || 'identity').toLowerCase();
      if (encoding !== 'identity') throw httpError(415, 'encoding.unsupported', `unsupported content encoding "${encoding}"`);
      const charset = /charset=([^;\s]+)/i.exec(String(req.headers['content-type']))?.[1]?.toLowerCase();
      if (charset && charset !== 'utf-8' && charset !== 'utf8') {
        throw httpError(415, 'charset.unsupported', `unsupported charset "${charset}"`);
      }

      const text = (await collect(req, limit)).toString('utf8');
      req._body = true;
      if (text.trim() === '') return next();
      // Strict, like body-parser: a bare string or number is not a request body.
      if (!/^[\s]*[{[]/.test(text)) throw httpError(400, 'entity.parse.failed', 'invalid JSON body');
      try {
        req.body = JSON.parse(text);
      } catch {
        throw httpError(400, 'entity.parse.failed', 'invalid JSON body');
      }
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

/**
 * Reads the body as raw bytes into `req.body` (a Buffer), whatever its type.
 * For the Razorpay webhook, whose signature is computed over the exact bytes
 * sent: parsing and re-serialising the JSON would change them.
 */
export function rawBody({ limit }) {
  return async (req, _res, next) => {
    try {
      if (req._body) return next();
      req.body = await collect(req, limit);
      req._body = true;
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

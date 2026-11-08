import { waitUntil } from '@vercel/functions';

/**
 * Runs best-effort work (emails, WhatsApp messages) without holding up the
 * response, and without ever letting it fail the request.
 *
 * On a long-running server a bare promise is enough: the process stays alive
 * until it settles. A serverless function is different — once the response has
 * been sent the platform is free to freeze the instance, and an email that was
 * still being handed to the SMTP server is simply never sent. `waitUntil` asks
 * the platform to keep the instance alive until the promise settles.
 *
 * Outside Vercel `waitUntil` has no request context and does nothing, so this is
 * the same fire-and-forget as before there.
 *
 * Failures are logged here, so callers need no `.catch` of their own.
 */
export function background(work, label = 'Background task') {
  const task = Promise.resolve(work).catch((err) => {
    console.error(`${label} failed:`, err?.message || err);
  });
  waitUntil(task);
  return task;
}

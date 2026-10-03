/**
 * Raised when the database itself refuses an appointment because it would
 * overlap a live one.
 *
 * This is the constraint firing, not an application check — by the time it is
 * thrown, two requests have genuinely raced and Postgres has picked a winner.
 * Callers turn it into the same 409 the pre-flight check produces, so the
 * patient sees one clear "that slot has just been taken" either way.
 */
export class SlotConflictError extends Error {
  constructor(message = 'Slot no longer available.') {
    super(message);
    this.name = 'SlotConflictError';
    this.code = 'slotTaken';
  }
}

/** Postgres SQLSTATE for exclusion_violation. */
export const EXCLUSION_VIOLATION = '23P01';
export const UNIQUE_VIOLATION = '23505';

/**
 * Branded loading placeholders. They hold the shape of what is coming, so the
 * page does not jump when it arrives, and shimmer slowly (transform only).
 */
export function Bone({ className = '' }) {
  return <span aria-hidden="true" className={`skeleton block ${className}`} />;
}

export function PageSkeleton() {
  return (
    <div className="min-h-[70vh]" role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="bg-surface">
        <div className="container-page space-y-4 py-14 sm:py-20">
          <Bone className="h-3 w-28 rounded-full" />
          <Bone className="h-12 w-4/5 max-w-xl rounded-2xl" />
          <Bone className="h-5 w-3/5 max-w-md rounded-full" />
        </div>
      </div>
      <div className="container-page grid gap-6 py-12 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card space-y-3">
            <Bone className="h-10 w-10 rounded-2xl" />
            <Bone className="h-5 w-2/3 rounded-full" />
            <Bone className="h-4 w-full rounded-full" />
            <Bone className="h-4 w-5/6 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

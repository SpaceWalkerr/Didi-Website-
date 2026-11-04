/** Heading band at the top of an interior page. */
export default function PageIntro({ eyebrow, title, lede, children, compact = false }) {
  return (
    <section className="relative overflow-hidden bg-cream">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_70%_at_95%_0%,rgb(var(--c-brand-100)/0.75),transparent_70%)]" aria-hidden="true" />
      <div className={`container-page relative ${compact ? 'pb-6 pt-10 sm:pt-14' : 'pb-12 pt-12 sm:pb-16 sm:pt-20'}`}>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="display-lg mt-4 max-w-3xl" style={{ animation: 'rise .8s var(--ease-calm) both' }}>
          {title}
        </h1>
        {lede && (
          <p className="lede mt-5 max-w-2xl" style={{ animation: 'rise .8s var(--ease-calm) .1s both' }}>
            {lede}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}

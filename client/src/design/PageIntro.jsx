/** Heading band at the top of an interior page. */
export default function PageIntro({ eyebrow, title, lede, children }) {
  return (
    <section className="border-b border-surface-200 bg-surface">
      <div className="container-page py-12 sm:py-16">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-2.5 max-w-3xl text-[2.25rem] leading-tight sm:text-5xl">{title}</h1>
        {lede && <p className="lede mt-5 max-w-2xl">{lede}</p>}
        {children}
      </div>
    </section>
  );
}

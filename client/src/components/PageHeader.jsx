export default function PageHeader({ eyebrow, title, description, children }) {
  return (
    <section className="border-b border-slate-200 bg-gradient-to-b from-brand-50 to-white">
      <div className="container-page py-12 sm:py-16">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-2 text-3xl sm:text-4xl">{title}</h1>
        {description && (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            {description}
          </p>
        )}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}

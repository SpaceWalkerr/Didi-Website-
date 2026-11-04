/**
 * A page section with a consistent heading block.
 *
 * `tone` switches between the cream, warm and deep bands that alternate down
 * the page. Every section takes an `id` so the nav and skip links can target
 * it, and labels itself by its own heading for screen-reader landmarks.
 */
export default function Section({
  id,
  tone = 'plain',
  eyebrow,
  title,
  lede,
  align = 'left',
  children,
  className = '',
  headingLevel: H = 'h2',
  aside,
}) {
  const headingId = id ? `${id}-heading` : undefined;
  const tones = {
    plain: 'section bg-cream',
    paper: 'section bg-paper',
    warm: 'section-warm',
    deep: 'section bg-deep text-white',
  };
  const deep = tone === 'deep';

  return (
    <section id={id} aria-labelledby={headingId} className={`${tones[tone] || tones.plain} ${className}`}>
      <div className="container-page">
        {(eyebrow || title || lede) && (
          <div className={`flex flex-col gap-6 ${align === 'center' ? 'items-center text-center' : 'lg:flex-row lg:items-end lg:justify-between'}`}>
            <div className={align === 'center' ? 'mx-auto max-w-2xl' : 'max-w-2xl'}>
              {eyebrow && <p className={`eyebrow ${deep ? '!text-[#9fe0d5]' : ''}`}>{eyebrow}</p>}
              {title && (
                <H id={headingId} className={`display-lg mt-4 ${deep ? '!text-white' : ''}`}>
                  {title}
                </H>
              )}
              {lede && <p className={`mt-5 text-lg leading-relaxed ${deep ? 'text-white/80' : 'text-slate-600'}`}>{lede}</p>}
            </div>
            {aside}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

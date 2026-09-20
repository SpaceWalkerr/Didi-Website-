/**
 * A page section with a consistent heading block.
 *
 * `tone` switches between the white and warm off-white bands that alternate
 * down the page. Every section takes an `id` so the nav and the skip links can
 * target it, and labels itself by its own heading for screen-reader landmarks.
 */
export default function Section({
  id,
  tone = 'plain',
  eyebrow,
  title,
  lede,
  align = 'center',
  children,
  className = '',
  headingLevel: H = 'h2',
}) {
  const headingId = id ? `${id}-heading` : undefined;
  const tones = {
    plain: 'section bg-white',
    warm: 'section-warm',
    brand: 'section bg-brand-700 text-brand-50',
  };

  return (
    <section id={id} aria-labelledby={headingId} className={`${tones[tone]} ${className}`}>
      <div className="container-page">
        {(eyebrow || title || lede) && (
          <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
            {eyebrow && (
              <p className={tone === 'brand' ? 'eyebrow text-brand-200' : 'eyebrow'}>{eyebrow}</p>
            )}
            {title && (
              <H
                id={headingId}
                className={`mt-2.5 text-3xl sm:text-[2.1rem] ${tone === 'brand' ? 'text-white' : ''}`}
              >
                {title}
              </H>
            )}
            {lede && (
              <p className={`mt-4 ${tone === 'brand' ? 'text-lg leading-relaxed text-brand-100' : 'lede'}`}>
                {lede}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

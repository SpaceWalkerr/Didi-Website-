/**
 * "Heart Scope" logo, served from /images. Colour and reverse variants are
 * both rendered and swapped by CSS (.logo-light / .logo-dark in index.css), so
 * night mode never shows dark-teal artwork on a dark page and nothing waits on
 * JavaScript. Explicit width/height keep the layout from shifting. The night
 * variant is always lazy: browsers skip lazy images that are display:none, so
 * day-mode visitors never download it.
 *
 * The horizontal lockup has the English name drawn as outlines, so for Hindi,
 * Punjabi and Russian the header uses the symbol beside live text instead.
 */
const SRC = {
  horizontal: ['/images/logo-horizontal.svg', '/images/logo-horizontal-reverse.svg'],
  mark: ['/images/logo-mark.svg', '/images/logo-mark-reverse.svg'],
};
const SIZE = { horizontal: [430, 100], mark: [100, 100] };

export default function BrandLogo({ variant = 'horizontal', className = '', alt = '', eager = false }) {
  const [width, height] = SIZE[variant];
  const [light, dark] = SRC[variant];
  const common = { width, height, alt, decoding: 'async', draggable: false };
  return (
    <>
      <img src={light} className={`logo-light ${className}`} loading={eager ? 'eager' : 'lazy'} {...common} />
      <img src={dark} className={`logo-dark ${className}`} loading="lazy" {...common} />
    </>
  );
}

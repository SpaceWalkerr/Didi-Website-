import { Fragment } from 'react';

/**
 * Headline revealed word by word.
 *
 * Splits on spaces only — never on characters — so Devanagari and Gurmukhi
 * conjuncts and vowel signs are never broken apart. `{accent}` in the
 * template becomes the italic accent word. The animation is CSS (`rise`),
 * runs once, and under reduced motion the words are simply there.
 *
 * Screen readers get the sentence once, as visually hidden plain text; the
 * animated spans are hidden from them.
 */
export default function SplitWords({ template, accent, as: Tag = 'h1', id, className = '', delay = 120, step = 65 }) {
  const parts = template.split(/\s+/).filter(Boolean);
  const label = template.replace('{accent}', accent);

  let index = 0;
  const word = (text, extra = '') => {
    const i = index++;
    return (
      <span
        className={`inline-block will-change-transform ${extra}`}
        style={{ animation: `rise 0.9s var(--ease-calm) ${delay + i * step}ms both` }}
      >
        {text}
      </span>
    );
  };

  return (
    <Tag id={id} className={className}>
      <span className="sr-only">{label}</span>
      <span aria-hidden="true">
        {parts.map((part, i) => {
          const sep = i < parts.length - 1 ? ' ' : '';
          if (!part.includes('{accent}')) return <Fragment key={i}>{word(part)}{sep}</Fragment>;
          // The accent may carry punctuation ("{accent}." or "{accent}।").
          const [before, after] = part.split('{accent}');
          return (
            <Fragment key={i}>
              {before && word(before)}
              {word(accent, 'accent-word')}
              {after && word(after)}
              {sep}
            </Fragment>
          );
        })}
      </span>
    </Tag>
  );
}

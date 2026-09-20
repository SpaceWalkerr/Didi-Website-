import { useI18n } from '../../i18n/index.jsx';

/**
 * First thing in the tab order. Invisible until focused, then jumps past the
 * navigation to the page content — the standard escape hatch for keyboard and
 * screen-reader users, who would otherwise tab through the whole header on
 * every single page.
 */
export default function SkipLink() {
  const { t } = useI18n();
  return (
    <a href="#main" className="skip-link">
      {t('common.skipToContent')}
    </a>
  );
}

import { useI18n } from '../../i18n/index.jsx';
import { CONTACT, waLink } from '@shared/practice.config.js';
import { WhatsAppIcon } from '../Icons.jsx';

/**
 * Floating WhatsApp button.
 *
 * Sits above the safe-area inset so it clears the home indicator on an iPhone,
 * and carries a real accessible name rather than relying on the icon.
 */
export default function WhatsAppFab() {
  const { t } = useI18n();

  return (
    <a
      href={waLink(t('whatsapp.default', { doctor: t('doctor.name') }))}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('whatsapp.buttonAria', { number: CONTACT.whatsappDisplay })}
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full
                 bg-whatsapp text-white shadow-lift transition hover:bg-whatsapp-dark
                 focus-visible:ring-2 focus-visible:ring-whatsapp focus-visible:ring-offset-2"
      style={{ bottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}

import { CONTACT, waLink } from '../config.js';
import { useI18n } from '../i18n/index.jsx';
import { WhatsAppIcon } from './Icons.jsx';

/**
 * Floating click-to-chat button, present on every page.
 * Most patients are on a phone, so it sits within thumb reach and clears the
 * iOS home indicator via safe-area padding. The pre-filled message is written
 * in whichever language the visitor is reading.
 */
export default function WhatsAppButton({ messageKey = 'whatsapp.default' }) {
  const { t } = useI18n();

  return (
    <a
      href={waLink(t(messageKey, { doctor: t('doctor.name') }))}
      target="_blank"
      rel="noopener noreferrer"
      className="group fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3.5
                 text-white shadow-lg shadow-[#25D366]/30 transition hover:bg-[#1ebe5a] hover:shadow-xl
                 focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2
                 sm:bottom-6 sm:right-6"
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      aria-label={t('whatsapp.buttonAria', { number: CONTACT.whatsappDisplay })}
    >
      <WhatsAppIcon className="h-6 w-6" />
      <span className="hidden text-sm font-semibold sm:inline">{t('common.chatWhatsApp')}</span>
    </a>
  );
}

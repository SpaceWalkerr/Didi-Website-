import { CONTACT, waLink, WHATSAPP_MESSAGES } from '../config.js';
import { WhatsAppIcon } from './Icons.jsx';

/**
 * Floating click-to-chat button, present on every page.
 * Most patients are on a phone, so it sits within thumb reach and clears the
 * iOS home indicator via safe-area padding.
 */
export default function WhatsAppButton({ message = WHATSAPP_MESSAGES.default }) {
  return (
    <a
      href={waLink(message)}
      target="_blank"
      rel="noopener noreferrer"
      className="group fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3.5
                 text-white shadow-lg shadow-[#25D366]/30 transition hover:bg-[#1ebe5a] hover:shadow-xl
                 focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2
                 sm:bottom-6 sm:right-6"
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      aria-label={`Chat with the clinic on WhatsApp at ${CONTACT.whatsappDisplay}`}
    >
      <WhatsAppIcon className="h-6 w-6" />
      <span className="hidden text-sm font-semibold sm:inline">Chat on WhatsApp</span>
    </a>
  );
}

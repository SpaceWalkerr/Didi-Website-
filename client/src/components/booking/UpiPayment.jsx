import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n/index.jsx';
import { rupees } from '../../lib/format.js';

/**
 * Manual UPI collection. Shows the doctor's UPI ID, a QR code and an "open UPI
 * app" link, then asks for the 12-digit UTR. Submitting does not confirm the
 * booking; the doctor does that once the money arrives.
 */
export default function UpiPayment({ upi, amount, bookingId, onSubmit, onCancel, busy, error }) {
  const { t } = useI18n();
  const [utr, setUtr] = useState('');
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);

  // qrcode is loaded on demand: only patients who reach this step need it.
  useEffect(() => {
    let live = true;
    import('qrcode')
      .then((m) => m.default.toDataURL(upi.link, { margin: 1, width: 220 }))
      .then((url) => live && setQr(url))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [upi.link]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(upi.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the ID is on screen to copy by hand.
    }
  };

  const digits = utr.replace(/\D/g, '');
  const valid = digits.length === 12;

  return (
    <div className="mt-6 space-y-6">
      <ol className="list-decimal space-y-1.5 pl-5 text-[0.9375rem] leading-relaxed text-slate-700">
        <li>{t('booking.upi.step1', { amount: rupees(amount) })}</li>
        <li>{t('booking.upi.step2')}</li>
        <li>{t('booking.upi.step3')}</li>
      </ol>

      <div className="grid items-center gap-6 rounded-2xl border border-slate-200 bg-surface p-5 sm:grid-cols-[auto_1fr]">
        {qr && (
          <img
            src={qr}
            alt={t('booking.upi.qrAlt')}
            width="176"
            height="176"
            className="mx-auto rounded-lg bg-paper p-2"
          />
        )}
        <div>
          <p className="text-sm text-slate-500">{t('booking.upi.payTo')}</p>
          <p className="font-medium text-slate-900">{upi.payeeName}</p>
          <p className="mt-3 text-sm text-slate-500">{t('booking.upi.idLabel')}</p>
          <p className="flex flex-wrap items-center gap-3">
            <span className="break-all font-mono text-lg font-semibold text-slate-900">{upi.id}</span>
            <button type="button" onClick={copy} className="btn-secondary !px-3 !py-1.5 text-sm">
              {copied ? t('booking.upi.copied') : t('booking.upi.copy')}
            </button>
          </p>
          <p className="mt-3 text-sm text-slate-500">{t('booking.upi.amountLabel')}</p>
          <p className="text-xl font-semibold text-slate-900">{rupees(amount)}</p>
          <a href={upi.link} className="btn-primary mt-4 w-full sm:w-auto">
            {t('booking.upi.openApp')}
          </a>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-[0.9375rem] text-red-900">
          {error}
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) onSubmit(digits);
        }}
        noValidate
      >
        <label htmlFor="utr" className="label">{t('booking.upi.utrLabel')}</label>
        <input
          id="utr"
          inputMode="numeric"
          autoComplete="off"
          maxLength={14}
          value={utr}
          onChange={(e) => setUtr(e.target.value)}
          className="input"
          placeholder="123456789012"
          aria-describedby="utr-help"
        />
        <p id="utr-help" className="mt-1.5 text-sm text-slate-500">{t('booking.upi.utrHelp')}</p>

        <button type="submit" disabled={!valid || busy} className="btn-primary mt-5 w-full text-base">
          {busy ? t('booking.upi.submitting') : t('booking.upi.submit')}
        </button>
        <button type="button" onClick={onCancel} disabled={busy} className="btn-secondary mt-3 w-full">
          {t('booking.upi.cancel', { id: bookingId })}
        </button>
        <p className="mt-3 text-sm text-slate-500">{t('booking.upi.holdNote')}</p>
      </form>
    </div>
  );
}

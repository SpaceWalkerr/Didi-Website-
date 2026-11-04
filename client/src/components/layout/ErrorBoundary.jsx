import { Component } from 'react';
import { CONTACT, waLink } from '@shared/practice.config.js';

/**
 * Last line of defence: a render error anywhere below this would otherwise
 * blank the whole page, leaving a patient with nothing — not even a way to
 * reach the clinic. This is a class because React only catches render errors
 * in class components. It sits above the i18n provider, so its wording is
 * fixed in English and Hindi rather than looked up.
 */
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error('Render error:', error, info?.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" style={{ maxWidth: 480, margin: '15vh auto', padding: 24, textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ fontSize: 24, marginBottom: 12 }}>Something went wrong</h1>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>
          Sorry — this page failed to load. Please refresh. Your booking is not affected. If it keeps
          happening, message the clinic on WhatsApp ({CONTACT.whatsappDisplay}).
        </p>
        <p style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => window.location.reload()} style={{ padding: '10px 18px', borderRadius: 10, border: 0, background: '#0f8078', color: '#fff', fontSize: 16 }}>
            Refresh
          </button>
          <a href={waLink('Hello, the website is not loading for me.')} style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid #cbd5e1', color: '#0f172a', textDecoration: 'none', fontSize: 16 }}>
            WhatsApp the clinic
          </a>
        </p>
      </div>
    );
  }
}

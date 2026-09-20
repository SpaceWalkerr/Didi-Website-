import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useI18n } from './i18n/index.jsx';
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';
import SkipLink from './components/layout/SkipLink.jsx';
import WhatsAppFab from './components/layout/WhatsAppFab.jsx';
import ScrollToTop from './components/layout/ScrollToTop.jsx';
import Home from './pages/Home.jsx';

/**
 * Home is imported eagerly — it is the landing page, and code-splitting it
 * would only add a round trip before anything renders. Every other route is
 * lazy, so a first-time visitor on a phone downloads the home page and nothing
 * else. The booking and admin pages are the heaviest and the least often
 * visited, which is exactly the trade this makes.
 */
const About = lazy(() => import('./pages/About.jsx'));
const Services = lazy(() => import('./pages/Services.jsx'));
const Faq = lazy(() => import('./pages/Faq.jsx'));
const Booking = lazy(() => import('./pages/Booking.jsx'));
const Confirmation = lazy(() => import('./pages/Confirmation.jsx'));
const Contact = lazy(() => import('./pages/Contact.jsx'));
const Privacy = lazy(() => import('./pages/Privacy.jsx'));
const Terms = lazy(() => import('./pages/Terms.jsx'));
const Refund = lazy(() => import('./pages/Refund.jsx'));
const Admin = lazy(() => import('./pages/Admin.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

/**
 * Reserves vertical space while a route chunk loads, so the footer does not
 * jump up the page and then back down — that jump is a layout shift, and it
 * is visible on a slow connection, which is exactly when it matters.
 */
function RouteFallback() {
  const { t } = useI18n();
  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-24">
      <p className="text-slate-500" role="status">
        {t('common.loading')}
      </p>
    </div>
  );
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink />
      <ScrollToTop />
      <Navbar />

      <main id="main" tabIndex={-1} className="flex-1">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/book" element={<Booking />} />
            <Route path="/confirmation/:bookingId" element={<Confirmation />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/refund" element={<Refund />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      <Footer />
      <WhatsAppFab />
    </div>
  );
}

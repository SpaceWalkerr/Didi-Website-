import { Suspense, lazy } from 'react';
import { createBrowserRouter, Outlet, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';
import SkipLink from './components/layout/SkipLink.jsx';
import WhatsAppFab from './components/layout/WhatsAppFab.jsx';
import ScrollToTop from './components/layout/ScrollToTop.jsx';
import { PageSkeleton } from './design/Skeleton.jsx';
import Home from './pages/Home.jsx';

/**
 * Home is imported eagerly — it is the landing page, and code-splitting it
 * would only add a round trip before anything renders. Every other route is
 * lazy, so a first-time visitor on a phone downloads the home page and nothing
 * else.
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
const Account = lazy(() => import('./pages/Account.jsx'));
const Admin = lazy(() => import('./pages/Admin.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

/** Browsers without view transitions get a short CSS fade on route change instead. */
const supportsViewTransitions = typeof document !== 'undefined' && 'startViewTransition' in document;

function Layout() {
  const { pathname } = useLocation();
  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink />
      <ScrollToTop />
      <Navbar />

      <main
        id="main"
        tabIndex={-1}
        key={supportsViewTransitions ? undefined : pathname}
        className={`flex-1 focus:outline-none ${supportsViewTransitions ? '' : 'route-fade'}`}
      >
        {/* The skeleton reserves height while a route chunk loads, so the
            footer does not jump up the page and back down (layout shift). */}
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </main>

      <Footer />
      <WhatsAppFab />
    </div>
  );
}

export const router = createBrowserRouter(
  [
    {
      element: <Layout />,
      children: [
        { path: '/', element: <Home /> },
        { path: '/about', element: <About /> },
        { path: '/services', element: <Services /> },
        { path: '/faq', element: <Faq /> },
        { path: '/book', element: <Booking /> },
        { path: '/confirmation/:bookingId', element: <Confirmation /> },
        { path: '/contact', element: <Contact /> },
        { path: '/privacy', element: <Privacy /> },
        { path: '/terms', element: <Terms /> },
        { path: '/refund', element: <Refund /> },
        { path: '/account', element: <Account /> },
        { path: '/admin', element: <Admin /> },
        { path: '*', element: <NotFound /> },
      ],
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  },
);

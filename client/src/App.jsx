import { Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import WhatsAppButton from './components/WhatsAppButton.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Services from './pages/Services.jsx';
import Booking from './pages/Booking.jsx';
import Confirmation from './pages/Confirmation.jsx';
import Contact from './pages/Contact.jsx';
import Admin from './pages/Admin.jsx';

function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <p className="eyebrow">Error 404</p>
      <h1 className="mt-2 text-3xl">We couldn’t find that page</h1>
      <p className="mx-auto mt-3 max-w-md text-slate-600">
        The link may be out of date. You can head back to the home page or book a consultation
        directly.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-secondary">
          Back to home
        </Link>
        <Link to="/book" className="btn-primary">
          Book a consultation
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/book" element={<Booking />} />
          <Route path="/confirmation/:bookingId" element={<Confirmation />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

/**
 * schema.org JSON-LD for the practice, built from practice.config.js.
 *
 * Injected into index.html at build time (client/vite.config.js), so crawlers
 * that do not run JavaScript still read it, and a corrected fee or registration
 * cannot be right on the page and wrong in the structured data.
 *
 * Claims are limited to verifiable facts: qualification, council, registration
 * number, fees, hours, languages. No aggregateRating: the practice has no
 * published reviews, and inventing them would be false and a policy violation.
 */
import { AVAILABILITY, BRAND, CONTACT, DOCTOR, SERVICES, STARTING_PRICE } from './practice.config.js';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const openingHours = () =>
  Object.entries(AVAILABILITY).flatMap(([weekday, windows]) =>
    windows.map(([opens, closes]) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `https://schema.org/${DAY_NAMES[Number(weekday)]}`,
      opens,
      closes,
    })),
  );

export function buildPracticeSchema() {
  const site = BRAND.siteUrl;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        // Physician is itself a MedicalBusiness; both types are listed so
        // consumers that only look for one still match.
        '@type': ['Physician', 'MedicalBusiness'],
        '@id': `${site}/#physician`,
        name: DOCTOR.name,
        url: site,
        image: `${site}${DOCTOR.photoUrl}`,
        logo: `${site}/images/icon-512.png`,
        description: `${DOCTOR.qualification}, ${DOCTOR.specialty}. Online consultations over WhatsApp for everyday health concerns.`,
        medicalSpecialty: 'https://schema.org/PrimaryCare',
        telephone: `+${CONTACT.whatsappNumber}`,
        email: CONTACT.email,
        isAcceptingNewPatients: true,
        knowsLanguage: ['en', 'hi'],
        availableLanguage: ['English', 'Hindi'],
        hasCredential: {
          '@type': 'EducationalOccupationalCredential',
          credentialCategory: 'Medical registration',
          identifier: DOCTOR.registrationNumber,
          recognizedBy: { '@type': 'Organization', name: DOCTOR.council },
        },
        memberOf: { '@type': 'Organization', name: DOCTOR.council },
        // Online only: there is no street address, and claiming one would be false.
        areaServed: { '@type': 'Country', name: 'India' },
        priceRange: `₹${STARTING_PRICE}–₹${Math.max(...SERVICES.map((s) => s.price))}`,
        currenciesAccepted: 'INR',
        openingHoursSpecification: openingHours(),
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Online consultations',
          itemListElement: SERVICES.map((service) => ({
            '@type': 'Offer',
            name: service.name,
            price: String(service.price),
            priceCurrency: 'INR',
            itemOffered: {
              '@type': 'Service',
              name: service.name,
              serviceType: 'Online medical consultation',
              hoursAvailable: `${service.durationMinutes} minutes`,
            },
          })),
        },
        potentialAction: {
          '@type': 'ReserveAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${site}/book`,
            actionPlatform: ['https://schema.org/DesktopWebPlatform', 'https://schema.org/MobileWebPlatform'],
          },
          result: { '@type': 'Reservation', name: 'Online consultation' },
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${site}/#website`,
        url: site,
        name: BRAND.name,
        inLanguage: ['en-IN', 'hi-IN', 'pa-IN'],
        publisher: { '@id': `${site}/#physician` },
      },
    ],
  };
}

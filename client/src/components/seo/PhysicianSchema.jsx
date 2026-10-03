import { BRAND, CONTACT, DOCTOR, SERVICES, STARTING_PRICE, AVAILABILITY } from '@shared/practice.config.js';

/**
 * schema.org Physician markup.
 *
 * Built from the shared config rather than hand-written into index.html, so a
 * corrected registration number or fee cannot end up right on the page and
 * wrong in the structured data — which is the failure mode that matters here,
 * since search engines may surface the markup instead of the page.
 *
 * Claims are kept to things that are verifiable and true: qualification,
 * council, registration number, fees, hours. No aggregateRating, because the
 * practice has no reviews yet and inventing them would be both a lie and a
 * structured-data policy violation.
 */

const DAY_NAMES = [
  'https://schema.org/Sunday',
  'https://schema.org/Monday',
  'https://schema.org/Tuesday',
  'https://schema.org/Wednesday',
  'https://schema.org/Thursday',
  'https://schema.org/Friday',
  'https://schema.org/Saturday',
];

/** AVAILABILITY → one OpeningHoursSpecification per window per day. */
const openingHours = () =>
  Object.entries(AVAILABILITY).flatMap(([weekday, windows]) =>
    windows.map(([opens, closes]) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: DAY_NAMES[Number(weekday)],
      opens,
      closes,
    })),
  );

export default function PhysicianSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Physician',
    '@id': `${BRAND.siteUrl}/#physician`,
    name: DOCTOR.name,
    url: BRAND.siteUrl,
    image: `${BRAND.siteUrl}${DOCTOR.photoUrl}`,
    description: `${DOCTOR.qualification}, ${DOCTOR.specialty}. Online consultations for everyday health concerns.`,
    medicalSpecialty: 'https://schema.org/PrimaryCare',
    telephone: `+${CONTACT.whatsappNumber}`,
    email: CONTACT.email,

    // The registration the Telemedicine Practice Guidelines require to be
    // published, expressed in a form a search engine can read.
    hasCredential: {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'Medical registration',
      identifier: DOCTOR.registrationNumber,
      recognizedBy: { '@type': 'Organization', name: DOCTOR.council },
    },
    memberOf: { '@type': 'Organization', name: DOCTOR.council },

    // Online only: no street address to give, and claiming one would be false.
    areaServed: { '@type': 'Country', name: 'India' },
    availableService: SERVICES.map((service) => ({
      '@type': 'MedicalProcedure',
      name: service.name,
      procedureType: 'https://schema.org/NoninvasiveProcedure',
    })),
    makesOffer: SERVICES.map((service) => ({
      '@type': 'Offer',
      name: service.name,
      price: String(service.price),
      priceCurrency: 'INR',
      availabilityStarts: undefined,
    })),
    priceRange: `₹${STARTING_PRICE}+`,
    currenciesAccepted: 'INR',
    openingHoursSpecification: openingHours(),

    potentialAction: {
      '@type': 'ReserveAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BRAND.siteUrl}/book`,
        actionPlatform: [
          'https://schema.org/DesktopWebPlatform',
          'https://schema.org/MobileWebPlatform',
        ],
      },
      result: { '@type': 'Reservation', name: 'Online consultation' },
    },
  };

  return (
    <script
      type="application/ld+json"
      // The content is built from local config, never from user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

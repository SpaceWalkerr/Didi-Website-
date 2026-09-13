/**
 * English — the reference dictionary.
 *
 * Every other language file mirrors these keys. Anything missing in another
 * language falls back to the English string here, so a partial translation
 * degrades gracefully instead of showing a blank or a raw key.
 */
export default {
  meta: { name: 'English', nativeName: 'English', locale: 'en-IN', dir: 'ltr' },

  doctor: {
    name: 'Dr. Richa Rani',
    qualification: 'MBBS, MD',
    specialty: 'General Physician',
    council: 'Bihar State Medical Council',
    tagline: 'Careful, unhurried online consultations for everyday health concerns.',
    shortBio:
      'I am a general physician trained in internal medicine. I treat common infections, fevers, ' +
      'lifestyle conditions such as diabetes and hypertension, and the everyday complaints that do ' +
      'not need a hospital visit — with enough time to actually listen.',
    longBio: [
      'I completed my MBBS followed by post-graduate training in general medicine, and have worked ' +
        'in hospital outpatient and inpatient care since. Much of what I saw there were ordinary ' +
        'problems that had been left far too long, often because getting to a doctor was the hard part.',
      'Most everyday health problems do not need a waiting room. A structured conversation, a ' +
        'careful history and a look at your reports can resolve a great deal — and when it cannot, ' +
        'I will say so plainly and help you find the right specialist or in-person care.',
      'I consult online for patients across India, and follow the Telemedicine Practice Guidelines ' +
        'issued by the Board of Governors in supersession of the Medical Council of India in March 2020.',
    ],
    credentials: [
      { title: 'MBBS', detail: '[Medical College Name], [Year]' },
      { title: 'MD — General Medicine', detail: '[Institute Name], [Year]' },
      { title: 'Registered medical practitioner', detail: 'Bihar State Medical Council — Reg. No. 52532' },
      { title: 'Certificate in Telemedicine', detail: 'As required under the 2020 Telemedicine Practice Guidelines' },
    ],
    focusAreas: [
      'Fever, infections and seasonal illness',
      'Diabetes, blood pressure and thyroid follow-up',
      'Digestive and acidity complaints',
      'Respiratory problems, cough and allergies',
      'Report interpretation and preventive health',
      'Medication review and second opinions',
    ],
    languagesSpoken: 'Hindi, English',
  },

  common: {
    book: 'Book Consultation',
    bookShort: 'Book',
    askQuestion: 'Ask a question',
    chatWhatsApp: 'Chat on WhatsApp',
    messageClinic: 'Message the clinic',
    backHome: 'Back to home',
    loading: 'Loading…',
    minutes: '{count} minutes',
    minutesShort: '{count} min',
    perConsultation: 'per consultation',
    needHelp: 'Need help booking?',
    seeServices: 'See services & fees',
    regNo: 'Reg. No. {number}',
    languageLabel: 'Language',
    changeLanguage: 'Change language',
  },

  nav: {
    home: 'Home',
    about: 'About',
    services: 'Services',
    contact: 'Contact',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    aria: 'Main',
  },

  home: {
    badge: 'Accepting online consultations',
    stats: { experience: 'Years of practice', typical: 'Typical consultation', starting: 'Starting fee' },
    consultingToday: 'Consulting today',
    photoPlaceholder: 'Doctor’s photograph',
    photoHint: 'Replace client/public/images/doctor-photo.png',
    stepsEyebrow: 'How it works',
    stepsTitle: 'Three steps, about two minutes',
    stepsBody: 'The whole process is designed for a phone. No account to create, no app to download.',
    steps: [
      { title: 'Pick a time', body: 'Choose a consultation type and a slot that suits you, up to 30 days ahead.' },
      { title: 'Share your details & pay', body: 'A short form about your symptoms, then a secure payment. Your slot is held while you pay.' },
      { title: 'Consult on WhatsApp', body: 'You get a WhatsApp link by email and SMS. Tap it at the scheduled time to begin.' },
    ],
    trustEyebrow: 'Why patients choose this practice',
    trustTitle: 'Real medicine, delivered calmly',
    trust: [
      { title: '{years}+ years in practice', body: 'Training and experience in hospital outpatient and inpatient medicine.' },
      { title: 'Unhurried consultations', body: 'Slots are long enough for a proper history — not a two-minute conversation.' },
      { title: 'Registered & compliant', body: 'Reg. No. {reg}, {council}. Practising under the 2020 Telemedicine Practice Guidelines.' },
      { title: 'Consult from anywhere', body: 'All you need is WhatsApp and a stable connection. No apps to install, no travel.' },
    ],
    focusEyebrow: 'What I treat',
    focusTitle: 'Everyday problems that don’t need a waiting room',
    focusBody:
      'If your concern needs a physical examination, imaging or hospital care, I will tell you so ' +
      'during the consultation and point you to the right next step.',
    ctaTitle: 'Ready to talk to a doctor?',
    ctaBody: 'Pick a slot that works for you. You’ll get a WhatsApp link to join at the scheduled time.',
    ctaWhatsApp: 'Message on WhatsApp',
  },

  about: {
    eyebrow: 'About the doctor',
    title: 'Meet {name}',
    photoPlaceholder: 'Photograph placeholder',
    photoHint: 'Set photoUrl in src/config.js',
    verifiedTitle: 'Verified registration',
    verifiedBody:
      'Registration details are published as required by the Telemedicine Practice Guidelines, 2020. ' +
      'They can be checked on the National Medical Commission register.',
    backgroundTitle: 'Background',
    registrationTitle: 'Registration & credentials',
    rows: {
      name: 'Full name',
      qualification: 'Qualification',
      specialty: 'Specialty',
      registration: 'Registration number',
      council: 'Registered with',
      experience: 'Years of experience',
      languages: 'Languages',
    },
    yearsValue: '{years} years',
    credentialsTitle: 'Qualifications & training',
    focusTitle: 'Areas of focus',
    hoursTitle: 'Consulting hours',
  },

  services: {
    eyebrow: 'Services & fees',
    title: 'Consultation types',
    description:
      'Clear, fixed fees. You pay for the doctor’s time — there are no platform charges, ' +
      'subscriptions or hidden extras.',
    loading: 'Loading services…',
    loadError: 'We couldn’t load the current fees ({error}). Please message the clinic on WhatsApp and we’ll help you book.',
    bookThis: 'Book this consultation',
    mostBooked: 'Most booked',
    items: {
      general: {
        name: 'General Consultation',
        description:
          'For a new health concern — fever, infections, aches, digestive issues, skin problems, ' +
          'lifestyle disease review and prescriptions.',
        includes: [
          'Video consultation with the doctor',
          'Digital prescription where appropriate',
          'Advice on tests, if any are needed',
          'One free follow-up message within 48 hours',
        ],
      },
      followup: {
        name: 'Follow-up Consultation',
        description:
          'For patients seen in the last 30 days. Review of reports, response to treatment and ' +
          'adjustment of an existing prescription.',
        includes: [
          'For patients consulted in the last 30 days',
          'Review of reports and response to treatment',
          'Adjustment of the existing prescription',
        ],
      },
      'second-opinion': {
        name: 'Second Opinion',
        description:
          'A detailed review of an existing diagnosis, prescription or investigation reports, with ' +
          'a written summary of the opinion.',
        includes: [
          'Detailed review of your diagnosis and reports',
          'Written summary of the opinion afterwards',
          'Guidance on whether further specialist input is needed',
        ],
      },
    },
    paymentTitle: 'Payment',
    paymentBody:
      'Fees are paid online at the time of booking through Razorpay, which accepts UPI, cards, net ' +
      'banking and wallets. Card details are handled entirely by the payment gateway and never reach ' +
      'this website.',
    refundTitle: 'Rescheduling & refunds',
    refundBody:
      'Reschedule free of charge up to 4 hours before your slot. Cancel more than 4 hours ahead for a ' +
      'full refund. If the doctor has to cancel, you are refunded in full or offered the next ' +
      'available slot, whichever you prefer.',
    faqTitle: 'Common questions',
    faqs: [
      {
        q: 'How does the consultation actually happen?',
        a: 'Once your payment is confirmed you receive a WhatsApp link by email and SMS. Tap it at your scheduled time and the consultation begins on WhatsApp — audio, video or chat, whichever suits you and the problem.',
      },
      {
        q: 'Will I get a prescription?',
        a: 'Where it is clinically appropriate, yes — a digital prescription signed by the doctor. Some conditions need an in-person examination first, and certain categories of medicine cannot be prescribed over a teleconsultation under the 2020 Telemedicine Practice Guidelines.',
      },
      {
        q: 'What should I keep ready?',
        a: 'A list of your current medicines, any recent test reports or prescriptions, and readings such as blood pressure or sugar if you monitor them at home. Photographs of reports can be sent on WhatsApp before the consultation.',
      },
      {
        q: 'What if I need to reschedule or cancel?',
        a: 'Message the clinic on WhatsApp at least 4 hours before your slot and it will be moved at no extra cost. Cancellations made more than 4 hours ahead are refunded in full; later than that, the fee covers the reserved time.',
      },
      {
        q: 'Is my information private?',
        a: 'Your details are used only for your care. Records are kept confidential in line with the Telemedicine Practice Guidelines and the Digital Personal Data Protection Act, 2023, and are never sold or shared for marketing.',
      },
    ],
  },

  booking: {
    eyebrow: 'Book a consultation',
    title: 'Choose a time that suits you',
    description:
      'Pick a slot, tell the doctor what’s troubling you, and pay securely. You’ll get a WhatsApp ' +
      'link to join at your scheduled time.',
    steps: ['Choose a slot', 'Your details', 'Payment'],
    demoTitle: 'Demo mode.',
    demoBody:
      'No Razorpay keys are configured, so payments are simulated and no money will be charged. ' +
      'Add test keys to server/.env to use Razorpay test mode.',
    step1Title: '1. Choose your consultation',
    consultationType: 'Consultation type',
    date: 'Date',
    today: 'Today',
    availableTimes: 'Available times (IST)',
    noConsultDay: 'The doctor does not consult on this date. Please pick another day.',
    allBooked: 'All slots on this date are taken. Please try another day, or {link} if it’s urgent.',
    allBookedLink: 'message the clinic',
    alreadyBooked: 'Already booked',
    continue: 'Continue',
    step2Title: '2. Patient details',
    step2Body: 'Please fill this in for the person who will be consulting.',
    fields: {
      name: 'Full name *',
      age: 'Age',
      gender: 'Gender',
      genderUnspecified: 'Prefer not to say',
      genderFemale: 'Female',
      genderMale: 'Male',
      genderOther: 'Other',
      phone: 'Mobile number *',
      phonePlaceholder: '10-digit mobile number',
      phoneHint: 'Use the number that has WhatsApp — the consultation link goes here.',
      email: 'Email *',
      symptoms: 'What would you like to discuss? *',
      symptomsPlaceholder:
        'Your main complaint, how long it has been going on, any medicines you are taking, and any relevant history.',
      symptomsHint:
        'The more detail you give, the more of the consultation can go into advice. Reports can be sent on WhatsApp before your slot.',
    },
    consent:
      'I consent to an online consultation and confirm the details above are correct. I understand ' +
      'the doctor may advise an in-person examination if the condition needs one, and that this ' +
      'service is not for emergencies.',
    pay: 'Pay {amount} & confirm',
    paying: 'Opening secure payment…',
    secureNote: 'Payments are processed by Razorpay. Card details never touch this website.',
    summaryTitle: 'Booking summary',
    summary: { consultation: 'Consultation', duration: 'Duration', when: 'When', total: 'Total', notSelected: 'Not selected' },
    holdNote:
      'Slots are held for {hold} minutes while you pay. Bookings open up to {days} days ahead and ' +
      'close {lead} minutes before the slot.',
    unavailableTitle: 'Booking is temporarily unavailable',
    unavailableBody:
      'We couldn’t reach the clinic’s booking system ({error}). Please message us on WhatsApp and we ' +
      'will book your slot manually.',
    unavailableCta: 'Book over WhatsApp',
    progressAria: 'Booking progress',
  },

  confirmation: {
    confirmedTitle: 'Your consultation is confirmed',
    pendingTitle: 'Payment not completed',
    confirmedBody: 'A confirmation has been sent to {email} and by SMS to {phone}. Please be ready a few minutes early.',
    pendingBody:
      'This booking is still marked as {status}. If money was deducted, message the clinic with your ' +
      'booking ID and it will be sorted out.',
    rows: { id: 'Booking ID', patient: 'Patient', consultation: 'Consultation', when: 'Date & time', amount: 'Amount' },
    joinTitle: 'How to join',
    joinBody:
      'At {when}, tap the button below. It opens WhatsApp with a message already written — just send ' +
      'it, and the doctor will start the consultation.',
    joinCta: 'Join on WhatsApp at your slot time',
    joinNote: 'Save this page or the email — the same link works any time before your slot.',
    beforeTitle: 'Before your consultation',
    beforeItems: [
      'Send any reports, prescriptions or photographs on WhatsApp beforehand so the doctor can review them.',
      'Keep a list of the medicines you currently take, with doses.',
      'Find a quiet spot with a decent network connection.',
      'To reschedule, message the clinic at least 4 hours before your slot.',
    ],
    loadingBooking: 'Loading your booking…',
    notFoundTitle: 'We couldn’t find that booking',
    questionMessage: 'Hello, I have a question about my booking {id}.',
    emergencySuffix: 'For non-urgent queries, WhatsApp {number}.',
  },

  contact: {
    eyebrow: 'Contact',
    title: 'Get in touch',
    description:
      'WhatsApp is the quickest way to reach the clinic for anything that isn’t a booking — questions ' +
      'about fees, rescheduling, or whether an online consultation is right for your problem.',
    whatsappTitle: 'WhatsApp',
    whatsappBody: 'Tap to open a chat with a message already written. {note}',
    responseNote: 'WhatsApp messages are usually answered within a few hours on working days.',
    emailTitle: 'Email',
    emailBody: 'For reports, documents and anything you would rather write out in full.',
    phoneTitle: 'Phone',
    phoneBody: 'Calls are answered during consulting hours only; WhatsApp is usually faster.',
    emergencyTitle: 'In an emergency',
    hoursTitle: 'Clinic hours',
    hoursNote: 'All times are Indian Standard Time.',
    selfServiceTitle: 'Booking is self-service',
    selfServiceBody:
      'You don’t need to call to get an appointment — available slots are shown live on the booking ' +
      'page and confirmed the moment payment goes through.',
    onlineOnly:
      'This is an online-only practice. Consultations take place over WhatsApp; there is no walk-in ' +
      'clinic address.',
  },

  hours: {
    weekdays: 'Monday – Friday',
    weekdaysTime: '9:00 AM – 1:00 PM, 5:00 PM – 8:00 PM',
    saturday: 'Saturday',
    saturdayTime: '10:00 AM – 1:00 PM',
    sunday: 'Sunday',
    sundayTime: 'Closed',
  },

  whatsapp: {
    default: 'Hello {doctor}, I found your website and would like to ask about an online consultation.',
    booking: 'Hello {doctor}, I need help booking an online consultation.',
    contact: 'Hello {doctor}, I have a question about your consultation services.',
    buttonAria: 'Chat with the clinic on WhatsApp at {number}',
  },

  emergency: {
    label: 'Not for emergencies.',
    notice:
      'Online consultation is not suitable for emergencies. If you have chest pain, breathlessness, ' +
      'severe bleeding, fainting, a seizure, a serious injury or thoughts of self-harm, call 112 ' +
      '(or 108 for an ambulance) or go to the nearest hospital immediately.',
  },

  footer: {
    quickLinks: 'Quick links',
    getInTouch: 'Get in touch',
    aboutLink: 'About the doctor',
    servicesLink: 'Services & fees',
    bookLink: 'Book a consultation',
    disclaimerLabel: 'Telemedicine disclaimer.',
    disclaimer1:
      'Consultations offered through this website are provided in accordance with the Telemedicine ' +
      'Practice Guidelines notified on 25 March 2020 by the Board of Governors in supersession of the ' +
      'Medical Council of India, which form Appendix 5 to the Indian Medical Council (Professional ' +
      'Conduct, Etiquette and Ethics) Regulations, 2002. The consulting doctor is a registered medical ' +
      'practitioner and their registration number and council are displayed above. Patient consent is ' +
      'recorded at the time of booking.',
    disclaimer2:
      'The doctor decides, at their professional discretion, whether a condition can be managed over a ' +
      'teleconsultation or requires an in-person examination, and may advise you to seek physical care ' +
      'instead. Prescriptions are issued only where clinically appropriate, and medicines listed as ' +
      'prohibited for telemedicine (including Schedule X drugs and narcotic and psychotropic ' +
      'substances) will not be prescribed. Information you share is treated as confidential and handled ' +
      'under the Digital Personal Data Protection Act, 2023.',
    disclaimer3:
      'Content on this website is for general information and does not replace a consultation, ' +
      'diagnosis or treatment by a qualified doctor. Fees paid cover the doctor’s professional time; ' +
      'outcomes cannot be guaranteed. Please read the cancellation and refund terms before booking.',
    // Shown only in non-English languages.
    translationNote:
      'This page has been translated for your convenience. In case of any difference in meaning, the ' +
      'English version of these terms is authoritative.',
    rights: '© {year} {name}. All rights reserved.',
    clinicLogin: 'Clinic login',
  },

  errors: {
    network: 'We could not reach the clinic server. Please try again.',
    generic: 'Something went wrong on our side. Please try again.',
    name: 'Please enter the patient’s full name.',
    phone: 'Please enter a valid 10-digit Indian mobile number.',
    email: 'Please enter a valid email address.',
    symptoms: 'Please describe the symptoms in at least a sentence.',
    age: 'Please enter a valid age.',
    consent: 'Patient consent is required under the Telemedicine Practice Guidelines.',
    fieldsInvalid: 'Please correct the highlighted fields.',
    slotTaken: 'That slot has just been taken. Please choose another.',
    slotPast: 'That slot is too soon — please pick a later time.',
    slotOutsideHours: 'That time is outside consulting hours.',
    slotInvalidDate: 'Please choose a valid date.',
    slotTooFar: 'Bookings open only {days} days in advance.',
    bookingNotFound: 'Booking not found.',
    paymentUnverified: 'Payment could not be verified. You have not been charged.',
    paymentMismatch: 'Payment does not match this booking.',
    paymentCancelled: 'Payment was cancelled. Your slot has been released.',
    paymentFailed: 'The payment failed. You have not been charged.',
    checkoutUnavailable: 'The payment window could not load. Please check your connection and retry.',
    slotLostAfterPayment:
      'Your payment went through but the slot was taken while you were paying. We will contact you to ' +
      'reschedule or refund.',
  },

  notFound: {
    eyebrow: 'Error 404',
    title: 'We couldn’t find that page',
    body: 'The link may be out of date. You can head back to the home page or book a consultation directly.',
  },
};

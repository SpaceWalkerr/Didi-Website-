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
    qualification: 'MBBS',
    specialty: 'General Physician',
    council: 'Bihar State Medical Council',
    tagline: 'Careful, unhurried online consultations for everyday health concerns.',
    shortBio:
      'I am a general physician trained in internal medicine. I treat common infections, fevers, ' +
      'lifestyle conditions such as diabetes and hypertension, and the everyday complaints that do ' +
      'not need a hospital visit — with enough time to actually listen.',
    longBio: [
      'I completed my MBBS and have worked in hospital outpatient and inpatient care since. Much of what I saw there were ordinary ' +
        'problems that had been left far too long, often because getting to a doctor was the hard part.',
      'Most everyday health problems do not need a waiting room. A structured conversation, a ' +
        'careful history and a look at your reports can resolve a great deal — and when it cannot, ' +
        'I will say so plainly and help you find the right specialist or in-person care.',
      'I consult online for patients across India, and follow the Telemedicine Practice Guidelines ' +
        'issued by the Board of Governors in supersession of the Medical Council of India in March 2020.',
    ],
    credentials: [
      { title: 'MBBS' },
      { title: 'General medicine', detail: 'Hospital outpatient and inpatient experience' },
      { title: 'Registered medical practitioner', detail: 'Bihar State Medical Council — Reg. No. 52532' },
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
    photoAlt: 'Portrait of {name}, general physician',
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
    readPolicies: 'Read the full policy',
    skipToContent: 'Skip to main content',
    regNo: 'Reg. No. {number}',
    languageLabel: 'Language',
    changeLanguage: 'Change language',
  },

  nav: {
    home: 'Home',
    about: 'About',
    services: 'Services',
    contact: 'Contact',
    faq: 'FAQ',
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
    gradPhotoAlt: 'Dr. Richa Rani at her convocation, holding her degree',
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
  },

  booking: {
    prefillArea: 'Area of concern: {area}. ',
    prefillTopic: 'Area of concern: {area} — {topic}. ',
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
    bodyMap: 'Hello {doctor}, I would like to ask about a concern related to {area}.',
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
    legalTitle: 'Policies',
    getInTouch: 'Get in touch',
    aboutLink: 'About the doctor',
    servicesLink: 'Services & fees',
    bookLink: 'Book a consultation',
    faqLink: 'Frequently asked questions',
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

  bodyMap: {
    eyebrow: 'Where does it hurt?',
    title: 'Find your concern on the body map',
    lede:
      'Tap the part of the body that is troubling you. You’ll see what a general physician is most ' +
      'often asked about for that area, and you can carry it straight into a booking.',
    viewLabel: 'Body view',
    view: { front: 'Front', back: 'Back' },
    figureLabel: 'Interactive body diagram, {view} view. Select an area to see common concerns.',
    hint: 'Tap an area of the figure',
    chipsTitle: 'Or choose from the list',
    emptyTitle: 'Where is the problem?',
    emptyBody:
      'Select an area on the figure, or pick from the list below it, and you’ll see the concerns ' +
      'most commonly brought to a general physician for that part of the body.',
    panelEyebrow: 'Commonly seen',
    concernsTitle: 'Common concerns',
    concernsHint: 'Choosing one just fills in the first line of the booking form. You can change it there.',
    askInstead: 'Ask first',
    announce: '{area} selected',
    footnote:
      'This map is a guide to what can be discussed in a consultation — it is not a diagnosis and ' +
      'does not tell you what you have. Only a doctor who has taken your history can do that.',
    regions: {
      head: {
        label: 'Head & face',
        summary: 'Headaches, fever, sinus trouble and the everyday complaints above the neck.',
        urgentNote:
          'A sudden severe headache unlike any you have had before, or a headache with weakness on ' +
          'one side, slurred speech, a drooping face, confusion or a fit, needs emergency care now — ' +
          'call 112 or go to the nearest hospital instead of booking.',
        concerns: [
          'Headache or migraine',
          'Fever with body ache',
          'Dizziness or light-headedness',
          'Blocked nose and sinus pain',
        ],
      },
      throat: {
        label: 'Throat & neck',
        summary: 'Sore throats, coughs, voice changes and thyroid follow-up.',
        concerns: ['Sore throat', 'Cough and cold', 'Hoarse voice', 'Thyroid review'],
      },
      chest: {
        label: 'Chest & breathing',
        summary: 'Cough, wheeze, breathlessness and asthma review.',
        urgentNote:
          'Chest pain, pressure or tightness — especially with sweating, breathlessness, or pain ' +
          'spreading to the arm, jaw or back — is an emergency. Call 112 or go to the nearest ' +
          'hospital immediately rather than booking a consultation.',
        concerns: [
          'A cough that will not settle',
          'Breathlessness on exertion',
          'Wheezing or asthma review',
          'Palpitations',
        ],
      },
      abdomen: {
        label: 'Stomach & abdomen',
        summary: 'Acidity, indigestion, bowel changes and appetite problems.',
        concerns: [
          'Acidity and heartburn',
          'Stomach pain or cramps',
          'Loose motions or vomiting',
          'Constipation and bloating',
        ],
      },
      pelvis: {
        label: 'Urinary & pelvic',
        summary: 'Urinary discomfort and menstrual concerns.',
        concerns: [
          'Burning when passing urine',
          'Passing urine too often',
          'Lower abdominal discomfort',
          'Irregular periods',
        ],
      },
      arms: {
        label: 'Arms, hands & joints',
        summary: 'Joint pain, stiffness and swelling in the shoulders, arms and hands.',
        concerns: [
          'Joint pain or stiffness',
          'Shoulder or elbow pain',
          'Wrist and hand pain',
          'Numbness or tingling',
        ],
      },
      legs: {
        label: 'Legs, knees & feet',
        summary: 'Knee and ankle pain, swelling and cramps.',
        concerns: ['Knee pain', 'Ankle or foot pain', 'Swelling in the legs', 'Muscle cramps'],
      },
      neck: {
        label: 'Neck & shoulders',
        summary: 'Stiffness and strain at the base of the neck and across the shoulders.',
        concerns: [
          'Neck stiffness',
          'Pain spreading to the shoulder',
          'Strain from desk or phone use',
          'Headache starting at the neck',
        ],
      },
      upperBack: {
        label: 'Upper back',
        summary: 'Aching and muscular strain between the shoulder blades.',
        concerns: [
          'Upper back ache',
          'Pain between the shoulder blades',
          'Muscle strain',
          'Pain worse after sitting',
        ],
      },
      lowerBack: {
        label: 'Lower back',
        summary: 'Low back pain, stiffness and strain.',
        concerns: [
          'Lower back pain',
          'Pain after lifting',
          'Stiffness in the morning',
          'Pain travelling down the leg',
        ],
      },
      hips: {
        label: 'Hips',
        summary: 'Hip and buttock pain, and pain that comes on when walking.',
        concerns: ['Hip joint pain', 'Pain climbing stairs', 'Pain when walking', 'Stiffness after rest'],
      },
      calves: {
        label: 'Calves & lower legs',
        summary: 'Cramps, heaviness and swelling below the knee.',
        concerns: [
          'Calf pain or cramps',
          'Swelling in the lower leg',
          'Heaviness after standing',
          'Night cramps',
        ],
      },
      skin: {
        label: 'Skin & hair',
        summary: 'Rashes, itching, infections and hair fall — anywhere on the body.',
        concerns: ['Rash or itching', 'Fungal infection', 'Acne', 'Hair fall'],
      },
    },
  },

  conditions: {
    eyebrow: 'What I help with',
    title: 'Everyday medicine, handled properly',
    lede:
      'The bread and butter of general practice. If your problem needs an examination, a scan or ' +
      'hospital care, you will be told that plainly rather than sold a consultation.',
    items: [
      {
        title: 'Common illnesses',
        body: 'Fever, infections, cough and cold, stomach upsets, aches and the seasonal complaints that come and go.',
      },
      {
        title: 'Follow-ups',
        body: 'Reviewing how you have responded to treatment and adjusting the plan — after a recent illness or for an ongoing condition.',
      },
      {
        title: 'Prescription renewals',
        body: 'Continuing a medicine you are already on, where that is clinically appropriate, after reviewing how you are doing on it.',
      },
      {
        title: 'Lab report review',
        body: 'Going through blood tests, scans and reports, and explaining in plain language what they do and do not show.',
      },
      {
        title: 'Second opinions',
        body: 'A careful, independent look at a diagnosis or prescription you have already been given elsewhere.',
      },
      {
        title: 'Long-term conditions',
        body: 'Routine review of diabetes, blood pressure and thyroid, including what your numbers actually mean day to day.',
      },
    ],
  },

  testimonials: {
    eyebrow: 'Patient feedback',
    title: 'What patients say',
    placeholderLabel: 'Placeholder — not real reviews',
    placeholderBody:
      'The cards below are layout placeholders. They will be replaced with genuine patient feedback ' +
      'once the practice has collected it, with written consent. Nothing shown here describes a real ' +
      'patient or a real consultation.',
    consentNote:
      'Feedback is published only with the patient’s written consent, and never includes clinical details.',
    items: [
      { quote: 'A short line of patient feedback will appear here.', name: 'Patient name', meta: 'Consultation type · Month Year' },
      { quote: 'A second placeholder quote sits in this card.', name: 'Patient name', meta: 'Consultation type · Month Year' },
      { quote: 'And a third, so the layout can be checked at full width.', name: 'Patient name', meta: 'Consultation type · Month Year' },
    ],
  },

  faq: {
    eyebrow: 'Questions',
    title: 'Frequently asked questions',
    lede: 'Fees, timings, prescriptions, privacy — and what happens if your problem needs to be seen in person.',
    stillStuckTitle: 'Still not sure?',
    stillStuckBody:
      'Message the clinic on WhatsApp before you book. If an online consultation is not right for ' +
      'your problem, you will be told so rather than sold a slot.',
    items: [
      {
        q: 'What does a consultation cost?',
        a: 'Fees start at ₹{price}. The full price of each consultation type is shown on the services page before you pay anything. The fee covers the doctor’s time — there are no platform charges, subscriptions or hidden extras.',
      },
      {
        q: 'When can I book a slot?',
        a: 'Consulting hours are Monday to Friday, {weekdaysTime}, and Saturday {saturdayTime} (Indian Standard Time). Sunday is closed. Slots open up to 30 days ahead and close one hour before the appointment time.',
      },
      {
        q: 'How does the consultation actually happen?',
        a: 'Once your payment is confirmed you receive a WhatsApp link by email and SMS. Tap it at your scheduled time and the consultation begins on WhatsApp — audio, video or chat, whichever suits you and the problem.',
      },
      {
        q: 'Will I get a prescription?',
        a: 'Where it is clinically appropriate, yes — a digital prescription signed by the doctor. Some conditions need an in-person examination first, and certain categories of medicine cannot be prescribed over a teleconsultation under the 2020 Telemedicine Practice Guidelines.',
      },
      {
        q: 'What if I need to be examined in person?',
        a: 'Some problems cannot be assessed safely over a call. If that is the case, the doctor will say so during the consultation and tell you what kind of in-person care to look for — a local clinic, a specialist, or a hospital if it is urgent.',
      },
      {
        q: 'What should I keep ready?',
        a: 'A list of the medicines you currently take with their doses, any recent test reports or prescriptions, and readings such as blood pressure or sugar if you monitor them at home. Photographs of reports can be sent on WhatsApp before your slot.',
      },
      {
        q: 'What if I need to reschedule or cancel?',
        a: 'Message the clinic on WhatsApp at least 4 hours before your slot and it will be moved at no extra cost. Cancellations made more than 4 hours ahead are refunded in full; later than that, the fee covers the time that was reserved for you.',
      },
      {
        q: 'Is my information private?',
        a: 'Your details are used only for your care. Records are kept confidential in line with the Telemedicine Practice Guidelines and the Digital Personal Data Protection Act, 2023, and are never sold or shared for marketing. The privacy policy sets out exactly what is collected and how long it is kept.',
      },
    ],
  },

  legal: {
    updated: 'Last updated {date}',
    authoritative:
      'This page has been translated for your convenience. If there is any difference in meaning, ' +
      'the English version of these terms governs.',
    contactTitle: 'Questions about this policy',
    contactBody: 'Write to {email}, or message the clinic on WhatsApp at {phone}.',

    privacy: {
      navLabel: 'Privacy policy',
      title: 'Privacy policy',
      lede:
        'This practice collects health information, which deserves careful handling. This page sets ' +
        'out exactly what is collected, why, who can see it and how long it is kept.',
      sections: [
        {
          h: 'Who this policy comes from',
          p: [
            'This website is operated by {doctor}, {qualification}, a registered medical practitioner (Reg. No. {reg}, {council}). The doctor is the person responsible for the health information collected here.',
            'There is no company, hospital or platform behind this site, and no third party buys, sells or brokers access to what you share.',
          ],
        },
        {
          h: 'What is collected',
          p: [
            'When you book, you provide: your name, age, gender if you choose to give it, mobile number, email address, and a description of the symptoms or concern you want to discuss.',
            'During and after the consultation, the doctor records clinical notes and any prescription issued, as a registered practitioner is required to do.',
            'For payment, a record of the amount, the payment reference and whether it succeeded is kept. Card, UPI and banking details are handled entirely by Razorpay and never reach this website’s servers.',
            'The web server keeps ordinary technical logs — IP address, browser type and the time of the request — which are used to keep the site running and secure, not to profile you.',
          ],
        },
        {
          h: 'Why it is collected',
          p: [
            'To provide the consultation you booked, to keep the medical record required of a registered practitioner, to take and reconcile payment, and to contact you about your own appointment.',
            'Your information is not used for advertising, and no automated decision is made about your care.',
          ],
        },
        {
          h: 'Your consent',
          p: [
            'You tick a consent box before booking. That consent covers the consultation itself and the keeping of the record it produces.',
            'You may withdraw consent for future contact at any time by messaging the clinic. Clinical records already created cannot be deleted on request, because a registered practitioner is obliged to retain them — but they stop being used for anything other than that obligation.',
          ],
        },
        {
          h: 'Who it is shared with',
          p: [
            'Razorpay, to process your payment. They receive the amount and your contact details, not your clinical information.',
            'A pharmacy, laboratory or another doctor, only where you ask for a prescription or referral to be sent, or where the doctor is referring you onward for your care and tells you so.',
            'A court, regulator or authority, where disclosure is required by Indian law.',
            'Nobody else. Your information is never sold, rented or shared for marketing.',
          ],
        },
        {
          h: 'How long it is kept',
          p: [
            'Clinical records and prescriptions are retained for at least three years from the date of the consultation, in line with medical record-keeping requirements.',
            'Payment and invoice records are retained for as long as tax law requires.',
            'Technical server logs are kept for a short operational period and then discarded.',
          ],
        },
        {
          h: 'How it is protected',
          p: [
            'The site is served over HTTPS, so what you send is encrypted in transit. The booking database is not publicly reachable, and the clinic administration page is password protected and used only by the doctor.',
            'No system is perfectly secure. If a breach ever affects your information, you will be told, along with what happened and what to do.',
          ],
        },
        {
          h: 'Your rights',
          p: [
            'Under the Digital Personal Data Protection Act, 2023, you may ask for a copy of the personal information held about you, ask for inaccurate details to be corrected, ask what it has been used for, and nominate someone to act for you.',
            'To exercise any of these, contact the doctor using the details below. You will get a response within a reasonable period, and you may escalate to the Data Protection Board of India if you are not satisfied.',
          ],
        },
      ],
    },

    terms: {
      navLabel: 'Terms of service',
      title: 'Terms of service',
      lede:
        'What this service is, what it is not, and what you and the doctor each agree to when you ' +
        'book a consultation.',
      sections: [
        {
          h: 'What this service is',
          p: [
            'An online consultation with {doctor}, {qualification}, a registered medical practitioner (Reg. No. {reg}, {council}), conducted by video, audio or chat.',
            'Consultations follow the Telemedicine Practice Guidelines notified on 25 March 2020, which form Appendix 5 to the Indian Medical Council (Professional Conduct, Etiquette and Ethics) Regulations, 2002.',
            'This is an online-only practice. There is no walk-in clinic and no physical examination is possible.',
          ],
        },
        {
          h: 'This service is not for emergencies',
          p: [
            'Do not use this website if you or someone else may be seriously unwell. Chest pain, breathlessness, severe bleeding, fainting, a fit, a serious injury, a suspected stroke or thoughts of self-harm all need emergency care immediately.',
            'Call 112, call 108 for an ambulance, or go to the nearest hospital. Booking a slot here will delay the care you need.',
          ],
        },
        {
          h: 'The doctor’s clinical judgement',
          p: [
            'The doctor decides whether your problem can be managed safely over a teleconsultation. If it cannot, they will tell you during the consultation and advise what in-person care to seek.',
            'The doctor may decline to continue a consultation where doing so would not be safe or appropriate. Where a consultation is ended for that reason and little or no clinical time has been used, the fee is refunded.',
          ],
        },
        {
          h: 'Prescriptions',
          p: [
            'A prescription is issued only where it is clinically appropriate after the consultation. Booking and paying does not entitle you to one.',
            'Medicines listed as prohibited for telemedicine — including Schedule X drugs and narcotic and psychotropic substances — will not be prescribed under any circumstances.',
          ],
        },
        {
          h: 'What you agree to',
          p: [
            'To give accurate information about your symptoms, history and current medicines. A consultation is only as good as what it is based on.',
            'That you are 18 or older, or that a parent or guardian is present and consenting if the patient is a minor.',
            'That you are booking for yourself or for someone who has agreed to the consultation.',
            'Not to record the consultation without the doctor’s knowledge and agreement.',
          ],
        },
        {
          h: 'Fees and payment',
          p: [
            'Fees are shown in full before payment and are charged in Indian rupees through Razorpay. Your slot is held while you pay and confirmed once the payment is verified.',
            'Cancellation, rescheduling and refund terms are set out on the refund policy page.',
          ],
        },
        {
          h: 'No guarantee of outcome',
          p: [
            'The fee pays for the doctor’s professional time, attention and advice. It does not buy a particular diagnosis, a prescription, a cure or a guaranteed result, and no such outcome is promised anywhere on this site.',
            'Information published on this website is general and does not replace a consultation, diagnosis or treatment by a qualified doctor.',
          ],
        },
        {
          h: 'Governing law',
          p: [
            'These terms are governed by the laws of India, and the courts of Bihar have jurisdiction over any dispute arising from them.',
          ],
        },
      ],
    },

    refund: {
      navLabel: 'Cancellation & refund policy',
      title: 'Cancellation & refund policy',
      lede:
        'Plain terms, applied consistently. If something goes wrong on the clinic’s side, you are ' +
        'not out of pocket.',
      sections: [
        {
          h: 'Rescheduling',
          p: [
            'Message the clinic on WhatsApp at least 4 hours before your slot and it will be moved to another available time at no extra cost.',
            'A booking can be rescheduled twice. After that, please cancel and book afresh.',
          ],
        },
        {
          h: 'If you cancel',
          p: [
            'Cancel more than 4 hours before your slot and you are refunded in full.',
            'Cancel within 4 hours of your slot and the fee is retained, because the time was reserved for you and can no longer be offered to another patient.',
          ],
        },
        {
          h: 'If the doctor cancels',
          p: [
            'You are refunded in full, or offered the next available slot — whichever you prefer. This applies however close to the appointment the cancellation happens.',
          ],
        },
        {
          h: 'If the consultation could not take place',
          p: [
            'If a technical failure on the clinic’s side prevents the consultation, you are refunded in full or rebooked at no cost.',
            'If the connection fails partway through, the doctor will attempt to continue on a call. Where a meaningful consultation was not possible, the fee is refunded or carried to a new slot.',
          ],
        },
        {
          h: 'If you do not attend',
          p: [
            'If you cannot be reached for 10 minutes after your slot begins and have not messaged the clinic, the consultation is marked as missed and the fee is not refunded.',
            'If something genuinely went wrong at your end, message the clinic and it will be looked at reasonably rather than mechanically.',
          ],
        },
        {
          h: 'How refunds are paid',
          p: [
            'Refunds go back through Razorpay to the method you paid with. There is no cash or alternative-account option.',
            'Razorpay typically takes 5 to 7 working days to return the money to your account, and sometimes longer for cards. The clinic issues the refund promptly; the timeline after that is the bank’s.',
          ],
        },
        {
          h: 'How to request one',
          p: [
            'Message the clinic on WhatsApp at {phone} with your booking ID, or email {email}. Requests are acknowledged within one working day.',
          ],
        },
      ],
    },
  },

  notFound: {
    eyebrow: 'Error 404',
    title: 'We couldn’t find that page',
    body: 'The link may be out of date. You can head back to the home page or book a consultation directly.',
  },
};

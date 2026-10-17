/**
 * START HERE. All names, dates, photographs, and section switches live here.
 * The entries below are sample content, not confirmed wedding arrangements.
 * Colours and fonts live separately in styles/theme.css.
 */
export const wedding = {
  id: 'ivory-garden-v1',
  site: {
    title: 'Bride & Groom · Wedding Invitation',
    description:
      'Together with our families, we invite you to celebrate a beautiful new beginning.',
    url: 'https://zamanmughal98.github.io/Zaman-Wedding-Invitation/',
    previewImage: '/assets/images/ivory-envelope.png',
    language: 'en',
    locale: 'en-GB',
    timeZone: 'Asia/Karachi',
    preview: true, // Remove the preview label when the details are confirmed.
  },
  // Turn sections off without deleting code. Array order sets page order.
  sections: [
    { id: 'home', enabled: true },
    { id: 'countdown', enabled: true },
    { id: 'save-the-date', enabled: true },
    { id: 'couple', enabled: true },
    { id: 'celebrations', enabled: true },
    { id: 'families', enabled: true },
    { id: 'story', enabled: true },
    { id: 'gallery', enabled: true },
    { id: 'venue', enabled: true },
    { id: 'dress-code', enabled: true },
    { id: 'rsvp', enabled: true },
    { id: 'wishes', enabled: true },
  ],
  navigation: [
    { section: 'home', label: 'Invitation' },
    { section: 'celebrations', label: 'Celebrations' },
    { section: 'gallery', label: 'Moments' },
    { section: 'rsvp', label: 'RSVP' },
  ],
  couple: {
    bride: {
      name: 'Bride',
      fullName: "The Bride's Name",
      initial: 'B',
      parents: 'With the blessings of her parents',
      bio: 'A little about the bride, in her own words.',
      photo: null,
      photoPosition: 'center 30%',
      social: null,
    },
    groom: {
      name: 'Groom',
      fullName: "The Groom's Name",
      initial: 'G',
      parents: 'With the blessings of his parents',
      bio: 'A little about the groom, in his own words.',
      photo: null,
      photoPosition: 'center 30%',
      social: null,
    },
    hashtag: '#OurForeverBegins',
    quote: 'Do dil, ek naya safar.',
  },
  invitation: {
    eyebrow: 'The wedding celebration of',
    together: 'Together with their families',
    arabic: 'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ',
    transliteration: 'In the name of Allah, the Most Gracious, the Most Merciful',
    verse: 'And We created you in pairs',
    verseSource: 'Surah An-Naba · 78:8',
    greeting: 'With love, laughter & your duas',
    message:
      'With hearts full of gratitude and the blessings of our families, we invite you to share in the joy of our beautiful new beginning.',
    closing: 'Your presence will make our celebration complete.',
    date: '2027-06-12T16:00:00+05:00', // Always include the actual event's UTC offset.
    city: 'A beautiful celebration awaits',
    heroPhoto: null, // e.g. '/assets/photos/couple.webp'
    heroPhotoPosition: 'center 25%',
  },
  envelope: { enabled: true, image: '/assets/images/ivory-envelope.png', rememberForSession: true },
  countdown: {
    eyebrow: 'Every moment brings us closer',
    title: 'Counting down to forever',
    message:
      'Until our families come together, our hearts say qubool hai, and a new chapter begins.',
    completed: 'Our forever has begun',
  },
  events: [
    {
      id: 'mehndi',
      name: 'Mehndi',
      urdu: 'مہندی',
      eyebrow: 'An evening of colour & joy',
      description:
        'Henna-stained hands, familiar melodies, and a little magic. Join us for an evening filled with laughter and celebration.',
      start: '2027-06-10T19:00:00+05:00',
      end: '2027-06-10T23:00:00+05:00',
      venue: 'Venue to be announced',
      address: '',
      mapsUrl: null,
      dressCode: 'Shades of green & gold',
      tone: 'green',
      illustration: 'garden',
    },
    {
      id: 'nikah',
      name: 'Nikah',
      urdu: 'نکاح',
      eyebrow: 'Two souls. One beautiful promise.',
      description:
        'In the presence of those we hold dear, we begin our forever. Please join us with your love and heartfelt duas.',
      start: '2027-06-12T16:00:00+05:00',
      end: '2027-06-12T17:30:00+05:00',
      venue: 'Venue to be announced',
      address: '',
      mapsUrl: null,
      dressCode: 'Ivory & soft pastels',
      tone: 'gold',
      illustration: 'arch',
    },
    {
      id: 'baraat',
      name: 'Baraat & Rukhsati',
      urdu: 'بارات',
      eyebrow: 'A celebration of togetherness',
      description:
        'An evening of warm welcomes, cherished traditions, and the joining of two families. We would love to celebrate with you.',
      start: '2027-06-12T19:00:00+05:00',
      end: '2027-06-12T23:00:00+05:00',
      venue: 'Venue to be announced',
      address: '',
      mapsUrl: null,
      dressCode: 'Traditional festive attire',
      tone: 'rose',
      illustration: 'palace',
    },
    {
      id: 'walima',
      name: 'Walima',
      urdu: 'ولیمہ',
      eyebrow: 'The first chapter of forever',
      description:
        'With grateful hearts, we welcome you to an evening of good company, warm wishes, and the joy of a new beginning.',
      start: '2027-06-13T19:00:00+05:00',
      end: '2027-06-13T23:00:00+05:00',
      venue: 'Venue to be announced',
      address: '',
      mapsUrl: null,
      dressCode: 'Elegant evening wear',
      tone: 'green',
      illustration: 'garden',
    },
  ],
  families: [
    {
      label: "The groom's family",
      name: 'Dulha Khandaan',
      message: 'With the blessings and heartfelt duas of our loved ones.',
      members: [
        { name: 'Parents of the groom', role: 'With love & blessings' },
        { name: "The groom's siblings", role: 'The welcoming committee' },
      ],
    },
    {
      label: "The bride's family",
      name: 'Dulhan Khandaan',
      message: 'With hearts full of love, we welcome you to our celebration.',
      members: [
        { name: 'Parents of the bride', role: 'With love & blessings' },
        { name: "The bride's siblings", role: 'The joyful hosts' },
      ],
    },
  ],
  story: {
    title: 'Written in the stars',
    subtitle: 'Every love story is beautiful. This one is ours.',
    milestones: [
      {
        label: 'The beginning',
        title: 'When our paths crossed',
        text: 'The story of how we first met will find its home here.',
      },
      {
        label: 'A beautiful yes',
        title: 'A promise for tomorrow',
        text: 'A favourite memory, a special moment, and the beginning of forever.',
      },
      {
        label: '12 June 2027',
        title: 'Our next chapter',
        text: 'Surrounded by our families and friends, we begin a lifetime together.',
      },
    ],
  },
  gallery: {
    title: 'Moments of togetherness',
    subtitle: 'A little collection of the memories we hold close.',
    // Add src and alt to any entry. The illustration disappears automatically.
    photos: [
      {
        src: null,
        alt: '',
        caption: 'A beautiful beginning',
        illustration: 'garden',
        position: 'center',
      },
      {
        src: null,
        alt: '',
        caption: 'Little moments, lasting memories',
        illustration: 'arch',
        position: 'center',
      },
      {
        src: null,
        alt: '',
        caption: 'With our favourite people',
        illustration: 'palace',
        position: 'center',
      },
      {
        src: null,
        alt: '',
        caption: 'A lifetime of celebrations',
        illustration: 'garden',
        position: 'center',
      },
    ],
  },
  venue: {
    primaryEventId: 'nikah',
    message: 'A special place, made more beautiful by the people in it.',
  },
  dressCode: {
    title: 'Dressed for the occasion',
    subtitle: 'Wear something you love. Bring your brightest smile.',
    swatches: ['ivory', 'green', 'gold', 'blush'],
  },
  rsvp: {
    deadline: '2027-05-25T23:59:00+05:00',
    maxGuests: 10,
    endpoint: null, // Optional HTTPS endpoint accepting JSON. No backend is required for previews.
    contactPhone: null, // International digits only, e.g. '923001234567'. Enables WhatsApp confirmation.
    message: 'We have saved you a place in our hearts. Let us know if you can join us.',
  },
  wishes: { enabled: true, maxLength: 500 },
  music: { enabled: true, src: null, volume: 0.15, ambientFallback: true },
  contacts: [
    { name: "The bride's family", role: 'For a little help along the way', phone: null },
    { name: "The groom's family", role: 'We would love to hear from you', phone: null },
  ],
};

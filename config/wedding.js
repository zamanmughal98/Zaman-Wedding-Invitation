/** Confirmed details from the printed card and latest schedule.
 * Empty times, venues, and dress codes are awaiting confirmation.
 * Hide or restore optional sections using the switches below.
 */
export const wedding = {
  id: 'zaman-nimra-2026',
  site: {
    title: 'Zaman Mughal & Nimra Shafiq · Wedding Celebrations',
    description:
      'Join Zaman Mughal and Nimra Shafiq for their wedding celebrations, 12–15 November 2026. Walima: Sunday, 15 November, 7:00 PM, Royal Vista Event Complex, Attock City.',
    url: 'https://zamanmughal98.github.io/Zaman-Wedding-Invitation/',
    previewImage: '/assets/images/ivory-envelope.png',
    language: 'en',
    locale: 'en-GB',
    timeZone: 'Asia/Karachi',
    preview: false,
  },
  sections: [
    {
      id: 'home',
      enabled: true,
    },
    {
      id: 'countdown',
      enabled: true,
    },
    {
      id: 'save-the-date',
      enabled: true,
    },
    {
      id: 'couple',
      enabled: true,
    },
    {
      id: 'celebrations',
      enabled: true,
    },
    {
      id: 'families',
      enabled: true,
    },
    {
      id: 'story',
      enabled: false,
    },
    {
      id: 'gallery',
      enabled: true,
    },
    {
      id: 'venue',
      enabled: true,
    },
    {
      id: 'dress-code',
      enabled: true,
    },
    {
      id: 'rsvp',
      enabled: false,
    },
    {
      id: 'photo-uploads',
      enabled: true,
    },
    {
      id: 'wishes',
      enabled: true,
    },
  ],
  navigation: [
    {
      section: 'home',
      label: 'Invitation',
    },
    {
      section: 'celebrations',
      label: 'Celebrations',
    },
    {
      section: 'photo-uploads',
      label: 'Photos',
    },
    {
      section: 'wishes',
      label: 'Wishes',
    },
  ],
  couple: {
    bride: {
      name: 'Nimra',
      fullName: 'Nimra Shafiq',
      initial: 'N',
      parents: 'Daughter of Mr. & Mrs. Shafiq',
      bio: '',
      // Add your childhood photograph here when it is ready.
      photo: null,
      photoAlt: 'Nimra as a child',
      photoPosition: 'center 30%',
      social: null,
    },
    groom: {
      name: 'Zaman',
      fullName: 'Zaman Mughal',
      initial: 'Z',
      parents: 'Son of Mr. & Mrs. Ishfaq Mughal',
      bio: '',
      // Add your childhood photograph here when it is ready.
      photo: null,
      photoAlt: 'Zaman as a child',
      photoPosition: 'center 30%',
      social: null,
    },
    hashtag: '',
    quote: '',
  },
  invitation: {
    eyebrow: 'Celebrating the wedding of',
    together: 'Together with their families',
    hosts: 'Mr. & Mrs. Ishfaq Mughal',
    hostMessage:
      'Request the honour of your presence at the wedding celebrations of their beloved',
    arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    transliteration: 'In the name of Allah, the Most Gracious, the Most Merciful',
    verse: 'And We created you in pairs',
    verseSource: 'Surah An-Naba · 78:8',
    greeting: 'With love, blessings & your duas',
    message:
      'With our families and the people closest to us, we look forward to celebrating this beautiful new beginning.',
    closing: 'We look forward to celebrating with you.',
    date: '2026-11-14',
    period: '12–15 November 2026',
    city: 'Attock, Pakistan',
    heroPhoto: null,
    heroPhotoPosition: 'center 25%',
    heroVideo: null,
    heroVideoPoster: null,
  },
  envelope: {
    enabled: true,
    image: '/assets/images/ivory-envelope.png',
  },
  countdown: {
    eyebrow: 'An evening to look forward to',
    title: 'Until our Walima',
    message: 'Join us for our wedding reception on Sunday, 15 November, at 7:00 PM.',
    targetDate: '2026-11-15T19:00:00+05:00',
    completed: 'Thank you for celebrating with us',
  },
  events: [
    {
      id: 'bride-mehndi',
      name: 'Nimra’s Mehndi',
      urdu: 'مہندی',
      eyebrow: 'The bride’s celebration',
      description: 'An evening of Mehndi with Nimra and her family.',
      date: '2026-11-12',
      start: null,
      end: null,
      timeLabel: 'Evening · Time to follow',
      venue: 'Zaraat Colony',
      address: 'Near University of Education, Attock Campus, Attock City',
      mapsUrl: null,
      dressCode: '',
      tone: 'beige',
      illustration: 'botanical',
    },
    {
      id: 'groom-mehndi',
      name: 'Zaman’s Mehndi',
      urdu: 'مہندی',
      eyebrow: 'The groom’s celebration',
      description: 'An evening of Mehndi with Zaman and his family.',
      date: '2026-11-13',
      start: null,
      end: null,
      timeLabel: 'Evening · Time to follow',
      venue: 'Masha Allah Marriage Hall',
      address: 'Attock City',
      mapsUrl: null,
      dressCode: '',
      tone: 'sand',
      illustration: 'botanical',
    },
    {
      id: 'nikah-barat',
      name: 'Nikah & Barat',
      urdu: 'نکاح و بارات',
      eyebrow: 'The beginning of our forever',
      description: 'Join our families as we celebrate our Nikah and Barat together.',
      date: '2026-11-14',
      start: null,
      end: null,
      timeLabel: 'Evening · Time to follow',
      venue: 'Zamzama Marriage Hall',
      address: 'Attock Cantt',
      mapsUrl: null,
      dressCode: '',
      tone: 'brown',
      illustration: 'botanical',
    },
    {
      id: 'walima',
      name: 'Walima Reception',
      urdu: 'ولیمہ',
      eyebrow: 'With grateful hearts',
      description:
        'Mr. & Mrs. Ishfaq Mughal request the honour of your presence at the wedding reception of Zaman Mughal and Nimra Shafiq.',
      date: '2026-11-15',
      start: '2026-11-15T19:00:00+05:00',
      end: null,
      timeLabel: '7:00 PM',
      venue: 'Royal Vista Event Complex',
      address: 'Attock City',
      mapsUrl: null,
      dressCode: '',
      tone: 'ivory',
      illustration: 'botanical',
    },
  ],
  families: [
    {
      label: 'With love & blessings',
      name: 'Mr. & Mrs. Ishfaq Mughal',
      message:
        'Welcoming you to the wedding celebrations of their beloved, Zaman Mughal, and Nimra Shafiq.',
      members: [],
    },
  ],
  story: {
    title: 'Our story',
    subtitle: '',
    milestones: [],
  },
  gallery: {
    title: 'Moments of togetherness',
    subtitle: 'A place for the memories we will make together.',
    photos: [],
  },
  venue: {
    primaryEventId: 'walima',
    message: 'Our Walima reception · Sunday, 15 November 2026, at 7:00 PM.',
  },
  dressCode: {
    title: 'Dressed for the occasion',
    subtitle: 'Dress details will be shared with you soon.',
    swatches: [],
  },
  responses: {
    email: 'zamanbinishfaq+wedding@gmail.com',
  },
  rsvp: {
    deadline: null,
    maxGuests: 10,
    contactPhone: '923490095926',
    message: 'We would love to know if you can celebrate with us.',
  },
  wishes: {
    enabled: true,
    maxLength: 500,
    publishedFile: '/data/wishes.json',
    // Paste only the public /exec deployment URL; the moderator key stays in your email.
    googleScriptUrl:
      'https://script.google.com/macros/s/AKfycbzleNjgh9fz45xKNPbJ6tBSVrOiSzY6qvIBoujXUCcOMSmQlZu9wsAqKOuD96isMxvG/exec',
    message: 'Leave a dua, a memory, or a little love for the journey ahead.',
  },
  photos: {
    title: 'Share your moments',
    message: 'Help us keep the memories you capture, shared privately with our family.',
    // A separate photo uploader; keep the working wishes deployment unchanged.
    googleScriptUrl:
      'https://script.google.com/macros/s/AKfycbxLrHpj5Y1xFS0rkubZsn61IdLMO3QFdaFh-xdy4u-Jb9OKUx6VdeFqq8FUPrSUBNu8/exec',
  },
  music: {
    enabled: true,
    src: null,
    volume: 0.15,
    ambientFallback: true,
  },
  contacts: [
    {
      name: 'Zaighum Mughal',
      role: 'Looking forward · For any assistance',
      phone: '+92 349 0095926',
    },
  ],
};

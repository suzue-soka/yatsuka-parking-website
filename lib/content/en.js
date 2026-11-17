// English. The Japanese version is the official one.
const en = {
  name: 'Yatsuka Station East Exit Parking',
  description:
    'A 24-hour, 300-space multi-storey car park about a 3-minute walk from the East Exit of Yatsuka Station (Soka, Saitama). Hourly and monthly parking, EV charging and Times Car Share. Height limit 2.10 m — large cars and SUVs welcome.',
  meta: {
    title: 'Parking at Yatsuka Station | Yatsuka Station East Exit Parking',
    template: '%s | Yatsuka Station East Exit Parking',
    skip: 'Skip to main content',
    ogAlt: 'Outside view of Yatsuka Station East Exit Parking',
  },
  walk: 'About a 3-minute walk from the East Exit of Yatsuka Station',
  addressFull: '1-7-20 Sezaki, Soka-shi, Saitama',
  owner: { name: 'Suzue Co., Ltd.', address: '1-7-20 Sezaki, Soka-shi, Saitama' },
  support: { name: 'AMS Customer Support Center', operator: 'Amano Management Service Corporation', hours: '24 hours, 365 days', tel: '0120-935-624', telHref: 'tel:0120935624', telLabel: 'Toll-free (from within Japan)' },
  yen: (n) => `¥${n}`,

  nav: {
    rates: 'Rates',
    calc: 'Fee calculator',
    access: 'Access',
    monthly: 'Monthly parking',
    support: 'Help',
    partners: 'Partner stores',
    login: 'Partner login',
    myPage: 'Partner page',
    adminPage: 'Admin',
    logout: 'Log out',
    menu: 'Menu',
    menuOpen: 'Open menu',
    mainMenu: 'Main menu',
    mainMenuMobile: 'Main menu (mobile)',
    quick: 'Quick links',
    call: 'Call',
    toTop: 'Home',
    language: 'Language',
  },

  hero: {
    eyebrow: 'Soka, Saitama · Yatsuka Station, Tobu Skytree Line',
    h1: ['Multi-storey car park', 'right by Yatsuka Station', 'Monthly', 'Hourly'],
    lead: 'Both are available.',
    cta: { rates: 'See rates', calc: 'Calculate the fee', access: 'Access', monthly: 'Monthly parking' },
    facts: [
      ['Open 24 hours', '300 spaces', 'EV charging', 'Car sharing'],
      ['3 min walk to station', 'Indoor parking', 'Elevator', 'Restroom'],
      ['Security cameras', 'ALSOK security'],
    ],
    imgAlt: 'Outside view of Yatsuka Station East Exit Parking, a multi-storey car park',
  },

  news: {
    title: 'News',
    all: 'All news',
    back: '← All news',
    metaDesc: 'Notices about construction, maintenance and rate changes at Yatsuka Station East Exit Parking.',
    categories: { お知らせ: 'Notice', 工事: 'Construction', メンテナンス: 'Maintenance', 料金改定: 'Rate change' },
    translationNote: 'This is a translation. If it differs from the Japanese notice, the Japanese version applies.',
  },

  rates: {
    title: 'Rates',
    subtitle: 'Hourly parking',
    max: 'Maximum',
    cards: [
      { key: 'day', band: 'Daytime', hours: '8:00–22:00', price: '100', per: '20 min', cap: '1,200', accent: true },
      { key: 'night', band: 'Night', hours: '22:00–8:00', price: '100', per: '60 min', cap: '600', accent: false },
    ],
    notes: [
      'All prices include tax.',
      'Payment: cash. From 2 Feb 2027, also ¥10,000 notes, credit card and transport IC cards (PASMO, Suica, etc.)',
      'Partner stores can cover your parking fee — ask at the store.',
    ],
  },

  calc: {
    title: 'Parking fee calculator',
    intro: 'Enter your arrival and departure date and time to see an estimate. Times use the 24-hour clock, Japan time (JST).',
    arrive: 'Arrival',
    leave: 'Departure',
    date: (l) => `${l} date`,
    hour: (l) => `${l} hour (24-hour clock)`,
    minute: (l) => `${l} minute`,
    from: 'From arrival:',
    preset: (h) => `${h} h`,
    estimate: 'Estimated fee (incl. tax)',
    free: (n) => `Free: ${n} minutes or less`,
    duration: 'Parking time',
    day: 'Daytime',
    night: 'Night',
    kinds: { day: 'Daytime', night: 'Night' },
    breakdown: (n) => `Breakdown by period (${n})`,
    th: ['Period', 'Date and time', 'Time', 'Fee'],
    capped: 'maximum applied',
    units: (n) => `${n} ${n === 1 ? 'unit' : 'units'}`,
    nextDay: (s) => `${s} (+1 day)`,
    errors: {
      invalid: 'Please enter the arrival and departure dates.',
      order: 'Departure must be after arrival.',
      too_long: (d) => `The calculator covers up to ${d} days. For long stays, please consider monthly parking.`,
    },
    notes: [
      'This is an estimate. The amount shown on the pay station is final.',
      'In each period, any part of a unit (20 min in the daytime, 60 min at night) is charged as a full unit.',
      'The maximum charge applies to each period (daytime 8:00–22:00: ¥1,200; night 22:00–8:00: ¥600).',
    ],
    monthlyNote: ['Partner-store and other discounts are not included. For long stays, please consider ', 'monthly parking', '.'],
  },

  access: {
    title: 'Access',
    items: ['About a 3-minute walk from the East Exit of Yatsuka Station (Tobu Skytree Line)', 'Front: two entrances and two exits', 'Back: one entrance, straight in from Nikko-kaido Avenue', 'Height limit 2.10 m'],
    directions: 'Directions in Google Maps',
    mapTitle: 'Map of Yatsuka Station East Exit Parking',
    navNote: 'For car navigation, enter the Japanese address or phone number:',
  },

  facility: {
    title: 'Facilities',
    items: [
      { icon: 'h24', t: 'Open 24 hours', d: 'All year round' },
      { icon: 'station', t: 'About 3 minutes from the station', d: 'Tobu Isesaki Line, handy for park and ride' },
      { icon: 'capacity', t: 'Space for 300 cars', d: 'Self-park, four floors plus roof' },
      { icon: 'max', t: 'Maximum fees', d: 'Day ¥1,200, night ¥600' },
      { icon: 'size', t: 'Vehicle size', d: 'Height 2.10 m, length 5.0 m, width 1.9 m', href: '#vehicles' },
      { icon: 'ticketless', t: 'Number plate recognition', d: 'No ticket on entry', note: 'From 2 Feb 2027' },
      { icon: 'monthly', t: 'Monthly contracts', d: 'By the month', href: '#monthly' },
      { icon: 'partner', t: 'Partner store discounts', d: 'Discounts when you use a partner store' },
      { icon: 'support', t: '24-hour support', d: 'Intercom and toll-free number', href: '#support' },
      { icon: 'wheelchair', t: 'Wheelchair-accessible space', d: '1 space (1A, street level)' },
      { icon: 'toiletAccessible', t: 'Restrooms', d: 'Men, women, accessible' },
      { icon: 'elevator', t: 'Elevator', d: '1A–4A and RA' },
      { icon: 'card', t: 'Credit cards', d: 'At the exit pay machine', note: 'From 2 Feb 2027' },
      { icon: 'emoney', t: 'E-money', d: 'Transit IC (PASMO, Suica, etc.)', note: 'From 2 Feb 2027' },
      { icon: 'cash', t: 'Cash', d: 'Coins and notes', note: '¥10,000 notes from 2 Feb 2027' },
      { icon: 'receipt', t: 'Receipts', d: 'Issued when you pay' },
      { icon: 'ev', t: 'EV / PHV charging', d: '4 spaces, 6 kW standard' },
      { icon: 'carshare', t: 'Times Car Share', d: '2 cars, reserved spaces on 2A' },
      { icon: 'camera', t: 'Security cameras', d: 'Throughout the car park' },
      { icon: 'security', t: 'ALSOK security', d: 'Monitored 24 hours' },
    ],
    sideAlt: 'Side view of the car park, with parking on every floor',
    cornerAlt: 'The car park seen from the corner',
  },

  vehicles: {
    title: 'Vehicles that can park',
    example: 'e.g. ',
    ngLabel: 'Not allowed: ',
    ok: [
      { name: 'Kei cars', size: 'Length up to 3.4 m, width up to 1.48 m', ex: 'Alto, N-BOX, Tanto, Wagon R, Move, Hustler, Dayz' },
      { name: 'Compact cars', size: 'Length up to 4.3 m, width up to 1.7 m', ex: 'Aqua, Fit, Note, Freed, Swift, Solio, Passo' },
      { name: 'Mid-size cars', size: 'Length under 4.8 m, width under 1.8 m', ex: 'Prius, Corolla, Impreza, Axela' },
      { name: 'Minivans', size: 'Length under 4.8 m, width under 1.8 m', ex: 'Voxy, Serena, Noah, Step WGN, Esquire' },
      { name: 'Large cars and SUVs', size: 'Length 4.8 m to under 5.0 m, width 1.8 m to under 1.9 m', ex: 'Crown, Alphard, Vellfire, Harrier, X-Trail, CX-5, Forester' },
    ],
    ng: ['trucks and heavy vehicles', 'motorcycles (all two-wheelers)'],
    sep: ', ',
  },

  monthly: {
    title: 'Monthly parking',
    fee: 'Monthly fee',
    feeNote: '(incl. tax and management fees)',
    initial: 'Initial fee',
    initialNote: '(incl. tax, at sign-up only)',
    tags: ['24 h', 'Indoor', 'Multi-storey', 'Paved', 'Large cars & SUVs', 'Gated', 'Any free space'],
    stepsTitle: 'How to apply',
    steps: ['Check availability on Park Direct', 'Apply online (screening)', 'Sign electronically and start parking'],
    cta: 'Check availability on Park Direct',
    note: 'Monthly contracts and payments are handled by Park Direct (Nealle Inc.). Their website is in Japanese.',
  },

  help: {
    title: 'Help',
    intro:
      'The intercom on the pay station (with camera) connects you directly to an operator. For payment problems, a lost parking ticket, accidents or broken equipment, ask the operator on the spot.',
    operatorBy: 'Operated by ',
    langNote: 'The operator may only speak Japanese.',
    cards: [
      { label: 'Hourly parking (fees, payment, accidents, faults)', value: 'Pay-station intercom', extra: ' (24 hours)' },
      { label: 'Monthly parking', value: 'Park Direct' },
      { label: 'Partner program and other enquiries', value: 'owner' },
    ],
  },

  partnerBand: {
    title: 'Become a partner store',
    text: 'With our partner program, your store covers your customers’ parking fee, making it easier for them to visit by car. Everything from sign-up to checking usage and invoices is done online.',
    contact: 'Contact: ',
    features: [
      { t: 'Bring in more customers', d: 'Customers can drive to your store without worrying about parking fees.' },
      { t: 'Check usage any time', d: 'See how many parking discounts were used each day.' },
      { t: 'Invoices online', d: 'Download monthly qualified invoices as PDFs. Pay by bank transfer or card.' },
      { t: 'Easy to set up', d: 'We deliver a pre-configured QR-code discount ticket issuer (free shipping).' },
    ],
  },

  validator: {
    kicker: 'Validation machine for partner stores',
    name: 'Compact QR-code discount ticket issuer',
    alt: 'Compact QR-code discount ticket issuer: a white unit with blue buttons “1” and “2” on top',
    priceNote: '(incl. tax, free shipping)',
    points: [
      'Buttons 1 and 2 issue up to two kinds of parking discount',
      'We set up your discounts before delivery (free shipping)',
      'Small enough to sit next to the register',
      'Paper and other supplies are sold at the official Amano shop',
    ],
  },

  security: {
    title: 'Security',
    items: [
      { t: 'Security cameras', d: 'Security cameras are installed in the car park. Recordings are used only for crime prevention and are managed securely.' },
      { t: 'Encrypted connection', d: 'The whole site uses TLS encryption to protect the information you send.' },
      { t: 'Two-step verification', d: 'Partner portal sign-in is confirmed with a one-time code.' },
      { t: 'No card data stored', d: 'Payments are processed by a payment provider; card numbers are never stored on our servers.' },
      { t: 'Data kept separate', d: 'Each partner store can only see its own information.' },
    ],
  },

  faq: {
    title: 'Frequently asked questions',
    items: [
      { q: 'Can I check the fee in advance?', a: 'Use the fee calculator: enter your arrival and departure times to see an estimate. The amount shown on the pay station is final.' },
      { q: 'How can I pay for hourly parking?', a: 'Cash. From 2 Feb 2027, also ¥10,000 notes, credit card and transport IC cards (PASMO, Suica, etc.).' },
      { q: 'What if there is a problem with the pay station or an accident?', a: 'The pay-station intercom, or the toll-free number 0120-935-624, connects you to the AMS Customer Support Center 24 hours a day. An operator will help you on the spot. The operator may only speak Japanese.' },
      { q: 'Do partner stores offer parking discounts?', a: 'Yes. When you shop at a partner store, the store can cover your parking fee. Please ask at the store.' },
      { q: 'Can I charge an electric car?', a: 'There are four 6 kW standard chargers. Use the Terra Charge app.' },
      { q: 'Can I park a large vehicle?', a: 'Vehicles up to 2.10 m high, under 5.0 m long and under 1.9 m wide can park. Trucks, heavy vehicles and motorcycles cannot.' },
      { q: 'How do I apply for monthly parking?', a: 'Check availability and apply online at Park Direct (website in Japanese).' },
    ],
  },

  partnersPage: {
    title: 'Partner stores',
    metaDesc: 'About the partner-store parking program at Yatsuka Station East Exit Parking.',
    intro: 'When you shop at a partner store, the store can cover your parking fee. Please ask at the store.',
    pending: 'The list of partner stores is being prepared. Stores will be listed here once they agree.',
    loginTitle: 'For partner stores',
    loginDesc: 'Check usage and invoices (Japanese only)',
    bizTitle: 'For shops and businesses',
    bizText: 'Join the partner program to cover your customers’ parking fees and make it easier for them to visit by car.',
  },

  privacy: {
    title: 'Privacy policy',
    body: 'Our privacy policy is being prepared. The Japanese version will be the official one.',
    contact: (owner, tel) => [`For questions about personal information, please contact ${owner} (TEL `, tel, ').'],
  },

  footer: {
    line: '3-minute walk from Yatsuka Station East Exit · Open 24 hours · 300 spaces',
    operator: 'Operator',
    links: { rates: 'Rates', access: 'Access', monthly: 'Monthly parking', news: 'News', partners: 'Partner stores', login: 'Partner login', privacy: 'Privacy policy' },
    official: 'This is a translation. If it differs from the Japanese version, the Japanese version applies.',
  },
};

export default en;

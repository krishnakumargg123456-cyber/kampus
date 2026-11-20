import type { Express, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import type {
  ExchangeProposal,
  GiveawayRequest,
  MarketAnalytics,
  MarketCategory,
  MarketCategoryConfig,
  MarketListing,
  MarketListingStatus,
  MarketOffer,
  MarketReport,
  MarketRole,
  SellerVerificationMap,
} from '../src/types/market.ts';

interface StoredMarketImage {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  base64Data: string;
  ownerId: string;
  createdAt: string;
}

interface MarketDatabase {
  listings: MarketListing[];
  categories: MarketCategoryConfig[];
  wishlistByUser: Record<string, string[]>;
  recentSearchesByUser: Record<string, string[]>;
  offers: MarketOffer[];
  giveawayRequests: GiveawayRequest[];
  exchangeProposals: ExchangeProposal[];
  reports: MarketReport[];
  blockedByUser: Record<string, string[]>;
  restrictedUserIds: string[];
  roleOverrides: Record<string, { role: MarketRole; label: string }>;
  uploadedImages: Record<string, StoredMarketImage>;
}

const DB_PATH = path.join(process.cwd(), '.kampus_market_db.json');
const KAMPUS_ID_DB_FILE = path.join(process.cwd(), '.kampus_kampus_id_db.json');
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const MARKET_PASSKEYS: Record<string, { role: MarketRole; label: string }> = {
  'KMP-MARKET-ADMIN-2026': {
    role: 'Platform Admin',
    label: 'Marketplace Platform Administrator',
  },
  'KMP-MARKET-MOD-2026': {
    role: 'Marketplace Moderator',
    label: 'Campus Safety & Listing Moderator',
  },
};

const PROHIBITED_PATTERNS = [
  /\bweapon\b/i,
  /\bgun\b/i,
  /\bknife\b/i,
  /\balcohol\b/i,
  /\bliquor\b/i,
  /\btobacco\b/i,
  /\bvape\b/i,
  /\bprescription drug\b/i,
  /\bleaked exam\b/i,
  /\bquestion paper leak\b/i,
  /\bfake id\b/i,
];

function checkProhibitedText(text: string): string | null {
  for (const pat of PROHIBITED_PATTERNS) {
    if (pat.test(text)) {
      return 'Listing contains restricted or prohibited item keywords under campus safety guidelines.';
    }
  }
  return null;
}

function validateImageMagicBytes(buffer: Buffer, ext: string): boolean {
  if (buffer.length === 0 || buffer.length > MAX_UPLOAD_BYTES) return false;
  if (ext === '.png')
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  if (ext === '.jpg' || ext === '.jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8;
  if (ext === '.webp') return buffer.subarray(0, 4).toString('ascii') === 'RIFF';
  return false;
}

function createSeedDatabase(): MarketDatabase {
  const daysAgoISO = (days: number) => new Date(Date.now() - days * 86400_000).toISOString();

  const categories: MarketCategoryConfig[] = [
    {
      category: 'Books & Study',
      subcategories: [
        'NCERT Books',
        'Reference Books',
        'Competitive Exam Books',
        'Previous Year Papers',
        'Academic Guides',
        'Handwritten Notes',
        'Question Banks',
      ],
    },
    {
      category: 'Electronics',
      subcategories: [
        'Calculators',
        'Keyboards',
        'Mouse',
        'Headphones',
        'Speakers',
        'Monitors',
        'Other Permitted Accessories',
      ],
    },
    {
      category: 'Stationery',
      subcategories: [
        'Notebooks',
        'Pens',
        'Art Supplies',
        'Geometry Boxes',
        'Drawing Instruments',
        'Study Organizers',
      ],
    },
    {
      category: 'Hostel Essentials',
      subcategories: [
        'Lamps',
        'Storage Organizers',
        'Bedding',
        'Water Bottles',
        'Desk Accessories',
        'Room Essentials',
      ],
    },
    { category: 'Fashion', subcategories: ['Bags', 'Watches', 'Clothing', 'Accessories'] },
    { category: 'Furniture', subcategories: ['Study Tables', 'Chairs', 'Bookshelves', 'Storage Units'] },
    {
      category: 'Lab Equipment',
      subcategories: [
        'Lab Coats',
        'Drawing Kits',
        'Academic Instruments',
        'Permitted Educational Equipment',
      ],
    },
    {
      category: 'Sports & Fitness',
      subcategories: ['Sports Accessories', 'Fitness Equipment', 'Outdoor Essentials'],
    },
  ];

  const listings: MarketListing[] = [
    {
      id: 'mkt_demo_ncert_bio',
      title: 'NCERT Biology Class 11 (Demo Listing)',
      description:
        'Clean hardcover NCERT Class 11 Biology reference copy with minimal pencil margin notes. Great for foundational medical & biotech prep.',
      category: 'Books & Study',
      subcategory: 'NCERT Books',
      brand: 'NCERT Publication',
      listingType: 'For Sale',
      condition: 'Good',
      priceINR: 180,
      originalPriceINR: 320,
      negotiable: true,
      images: ['books'],
      coverIndex: 0,
      sellerId: 'stu_ananya',
      sellerName: 'Ananya Verma (Demo Seller)',
      sellerAvatarKey: 'ananya',
      sellerCampus: 'Delhi University',
      sellerCity: 'New Delhi',
      sellerArea: 'North Campus Hostel',
      pickupPoint: 'Central Library Gate (Public Area)',
      deliveryAvailable: false,
      status: 'Active',
      isDemoRecord: true,
      viewsCount: 0,
      createdAt: daysAgoISO(1),
      updatedAt: daysAgoISO(1),
      statusHistory: [
        { status: 'Active', changedBy: 'System Demo Seed', note: 'Initial demo catalog', changedAt: daysAgoISO(1) },
      ],
    },
    {
      id: 'mkt_demo_sci_calc',
      title: 'Scientific Calculator (Demo Listing)',
      description:
        'Non-programmable 417-function scientific calculator approved for university engineering & math semester exams. Crisp display, solar + battery.',
      category: 'Electronics',
      subcategory: 'Calculators',
      brand: 'Casio / TI Class',
      listingType: 'For Sale',
      condition: 'Like New',
      priceINR: 690,
      originalPriceINR: 1295,
      negotiable: true,
      images: ['calculator'],
      coverIndex: 0,
      sellerId: 'stu_aditya',
      sellerName: 'Aditya Sharma (Demo Seller)',
      sellerAvatarKey: 'aditya',
      sellerCampus: 'IIT Bombay',
      sellerCity: 'Mumbai',
      sellerArea: 'Powai Campus Zone',
      pickupPoint: 'Lecture Hall Complex Foyer',
      deliveryAvailable: true,
      status: 'Active',
      isDemoRecord: true,
      viewsCount: 0,
      createdAt: daysAgoISO(2),
      updatedAt: daysAgoISO(2),
      statusHistory: [
        { status: 'Active', changedBy: 'System Demo Seed', note: 'Initial demo catalog', changedAt: daysAgoISO(2) },
      ],
    },
    {
      id: 'mkt_demo_study_lamp',
      title: 'Study Table Lamp (Demo Listing)',
      description:
        'Adjustable anodized aluminum LED study lamp with 3 warm-to-daylight color modes for late-night hostel study sessions without harsh glare.',
      category: 'Hostel Essentials',
      subcategory: 'Lamps',
      brand: 'Mi Desk Series',
      listingType: 'For Sale',
      condition: 'Good',
      priceINR: 550,
      originalPriceINR: null,
      negotiable: true,
      images: ['lamp'],
      coverIndex: 0,
      sellerId: 'stu_rohan',
      sellerName: 'Rohan Kulkarni (Demo Seller)',
      sellerAvatarKey: 'rohan',
      sellerCampus: 'NIT Surathkal',
      sellerCity: 'Mangaluru',
      sellerArea: 'Hostel Block B',
      pickupPoint: 'Student Activity Center Desk',
      deliveryAvailable: false,
      status: 'Active',
      isDemoRecord: true,
      viewsCount: 0,
      createdAt: daysAgoISO(2),
      updatedAt: daysAgoISO(2),
      statusHistory: [
        { status: 'Active', changedBy: 'System Demo Seed', note: 'Initial demo catalog', changedAt: daysAgoISO(2) },
      ],
    },
    {
      id: 'mkt_demo_drawing_kit',
      title: 'Engineering Drawing Kit (Demo Listing)',
      description:
        'Complete first-year engineering graphics set: precision compass, triangular scale ruler, French curves, and waterproof sheet storage tube.',
      category: 'Stationery',
      subcategory: 'Drawing Instruments',
      brand: 'Staedtler / Rotring Set',
      listingType: 'For Sale',
      condition: 'Good',
      priceINR: 420,
      originalPriceINR: 950,
      negotiable: false,
      images: ['drawing_kit'],
      coverIndex: 0,
      sellerId: 'stu_meera',
      sellerName: 'Meera Iyer (Demo Seller)',
      sellerAvatarKey: 'meera',
      sellerCampus: 'COEP Pune',
      sellerCity: 'Pune',
      sellerArea: 'Shivajinagar Campus',
      pickupPoint: 'Main Academic Lawn Bench',
      deliveryAvailable: false,
      status: 'Active',
      isDemoRecord: true,
      viewsCount: 0,
      createdAt: daysAgoISO(3),
      updatedAt: daysAgoISO(3),
      statusHistory: [
        { status: 'Active', changedBy: 'System Demo Seed', note: 'Initial demo catalog', changedAt: daysAgoISO(3) },
      ],
    },
    {
      id: 'mkt_demo_backpack',
      title: 'College Backpack (Demo Listing)',
      description:
        'Water-resistant navy-charcoal 16-inch laptop backpack with padded shoulder straps, bottle pockets, and clean zippers. Lightly carried one semester.',
      category: 'Fashion',
      subcategory: 'Bags',
      brand: 'Canvas Pro 28L',
      listingType: 'For Sale',
      condition: 'Like New',
      priceINR: 850,
      originalPriceINR: 1899,
      negotiable: true,
      images: ['backpack'],
      coverIndex: 0,
      sellerId: 'stu_kabir',
      sellerName: 'Kabir Malhotra (Demo Seller)',
      sellerAvatarKey: 'kabir',
      sellerCampus: 'IIT Roorkee',
      sellerCity: 'Roorkee',
      sellerArea: 'Rajendra Bhawan Area',
      pickupPoint: 'Campus Main Canteen',
      deliveryAvailable: true,
      status: 'Active',
      isDemoRecord: true,
      viewsCount: 0,
      createdAt: daysAgoISO(4),
      updatedAt: daysAgoISO(4),
      statusHistory: [
        { status: 'Active', changedBy: 'System Demo Seed', note: 'Initial demo catalog', changedAt: daysAgoISO(4) },
      ],
    },
    {
      id: 'mkt_demo_study_table',
      title: 'Wooden Study Table (Demo Listing)',
      description:
        'Compact solid oak hostel/PG study desk (90cm x 55cm) with sturdy frame and smooth writing surface. Available for direct item exchange.',
      category: 'Furniture',
      subcategory: 'Study Tables',
      brand: 'Custom Woodwork',
      listingType: 'Exchange',
      condition: 'Used',
      priceINR: null,
      originalPriceINR: null,
      negotiable: false,
      preferredExchangeItem: 'Ergonomic study chair, monitor stand, or GATE CS reference books',
      exchangeDescription:
        'Graduating soon and moving to a smaller apartment; open to swapping for a compact chair, external keyboard, or reference books.',
      images: ['study_table'],
      coverIndex: 0,
      sellerId: 'stu_aditya',
      sellerName: 'Aditya Sharma (Demo Seller)',
      sellerAvatarKey: 'aditya',
      sellerCampus: 'IIT Bombay',
      sellerCity: 'Mumbai',
      sellerArea: 'Hostel 14 Courtyard',
      pickupPoint: 'Hostel 14 Security Gate',
      deliveryAvailable: false,
      status: 'Active',
      isDemoRecord: true,
      viewsCount: 0,
      createdAt: daysAgoISO(5),
      updatedAt: daysAgoISO(5),
      statusHistory: [
        { status: 'Active', changedBy: 'System Demo Seed', note: 'Initial demo catalog', changedAt: daysAgoISO(5) },
      ],
    },
    {
      id: 'mkt_demo_ref_books_bundle',
      title: 'Reference Books Bundle (Demo Listing)',
      description:
        'Passing on 3 undergraduate mathematics & general aptitude reference volumes for free to incoming first-year students.',
      category: 'Books & Study',
      subcategory: 'Reference Books',
      brand: 'University Press Editions',
      listingType: 'Giveaway',
      condition: 'Good',
      priceINR: 0,
      originalPriceINR: null,
      negotiable: false,
      images: ['bundle_books'],
      coverIndex: 0,
      sellerId: 'stu_ananya',
      sellerName: 'Ananya Verma (Demo Seller)',
      sellerAvatarKey: 'ananya',
      sellerCampus: 'Delhi University',
      sellerCity: 'New Delhi',
      sellerArea: 'Arts Faculty Reading Area',
      pickupPoint: 'Central Library Help Desk',
      deliveryAvailable: false,
      status: 'Active',
      isDemoRecord: true,
      viewsCount: 0,
      createdAt: daysAgoISO(6),
      updatedAt: daysAgoISO(6),
      statusHistory: [
        { status: 'Active', changedBy: 'System Demo Seed', note: 'Initial demo catalog', changedAt: daysAgoISO(6) },
      ],
    },
    {
      id: 'mkt_demo_headphones',
      title: 'Wireless Study Headphones (Demo Listing)',
      description:
        'Comfortable over-ear Bluetooth headphones with 30-hour battery life, clean ear cushions, USB-C cable, and low noise leakage for library study.',
      category: 'Electronics',
      subcategory: 'Headphones',
      brand: 'Soundcore Studio',
      listingType: 'For Sale',
      condition: 'Like New',
      priceINR: 1450,
      originalPriceINR: null,
      negotiable: true,
      images: ['headphones'],
      coverIndex: 0,
      sellerId: 'stu_rohan',
      sellerName: 'Rohan Kulkarni (Demo Seller)',
      sellerAvatarKey: 'rohan',
      sellerCampus: 'NIT Surathkal',
      sellerCity: 'Mangaluru',
      sellerArea: 'Main Campus Pavilion',
      pickupPoint: 'Central Library Entrance',
      deliveryAvailable: true,
      status: 'Active',
      isDemoRecord: true,
      viewsCount: 0,
      createdAt: daysAgoISO(3),
      updatedAt: daysAgoISO(3),
      statusHistory: [
        { status: 'Active', changedBy: 'System Demo Seed', note: 'Initial demo catalog', changedAt: daysAgoISO(3) },
      ],
    },
    {
      id: 'mkt_demo_lab_kit',
      title: 'Cotton Lab Coat & Safety Goggles (Demo Listing)',
      description:
        'Size M full-sleeve white chemistry & biology lab coat (freshly laundered) with clear wrap-around protective lab goggles.',
      category: 'Lab Equipment',
      subcategory: 'Lab Coats',
      brand: 'Campus Labwear',
      listingType: 'For Sale',
      condition: 'Good',
      priceINR: 260,
      originalPriceINR: 550,
      negotiable: false,
      images: ['lab_gear'],
      coverIndex: 0,
      sellerId: 'stu_meera',
      sellerName: 'Meera Iyer (Demo Seller)',
      sellerAvatarKey: 'meera',
      sellerCampus: 'COEP Pune',
      sellerCity: 'Pune',
      sellerArea: 'Science Block Lawn',
      pickupPoint: 'Chemistry Lab Porch',
      deliveryAvailable: false,
      status: 'Active',
      isDemoRecord: true,
      viewsCount: 0,
      createdAt: daysAgoISO(5),
      updatedAt: daysAgoISO(5),
      statusHistory: [
        { status: 'Active', changedBy: 'System Demo Seed', note: 'Initial demo catalog', changedAt: daysAgoISO(5) },
      ],
    },
    {
      id: 'mkt_demo_sports_set',
      title: 'Badminton & Fitness Resistance Kit (Demo Listing)',
      description:
        'Clean pair of lightweight badminton rackets with 3 resistance training bands; barely used this semester.',
      category: 'Sports & Fitness',
      subcategory: 'Sports Accessories',
      brand: 'Yonex / Decathlon',
      listingType: 'Exchange',
      condition: 'Good',
      priceINR: null,
      originalPriceINR: null,
      negotiable: false,
      preferredExchangeItem: 'Mechanical keyboard, yoga mat, or insulated steel flask',
      exchangeDescription:
        'Looking to trade for study desk peripherals or outdoor running essentials.',
      images: ['sports'],
      coverIndex: 0,
      sellerId: 'stu_kabir',
      sellerName: 'Kabir Malhotra (Demo Seller)',
      sellerAvatarKey: 'kabir',
      sellerCampus: 'IIT Roorkee',
      sellerCity: 'Roorkee',
      sellerArea: 'Sports Complex Courtyard',
      pickupPoint: 'Student Gymkhana Reception',
      deliveryAvailable: false,
      status: 'Active',
      isDemoRecord: true,
      viewsCount: 0,
      createdAt: daysAgoISO(4),
      updatedAt: daysAgoISO(4),
      statusHistory: [
        { status: 'Active', changedBy: 'System Demo Seed', note: 'Initial demo catalog', changedAt: daysAgoISO(4) },
      ],
    },
  ];

  return {
    listings,
    categories,
    wishlistByUser: {},
    recentSearchesByUser: {},
    offers: [],
    giveawayRequests: [],
    exchangeProposals: [],
    reports: [],
    blockedByUser: {},
    restrictedUserIds: [],
    roleOverrides: {},
    uploadedImages: {},
  };
}

function loadDb(): MarketDatabase {
  try {
    if (fs.existsSync(DB_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
      if (parsed && Array.isArray(parsed.listings)) {
        return parsed as MarketDatabase;
      }
    }
  } catch {
    // fallback to clean seed
  }
  const seeded = createSeedDatabase();
  saveDb(seeded);
  return seeded;
}

function saveDb(db: MarketDatabase) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save Market DB:', err);
  }
}

function isPrivilegedRole(role: MarketRole): boolean {
  return role === 'Platform Admin' || role === 'Marketplace Moderator';
}

function buildSellerVerificationMap(
  db: MarketDatabase,
  sellerIds: string[]
): SellerVerificationMap {
  let kidRecords: any[] = [];
  try {
    if (fs.existsSync(KAMPUS_ID_DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(KAMPUS_ID_DB_FILE, 'utf-8'));
      if (Array.isArray(parsed?.records)) kidRecords = parsed.records;
    }
  } catch {
    // non-fatal
  }

  const map: SellerVerificationMap = {};
  for (const sid of Array.from(new Set(sellerIds))) {
    const kid = kidRecords.find((r) => r.userId === sid);
    const verified = Boolean(kid && (kid.isVerified || kid.status === 'Verified'));
    map[sid] = {
      isVerifiedKampusId: verified,
      verificationLabel: verified
        ? `Verified KAMPUS ID (${kid.kampusIdCode || 'Active'})`
        : 'Standard Account (KAMPUS ID Not Verified)',
      isRestricted: db.restrictedUserIds.includes(sid),
    };
  }
  return map;
}

function computeAnalytics(db: MarketDatabase): MarketAnalytics {
  return {
    totalListings: db.listings.length,
    activeListings: db.listings.filter((l) => l.status === 'Active').length,
    pendingApproval: db.listings.filter((l) => l.status === 'Pending Approval').length,
    soldItems: db.listings.filter((l) => l.status === 'Sold').length,
    giveawaysCount: db.listings.filter((l) => l.listingType === 'Giveaway' && l.status === 'Active').length,
    exchangesCount: db.listings.filter((l) => l.listingType === 'Exchange' && l.status === 'Active').length,
    totalOffers: db.offers.length,
    openReports: db.reports.filter((r) => r.status === 'Open').length,
    restrictedAccounts: db.restrictedUserIds.length,
  };
}

export function registerMarketBackend(app: Express) {
  const db = loadDb();

  // 1. Bootstrap Marketplace Workspace
  app.post('/api/market/bootstrap', (req: Request, res: Response) => {
    const userId = String(req.body?.userId || '').trim();
    if (!userId) return res.status(400).json({ message: 'userId is required.' });

    const roleInfo = db.roleOverrides[userId] || { role: 'Student' as MarketRole, label: null };
    const isAdmin = isPrivilegedRole(roleInfo.role);
    const blocked = db.blockedByUser[userId] || [];

    const visibleListings = db.listings.filter((item) => {
      if (blocked.includes(item.sellerId)) return false;
      if (isAdmin || item.sellerId === userId) return true;
      return item.status === 'Active' || item.status === 'Sold';
    });

    const sellerIds = [userId, ...visibleListings.map((l) => l.sellerId)];
    const sellerVerification = buildSellerVerificationMap(db, sellerIds);

    return res.json({
      listings: visibleListings,
      categories: db.categories,
      wishlistIds: db.wishlistByUser[userId] || [],
      recentSearches: db.recentSearchesByUser[userId] || [],
      offers: db.offers.filter((o) => o.buyerId === userId || o.sellerId === userId),
      giveawayRequests: db.giveawayRequests.filter(
        (g) => g.requesterId === userId || g.ownerId === userId
      ),
      exchangeProposals: db.exchangeProposals.filter(
        (x) => x.proposerId === userId || x.ownerId === userId
      ),
      blockedUserIds: blocked,
      sellerVerification,
      roleInfo,
      isRestricted: db.restrictedUserIds.includes(userId),
      reports: isAdmin ? db.reports : [],
      analytics: isAdmin ? computeAnalytics(db) : null,
    });
  });

  // 2. RBAC Role Switch
  app.post('/api/market/auth/role-session', (req: Request, res: Response) => {
    const { userId, passkey, revert } = req.body || {};
    if (!userId) return res.status(400).json({ message: 'userId is required.' });
    if (revert) {
      delete db.roleOverrides[userId];
      saveDb(db);
      return res.json({ ok: true, roleInfo: { role: 'Student', label: null } });
    }
    const matched = MARKET_PASSKEYS[String(passkey || '').trim().toUpperCase()];
    if (!matched) {
      return res.status(403).json({ message: 'Invalid Marketplace Moderator or Admin passkey.' });
    }
    db.roleOverrides[userId] = matched;
    saveDb(db);
    return res.json({ ok: true, roleInfo: matched });
  });

  // 3. Upload & Serve Product Image (magic bytes validated, <= 5 MB)
  app.post('/api/market/upload-image', (req: Request, res: Response) => {
    const { userId, fileName, mimeType, base64Data } = req.body || {};
    if (!userId || !fileName || !base64Data) {
      return res.status(400).json({ message: 'Image payload missing.' });
    }
    const ext = path.extname(String(fileName)).toLowerCase();
    if (!['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
      return res.status(400).json({ message: 'Only PNG, JPG, JPEG, and WEBP product photos are supported.' });
    }
    const clean = String(base64Data).includes(',')
      ? String(base64Data).split(',')[1]
      : String(base64Data);
    const buffer = Buffer.from(clean, 'base64');
    if (!validateImageMagicBytes(buffer, ext)) {
      return res.status(400).json({ message: 'Invalid image signature or file exceeds 5 MB limit.' });
    }
    const id = `mktimg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    db.uploadedImages[id] = {
      id,
      fileName: String(fileName),
      mimeType: String(mimeType || 'image/jpeg'),
      sizeBytes: buffer.length,
      base64Data: clean,
      ownerId: String(userId),
      createdAt: new Date().toISOString(),
    };
    saveDb(db);
    return res.status(201).json({
      imageUrl: `/api/market/media/${id}`,
      id,
      fileName: String(fileName),
      sizeBytes: buffer.length,
    });
  });

  app.get('/api/market/media/:id', (req: Request, res: Response) => {
    const media = db.uploadedImages[req.params.id];
    if (!media) return res.status(404).send('Image not found');
    res.setHeader('Content-Type', media.mimeType || 'image/jpeg');
    return res.send(Buffer.from(media.base64Data, 'base64'));
  });

  // 4. Recent Search History
  app.post('/api/market/recent-searches', (req: Request, res: Response) => {
    const { userId, query, clear } = req.body || {};
    if (!userId) return res.status(400).json({ message: 'userId required.' });
    if (clear) {
      db.recentSearchesByUser[userId] = [];
      saveDb(db);
      return res.json({ recentSearches: [] });
    }
    const trimmed = String(query || '').trim();
    if (!trimmed) return res.json({ recentSearches: db.recentSearchesByUser[userId] || [] });
    const prev = (db.recentSearchesByUser[userId] || []).filter(
      (s) => s.toLowerCase() !== trimmed.toLowerCase()
    );
    db.recentSearchesByUser[userId] = [trimmed, ...prev].slice(0, 8);
    saveDb(db);
    return res.json({ recentSearches: db.recentSearchesByUser[userId] });
  });

  // 5. Create Listing (Runs Prohibited-Item Check)
  app.post('/api/market/listings', (req: Request, res: Response) => {
    const b = req.body || {};
    const sellerId = String(b.sellerId || '').trim();
    if (!sellerId) return res.status(400).json({ message: 'Authentication required.' });
    if (db.restrictedUserIds.includes(sellerId)) {
      return res.status(403).json({ message: 'Account restricted by marketplace moderation.' });
    }
    const title = String(b.title || '').trim();
    const description = String(b.description || '').trim();
    if (!title || !description || !b.category) {
      return res.status(400).json({ message: 'Product title, category, and description are required.' });
    }
    const prohibitedErr = checkProhibitedText(`${title} ${description}`);
    if (prohibitedErr) {
      return res.status(400).json({ message: prohibitedErr });
    }

    const listingType = b.listingType || 'For Sale';
    const priceINR =
      listingType === 'For Sale' ? Math.max(0, Number(b.priceINR) || 0) : listingType === 'Giveaway' ? 0 : null;
    const originalPriceINR =
      typeof b.originalPriceINR === 'number' && b.originalPriceINR > (priceINR || 0)
        ? b.originalPriceINR
        : null;

    const now = new Date().toISOString();
    const newItem: MarketListing = {
      id: `mkt_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      title,
      description,
      category: b.category as MarketCategory,
      subcategory: String(b.subcategory || 'General'),
      brand: String(b.brand || '').trim() || undefined,
      listingType,
      condition: b.condition || 'Good',
      priceINR,
      originalPriceINR,
      negotiable: Boolean(b.negotiable),
      preferredExchangeItem:
        listingType === 'Exchange' ? String(b.preferredExchangeItem || '').trim() : undefined,
      exchangeDescription:
        listingType === 'Exchange' ? String(b.exchangeDescription || description).trim() : undefined,
      images:
        Array.isArray(b.images) && b.images.length > 0 ? b.images : ['books'],
      coverIndex: Number(b.coverIndex) || 0,
      sellerId,
      sellerName: String(b.sellerName || 'Student Seller'),
      sellerAvatarKey: String(b.sellerAvatarKey || 'aditya'),
      sellerCampus: String(b.sellerCampus || 'KAMPUS Campus'),
      sellerCity: String(b.sellerCity || 'Campus City'),
      sellerArea: String(b.sellerArea || 'Student Zone'),
      pickupPoint: String(b.pickupPoint || 'Campus Central Library Gate'),
      deliveryAvailable: Boolean(b.deliveryAvailable),
      status: 'Active',
      isDemoRecord: false,
      viewsCount: 0,
      createdAt: now,
      updatedAt: now,
      statusHistory: [
        {
          status: 'Active',
          changedBy: String(b.sellerName || sellerId),
          note: 'Published by student seller',
          changedAt: now,
        },
      ],
    };

    db.listings.unshift(newItem);
    saveDb(db);
    return res.status(201).json({ listing: newItem });
  });

  // 6. Update / Pause / Mark Sold / Delete Listing (Strict Ownership Validation)
  app.patch('/api/market/listings/:id', (req: Request, res: Response) => {
    const item = db.listings.find((l) => l.id === req.params.id);
    if (!item) return res.status(404).json({ message: 'Listing not found.' });
    const b = req.body || {};
    const actorId = String(b.userId || '').trim();
    const actorRole = db.roleOverrides[actorId]?.role || 'Student';
    if (item.sellerId !== actorId && !isPrivilegedRole(actorRole)) {
      return res.status(403).json({ message: '403 Forbidden: Only the listing owner can edit this item.' });
    }
    if (typeof b.title === 'string' && b.title.trim()) {
      const check = checkProhibitedText(b.title);
      if (check) return res.status(400).json({ message: check });
      item.title = b.title.trim();
    }
    if (typeof b.description === 'string' && b.description.trim()) {
      const check = checkProhibitedText(b.description);
      if (check) return res.status(400).json({ message: check });
      item.description = b.description.trim();
    }
    if (b.category) item.category = b.category;
    if (typeof b.subcategory === 'string') item.subcategory = b.subcategory;
    if (b.condition) item.condition = b.condition;
    if (typeof b.priceINR === 'number') item.priceINR = Math.max(0, b.priceINR);
    if (typeof b.negotiable === 'boolean') item.negotiable = b.negotiable;
    if (typeof b.pickupPoint === 'string') item.pickupPoint = b.pickupPoint;
    if (typeof b.deliveryAvailable === 'boolean') item.deliveryAvailable = b.deliveryAvailable;
    if (Array.isArray(b.images) && b.images.length > 0) item.images = b.images;
    if (typeof b.coverIndex === 'number') item.coverIndex = b.coverIndex;

    if (b.status && b.status !== item.status) {
      item.status = b.status as MarketListingStatus;
      item.statusHistory.push({
        status: item.status,
        changedBy: actorId,
        note: String(b.statusNote || `Status updated to ${item.status}`),
        changedAt: new Date().toISOString(),
      });
    }
    item.updatedAt = new Date().toISOString();
    saveDb(db);
    return res.json({ listing: item });
  });

  app.delete('/api/market/listings/:id', (req: Request, res: Response) => {
    const item = db.listings.find((l) => l.id === req.params.id);
    if (!item) return res.status(404).json({ message: 'Listing not found.' });
    const actorId = String(req.query.userId || '').trim();
    const actorRole = db.roleOverrides[actorId]?.role || 'Student';
    if (item.sellerId !== actorId && !isPrivilegedRole(actorRole)) {
      return res.status(403).json({ message: '403 Forbidden: Only the listing owner can delete this item.' });
    }
    db.listings = db.listings.filter((l) => l.id !== item.id);
    saveDb(db);
    return res.json({ ok: true });
  });

  // 7. Wishlist Toggle
  app.post('/api/market/wishlist/toggle', (req: Request, res: Response) => {
    const { userId, listingId } = req.body || {};
    if (!userId || !listingId) return res.status(400).json({ message: 'Missing userId or listingId.' });
    const list = db.wishlistByUser[userId] || [];
    if (list.includes(listingId)) {
      db.wishlistByUser[userId] = list.filter((id) => id !== listingId);
    } else {
      db.wishlistByUser[userId] = [listingId, ...list];
    }
    saveDb(db);
    return res.json({ wishlistIds: db.wishlistByUser[userId] });
  });

  // 8. Structured Offers & Negotiation (Does NOT auto-confirm sale on Accept)
  app.post('/api/market/offers', (req: Request, res: Response) => {
    const b = req.body || {};
    const buyerId = String(b.buyerId || '').trim();
    const item = db.listings.find((l) => l.id === b.listingId);
    if (!buyerId || !item) return res.status(404).json({ message: 'Listing not found.' });
    if (item.sellerId === buyerId) {
      return res.status(400).json({ message: 'You cannot send an offer on your own listing.' });
    }
    if (item.status !== 'Active') {
      return res.status(400).json({ message: `This listing is currently ${item.status}.` });
    }
    const offerPriceINR = Number(b.offerPriceINR);
    if (Number.isNaN(offerPriceINR) || offerPriceINR <= 0) {
      return res.status(400).json({ message: 'Enter a valid positive offer amount.' });
    }
    const now = new Date().toISOString();
    const offer: MarketOffer = {
      id: `moff_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      listingId: item.id,
      listingTitle: item.title,
      buyerId,
      buyerName: String(b.buyerName || 'Student Buyer'),
      sellerId: item.sellerId,
      sellerName: item.sellerName,
      offerPriceINR,
      buyerMessage: String(b.buyerMessage || '').trim() || 'Interested in purchasing at this offer.',
      status: 'Pending',
      createdAt: now,
      updatedAt: now,
    };
    db.offers.unshift(offer);
    saveDb(db);
    return res.status(201).json({ offer });
  });

  app.patch('/api/market/offers/:id', (req: Request, res: Response) => {
    const offer = db.offers.find((o) => o.id === req.params.id);
    if (!offer) return res.status(404).json({ message: 'Offer not found.' });
    const b = req.body || {};
    const actorId = String(b.userId || '').trim();
    if (actorId !== offer.buyerId && actorId !== offer.sellerId) {
      return res.status(403).json({ message: '403 Forbidden: Not a party to this offer.' });
    }
    const nextStatus = b.status as MarketOffer['status'];
    if (nextStatus === 'Withdrawn' && actorId !== offer.buyerId) {
      return res.status(403).json({ message: 'Only buyer can withdraw an offer.' });
    }
    if (['Accepted', 'Rejected', 'Countered'].includes(nextStatus) && actorId !== offer.sellerId) {
      return res.status(403).json({ message: 'Only seller can accept, reject, or counter an offer.' });
    }
    offer.status = nextStatus;
    if (typeof b.counterPriceINR === 'number' && b.counterPriceINR > 0) {
      offer.counterPriceINR = b.counterPriceINR;
    }
    if (typeof b.sellerMessage === 'string') {
      offer.sellerMessage = b.sellerMessage;
    }
    offer.updatedAt = new Date().toISOString();
    saveDb(db);
    // Note: Do not auto-confirm a purchase or mark item as Sold when offer is Accepted
    return res.json({ offer });
  });

  // 9. Giveaway Requests (Free Corner)
  app.post('/api/market/giveaway-requests', (req: Request, res: Response) => {
    const b = req.body || {};
    const requesterId = String(b.requesterId || '').trim();
    const item = db.listings.find((l) => l.id === b.listingId && l.listingType === 'Giveaway');
    if (!requesterId || !item) return res.status(404).json({ message: 'Giveaway item not found.' });
    if (item.sellerId === requesterId) {
      return res.status(400).json({ message: 'Cannot request your own giveaway listing.' });
    }
    if (item.status !== 'Active') {
      return res.status(400).json({ message: 'Giveaway item is no longer available.' });
    }
    const now = new Date().toISOString();
    const gReq: GiveawayRequest = {
      id: `mgiv_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      listingId: item.id,
      listingTitle: item.title,
      requesterId,
      requesterName: String(b.requesterName || 'Student'),
      ownerId: item.sellerId,
      ownerName: item.sellerName,
      message: String(b.message || 'Interested in picking up this item.'),
      status: 'Pending',
      createdAt: now,
      updatedAt: now,
    };
    db.giveawayRequests.unshift(gReq);
    saveDb(db);
    return res.status(201).json({ request: gReq });
  });

  app.patch('/api/market/giveaway-requests/:id', (req: Request, res: Response) => {
    const gReq = db.giveawayRequests.find((g) => g.id === req.params.id);
    if (!gReq) return res.status(404).json({ message: 'Giveaway request not found.' });
    const b = req.body || {};
    const actorId = String(b.userId || '').trim();
    if (actorId !== gReq.requesterId && actorId !== gReq.ownerId) {
      return res.status(403).json({ message: '403 Forbidden.' });
    }
    if (b.status) gReq.status = b.status;
    gReq.updatedAt = new Date().toISOString();
    saveDb(db);
    return res.json({ request: gReq });
  });

  // 10. Exchange Proposals (Exchange Hub)
  app.post('/api/market/exchange-proposals', (req: Request, res: Response) => {
    const b = req.body || {};
    const proposerId = String(b.proposerId || '').trim();
    const item = db.listings.find((l) => l.id === b.listingId && l.listingType === 'Exchange');
    if (!proposerId || !item) return res.status(404).json({ message: 'Exchange listing not found.' });
    if (item.sellerId === proposerId) {
      return res.status(400).json({ message: 'Cannot propose an exchange on your own listing.' });
    }
    if (!String(b.proposedItemTitle || '').trim()) {
      return res.status(400).json({ message: 'Please specify the item you are proposing to exchange.' });
    }
    const now = new Date().toISOString();
    const prop: ExchangeProposal = {
      id: `mex_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      listingId: item.id,
      listingTitle: item.title,
      proposerId,
      proposerName: String(b.proposerName || 'Student'),
      ownerId: item.sellerId,
      ownerName: item.sellerName,
      proposedItemTitle: String(b.proposedItemTitle).trim(),
      proposedItemCondition: b.proposedItemCondition || 'Good',
      message: String(b.message || ''),
      status: 'Pending',
      createdAt: now,
      updatedAt: now,
    };
    db.exchangeProposals.unshift(prop);
    saveDb(db);
    return res.status(201).json({ proposal: prop });
  });

  app.patch('/api/market/exchange-proposals/:id', (req: Request, res: Response) => {
    const prop = db.exchangeProposals.find((x) => x.id === req.params.id);
    if (!prop) return res.status(404).json({ message: 'Exchange proposal not found.' });
    const b = req.body || {};
    const actorId = String(b.userId || '').trim();
    if (actorId !== prop.proposerId && actorId !== prop.ownerId) {
      return res.status(403).json({ message: '403 Forbidden.' });
    }
    if (b.status) prop.status = b.status;
    prop.updatedAt = new Date().toISOString();
    saveDb(db);
    return res.json({ proposal: prop });
  });

  // 11. Trust & Safety: Reports & Blocking
  app.post('/api/market/reports', (req: Request, res: Response) => {
    const b = req.body || {};
    if (!b.reporterId || !b.targetId || !String(b.reason || '').trim()) {
      return res.status(400).json({ message: 'Target and report reason are required.' });
    }
    const rp: MarketReport = {
      id: `mrp_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      targetType: b.targetType === 'user' ? 'user' : 'listing',
      targetId: String(b.targetId),
      targetTitle: String(b.targetTitle || b.targetId),
      reporterId: String(b.reporterId),
      reporterName: String(b.reporterName || 'Student'),
      reason: String(b.reason).trim(),
      details: String(b.details || '').trim(),
      status: 'Open',
      createdAt: new Date().toISOString(),
    };
    db.reports.unshift(rp);
    saveDb(db);
    return res.status(201).json({ report: rp });
  });

  app.post('/api/market/block-user', (req: Request, res: Response) => {
    const { userId, targetUserId } = req.body || {};
    if (!userId || !targetUserId) {
      return res.status(400).json({ message: 'userId and targetUserId are required.' });
    }
    const prev = db.blockedByUser[userId] || [];
    if (prev.includes(targetUserId)) {
      db.blockedByUser[userId] = prev.filter((id) => id !== targetUserId);
    } else {
      db.blockedByUser[userId] = [...prev, targetUserId];
    }
    saveDb(db);
    return res.json({ blockedUserIds: db.blockedByUser[userId] });
  });

  // 12. Admin & Moderation Routes (Strict 403 for Student accounts)
  app.patch('/api/market/admin/listings/:id/moderate', (req: Request, res: Response) => {
    const b = req.body || {};
    const role = db.roleOverrides[String(b.userId || '')]?.role || 'Student';
    if (!isPrivilegedRole(role)) {
      return res.status(403).json({ message: '403 Forbidden: Moderator or Admin access required.' });
    }
    const item = db.listings.find((l) => l.id === req.params.id);
    if (!item) return res.status(404).json({ message: 'Listing not found.' });
    if (b.status) {
      item.status = b.status as MarketListingStatus;
      item.statusHistory.push({
        status: item.status,
        changedBy: role,
        note: String(b.note || `Moderation decision: ${item.status}`),
        changedAt: new Date().toISOString(),
      });
    }
    item.updatedAt = new Date().toISOString();
    saveDb(db);
    return res.json({ listing: item, analytics: computeAnalytics(db) });
  });

  app.post('/api/market/admin/categories', (req: Request, res: Response) => {
    const b = req.body || {};
    const role = db.roleOverrides[String(b.userId || '')]?.role || 'Student';
    if (!isPrivilegedRole(role)) {
      return res.status(403).json({ message: '403 Forbidden: Admin access required.' });
    }
    const cat = db.categories.find((c) => c.category === b.category);
    const sub = String(b.subcategory || '').trim();
    if (!cat || !sub) {
      return res.status(400).json({ message: 'Valid category and new subcategory name required.' });
    }
    if (!cat.subcategories.includes(sub)) {
      cat.subcategories.push(sub);
      saveDb(db);
    }
    return res.status(201).json({ categories: db.categories });
  });

  app.patch('/api/market/admin/users/:targetId/restrict', (req: Request, res: Response) => {
    const b = req.body || {};
    const role = db.roleOverrides[String(b.userId || '')]?.role || 'Student';
    if (!isPrivilegedRole(role)) {
      return res.status(403).json({ message: '403 Forbidden: Moderator or Admin access required.' });
    }
    const targetId = String(req.params.targetId || '');
    if (db.restrictedUserIds.includes(targetId)) {
      db.restrictedUserIds = db.restrictedUserIds.filter((id) => id !== targetId);
    } else {
      db.restrictedUserIds.push(targetId);
    }
    saveDb(db);
    return res.json({
      restricted: db.restrictedUserIds.includes(targetId),
      analytics: computeAnalytics(db),
    });
  });

  app.patch('/api/market/admin/reports/:id', (req: Request, res: Response) => {
    const b = req.body || {};
    const role = db.roleOverrides[String(b.userId || '')]?.role || 'Student';
    if (!isPrivilegedRole(role)) {
      return res.status(403).json({ message: '403 Forbidden.' });
    }
    const rp = db.reports.find((r) => r.id === req.params.id);
    if (!rp) return res.status(404).json({ message: 'Report not found.' });
    rp.status = b.status === 'Dismissed' ? 'Dismissed' : 'Resolved';
    if (typeof b.resolutionNote === 'string') rp.resolutionNote = b.resolutionNote;
    saveDb(db);
    return res.json({ report: rp, analytics: computeAnalytics(db) });
  });
}

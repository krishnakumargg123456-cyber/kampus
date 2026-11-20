import heroDeskImg from '../assets/images/market_hero_student_desk_1794573425705.jpg';
import booksImg from '../assets/images/market_product_books_1794573425196.jpg';
import calculatorImg from '../assets/images/market_product_calculator_1794573425708.jpg';
import lampImg from '../assets/images/market_product_lamp_1794573426148.jpg';
import drawingKitImg from '../assets/images/market_product_drawing_kit_1794573426385.jpg';
import backpackImg from '../assets/images/market_product_backpack_1794573426902.jpg';
import studyTableImg from '../assets/images/market_product_study_table_1794573427891.jpg';
import headphonesImg from '../assets/images/market_product_headphones_1794573427705.jpg';
import bundleBooksImg from '../assets/images/community_books_study_1794552226075.jpg';
import labGearImg from '../assets/images/studyhub_science_stem_1794549223458.jpg';
import sportsImg from '../assets/images/campus_life_activities_1794488255584.jpg';
import keyboardDeskImg from '../assets/images/studyhub_desk_hero_1794549223041.jpg';
import type {
  MarketCategory,
  MarketCondition,
  MarketListingType,
  OfferStatus,
} from '../types/market';

export const MARKET_HERO_IMAGE = heroDeskImg;

export const MARKET_IMAGE_ASSETS: Record<string, string> = {
  books: booksImg,
  calculator: calculatorImg,
  lamp: lampImg,
  drawing_kit: drawingKitImg,
  backpack: backpackImg,
  study_table: studyTableImg,
  headphones: headphonesImg,
  bundle_books: bundleBooksImg,
  lab_gear: labGearImg,
  sports: sportsImg,
  keyboard_desk: keyboardDeskImg,
  hero_desk: heroDeskImg,
};

export function resolveMarketImage(keyOrUrl?: string): string {
  if (!keyOrUrl) return booksImg;
  if (
    keyOrUrl.startsWith('/api/') ||
    keyOrUrl.startsWith('data:image/') ||
    keyOrUrl.startsWith('http://') ||
    keyOrUrl.startsWith('https://')
  ) {
    return keyOrUrl;
  }
  return MARKET_IMAGE_ASSETS[keyOrUrl] || booksImg;
}

export const ALL_MARKET_CATEGORIES: MarketCategory[] = [
  'Books & Study',
  'Electronics',
  'Stationery',
  'Hostel Essentials',
  'Fashion',
  'Furniture',
  'Lab Equipment',
  'Sports & Fitness',
];

export const DEFAULT_CATEGORY_SUBCATEGORIES: Record<MarketCategory, string[]> = {
  'Books & Study': [
    'NCERT Books',
    'Reference Books',
    'Competitive Exam Books',
    'Previous Year Papers',
    'Academic Guides',
    'Handwritten Notes',
    'Question Banks',
  ],
  Electronics: [
    'Calculators',
    'Keyboards',
    'Mouse',
    'Headphones',
    'Speakers',
    'Monitors',
    'Other Permitted Accessories',
  ],
  Stationery: [
    'Notebooks',
    'Pens',
    'Art Supplies',
    'Geometry Boxes',
    'Drawing Instruments',
    'Study Organizers',
  ],
  'Hostel Essentials': [
    'Lamps',
    'Storage Organizers',
    'Bedding',
    'Water Bottles',
    'Desk Accessories',
    'Room Essentials',
  ],
  Fashion: ['Bags', 'Watches', 'Clothing', 'Accessories'],
  Furniture: ['Study Tables', 'Chairs', 'Bookshelves', 'Storage Units'],
  'Lab Equipment': [
    'Lab Coats',
    'Drawing Kits',
    'Academic Instruments',
    'Permitted Educational Equipment',
  ],
  'Sports & Fitness': [
    'Sports Accessories',
    'Fitness Equipment',
    'Outdoor Essentials',
  ],
};

export const FREE_CORNER_TYPES = [
  'Free Books',
  'Free Stationery',
  'Hostel Items',
  'Study Materials',
  'Other Useful Items',
];

export const MARKET_CONDITIONS: MarketCondition[] = [
  'Brand New',
  'Like New',
  'Good',
  'Used',
];

export const MARKET_LISTING_TYPES: MarketListingType[] = [
  'For Sale',
  'Giveaway',
  'Exchange',
];

export const OFFER_STATUS_LIST: OfferStatus[] = [
  'Pending',
  'Accepted',
  'Rejected',
  'Countered',
  'Withdrawn',
  'Expired',
];

export const CAMPUS_DIRECTORY = [
  { label: 'All Campuses', city: 'All Cities', campus: 'All' },
  { label: 'IIT Bombay · Mumbai', city: 'Mumbai', campus: 'IIT Bombay' },
  { label: 'Delhi University · New Delhi', city: 'New Delhi', campus: 'Delhi University' },
  { label: 'COEP Technological Univ · Pune', city: 'Pune', campus: 'COEP Pune' },
  { label: 'NIT Surathkal · Mangaluru', city: 'Mangaluru', campus: 'NIT Surathkal' },
  { label: 'IIT Roorkee · Roorkee', city: 'Roorkee', campus: 'IIT Roorkee' },
];

export function formatMarketINR(amount: number | null | undefined, listingType?: MarketListingType): string {
  if (listingType === 'Giveaway') return 'Free (Giveaway)';
  if (listingType === 'Exchange') return 'Exchange';
  if (amount === null || amount === undefined || Number.isNaN(amount)) return 'Price on inquiry';
  if (amount === 0) return 'Free';
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatMarketDate(iso?: string): string {
  if (!iso) return 'Recently';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

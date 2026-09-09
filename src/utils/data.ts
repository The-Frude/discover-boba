import fs from 'fs'
import path from 'path'
import { supabase } from './supabase';

export interface Shop {
  id: string;
  name: string;
  formatted_address: string;
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
  rating: number;
  user_ratings_total: number;
  reviews?: number;
  reviews_link?: string;
  website?: string;
  formatted_phone_number?: string;
  opening_hours?: {
    weekday_text: string[];
  };
  working_hours?: any;
  photos?: string[];
  tags: string[];
  slug: string;
  email?: string;
  description?: string;
  description_enriched?: string;
  meta_title?: string;
  meta_description?: string;
  has_working_photo?: boolean;
  about?: string;
  reservation_links?: string;
  booking_appointment_link?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  menu_link?: string;
  order_links?: string;
  is_premium?: boolean;
  featured_until?: string;
  featured_logo?: string;
  featured_order_url?: string;
  owner_id?: string;
  updated_at?: string;
}

// Tags applied to every shop by extractTags() regardless of its actual
// data, so they carry no filtering value and are deprioritized on shop
// cards and excluded from filter options (see extractTags below).
export const GENERIC_TAGS = [
  'Bubble Tea',
  'Milk Tea',
  'Tapioca Pearls',
  'Boba',
  'Takeout',
  'Dine-in',
]

export interface City {
  name: string;
  slug: string;
  state: string;
  shopCount: number;
  image?: string;
}

// `about` is not free text - it's a structured JSON blob straight from the
// original Google Places scrape, shaped like:
//   {"Service options": {"Delivery": true, "Takeout": true}, "Crowd":
//    {"LGBTQ+ friendly": true}, "Other": {"LGBTQ+ friendly": true}, ...}
// The same real-world attribute sometimes appears filed under two
// different category names (e.g. "LGBTQ+ friendly" under both "Crowd"
// and "Other" for the same shop), so this flattens every category and
// returns the set of true-valued leaf attribute names, category-agnostic.
// 810 of 813 shops parse successfully; the rest have an empty/missing
// `about` and just get an empty set.
export function parseAboutAttributes(about?: string | null): Set<string> {
  const attributes = new Set<string>();
  if (!about || about === '{}') return attributes;
  let parsed: Record<string, Record<string, boolean>>;
  try {
    parsed = JSON.parse(about);
  } catch {
    return attributes;
  }
  Object.values(parsed).forEach((items) => {
    if (!items || typeof items !== 'object') return;
    Object.entries(items).forEach(([name, value]) => {
      if (value === true) attributes.add(name);
    });
  });
  return attributes;
}

export interface FilterAttribute {
  key: string;
  label: string;
  group: string;
  /** Any one of these raw `about` item names counts as a match (OR). */
  aboutItems: string[];
}

// The full candidate list - not every one of these will actually appear
// as a filter in every city (or any city). Population is checked live,
// per city, against MIN_ATTRIBUTE_COUNT/MIN_ATTRIBUTE_PERCENT below, so a
// dimension that's real but too rare everywhere (e.g. "Live music", 5
// shops sitewide) simply never renders rather than needing to be manually
// excluded here. See docs/AUDIT.md for the full per-city population table
// this was calibrated against.
export const FILTER_ATTRIBUTES: FilterAttribute[] = [
  // Access & service
  { key: 'delivery', label: 'Delivery', group: 'Access & service', aboutItems: ['Delivery'] },
  {
    key: 'wheelchairAccessible',
    label: 'Wheelchair accessible',
    group: 'Access & service',
    aboutItems: [
      'Wheelchair accessible entrance',
      'Wheelchair accessible restroom',
      'Wheelchair accessible seating',
      'Wheelchair accessible parking lot',
    ],
  },
  { key: 'outdoorSeating', label: 'Outdoor seating', group: 'Access & service', aboutItems: ['Outdoor seating'] },
  { key: 'reservations', label: 'Accepts reservations', group: 'Access & service', aboutItems: ['Accepts reservations'] },
  { key: 'wifi', label: 'Wi-Fi', group: 'Access & service', aboutItems: ['Wi-Fi'] },

  // Dietary
  { key: 'vegetarian', label: 'Vegetarian options', group: 'Dietary', aboutItems: ['Vegetarian options'] },
  { key: 'vegan', label: 'Vegan options', group: 'Dietary', aboutItems: ['Vegan options'] },
  { key: 'alcohol', label: 'Serves alcohol', group: 'Dietary', aboutItems: ['Alcohol', 'Beer', 'Wine', 'Cocktails', 'Hard liquor'] },

  // Good for
  { key: 'goodForKids', label: 'Good for kids', group: 'Good for', aboutItems: ['Good for kids'] },
  { key: 'familyFriendly', label: 'Family-friendly', group: 'Good for', aboutItems: ['Family-friendly'] },
  { key: 'groups', label: 'Good for groups', group: 'Good for', aboutItems: ['Groups'] },
  { key: 'soloDining', label: 'Good for solo dining', group: 'Good for', aboutItems: ['Solo dining'] },
  { key: 'laptop', label: 'Good for working on a laptop', group: 'Good for', aboutItems: ['Good for working on laptop'] },
  { key: 'collegeStudents', label: 'Popular with college students', group: 'Good for', aboutItems: ['College students'] },
  { key: 'dogsFriendly', label: 'Dog friendly', group: 'Good for', aboutItems: ['Dogs allowed', 'Dogs allowed outside', 'Dogs allowed inside'] },

  // Inclusive & ownership
  { key: 'lgbtqFriendly', label: 'LGBTQ+ friendly', group: 'Inclusive & ownership', aboutItems: ['LGBTQ+ friendly'] },
  { key: 'transSafespace', label: 'Transgender safespace', group: 'Inclusive & ownership', aboutItems: ['Transgender safespace'] },
  { key: 'womenOwned', label: 'Women-owned', group: 'Inclusive & ownership', aboutItems: ['Identifies as women-owned'] },
  { key: 'asianOwned', label: 'Asian-owned', group: 'Inclusive & ownership', aboutItems: ['Identifies as Asian-owned'] },
  { key: 'blackOwned', label: 'Black-owned', group: 'Inclusive & ownership', aboutItems: ['Identifies as Black-owned'] },
  { key: 'latinoOwned', label: 'Latino-owned', group: 'Inclusive & ownership', aboutItems: ['Identifies as Latino-owned'] },
  { key: 'veteranOwned', label: 'Veteran-owned', group: 'Inclusive & ownership', aboutItems: ['Identifies as veteran-owned'] },
  { key: 'lgbtqOwned', label: 'LGBTQ+-owned', group: 'Inclusive & ownership', aboutItems: ['Identifies as LGBTQ+ owned'] },
  { key: 'smallBusiness', label: 'Small business', group: 'Inclusive & ownership', aboutItems: ['Small business'] },
]

// A filter that returns almost nothing is worse than no filter at all -
// this is the floor a FILTER_ATTRIBUTES entry must clear, per city, to
// actually render there. Deliberately looser than the site-wide-uniform
// dimensions (rating/hours/delivery, which clear 60%+ everywhere): those
// go through the same check but pass easily, while a genuinely niche-but-
// real attribute like "Vegan options" only shows up in the cities where
// it means something.
export const MIN_ATTRIBUTE_COUNT = 5
export const MIN_ATTRIBUTE_PERCENT = 3

export interface AvailableAttribute extends FilterAttribute {
  count: number
}

export interface AttributeGroup {
  group: string
  items: AvailableAttribute[]
}

// Given a city's full shop list, returns only the FILTER_ATTRIBUTES that
// clear the floor for THIS city, grouped for display, in FILTER_ATTRIBUTES
// order. A shop's attribute set is parsed once and reused across every
// candidate check, not re-parsed per attribute.
export function getAvailableAttributeGroups(shops: Shop[]): AttributeGroup[] {
  const attributeSets = shops.map((shop) => parseAboutAttributes(shop.about))
  const totalShops = shops.length
  const groups = new Map<string, AvailableAttribute[]>()

  FILTER_ATTRIBUTES.forEach((attr) => {
    const count = attributeSets.filter((set) => attr.aboutItems.some((item) => set.has(item))).length
    const percent = totalShops > 0 ? (count / totalShops) * 100 : 0
    if (count < MIN_ATTRIBUTE_COUNT || percent < MIN_ATTRIBUTE_PERCENT) return
    const list = groups.get(attr.group) || []
    list.push({ ...attr, count })
    groups.set(attr.group, list)
  })

  return Array.from(groups.entries()).map(([group, items]) => ({ group, items }))
}

export function shopHasAttribute(shop: Shop, attr: FilterAttribute): boolean {
  const set = parseAboutAttributes(shop.about)
  return attr.aboutItems.some((item) => set.has(item))
}

// Function to extract tags from the about field
export function extractTags(aboutField: string): string[] {
  try {
    // Default tags that are common for boba shops
    const defaultTags = GENERIC_TAGS;

    // If the about field is empty or invalid, return default tags
    if (!aboutField || aboutField === '{}') {
      return defaultTags;
    }
    
    // Extract tags using regular expressions
    const tags: string[] = [];
    
    // Common service options
    const serviceOptions = [
      'Takeout', 'Dine-in', 'Delivery', 'Curbside pickup',
      'No-contact delivery', 'Outdoor seating', 'Indoor seating'
    ];
    
    // Common features
    const features = [
      'Free Wi-Fi', 'Family-friendly', 'Vegetarian options',
      'Vegan options', 'Gluten-free options', 'Organic',
      'Accepts credit cards', 'Parking available', 'Wheelchair accessible'
    ];
    
    // Check for service options and features in the about field
    [...serviceOptions, ...features].forEach(option => {
      if (aboutField.includes(option) || 
          aboutField.toLowerCase().includes(option.toLowerCase())) {
        tags.push(option);
      }
    });
    
    // Add some boba-specific tags based on the about field content
    if (aboutField.toLowerCase().includes('fruit')) tags.push('Fruit Teas');
    if (aboutField.toLowerCase().includes('matcha')) tags.push('Matcha');
    if (aboutField.toLowerCase().includes('taro')) tags.push('Taro');
    if (aboutField.toLowerCase().includes('coffee')) tags.push('Coffee');
    if (aboutField.toLowerCase().includes('smoothie')) tags.push('Smoothies');
    if (aboutField.toLowerCase().includes('slush')) tags.push('Slushies');
    
    // Combine with default tags and remove duplicates
    return [...new Set([...defaultTags, ...tags])];
  } catch (error) {
    console.error('Error extracting tags:', error);
    return [];
  }
}

// Sentence openers used to build a fallback shop blurb when the CSV-sourced
// `description` field is empty. Picking a deterministic opener/feature/service
// combination per shop (via a hash of its slug) avoids every page reading as
// the exact same template while keeping the output stable across renders.
const BLURB_OPENERS: Array<(name: string, city: string) => string> = [
  (name, city) => `${name} is a bubble tea shop serving the ${city} area`,
  (name, city) => `Located in ${city}, ${name} specializes in bubble tea and milk tea drinks`,
  (name, city) => `${name} brings its own take on boba to ${city}`,
  (name, city) => `In ${city}, ${name} is a neighborhood stop for bubble tea`,
  (name, city) => `${name} serves bubble tea and specialty drinks in ${city}`,
  (name, city) => `${name} is one of ${city}'s bubble tea spots`,
]

const BLURB_SERVICE_PHRASES: Record<string, string[]> = {
  'Delivery': ['offers delivery', 'delivers to the neighborhood', 'is available for delivery'],
  'No-contact delivery': ['offers no-contact delivery', 'delivers without contact required'],
  'Takeout': ['offers takeout', 'is set up for quick takeout orders', 'is takeout-friendly'],
  'Curbside pickup': ['offers curbside pickup'],
  'Outdoor seating': ['has outdoor seating'],
  'Dine-in': ['has a dine-in space', 'welcomes guests to dine in', 'offers seating for dine-in'],
}

const BLURB_FEATURE_LABELS: Record<string, string> = {
  'Fruit Teas': 'fruit teas',
  'Matcha': 'matcha drinks',
  'Taro': 'taro flavors',
  'Coffee': 'coffee drinks',
  'Smoothies': 'smoothies',
  'Slushies': 'slushies',
}

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

// Builds a short, non-templated-sounding blurb from whatever data a shop
// does have (tags, service options, city) for the ~65-85% of shops whose
// CSV `description` column is empty.
export function generateShopBlurb(shop: Shop): string {
  const seed = hashString(shop.slug || shop.name || '')
  const opener = BLURB_OPENERS[seed % BLURB_OPENERS.length](shop.name, shop.city)

  const distinguishing = shop.tags.filter(tag => !GENERIC_TAGS.includes(tag))
  const features = distinguishing
    .map(tag => BLURB_FEATURE_LABELS[tag])
    .filter((label): label is string => Boolean(label))
  const services = distinguishing.filter(tag => BLURB_SERVICE_PHRASES[tag])

  const clauses: string[] = []
  if (features.length > 0) {
    clauses.push(`with ${features.slice(0, 2).join(' and ')} on the menu`)
  }
  if (services.length > 0) {
    const service = services[seed % services.length]
    const phraseOptions = BLURB_SERVICE_PHRASES[service]
    clauses.push(phraseOptions[seed % phraseOptions.length])
  }

  if (clauses.length === 0) {
    return `${opener}.`
  }

  return `${opener}, ${clauses.join(', and ')}.`
}

// Prefers the human-reviewed enriched description, then the real
// Google-sourced description, then a generated fallback blurb - so every
// shop page has at least one sentence of descriptive text instead of just
// structured facts.
export function getShopDescription(shop: Shop): string {
  if (shop.description_enriched && shop.description_enriched.trim()) {
    return shop.description_enriched.trim()
  }
  if (shop.description && shop.description.trim()) {
    return shop.description.trim()
  }
  return generateShopBlurb(shop)
}

// Function to extract city and state from formatted_address
export function extractCityState(formattedAddress: string): { city: string; state: string } {
  try {
    // Example: "1165 Perimeter Center W #303 Atlanta GA 30346"
    const parts = formattedAddress.split(' ');
    
    // Assuming the format is consistent with city and state near the end
    // This is a simplified approach and might need refinement for different address formats
    const state = parts[parts.length - 2];
    const city = parts[parts.length - 3];
    
    return { city, state };
  } catch (error) {
    console.error('Error extracting city and state:', error);
    return { city: '', state: '' };
  }
}

// Function to format working hours
export function formatWorkingHours(workingHours: any): string[] {
  try {
    if (!workingHours) return [];
    
    // If workingHours is already an object
    if (typeof workingHours === 'object') {
      return Object.entries(workingHours).map(([day, hours]) => {
        return `${day}: ${hours}`;
      });
    }
    
    // If workingHours is a string, parse it
    const hoursData = JSON.parse(typeof workingHours === 'string' ? workingHours.replace(/'/g, '"') : workingHours);
    
    // Format the hours
    return Object.entries(hoursData).map(([day, hours]) => {
      return `${day}: ${hours}`;
    });
  } catch (error) {
    console.error('Error formatting working hours:', error);
    return [];
  }
}

const SCHEMA_DAYS: Record<string, string> = {
  Monday: 'https://schema.org/Monday',
  Tuesday: 'https://schema.org/Tuesday',
  Wednesday: 'https://schema.org/Wednesday',
  Thursday: 'https://schema.org/Thursday',
  Friday: 'https://schema.org/Friday',
  Saturday: 'https://schema.org/Saturday',
  Sunday: 'https://schema.org/Sunday',
}

function to24HourTime(time: string): string | null {
  const match = time.trim().match(/^(\d{1,2}):?(\d{2})?\s*([AaPp][Mm])?$/)
  if (!match) return null
  let hour = parseInt(match[1], 10)
  const minute = match[2] || '00'
  const meridiem = match[3]?.toUpperCase()
  if (meridiem === 'PM' && hour !== 12) hour += 12
  if (meridiem === 'AM' && hour === 12) hour = 0
  if (hour > 23) return null
  return `${hour.toString().padStart(2, '0')}:${minute}`
}

// Best-effort conversion of "Monday: 9:00 AM – 9:00 PM" style hours strings
// into schema.org OpeningHoursSpecification entries. Lines that don't match
// a recognizable day/time-range pattern (e.g. "Closed") are skipped rather
// than guessed at.
export function parseOpeningHoursSpec(hours: string[]): Array<Record<string, string>> {
  const specs: Array<Record<string, string>> = []

  for (const line of hours) {
    const [dayRaw, timeRaw] = line.split(': ')
    if (!dayRaw || !timeRaw) continue

    const dayOfWeek = SCHEMA_DAYS[dayRaw.trim()]
    if (!dayOfWeek) continue
    if (/closed/i.test(timeRaw)) continue

    const parts = timeRaw.split(/–|—|-/).map(s => s.trim())
    if (parts.length !== 2) continue

    const opens = to24HourTime(parts[0])
    const closes = to24HourTime(parts[1])
    if (!opens || !closes) continue

    specs.push({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek,
      opens,
      closes,
    })
  }

  return specs
}

// The site groups shops by metro, not exact address (docs/AUDIT.md), so
// "open now" is approximated with one timezone per metro rather than a
// per-shop timezone lookup - accurate enough for the 7 metros covered.
const CITY_TIMEZONES: Record<string, string> = {
  Atlanta: 'America/New_York',
  Chicago: 'America/Chicago',
  Dallas: 'America/Chicago',
  'New York': 'America/New_York',
  Philadelphia: 'America/New_York',
  Seattle: 'America/Los_Angeles',
  Washington: 'America/New_York',
}

function parseClockToMinutes(raw: string): number | null {
  const match = raw.trim().match(/^(\d{1,2}):?(\d{2})?\s*([AaPp][Mm])?$/)
  if (!match) return null
  let hour = parseInt(match[1], 10)
  const minute = match[2] ? parseInt(match[2], 10) : 0
  let meridiem = match[3]?.toUpperCase()

  if (!meridiem) {
    // Source data sometimes omits AM/PM on the opening time (e.g.
    // "12-9PM"). A bare 12 is overwhelmingly a shop's noon opening, not
    // midnight; any other bare hour in this dataset is a morning opening.
    meridiem = hour === 12 ? 'PM' : 'AM'
  }

  if (meridiem === 'PM' && hour !== 12) hour += 12
  if (meridiem === 'AM' && hour === 12) hour = 0
  if (hour > 23) return null
  return hour * 60 + minute
}

function formatMinutesAsClock(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440
  let hour = Math.floor(normalized / 60)
  const minute = normalized % 60
  const meridiem = hour >= 12 ? 'PM' : 'AM'
  hour = hour % 12 || 12
  return minute === 0 ? `${hour} ${meridiem}` : `${hour}:${minute.toString().padStart(2, '0')} ${meridiem}`
}

export interface OpenStatus {
  isOpen: boolean
  label: string
}

// Best-effort "open now" status for the shop card (docs/UI-OVERHAUL-PLAN-09sep2026.md
// §4). Returns null whenever it can't be determined confidently (missing
// hours, unrecognized city, unparseable time range) - the card omits the
// status line entirely in that case rather than guessing.
export function getOpenStatus(shop: Shop): OpenStatus | null {
  if (!shop.working_hours || typeof shop.working_hours !== 'object') return null
  const timeZone = CITY_TIMEZONES[shop.city]
  if (!timeZone) return null

  let dayName: string
  let nowMinutes: number
  try {
    const now = new Date()
    dayName = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long' }).format(now)
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(now)
    const h = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10)
    const m = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10)
    nowMinutes = h * 60 + m
  } catch {
    return null
  }

  const todayHours = (shop.working_hours as Record<string, string>)[dayName]
  if (!todayHours) return null
  if (/closed/i.test(todayHours)) return { isOpen: false, label: 'Closed today' }

  const range = todayHours.split(/–|—|-/).map((s) => s.trim())
  if (range.length !== 2) return null

  const openMinutes = parseClockToMinutes(range[0])
  let closeMinutes = parseClockToMinutes(range[1])
  if (openMinutes === null || closeMinutes === null) return null
  if (closeMinutes <= openMinutes) closeMinutes += 1440 // crosses midnight

  if (nowMinutes >= openMinutes && nowMinutes < closeMinutes) {
    return { isOpen: true, label: `closes ${formatMinutesAsClock(closeMinutes)}` }
  }
  return { isOpen: false, label: `opens ${formatMinutesAsClock(openMinutes)}` }
}

// Function to create a slug from a string
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
}

// getCities() otherwise derives a metro's `state` from whichever shop row
// happens to load first for that city - fine for single-state metros, but
// for multi-state metros (Washington spans DC/MD/VA) that makes `state`
// depend on query row order rather than reliably resolving to the metro's
// actual primary state/label. Override it for the metros where that matters.
const CITY_PRIMARY_STATE: Record<string, string> = {
  Washington: 'D.C.',
}

// Function to get all cities
export async function getCities(): Promise<City[]> {
  try {
    // Get all unique cities from the shops table
    const { data: cityData, error } = await supabase
      .from('shops')
      .select('city, state')
      .order('city');
      
    if (error) {
      console.error('Error fetching cities:', error);
      return [];
    }
    
    // Count shops per city and create city objects
    const cities: City[] = [];
    const cityMap = new Map<string, { count: number, state: string }>();
    
    // Group by city and count shops
    for (const shop of cityData) {
      const cityName = shop.city;
      if (!cityMap.has(cityName)) {
        cityMap.set(cityName, { count: 1, state: shop.state });
      } else {
        const current = cityMap.get(cityName)!;
        cityMap.set(cityName, { count: current.count + 1, state: current.state });
      }
    }
    
    // Create city objects
    for (const [cityName, data] of cityMap.entries()) {
      // Check for city image
      let imagePath = `/images/${cityName}.jpg`; // Default path
      if (fs.existsSync(path.join(process.cwd(), 'public', 'images', `${cityName}.jpg`))) {
        imagePath = `/images/${cityName}.jpg`;
      } else if (fs.existsSync(path.join(process.cwd(), 'public', 'images', `${cityName}.JPG`))) {
        imagePath = `/images/${cityName}.JPG`;
      } else if (fs.existsSync(path.join(process.cwd(), 'public', 'images', `${cityName}.jpeg`))) {
        imagePath = `/images/${cityName}.jpeg`;
      } else if (fs.existsSync(path.join(process.cwd(), 'public', 'images', `${cityName}.PNG`))) {
        imagePath = `/images/${cityName}.PNG`;
      } else {
        imagePath = `/images/boba-cat.jpeg`; // Fallback image
      }
      
      cities.push({
        name: cityName,
        slug: createSlug(cityName),
        state: CITY_PRIMARY_STATE[cityName] || data.state,
        shopCount: data.count,
        image: imagePath,
      });
    }
    
    return cities;
  } catch (error) {
    console.error('Error getting cities:', error);
    return [];
  }
}

// Function to get shops by city
export async function getShopsByCity(cityName: string, sortBy = 'rating'): Promise<Shop[]> {
  try {
    // Determine sort order
    let sortField = 'rating';
    let ascending = false;
    
    switch(sortBy) {
      case 'rating': 
        sortField = 'rating';
        ascending = false;
        break;
      case 'reviews': 
        sortField = 'user_ratings_total';
        ascending = false;
        break;
      case 'name': 
        sortField = 'name';
        ascending = true;
        break;
      default: 
        sortField = 'rating';
        ascending = false;
    }
    
    // Add premium sorting (premium shops first, then by selected sort)
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('city', cityName)
      .order('is_premium', { ascending: false })
      .order(sortField, { ascending });
      
    if (error) {
      console.error(`Error getting shops for ${cityName}:`, error);
      return [];
    }

    // Group listings so the best-presented shops show first: a real
    // Google description plus a working photo, then just a working
    // photo, then everything else. Array.sort is stable, so within each
    // premium/tier bucket the existing rating/name/reviews order (already
    // applied by the query above) is left exactly as-is.
    const shops = [...(data || [])];
    shops.sort((a, b) => {
      const premiumDiff = (b.is_premium ? 1 : 0) - (a.is_premium ? 1 : 0);
      if (premiumDiff !== 0) return premiumDiff;
      return getDisplayTierPriority(a) - getDisplayTierPriority(b);
    });

    return shops;
  } catch (error) {
    console.error(`Error getting shops for ${cityName}:`, error);
    return [];
  }
}

// Display-order priority for city listings: 0 = real description + working
// photo, 1 = working photo only, 2 = no working photo.
function getDisplayTierPriority(shop: Shop): number {
  const hasRealDescription = Boolean(shop.description && shop.description.trim());
  const hasWorkingPhoto = shop.has_working_photo === true;
  if (hasRealDescription && hasWorkingPhoto) return 0;
  if (hasWorkingPhoto) return 1;
  return 2;
}

// Function to get a shop by slug
export async function getShopBySlug(slug: string): Promise<Shop | null> {
  try {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('slug', slug)
      .single();
      
    if (error) {
      console.error(`Error getting shop with slug ${slug}:`, error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error(`Error getting shop with slug ${slug}:`, error);
    return null;
  }
}

// Returns the most recent `updated_at` across all shops, as a freshness
// signal for the footer. Uses the existing column (auto-maintained by the
// DB on every row update) rather than adding any new tracking.
export async function getLastUpdated(): Promise<Date | null> {
  try {
    const { data, error } = await supabase
      .from('shops')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data?.updated_at) {
      return null;
    }

    return new Date(data.updated_at);
  } catch (error) {
    console.error('Error getting last updated date:', error);
    return null;
  }
}

// Function to get all tags across all shops
export async function getAllTags(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('shops')
      .select('tags');
      
    if (error) {
      console.error('Error getting tags:', error);
      return [];
    }
    
    // Flatten and deduplicate tags
    const allTags = new Set<string>();
    
    data.forEach(shop => {
      if (shop.tags) {
        shop.tags.forEach((tag: string) => {
          allTags.add(tag);
        });
      }
    });
    
    return Array.from(allTags);
  } catch (error) {
    console.error('Error getting tags:', error);
    return [];
  }
}

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

// Returns the real Google-sourced description when present, otherwise a
// generated fallback blurb - so every shop page has at least one sentence
// of descriptive text instead of just structured facts.
export function getShopDescription(shop: Shop): string {
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
    
    return data || [];
  } catch (error) {
    console.error(`Error getting shops for ${cityName}:`, error);
    return [];
  }
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

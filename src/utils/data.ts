import fs from 'fs'
import path from 'path'
import csvParser from 'csv-parser'
import { Readable } from 'stream'

export interface Shop {
  id: string;
  name: string;
  formatted_address: string;
  city: string;
  state: string;
  rating: number;
  user_ratings_total: number;
  reviews?: number;
  reviews_link?: string;
  website?: string;
  formatted_phone_number?: string;
  opening_hours?: {
    weekday_text: string[];
  };
  working_hours?: string;
  photos?: string[];
  tags: string[];
  slug: string;
}

export interface City {
  name: string;
  slug: string;
  state: string;
  shopCount: number;
  image?: string;
}

// Function to parse CSV data
export async function parseCSV(filePath: string): Promise<any[]> {
  const results: any[] = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (data: any) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error: Error) => reject(error));
  });
}

// Function to extract tags from the about field
export function extractTags(aboutField: string): string[] {
  try {
    // Default tags that are common for boba shops
    const defaultTags = [
      'Bubble Tea', 
      'Milk Tea', 
      'Tapioca Pearls', 
      'Boba', 
      'Takeout', 
      'Dine-in'
    ];
    
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
export function formatWorkingHours(workingHours: string): string[] {
  try {
    if (!workingHours) return [];
    
    // Parse the JSON data
    const hoursData = JSON.parse(workingHours.replace(/'/g, '"'));
    
    // Format the hours
    return Object.entries(hoursData).map(([day, hours]) => {
      return `${day}: ${hours}`;
    });
  } catch (error) {
    console.error('Error formatting working hours:', error);
    return [];
  }
}

// Function to create a slug from a string
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
}

// Function to get all cities
export async function getCities(): Promise<City[]> {
  const dataDir = path.join(process.cwd(), 'data');
  const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.csv'));
  
  const cities: City[] = [];
  
  for (const file of files) {
    const cityName = path.basename(file, '.csv');
    const filePath = path.join(dataDir, file);
    
    try {
      const shops = await getShopsByCity(cityName);
      const firstShop = shops[0];
      
      cities.push({
        name: cityName,
        slug: createSlug(cityName),
        state: firstShop?.state || '',
        shopCount: shops.length,
        image: '/images/boba-cat.jpeg', // Default image
      });
    } catch (error) {
      console.error(`Error processing ${cityName}:`, error);
    }
  }
  
  return cities;
}

// Function to get shops by city
export async function getShopsByCity(cityName: string): Promise<Shop[]> {
  const filePath = path.join(process.cwd(), 'data', `${cityName}.csv`);
  
  if (!fs.existsSync(filePath)) {
    return [];
  }
  
  try {
    const rawData = await parseCSV(filePath);
    
    return rawData.map((item: any) => {
      const address = item.full_address || item.formatted_address || '';
      const { city, state } = extractCityState(address);
      
      // Handle both hour formats
      let openingHours = null;
      if (item.working_hours) {
        try {
          openingHours = typeof item.working_hours === 'string' 
            ? JSON.parse(item.working_hours)
            : item.working_hours;
        } catch (e) {
          console.error('Error parsing working_hours:', e);
        }
      } else if (item.working_hours_old_format) {
        try {
          const hoursArray = item.working_hours_old_format.split('|');
          const hoursObj: Record<string, string> = {};
          hoursArray.forEach((hour: string) => {
            const [day, time] = hour.split(':');
            hoursObj[day] = time;
          });
          openingHours = { weekday_text: Object.entries(hoursObj).map(([day, time]) => `${day}: ${time}`) };
        } catch (e) {
          console.error('Error parsing working_hours_old_format:', e);
        }
      }
      
      return {
        id: item.id || item.place_id || '',
        name: item.name || '',
        formatted_address: address,
        city,
        state,
        rating: parseFloat(item.rating) || 0,
        user_ratings_total: parseInt(item.user_ratings_total) || 0,
        reviews: parseInt(item.reviews) || 0,
        reviews_link: item.reviews_link || '',
        website: item.website || '',
        formatted_phone_number: item.formatted_phone_number || '',
        opening_hours: openingHours,
        working_hours: item.working_hours || '',
        photos: item.photos ? [item.photos] : [],
        tags: extractTags(item.about || '{}'),
        slug: createSlug(item.name || ''),
      };
    });
  } catch (error) {
    console.error(`Error getting shops for ${cityName}:`, error);
    return [];
  }
}

// Function to get a shop by slug
export async function getShopBySlug(slug: string): Promise<Shop | null> {
  const dataDir = path.join(process.cwd(), 'data');
  const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.csv'));
  
  for (const file of files) {
    const cityName = path.basename(file, '.csv');
    const shops = await getShopsByCity(cityName);
    
    const shop = shops.find(shop => shop.slug === slug);
    if (shop) {
      return shop;
    }
  }
  
  return null;
}

// Function to get all tags across all shops
export async function getAllTags(): Promise<string[]> {
  const dataDir = path.join(process.cwd(), 'data');
  const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.csv'));
  
  const allTags = new Set<string>();
  
  for (const file of files) {
    const cityName = path.basename(file, '.csv');
    const shops = await getShopsByCity(cityName);
    
    shops.forEach(shop => {
      shop.tags.forEach(tag => {
        allTags.add(tag);
      });
    });
  }
  
  return Array.from(allTags);
}

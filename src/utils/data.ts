import fs from 'fs'
import path from 'path'
import { supabase } from './supabase';

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
  working_hours?: any;
  photos?: string[];
  tags: string[];
  slug: string;
  email?: string;
  menu_link?: string;
  order_links?: string;
  is_premium?: boolean;
  featured_until?: string;
  featured_logo?: string;
}

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

// Function to create a slug from a string
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
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
        state: data.state,
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

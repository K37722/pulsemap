import axios, { AxiosInstance } from 'axios';
import { Coordinates, LocationPrecision } from '@/types/incident';

interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  boundingbox?: string[];
}

export class GeocodingService {
  private client: AxiosInstance;
  private userAgent: string;
  private cache: Map<string, { coords: Coordinates | null; precision: LocationPrecision }>;
  private lastRequestTime: number = 0;
  private minRequestInterval: number = 1000; // Nominatim requires 1 request/second

  constructor() {
    this.userAgent = process.env.NOMINATIM_USER_AGENT || 'PulseMap/1.0';
    const baseURL = process.env.NOMINATIM_API_URL || 'https://nominatim.openstreetmap.org';

    this.client = axios.create({
      baseURL,
      timeout: 5000,
      headers: {
        'User-Agent': this.userAgent,
      },
    });

    this.cache = new Map();
  }

  /**
   * Geocode a location string to coordinates
   */
  async geocode(
    location: string,
    district: string = 'Oslo'
  ): Promise<{ coordinates: Coordinates | null; precision: LocationPrecision }> {
    const cacheKey = `${location}|${district}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Rate limiting - ensure we don't exceed 1 request/second for Nominatim
    await this.enforceRateLimit();

    try {
      // Build search query with context
      const searchQuery = `${location}, ${district}, Norway`;

      const response = await this.client.get<NominatimResponse[]>('/search', {
        params: {
          q: searchQuery,
          format: 'json',
          addressdetails: 1,
          limit: 1,
        },
      });

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        const coordinates: Coordinates = {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
        };

        const precision = this.determinePrecision(result, location);
        const geocodeResult = { coordinates, precision };

        // Cache the result
        this.cache.set(cacheKey, geocodeResult);

        return geocodeResult;
      }

      // No results found
      const noResult = { coordinates: null, precision: 'unknown' as LocationPrecision };
      this.cache.set(cacheKey, noResult);
      return noResult;

    } catch (error) {
      console.error(`Geocoding error for "${location}":`, error);
      return { coordinates: null, precision: 'unknown' };
    }
  }

  /**
   * Reverse geocode coordinates to an address
   */
  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    await this.enforceRateLimit();

    try {
      const response = await this.client.get<any>('/reverse', {
        params: {
          lat,
          lon: lng,
          format: 'json',
          addressdetails: 1,
        },
      });

      return response.data?.display_name || null;
    } catch (error) {
      console.error(`Reverse geocoding error for (${lat}, ${lng}):`, error);
      return null;
    }
  }

  /**
   * Determine location precision based on geocoding result and original location string
   */
  private determinePrecision(
    result: NominatimResponse,
    originalLocation: string
  ): LocationPrecision {
    const location = originalLocation.toLowerCase();

    // Check for specific address indicators
    const hasNumber = /\d+/.test(location);
    const hasStreetWords = /(gate|vei|veien|plass|allé|gata|street|road)/i.test(location);

    // Nominatim result type
    const type = result.type;
    const classification = result.class;

    // Exact address: has street number
    if (hasNumber && hasStreetWords) {
      if (type === 'house' || type === 'building' || type === 'residential') {
        return 'exact';
      }
      return 'street';
    }

    // Street level: has street name but no number
    if (hasStreetWords) {
      return 'street';
    }

    // Area/neighborhood level
    if (
      type === 'neighbourhood' ||
      type === 'suburb' ||
      type === 'quarter' ||
      classification === 'place'
    ) {
      return 'area';
    }

    // District level
    if (
      type === 'city_district' ||
      type === 'district' ||
      type === 'municipality'
    ) {
      return 'district';
    }

    // General location (just city name, etc.)
    if (location.length < 10 || location.split(' ').length <= 2) {
      return 'district';
    }

    // Default to area if we have a result but can't determine specificity
    return 'area';
  }

  /**
   * Enforce rate limiting (1 request per second for Nominatim)
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Batch geocode multiple locations with rate limiting
   */
  async batchGeocode(
    locations: Array<{ location: string; district: string }>
  ): Promise<Array<{ coordinates: Coordinates | null; precision: LocationPrecision }>> {
    const results: Array<{ coordinates: Coordinates | null; precision: LocationPrecision }> = [];

    for (const loc of locations) {
      const result = await this.geocode(loc.location, loc.district);
      results.push(result);
    }

    return results;
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; entries: number } {
    return {
      size: this.cache.size,
      entries: this.cache.size,
    };
  }
}

// Singleton instance
let geocodingService: GeocodingService | null = null;

export function getGeocodingService(): GeocodingService {
  if (!geocodingService) {
    geocodingService = new GeocodingService();
  }
  return geocodingService;
}

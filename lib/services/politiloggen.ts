import axios, { AxiosInstance } from 'axios';
import { PolitiloggenIncident } from '@/types/incident';
import { mockIncidents, getMockIncidentsByDistrict, getMockIncidentsByDateRange } from './mock-data';

export class PolitiloggenService {
  private client: AxiosInstance;
  private baseUrl: string;
  private useMockData: boolean;

  constructor() {
    this.baseUrl = process.env.POLITILOGGEN_API_URL || 'https://api.politiet.no/politiloggen/v1';
    this.useMockData = process.env.USE_MOCK_DATA === 'true';

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PulseMap/1.0',
      },
    });
  }

  /**
   * Fetch incidents from Politiloggen API
   * @param district - Police district (e.g., "Oslo")
   * @param from - ISO date string for start date
   * @param to - ISO date string for end date
   */
  async fetchIncidents(
    district?: string,
    from?: string,
    to?: string
  ): Promise<PolitiloggenIncident[]> {
    // Use mock data if enabled or if API fails
    if (this.useMockData) {
      console.log('🔄 Using mock data (USE_MOCK_DATA=true in .env)');
      return this.getMockData(district, from, to);
    }

    try {
      const params: any = {
        Take: 50, // Max allowed by API
        SortBy: 'Date',
        SortOrder: 'Descending',
      };

      // API uses capital first letter for parameters
      if (district) {
        params.Districts = [district]; // Array format
      }

      if (from) {
        params.DateFrom = from;
      }

      if (to) {
        params.DateTo = to;
      }

      // Correct endpoint is /messages not /hendelser
      const response = await this.client.get('/messages', { params });

      const data = response.data;

      if (Array.isArray(data)) {
        console.log(`✅ Fetched ${data.length} incidents from Politiloggen API`);
        return data.map(this.normalizeIncident);
      }

      console.warn('Unexpected API response structure:', data);
      return [];
    } catch (error: any) {
      console.error('❌ Error fetching from Politiloggen API:', error.message);

      // Fallback to mock data if API fails
      console.log('⚠️  API failed - falling back to mock data');
      return this.getMockData(district, from, to);
    }
  }

  /**
   * Get mock data (used when API is unavailable or in development)
   */
  private getMockData(district?: string, from?: string, to?: string): PolitiloggenIncident[] {
    if (from || to) {
      return getMockIncidentsByDateRange(from, to);
    }
    if (district) {
      return getMockIncidentsByDistrict(district);
    }
    return mockIncidents;
  }

  /**
   * Fetch a single incident by ID
   */
  async fetchIncidentById(id: string): Promise<PolitiloggenIncident | null> {
    if (this.useMockData) {
      return mockIncidents.find(i => i.id === id) || null;
    }

    try {
      // Correct endpoint is /message/{id}
      const response = await this.client.get(`/message/${id}`);
      return this.normalizeIncident(response.data);
    } catch (error) {
      console.error(`Error fetching incident ${id}:`, error);
      return null;
    }
  }

  /**
   * Normalize incident data from API response to our format
   * API fields: id, threadId, text, district, category, municipality, area, createdOn, updatedOn, isActive
   */
  private normalizeIncident(raw: any): PolitiloggenIncident {
    return {
      id: raw.id || raw.hendelseid || raw.incident_id,
      published: raw.createdOn || raw.published || raw.publisert || raw.timestamp,
      lastModified: raw.updatedOn || raw.lastModified || raw.sistEndret || raw.last_modified,
      location: raw.area || raw.municipality || raw.location || raw.lokasjon || raw.sted || '',
      district: raw.district || raw.politidistrikt || raw.distrikt || '',
      category: raw.category || raw.kategori || raw.type || 'Ukjent',
      subcategory: raw.subcategory || raw.underkategori,
      title: raw.category || raw.title || raw.tittel || raw.overskrift || '', // Use category as title if no title
      description: raw.text || raw.description || raw.beskrivelse || raw.tekst || '',
      status: raw.isActive ? 'Aktiv' : 'Avsluttet',
    };
  }

  /**
   * Extract thread ID from incident
   * The thread ID groups related incidents together
   */
  extractThreadId(incident: PolitiloggenIncident): string {
    // Strategy 1: Look for explicit thread/group ID in the data
    const raw = incident as any;
    if (raw.threadId || raw.thread_id || raw.gruppeId) {
      return raw.threadId || raw.thread_id || raw.gruppeId;
    }

    // Strategy 2: Create thread ID based on location + category + date
    // This groups incidents at the same location with same category on the same day
    const date = new Date(incident.published);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const locationKey = incident.location.toLowerCase().replace(/[^a-z0-9]/g, '');
    const categoryKey = incident.category.toLowerCase().replace(/[^a-z0-9]/g, '');

    return `${dateStr}-${locationKey}-${categoryKey}`;
  }

  /**
   * Check API health
   */
  async healthCheck(): Promise<boolean> {
    if (this.useMockData) {
      return true; // Always healthy in mock mode
    }

    try {
      // Correct endpoint: /messages with minimal parameters
      const response = await this.client.get('/messages', {
        params: {
          Take: 1,
          Districts: ['Oslo'],
        },
        timeout: 10000,
      });
      return response.status === 200;
    } catch (error) {
      console.error('Politiloggen API health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
let politiloggenService: PolitiloggenService | null = null;

export function getPolitiloggenService(): PolitiloggenService {
  if (!politiloggenService) {
    politiloggenService = new PolitiloggenService();
  }
  return politiloggenService;
}

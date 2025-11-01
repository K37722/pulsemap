import axios, { AxiosInstance } from 'axios';
import { PolitiloggenIncident } from '@/types/incident';

export class PolitiloggenService {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.POLITILOGGEN_API_URL || 'https://api.politiet.no/politiloggen/v1';
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
    try {
      const params: any = {};

      if (district) {
        params.politidistrikt = district;
      }

      if (from) {
        params.fra = from;
      }

      if (to) {
        params.til = to;
      }

      const response = await this.client.get('/hendelser', { params });

      // The API might return different structures - adjust based on actual response
      const data = response.data;

      if (Array.isArray(data)) {
        return data.map(this.normalizeIncident);
      } else if (data.results && Array.isArray(data.results)) {
        return data.results.map(this.normalizeIncident);
      } else if (data.hendelser && Array.isArray(data.hendelser)) {
        return data.hendelser.map(this.normalizeIncident);
      }

      console.warn('Unexpected API response structure:', data);
      return [];
    } catch (error) {
      console.error('Error fetching incidents from Politiloggen:', error);
      throw error;
    }
  }

  /**
   * Fetch a single incident by ID
   */
  async fetchIncidentById(id: string): Promise<PolitiloggenIncident | null> {
    try {
      const response = await this.client.get(`/hendelser/${id}`);
      return this.normalizeIncident(response.data);
    } catch (error) {
      console.error(`Error fetching incident ${id}:`, error);
      return null;
    }
  }

  /**
   * Normalize incident data from API response
   */
  private normalizeIncident(raw: any): PolitiloggenIncident {
    return {
      id: raw.id || raw.hendelseid || raw.incident_id,
      published: raw.published || raw.publisert || raw.timestamp,
      lastModified: raw.lastModified || raw.sistEndret || raw.last_modified,
      location: raw.location || raw.lokasjon || raw.sted || '',
      district: raw.district || raw.politidistrikt || raw.distrikt || '',
      category: raw.category || raw.kategori || raw.type || 'Ukjent',
      subcategory: raw.subcategory || raw.underkategori,
      title: raw.title || raw.tittel || raw.overskrift || '',
      description: raw.description || raw.beskrivelse || raw.tekst || '',
      status: raw.status || raw.status,
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
    try {
      // Try fetching incidents as a health check (API doesn't have /health endpoint)
      const response = await this.client.get('/hendelser', {
        params: {
          limit: 1,
          // Optional: filter by Oslo to make request faster
        },
        timeout: 10000, // Increased timeout to 10 seconds
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

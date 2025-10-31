import { getPolitiloggenService } from './politiloggen';
import { getGeocodingService } from './geocoding';
import { classifySeverity, classifyStatus } from './classifier';
import {
  upsertIncident,
  getIncidentsNeedingGeocode,
  updateIncidentGeocode,
  getStats,
  addIncidentUpdate,
  getIncidentsByThread,
} from '../db/incidents';
import { EnrichedIncident, PolitiloggenIncident } from '@/types/incident';

export class IncidentSyncService {
  private politiloggen = getPolitiloggenService();
  private geocoder = getGeocodingService();
  private isRunning = false;

  /**
   * Sync incidents from Politiloggen API
   */
  async syncIncidents(district: string = 'Oslo', daysBack: number = 7): Promise<{
    fetched: number;
    processed: number;
    errors: string[];
  }> {
    if (this.isRunning) {
      console.log('Sync already running, skipping...');
      return { fetched: 0, processed: 0, errors: ['Sync already running'] };
    }

    this.isRunning = true;
    const errors: string[] = [];

    try {
      // Calculate date range
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - daysBack);

      console.log(`Syncing incidents from ${from.toISOString()} to ${to.toISOString()}`);

      // Fetch incidents from API
      const incidents = await this.politiloggen.fetchIncidents(
        district,
        from.toISOString(),
        to.toISOString()
      );

      console.log(`Fetched ${incidents.length} incidents from Politiloggen`);

      // Process each incident
      let processed = 0;
      for (const incident of incidents) {
        try {
          await this.processIncident(incident);
          processed++;
        } catch (error) {
          console.error(`Error processing incident ${incident.id}:`, error);
          errors.push(`Incident ${incident.id}: ${error}`);
        }
      }

      // Geocode incidents that need it
      await this.geocodeIncidents();

      return {
        fetched: incidents.length,
        processed,
        errors,
      };
    } catch (error) {
      console.error('Error syncing incidents:', error);
      errors.push(`Sync error: ${error}`);
      return { fetched: 0, processed: 0, errors };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Process a single incident
   */
  private async processIncident(incident: PolitiloggenIncident): Promise<void> {
    // Extract thread ID (groups related incidents)
    const threadId = this.politiloggen.extractThreadId(incident);

    // Check if this is an update to an existing thread
    const existingIncidents = await getIncidentsByThread(threadId);
    const isUpdate = existingIncidents.length > 0;

    // Classify the incident
    const severity = classifySeverity(incident);
    const incidentStatus = classifyStatus(incident);

    // Try to geocode (will use cache if available)
    let coordinates = null;
    let precision = 'unknown' as const;

    try {
      const geocodeResult = await this.geocoder.geocode(
        incident.location,
        incident.district
      );
      coordinates = geocodeResult.coordinates;
      precision = geocodeResult.precision;
    } catch (error) {
      console.error(`Geocoding failed for incident ${incident.id}:`, error);
    }

    // Upsert incident
    await upsertIncident(
      incident,
      threadId,
      coordinates,
      precision,
      severity,
      incidentStatus
    );

    // If this is an update, track it
    if (isUpdate) {
      await addIncidentUpdate(incident.id, threadId, {
        id: incident.id,
        timestamp: incident.lastModified || incident.published,
        description: incident.description,
        status: incident.status,
      });
    }

    console.log(
      `Processed incident ${incident.id} (thread: ${threadId}, ` +
      `severity: ${severity}, precision: ${precision}, update: ${isUpdate})`
    );
  }

  /**
   * Geocode incidents that don't have coordinates yet
   */
  async geocodeIncidents(batchSize: number = 50): Promise<number> {
    const incidents = await getIncidentsNeedingGeocode(batchSize);

    console.log(`Geocoding ${incidents.length} incidents...`);

    let geocoded = 0;
    for (const incident of incidents) {
      try {
        const result = await this.geocoder.geocode(
          incident.location,
          incident.district
        );

        await updateIncidentGeocode(
          incident.id,
          result.coordinates,
          result.precision
        );

        if (result.coordinates) {
          geocoded++;
        }

        console.log(
          `Geocoded ${incident.id}: ${result.coordinates ? 'success' : 'failed'} ` +
          `(precision: ${result.precision})`
        );
      } catch (error) {
        console.error(`Error geocoding incident ${incident.id}:`, error);
        // Still update the attempt count
        await updateIncidentGeocode(incident.id, null, 'unknown');
      }
    }

    return geocoded;
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<any> {
    const stats = await getStats();
    const cacheStats = this.geocoder.getCacheStats();

    return {
      ...stats,
      geocodingCache: cacheStats,
      syncRunning: this.isRunning,
    };
  }

  /**
   * Force sync a specific incident by ID
   */
  async syncIncidentById(id: string): Promise<EnrichedIncident | null> {
    try {
      const incident = await this.politiloggen.fetchIncidentById(id);
      if (!incident) {
        return null;
      }

      await this.processIncident(incident);

      // Fetch the enriched incident from database
      const threadId = this.politiloggen.extractThreadId(incident);
      const incidents = await getIncidentsByThread(threadId);

      return incidents.find(i => i.id === id) || null;
    } catch (error) {
      console.error(`Error syncing incident ${id}:`, error);
      return null;
    }
  }
}

// Singleton instance
let syncService: IncidentSyncService | null = null;

export function getIncidentSyncService(): IncidentSyncService {
  if (!syncService) {
    syncService = new IncidentSyncService();
  }
  return syncService;
}

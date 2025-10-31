import { query, getClient } from './index';
import {
  EnrichedIncident,
  PolitiloggenIncident,
  IncidentUpdate,
  Coordinates,
  LocationPrecision,
  IncidentSeverity,
  IncidentStatus,
  IncidentFilters,
} from '@/types/incident';

export interface IncidentRow {
  id: string;
  thread_id: string;
  published: Date;
  last_modified?: Date;
  location: string;
  district: string;
  category: string;
  subcategory?: string;
  title: string;
  description: string;
  status?: string;
  coordinates?: any; // PostGIS geography
  precision?: LocationPrecision;
  severity?: IncidentSeverity;
  incident_status?: IncidentStatus;
  geocoding_attempts: number;
  last_geocoded?: Date;
  created_at: Date;
  updated_at: Date;
}

/**
 * Insert or update an incident
 */
export async function upsertIncident(
  incident: PolitiloggenIncident,
  threadId: string,
  coordinates: Coordinates | null,
  precision: LocationPrecision,
  severity: IncidentSeverity,
  incidentStatus: IncidentStatus
): Promise<void> {
  const coordsWKT = coordinates
    ? `POINT(${coordinates.lng} ${coordinates.lat})`
    : null;

  const sql = `
    INSERT INTO incidents (
      id, thread_id, published, last_modified, location, district,
      category, subcategory, title, description, status,
      coordinates, precision, severity, incident_status, geocoding_attempts
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
              ${coordsWKT ? `ST_GeogFromText($12)` : 'NULL'},
              $${coordsWKT ? 13 : 12}, $${coordsWKT ? 14 : 13}, $${coordsWKT ? 15 : 14}, $${coordsWKT ? 16 : 15})
    ON CONFLICT (id) DO UPDATE SET
      last_modified = EXCLUDED.last_modified,
      description = EXCLUDED.description,
      status = EXCLUDED.status,
      coordinates = EXCLUDED.coordinates,
      precision = EXCLUDED.precision,
      severity = EXCLUDED.severity,
      incident_status = EXCLUDED.incident_status,
      updated_at = NOW()
  `;

  const params = [
    incident.id,
    threadId,
    incident.published,
    incident.lastModified || null,
    incident.location,
    incident.district,
    incident.category,
    incident.subcategory || null,
    incident.title,
    incident.description,
    incident.status || null,
  ];

  if (coordsWKT) {
    params.push(`SRID=4326;${coordsWKT}`);
  }

  params.push(precision, severity, incidentStatus, 0);

  await query(sql, params);
}

/**
 * Get incidents with filters
 */
export async function getIncidents(filters?: IncidentFilters): Promise<EnrichedIncident[]> {
  let sql = `
    SELECT
      id, thread_id, published, last_modified, location, district,
      category, subcategory, title, description, status,
      ST_Y(coordinates::geometry) as lat,
      ST_X(coordinates::geometry) as lng,
      precision, severity, incident_status, geocoding_attempts,
      last_geocoded, created_at, updated_at
    FROM incidents
    WHERE 1=1
  `;

  const params: any[] = [];
  let paramIndex = 1;

  if (filters) {
    if (filters.categories && filters.categories.length > 0) {
      sql += ` AND category = ANY($${paramIndex})`;
      params.push(filters.categories);
      paramIndex++;
    }

    if (filters.statuses && filters.statuses.length > 0) {
      sql += ` AND incident_status = ANY($${paramIndex})`;
      params.push(filters.statuses);
      paramIndex++;
    }

    if (filters.severities && filters.severities.length > 0) {
      sql += ` AND severity = ANY($${paramIndex})`;
      params.push(filters.severities);
      paramIndex++;
    }

    if (filters.precisions && filters.precisions.length > 0) {
      sql += ` AND precision = ANY($${paramIndex})`;
      params.push(filters.precisions);
      paramIndex++;
    }

    if (filters.districts && filters.districts.length > 0) {
      sql += ` AND district = ANY($${paramIndex})`;
      params.push(filters.districts);
      paramIndex++;
    }

    if (filters.dateFrom) {
      sql += ` AND published >= $${paramIndex}`;
      params.push(filters.dateFrom);
      paramIndex++;
    }

    if (filters.dateTo) {
      sql += ` AND published <= $${paramIndex}`;
      params.push(filters.dateTo);
      paramIndex++;
    }
  }

  sql += ' ORDER BY published DESC LIMIT 1000';

  const result = await query<IncidentRow & { lat: number; lng: number }>(sql, params);

  const incidents: EnrichedIncident[] = result.rows.map(row => ({
    id: row.id,
    threadId: row.thread_id,
    published: row.published.toISOString(),
    lastModified: row.last_modified?.toISOString(),
    location: row.location,
    district: row.district,
    category: row.category,
    subcategory: row.subcategory,
    title: row.title,
    description: row.description,
    status: row.status,
    coordinates: row.lat && row.lng ? { lat: row.lat, lng: row.lng } : null,
    precision: row.precision || 'unknown',
    severity: row.severity || 'info',
    incidentStatus: row.incident_status || 'active',
    geocodingAttempts: row.geocoding_attempts,
    lastGeocoded: row.last_geocoded?.toISOString(),
    updates: [], // Will be populated separately if needed
  }));

  return incidents;
}

/**
 * Get incidents by thread ID
 */
export async function getIncidentsByThread(threadId: string): Promise<EnrichedIncident[]> {
  const sql = `
    SELECT
      id, thread_id, published, last_modified, location, district,
      category, subcategory, title, description, status,
      ST_Y(coordinates::geometry) as lat,
      ST_X(coordinates::geometry) as lng,
      precision, severity, incident_status, geocoding_attempts,
      last_geocoded, created_at, updated_at
    FROM incidents
    WHERE thread_id = $1
    ORDER BY published ASC
  `;

  const result = await query<IncidentRow & { lat: number; lng: number }>(sql, [threadId]);

  return result.rows.map(row => ({
    id: row.id,
    threadId: row.thread_id,
    published: row.published.toISOString(),
    lastModified: row.last_modified?.toISOString(),
    location: row.location,
    district: row.district,
    category: row.category,
    subcategory: row.subcategory,
    title: row.title,
    description: row.description,
    status: row.status,
    coordinates: row.lat && row.lng ? { lat: row.lat, lng: row.lng } : null,
    precision: row.precision || 'unknown',
    severity: row.severity || 'info',
    incidentStatus: row.incident_status || 'active',
    geocodingAttempts: row.geocoding_attempts,
    lastGeocoded: row.last_geocoded?.toISOString(),
    updates: [],
  }));
}

/**
 * Add an incident update to tracking
 */
export async function addIncidentUpdate(
  incidentId: string,
  threadId: string,
  update: IncidentUpdate
): Promise<void> {
  const sql = `
    INSERT INTO incident_updates (incident_id, thread_id, timestamp, description, status)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (incident_id, timestamp) DO NOTHING
  `;

  await query(sql, [
    incidentId,
    threadId,
    update.timestamp,
    update.description,
    update.status || null,
  ]);
}

/**
 * Get updates for an incident thread
 */
export async function getThreadUpdates(threadId: string): Promise<IncidentUpdate[]> {
  const sql = `
    SELECT id, timestamp, description, status
    FROM incident_updates
    WHERE thread_id = $1
    ORDER BY timestamp ASC
  `;

  const result = await query(sql, [threadId]);

  return result.rows.map(row => ({
    id: row.id,
    timestamp: row.timestamp.toISOString(),
    description: row.description,
    status: row.status,
  }));
}

/**
 * Get incidents that need geocoding
 */
export async function getIncidentsNeedingGeocode(limit: number = 100): Promise<EnrichedIncident[]> {
  const sql = `
    SELECT
      id, thread_id, published, last_modified, location, district,
      category, subcategory, title, description, status,
      ST_Y(coordinates::geometry) as lat,
      ST_X(coordinates::geometry) as lng,
      precision, severity, incident_status, geocoding_attempts,
      last_geocoded, created_at, updated_at
    FROM incidents
    WHERE coordinates IS NULL
      AND geocoding_attempts < 3
      AND (last_geocoded IS NULL OR last_geocoded < NOW() - INTERVAL '1 day')
    ORDER BY published DESC
    LIMIT $1
  `;

  const result = await query<IncidentRow & { lat: number; lng: number }>(sql, [limit]);

  return result.rows.map(row => ({
    id: row.id,
    threadId: row.thread_id,
    published: row.published.toISOString(),
    lastModified: row.last_modified?.toISOString(),
    location: row.location,
    district: row.district,
    category: row.category,
    subcategory: row.subcategory,
    title: row.title,
    description: row.description,
    status: row.status,
    coordinates: null,
    precision: row.precision || 'unknown',
    severity: row.severity || 'info',
    incidentStatus: row.incident_status || 'active',
    geocodingAttempts: row.geocoding_attempts,
    lastGeocoded: row.last_geocoded?.toISOString(),
    updates: [],
  }));
}

/**
 * Update geocoding information for an incident
 */
export async function updateIncidentGeocode(
  incidentId: string,
  coordinates: Coordinates | null,
  precision: LocationPrecision
): Promise<void> {
  const coordsWKT = coordinates
    ? `SRID=4326;POINT(${coordinates.lng} ${coordinates.lat})`
    : null;

  const sql = coordsWKT
    ? `
      UPDATE incidents
      SET coordinates = ST_GeogFromText($2),
          precision = $3,
          geocoding_attempts = geocoding_attempts + 1,
          last_geocoded = NOW()
      WHERE id = $1
    `
    : `
      UPDATE incidents
      SET precision = $2,
          geocoding_attempts = geocoding_attempts + 1,
          last_geocoded = NOW()
      WHERE id = $1
    `;

  const params = coordsWKT
    ? [incidentId, coordsWKT, precision]
    : [incidentId, precision];

  await query(sql, params);
}

/**
 * Get statistics
 */
export async function getStats(): Promise<{
  total: number;
  active: number;
  geocoded: number;
  needsGeocode: number;
}> {
  const sql = `
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE incident_status = 'active') as active,
      COUNT(*) FILTER (WHERE coordinates IS NOT NULL) as geocoded,
      COUNT(*) FILTER (WHERE coordinates IS NULL AND geocoding_attempts < 3) as needs_geocode
    FROM incidents
  `;

  const result = await query(sql);
  const row = result.rows[0];

  return {
    total: parseInt(row.total),
    active: parseInt(row.active),
    geocoded: parseInt(row.geocoded),
    needsGeocode: parseInt(row.needs_geocode),
  };
}

// Types based on Politiloggen API structure

export type LocationPrecision = 'exact' | 'street' | 'area' | 'district' | 'unknown';
export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type IncidentStatus = 'active' | 'updated' | 'closed';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface PolitiloggenIncident {
  id: string;
  published: string;
  lastModified?: string;
  location: string;
  district: string;
  category: string;
  subcategory?: string;
  title: string;
  description: string;
  status?: string;
}

export interface EnrichedIncident extends PolitiloggenIncident {
  threadId: string;
  coordinates: Coordinates | null;
  precision: LocationPrecision;
  severity: IncidentSeverity;
  incidentStatus: IncidentStatus;
  geocodingAttempts: number;
  lastGeocoded?: string;
  updates: IncidentUpdate[];
}

export interface IncidentUpdate {
  id: string;
  timestamp: string;
  description: string;
  status?: string;
}

export interface IncidentFilters {
  categories?: string[];
  statuses?: IncidentStatus[];
  severities?: IncidentSeverity[];
  precisions?: LocationPrecision[];
  districts?: string[];
  dateFrom?: Date;
  dateTo?: Date;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  lastPollTime?: Date;
  pollIntervalMs: number;
  totalIncidents: number;
  activeIncidents: number;
  geocodingSuccessRate: number;
  apiResponseTime?: number;
  errors: string[];
}

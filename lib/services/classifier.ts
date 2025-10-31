import { IncidentSeverity, IncidentStatus, PolitiloggenIncident } from '@/types/incident';

/**
 * Classify incident severity based on category and description
 */
export function classifySeverity(incident: PolitiloggenIncident): IncidentSeverity {
  const category = incident.category.toLowerCase();
  const description = incident.description.toLowerCase();
  const title = incident.title.toLowerCase();
  const combined = `${category} ${description} ${title}`;

  // Critical severity keywords
  const criticalKeywords = [
    'drap',
    'mord',
    'skyteepisode',
    'skyting',
    'knivstikking',
    'gisselsituasjon',
    'terror',
    'bomb',
    'eksplosjon',
    'livstruende',
    'alvorlig',
    'kritisk',
    'død',
    'dødelig',
    'voldtekt',
    'ran med våpen',
  ];

  // High severity keywords
  const highKeywords = [
    'ran',
    'brann',
    'vold',
    'trusler',
    'skadet',
    'ambulanse',
    'nødetater',
    'rømning',
    'ulykke',
    'kollisjon',
    'trafikkulykke',
    'innbrudd',
    'tyveri',
  ];

  // Medium severity keywords
  const mediumKeywords = [
    'støy',
    'ordensforstyrrelser',
    'trafikk',
    'parkering',
    'hærverk',
    'slagsmål',
    'bråk',
  ];

  // Low/info keywords
  const lowKeywords = [
    'melding',
    'hittegods',
    'assistance',
    'kontroll',
    'viltpåkjørsel',
  ];

  // Check critical first
  if (criticalKeywords.some(keyword => combined.includes(keyword))) {
    return 'critical';
  }

  // Check high
  if (highKeywords.some(keyword => combined.includes(keyword))) {
    return 'high';
  }

  // Check medium
  if (mediumKeywords.some(keyword => combined.includes(keyword))) {
    return 'medium';
  }

  // Check low
  if (lowKeywords.some(keyword => combined.includes(keyword))) {
    return 'low';
  }

  // Category-based classification as fallback
  if (
    category.includes('vold') ||
    category.includes('ran') ||
    category.includes('brann')
  ) {
    return 'high';
  }

  if (
    category.includes('trafikk') ||
    category.includes('tyveri') ||
    category.includes('hærverk')
  ) {
    return 'medium';
  }

  // Default to info
  return 'info';
}

/**
 * Determine incident status
 */
export function classifyStatus(incident: PolitiloggenIncident): IncidentStatus {
  const status = incident.status?.toLowerCase() || '';
  const description = incident.description.toLowerCase();

  // Check for closure indicators
  if (
    status.includes('avsluttet') ||
    status.includes('ferdig') ||
    status.includes('løst') ||
    description.includes('avsluttet') ||
    description.includes('ingen tiltak')
  ) {
    return 'closed';
  }

  // Check for update indicators
  if (
    status.includes('oppdatert') ||
    status.includes('pågår') ||
    incident.lastModified
  ) {
    return 'updated';
  }

  // Default to active
  return 'active';
}

/**
 * Extract keywords from incident for better classification
 */
export function extractKeywords(incident: PolitiloggenIncident): string[] {
  const combined = `${incident.category} ${incident.description} ${incident.title}`.toLowerCase();
  const words = combined.match(/\b[\wæøå]+\b/g) || [];

  // Norwegian stop words to filter out
  const stopWords = new Set([
    'og', 'i', 'på', 'til', 'fra', 'med', 'av', 'for', 'er', 'har', 'det',
    'en', 'et', 'som', 'var', 'om', 'på', 'være', 'ved', 'ikke', 'den',
  ]);

  const keywords = words
    .filter(word => word.length > 3)
    .filter(word => !stopWords.has(word))
    .filter((word, index, self) => self.indexOf(word) === index) // unique
    .slice(0, 10); // top 10

  return keywords;
}

/**
 * Get severity color for UI
 */
export function getSeverityColor(severity: IncidentSeverity): string {
  const colors: Record<IncidentSeverity, string> = {
    critical: '#ef4444', // red-500
    high: '#f97316',     // orange-500
    medium: '#eab308',   // yellow-500
    low: '#3b82f6',      // blue-500
    info: '#6b7280',     // gray-500
  };

  return colors[severity];
}

/**
 * Get precision color for UI
 */
export function getPrecisionColor(precision: string): string {
  const colors: Record<string, string> = {
    exact: '#22c55e',    // green-500
    street: '#eab308',   // yellow-500
    area: '#f97316',     // orange-500
    district: '#ef4444', // red-500
    unknown: '#9ca3af',  // gray-400
  };

  return colors[precision] || colors.unknown;
}

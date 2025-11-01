import { PolitiloggenIncident } from '@/types/incident';

/**
 * Mock incidents for testing when API access is not available
 * These are realistic examples based on typical Oslo police incidents
 */
export const mockIncidents: PolitiloggenIncident[] = [
  {
    id: 'mock-001',
    published: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
    location: 'Storgata 15',
    district: 'Oslo',
    category: 'Trafikkulykke',
    title: 'Trafikkulykke med personskade',
    description: 'Politiet rykket ut til en trafikkulykke på Storgata. En bil og en sykkel kolliderte. Syklist lettere skadet og kjørt til sykehus. Trafikken dirigeres forbi stedet.',
    status: 'Pågår',
  },
  {
    id: 'mock-002',
    published: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    location: 'Karl Johans gate 22',
    district: 'Oslo',
    category: 'Tyveri',
    subcategory: 'Butikktyveri',
    title: 'Anmeldt tyveri fra butikk',
    description: 'Politiet fikk melding om tyveri fra butikk i sentrum. En person observert forlate butikken med stjålne varer. Politiet har fått signalement og søker etter gjerningsperson.',
    status: 'Under etterforskning',
  },
  {
    id: 'mock-003',
    published: new Date(Date.now() - 5400000).toISOString(), // 1.5 hours ago
    lastModified: new Date(Date.now() - 3600000).toISOString(),
    location: 'Grünerløkka',
    district: 'Oslo',
    category: 'Ordensforstyrrelser',
    title: 'Støyklager',
    description: 'Politiet fikk melding om støyklager fra beboere i området. Patrulje rykket ut og ba de ansvarlige om å dempe musikken. Situasjonen er nå avsluttet.',
    status: 'Avsluttet',
  },
  {
    id: 'mock-004',
    published: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    location: 'Majorstuen T-banestasjon',
    district: 'Oslo',
    category: 'Ran',
    title: 'Forsøk på ran',
    description: 'Politiet fikk melding om forsøk på ran ved T-banestasjonen. Fornærmet ikke fysisk skadet. Gjerningsperson stakk fra stedet. Politiet jobber med etterforskning.',
    status: 'Under etterforskning',
  },
  {
    id: 'mock-005',
    published: new Date(Date.now() - 9000000).toISOString(), // 2.5 hours ago
    location: 'Aker Brygge',
    district: 'Oslo',
    category: 'Hærverk',
    title: 'Hærverk mot kjøretøy',
    description: 'Anmeldt hærverk mot parkert kjøretøy ved Aker Brygge. Vindu knust. Politiet har tatt foto av skadestedet og etterforsker saken.',
    status: 'Under etterforskning',
  },
  {
    id: 'mock-006',
    published: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
    location: 'Vigelandsparken',
    district: 'Oslo',
    category: 'Melding',
    title: 'Savnet person funnet',
    description: 'En person som ble meldt savnet tidligere i dag er nå funnet i god behold i Vigelandsparken. Pårørende er varslet.',
    status: 'Avsluttet',
  },
  {
    id: 'mock-007',
    published: new Date(Date.now() - 12600000).toISOString(), // 3.5 hours ago
    location: 'E18 ved Lysaker',
    district: 'Oslo',
    category: 'Trafikkulykke',
    title: 'Trafikkuhell - materielle skader',
    description: 'Politiet på stedet etter trafikkuhell på E18. To biler involvert. Kun materielle skader. Trafikken går sakte forbi ulykkesstedet.',
    status: 'Pågår',
  },
  {
    id: 'mock-008',
    published: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
    location: 'Sofienberg park',
    district: 'Oslo',
    category: 'Narkotika',
    title: 'Beslag av narkotika',
    description: 'Politipatrulje stanset person i Sofienberg park. Ved kontroll ble det funnet mindre mengde narkotika. Person pågrepet og vil bli fremstilt for varetektsfengsling.',
    status: 'Avsluttet',
  },
  {
    id: 'mock-009',
    published: new Date(Date.now() - 16200000).toISOString(), // 4.5 hours ago
    location: 'Oslo S',
    district: 'Oslo',
    category: 'Vold',
    title: 'Slagsmål',
    description: 'Politiet rykket ut til melding om slagsmål ved Oslo S. To personer involvert. Begge parter er identifisert og anmeldt for vold. Ingen alvorlige skader.',
    status: 'Under etterforskning',
  },
  {
    id: 'mock-010',
    published: new Date(Date.now() - 18000000).toISOString(), // 5 hours ago
    location: 'Frogner',
    district: 'Oslo',
    category: 'Innbrudd',
    title: 'Innbrudd i leilighet',
    description: 'Politiet fikk anmeldelse om innbrudd i leilighet i Frogner. Innbrudd skjedde mens beboere var borte. Verdisaker stjålet. Krimteknikere har undersøkt åstedet.',
    status: 'Under etterforskning',
  },
  {
    id: 'mock-011',
    published: new Date(Date.now() - 19800000).toISOString(), // 5.5 hours ago
    location: 'Bogstadveien',
    district: 'Oslo',
    category: 'Brann',
    title: 'Brann i søppelcontainer',
    description: 'Politiet og brannvesen rykket ut til brann i søppelcontainer på Bogstadveien. Brannen er slukket. Ingen personskader. Årsak under etterforskning.',
    status: 'Avsluttet',
  },
  {
    id: 'mock-012',
    published: new Date(Date.now() - 21600000).toISOString(), // 6 hours ago
    location: 'Torggata',
    district: 'Oslo',
    category: 'Vinningskriminalitet',
    subcategory: 'Lommetyveri',
    title: 'Lommetyveri anmeldt',
    description: 'Person anmeldte lommetyveri etter å ha oppdaget at lommebok var stjålet. Hendelsen skal ha skjedd i travle Torggata. Politiet oppfordrer til ekstra årvåkenhet.',
    status: 'Under etterforskning',
  },
];

/**
 * Get mock incidents filtered by district
 */
export function getMockIncidentsByDistrict(district?: string): PolitiloggenIncident[] {
  if (!district) {
    return mockIncidents;
  }
  return mockIncidents.filter(incident =>
    incident.district.toLowerCase() === district.toLowerCase()
  );
}

/**
 * Get mock incidents filtered by date range
 */
export function getMockIncidentsByDateRange(
  from?: string,
  to?: string
): PolitiloggenIncident[] {
  let incidents = [...mockIncidents];

  if (from) {
    const fromDate = new Date(from);
    incidents = incidents.filter(incident =>
      new Date(incident.published) >= fromDate
    );
  }

  if (to) {
    const toDate = new Date(to);
    incidents = incidents.filter(incident =>
      new Date(incident.published) <= toDate
    );
  }

  return incidents;
}

/**
 * Get a single mock incident by ID
 */
export function getMockIncidentById(id: string): PolitiloggenIncident | null {
  return mockIncidents.find(incident => incident.id === id) || null;
}

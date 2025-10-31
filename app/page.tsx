'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { EnrichedIncident, IncidentFilters } from '@/types/incident';
import FilterPanel from '@/components/filters/FilterPanel';
import IncidentDetail from '@/components/ui/IncidentDetail';
import StatsPanel from '@/components/ui/StatsPanel';

// Dynamically import map component to avoid SSR issues with Leaflet
const IncidentMap = dynamic(() => import('@/components/map/IncidentMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-gray-500">Loading map...</div>
    </div>
  ),
});

export default function HomePage() {
  const [incidents, setIncidents] = useState<EnrichedIncident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<EnrichedIncident[]>([]);
  const [filters, setFilters] = useState<IncidentFilters>({});
  const [selectedIncident, setSelectedIncident] = useState<EnrichedIncident | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [syncing, setSyncing] = useState(false);

  const refreshInterval = parseInt(
    process.env.NEXT_PUBLIC_REFRESH_INTERVAL_MS || '60000'
  );

  // Fetch incidents from API
  const fetchIncidents = async () => {
    try {
      const params = new URLSearchParams();

      if (filters.categories) {
        params.append('categories', filters.categories.join(','));
      }
      if (filters.statuses) {
        params.append('statuses', filters.statuses.join(','));
      }
      if (filters.severities) {
        params.append('severities', filters.severities.join(','));
      }
      if (filters.precisions) {
        params.append('precisions', filters.precisions.join(','));
      }
      if (filters.districts) {
        params.append('districts', filters.districts.join(','));
      }

      const response = await fetch(`/api/incidents?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setIncidents(data.incidents);
        setFilteredIncidents(data.incidents);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  // Trigger sync with Politiloggen API
  const syncIncidents = async () => {
    if (syncing) return;

    setSyncing(true);
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          district: process.env.NEXT_PUBLIC_OSLO_DISTRICT || 'Oslo',
          daysBack: 7,
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('Sync complete:', data.result);
        // Refresh incidents after sync
        await fetchIncidents();
      }
    } catch (error) {
      console.error('Error syncing incidents:', error);
    } finally {
      setSyncing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchIncidents();
  }, []);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Auto-refreshing incidents...');
      fetchIncidents();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, filters]);

  // Apply filters
  useEffect(() => {
    fetchIncidents();
  }, [filters]);

  // Get unique categories and districts
  const availableCategories = Array.from(
    new Set(incidents.map((i) => i.category))
  ).sort();
  const availableDistricts = Array.from(
    new Set(incidents.map((i) => i.district))
  ).sort();

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">🗺️ PulseMap</h1>
              <p className="text-sm text-blue-100">Oslo Incident Map</p>
            </div>
            <div className="flex items-center gap-4">
              {lastUpdate && (
                <div className="text-sm text-blue-100">
                  Last updated: {lastUpdate.toLocaleTimeString('no-NO')}
                </div>
              )}
              <button
                onClick={syncIncidents}
                disabled={syncing}
                className={`px-4 py-2 rounded font-semibold transition-colors ${
                  syncing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-white text-blue-600 hover:bg-blue-50'
                }`}
              >
                {syncing ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⟳</span>
                    Syncing...
                  </>
                ) : (
                  '🔄 Sync Now'
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 bg-gray-50 border-r overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Stats */}
            <StatsPanel />

            {/* Filters */}
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              availableCategories={availableCategories}
              availableDistricts={availableDistricts}
            />

            {/* Legend */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Legend</h3>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Severity (Fill Color)</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-red-500"></div>
                      <span>Critical</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                      <span>High</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                      <span>Medium</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                      <span>Low</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-gray-500"></div>
                      <span>Info</span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Precision (Border Color)</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-4 border-green-500"></div>
                      <span>Exact (±10m)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-4 border-yellow-500"></div>
                      <span>Street (±100m)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-4 border-orange-500"></div>
                      <span>Area (±1km)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-4 border-red-500"></div>
                      <span>District (±5km)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Incident count */}
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {filteredIncidents.filter((i) => i.coordinates).length}
              </p>
              <p className="text-sm text-gray-600">Mapped Incidents</p>
            </div>
          </div>
        </aside>

        {/* Map */}
        <main className="flex-1 relative">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-gray-500">
                <div className="animate-spin text-4xl mb-2">⟳</div>
                <p>Loading incidents...</p>
              </div>
            </div>
          ) : (
            <IncidentMap
              incidents={filteredIncidents}
              onIncidentClick={setSelectedIncident}
            />
          )}
        </main>
      </div>

      {/* Incident detail modal */}
      {selectedIncident && (
        <IncidentDetail
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
        />
      )}
    </div>
  );
}

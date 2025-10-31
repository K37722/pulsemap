'use client';

import { useEffect, useState } from 'react';

interface Stats {
  total: number;
  active: number;
  geocoded: number;
  needsGeocode: number;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  checks: {
    database: boolean;
    api: boolean;
  };
  stats: Stats | null;
  errors: string[];
}

export default function StatsPanel() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealth(data);
    } catch (error) {
      console.error('Error fetching health:', error);
      setHealth({
        status: 'down',
        timestamp: new Date().toISOString(),
        checks: { database: false, api: false },
        stats: null,
        errors: ['Failed to fetch health status'],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!health) return null;

  const statusColor =
    health.status === 'healthy'
      ? 'bg-green-500'
      : health.status === 'degraded'
      ? 'bg-yellow-500'
      : 'bg-red-500';

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 space-y-3">
      {/* Status indicator */}
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${statusColor}`}></div>
        <span className="font-semibold text-gray-800">System Status</span>
        <span className="text-sm text-gray-500 capitalize">{health.status}</span>
      </div>

      {/* Health checks */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-1">
          <span>{health.checks.database ? '✅' : '❌'}</span>
          <span className="text-gray-600">Database</span>
        </div>
        <div className="flex items-center gap-1">
          <span>{health.checks.api ? '✅' : '❌'}</span>
          <span className="text-gray-600">API</span>
        </div>
      </div>

      {/* Stats */}
      {health.stats && (
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div>
            <p className="text-xs text-gray-500">Total Incidents</p>
            <p className="text-lg font-bold text-gray-900">{health.stats.total}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Active</p>
            <p className="text-lg font-bold text-blue-600">{health.stats.active}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Geocoded</p>
            <p className="text-lg font-bold text-green-600">
              {health.stats.geocoded}
              <span className="text-xs ml-1 text-gray-500">
                ({health.stats.total > 0
                  ? Math.round((health.stats.geocoded / health.stats.total) * 100)
                  : 0}
                %)
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Needs Geocode</p>
            <p className="text-lg font-bold text-orange-600">{health.stats.needsGeocode}</p>
          </div>
        </div>
      )}

      {/* Errors */}
      {health.errors.length > 0 && (
        <div className="pt-2 border-t">
          <p className="text-xs font-semibold text-red-600 mb-1">Errors:</p>
          <ul className="text-xs text-red-500 space-y-1">
            {health.errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Last updated */}
      <p className="text-xs text-gray-400 pt-2 border-t">
        Updated: {new Date(health.timestamp).toLocaleTimeString('no-NO')}
      </p>
    </div>
  );
}

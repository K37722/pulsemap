'use client';

import { useState } from 'react';
import {
  IncidentFilters,
  IncidentSeverity,
  IncidentStatus,
  LocationPrecision,
} from '@/types/incident';
import { getSeverityColor, getPrecisionColor } from '@/lib/services/classifier';

interface FilterPanelProps {
  filters: IncidentFilters;
  onFiltersChange: (filters: IncidentFilters) => void;
  availableCategories: string[];
  availableDistricts: string[];
}

export default function FilterPanel({
  filters,
  onFiltersChange,
  availableCategories,
  availableDistricts,
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const severities: IncidentSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];
  const statuses: IncidentStatus[] = ['active', 'updated', 'closed'];
  const precisions: LocationPrecision[] = ['exact', 'street', 'area', 'district', 'unknown'];

  const toggleFilter = <K extends keyof IncidentFilters>(
    key: K,
    value: string
  ) => {
    const currentValues = (filters[key] as string[]) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];

    onFiltersChange({
      ...filters,
      [key]: newValues.length > 0 ? newValues : undefined,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const activeFilterCount = [
    filters.categories?.length || 0,
    filters.statuses?.length || 0,
    filters.severities?.length || 0,
    filters.precisions?.length || 0,
    filters.districts?.length || 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-800">Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        <button className="text-gray-500">
          {isOpen ? '▼' : '▶'}
        </button>
      </div>

      {/* Filter content */}
      {isOpen && (
        <div className="p-4 border-t space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Severity filters */}
          <div>
            <h4 className="font-semibold text-sm mb-2 text-gray-700">Severity</h4>
            <div className="flex flex-wrap gap-2">
              {severities.map((severity) => {
                const isActive = filters.severities?.includes(severity);
                return (
                  <button
                    key={severity}
                    onClick={() => toggleFilter('severities', severity)}
                    className={`px-3 py-1 rounded text-sm transition-all ${
                      isActive
                        ? 'text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={
                      isActive
                        ? { backgroundColor: getSeverityColor(severity) }
                        : undefined
                    }
                  >
                    {severity}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status filters */}
          <div>
            <h4 className="font-semibold text-sm mb-2 text-gray-700">Status</h4>
            <div className="flex flex-wrap gap-2">
              {statuses.map((status) => {
                const isActive = filters.statuses?.includes(status);
                return (
                  <button
                    key={status}
                    onClick={() => toggleFilter('statuses', status)}
                    className={`px-3 py-1 rounded text-sm ${
                      isActive
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Precision filters */}
          <div>
            <h4 className="font-semibold text-sm mb-2 text-gray-700">Location Precision</h4>
            <div className="flex flex-wrap gap-2">
              {precisions.map((precision) => {
                const isActive = filters.precisions?.includes(precision);
                return (
                  <button
                    key={precision}
                    onClick={() => toggleFilter('precisions', precision)}
                    className={`px-3 py-1 rounded text-sm transition-all ${
                      isActive
                        ? 'text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={
                      isActive
                        ? { backgroundColor: getPrecisionColor(precision) }
                        : undefined
                    }
                  >
                    {precision}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category filters */}
          {availableCategories.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2 text-gray-700">Category</h4>
              <div className="flex flex-wrap gap-2">
                {availableCategories.slice(0, 10).map((category) => {
                  const isActive = filters.categories?.includes(category);
                  return (
                    <button
                      key={category}
                      onClick={() => toggleFilter('categories', category)}
                      className={`px-3 py-1 rounded text-sm ${
                        isActive
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* District filters */}
          {availableDistricts.length > 1 && (
            <div>
              <h4 className="font-semibold text-sm mb-2 text-gray-700">District</h4>
              <div className="flex flex-wrap gap-2">
                {availableDistricts.map((district) => {
                  const isActive = filters.districts?.includes(district);
                  return (
                    <button
                      key={district}
                      onClick={() => toggleFilter('districts', district)}
                      className={`px-3 py-1 rounded text-sm ${
                        isActive
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {district}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Clear button */}
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

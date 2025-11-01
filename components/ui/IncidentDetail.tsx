'use client';

import { EnrichedIncident } from '@/types/incident';
import { getSeverityColor, getPrecisionColor } from '@/lib/services/classifier';

interface IncidentDetailProps {
  incident: EnrichedIncident | null;
  onClose: () => void;
}

export default function IncidentDetail({ incident, onClose }: IncidentDetailProps) {
  if (!incident) return null;

  return (
    <div
      className="modal-backdrop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
    >
      <div
        className="modal-content bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{incident.title}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(incident.published).toLocaleString('no-NO', {
                dateStyle: 'full',
                timeStyle: 'short',
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center text-2xl leading-none ml-4 transition-colors flex-shrink-0"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            <span
              className="px-3 py-1 rounded-full text-white text-sm font-medium"
              style={{ backgroundColor: getSeverityColor(incident.severity) }}
            >
              {incident.severity.toUpperCase()}
            </span>
            <span
              className="px-3 py-1 rounded-full text-white text-sm font-medium"
              style={{ backgroundColor: getPrecisionColor(incident.precision) }}
            >
              📍 {incident.precision}
            </span>
            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
              {incident.incidentStatus}
            </span>
            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm font-medium">
              {incident.category}
            </span>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{incident.description}</p>
          </div>

          {/* Location */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Location</h3>
            <p className="text-gray-700">{incident.location}</p>
            <p className="text-sm text-gray-500 mt-1">{incident.district}</p>
            {incident.coordinates && (
              <p className="text-xs text-gray-400 mt-1">
                Coordinates: {incident.coordinates.lat.toFixed(6)}, {incident.coordinates.lng.toFixed(6)}
              </p>
            )}
          </div>

          {/* Timeline */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Timeline</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Published</p>
                  <p className="text-sm text-gray-900">
                    {new Date(incident.published).toLocaleString('no-NO')}
                  </p>
                </div>
              </div>
              {incident.lastModified && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Last Modified</p>
                    <p className="text-sm text-gray-900">
                      {new Date(incident.lastModified).toLocaleString('no-NO')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Updates */}
          {incident.updates && incident.updates.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Updates ({incident.updates.length})
              </h3>
              <div className="space-y-3">
                {incident.updates.map((update) => (
                  <div
                    key={update.id}
                    className="border-l-2 border-gray-300 pl-4 py-2"
                  >
                    <p className="text-xs text-gray-500 mb-1">
                      {new Date(update.timestamp).toLocaleString('no-NO')}
                    </p>
                    <p className="text-sm text-gray-700">{update.description}</p>
                    {update.status && (
                      <span className="inline-block mt-1 text-xs px-2 py-1 bg-gray-100 rounded">
                        {update.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="border-t pt-4 text-xs text-gray-500 space-y-1">
            <p>Thread ID: {incident.threadId}</p>
            <p>Incident ID: {incident.id}</p>
            {incident.subcategory && <p>Subcategory: {incident.subcategory}</p>}
            {incident.lastGeocoded && (
              <p>Last Geocoded: {new Date(incident.lastGeocoded).toLocaleString('no-NO')}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
          {incident.coordinates && (
            <a
              href={`https://www.google.com/maps?q=${incident.coordinates.lat},${incident.coordinates.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Open in Google Maps
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

-- Enable PostGIS extension for spatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Incidents table with spatial support
CREATE TABLE IF NOT EXISTS incidents (
    id VARCHAR(255) PRIMARY KEY,
    thread_id VARCHAR(255) NOT NULL,
    published TIMESTAMP NOT NULL,
    last_modified TIMESTAMP,
    location TEXT NOT NULL,
    district VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50),

    -- Enriched fields
    coordinates GEOGRAPHY(POINT, 4326),
    precision VARCHAR(20) CHECK (precision IN ('exact', 'street', 'area', 'district', 'unknown')),
    severity VARCHAR(20) CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
    incident_status VARCHAR(20) CHECK (incident_status IN ('active', 'updated', 'closed')),
    geocoding_attempts INT DEFAULT 0,
    last_geocoded TIMESTAMP,

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Indexes
    CONSTRAINT valid_coordinates CHECK (
        coordinates IS NULL OR
        ST_Y(coordinates::geometry) BETWEEN -90 AND 90 AND
        ST_X(coordinates::geometry) BETWEEN -180 AND 180
    )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_incidents_thread_id ON incidents(thread_id);
CREATE INDEX IF NOT EXISTS idx_incidents_published ON incidents(published DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_district ON incidents(district);
CREATE INDEX IF NOT EXISTS idx_incidents_category ON incidents(category);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_precision ON incidents(precision);
CREATE INDEX IF NOT EXISTS idx_incidents_incident_status ON incidents(incident_status);
CREATE INDEX IF NOT EXISTS idx_incidents_coordinates ON incidents USING GIST(coordinates);

-- Incident updates tracking
CREATE TABLE IF NOT EXISTS incident_updates (
    id SERIAL PRIMARY KEY,
    incident_id VARCHAR(255) NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    thread_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(incident_id, timestamp)
);

CREATE INDEX IF NOT EXISTS idx_incident_updates_thread_id ON incident_updates(thread_id);
CREATE INDEX IF NOT EXISTS idx_incident_updates_incident_id ON incident_updates(incident_id);

-- System health monitoring
CREATE TABLE IF NOT EXISTS system_health (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) CHECK (status IN ('healthy', 'degraded', 'down')),
    total_incidents INT DEFAULT 0,
    active_incidents INT DEFAULT 0,
    geocoding_success_rate FLOAT,
    api_response_time_ms INT,
    errors JSONB,
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_system_health_timestamp ON system_health(timestamp DESC);

-- View for latest incident per thread
CREATE OR REPLACE VIEW latest_incidents AS
SELECT DISTINCT ON (thread_id)
    *
FROM incidents
ORDER BY thread_id, published DESC;

-- View for active incidents with coordinates
CREATE OR REPLACE VIEW active_mapped_incidents AS
SELECT *
FROM incidents
WHERE incident_status = 'active'
  AND coordinates IS NOT NULL
ORDER BY published DESC;

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_incidents_updated_at
    BEFORE UPDATE ON incidents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

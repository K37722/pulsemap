# PulseMap Setup Guide

## Quick Start (Docker)

The easiest way to get started is using Docker for PostgreSQL:

```bash
# 1. Start PostgreSQL with PostGIS
npm run db:docker

# 2. Wait for database to be ready (about 10 seconds)
# The schema will be automatically applied

# 3. Start the development server
npm run dev

# 4. Open http://localhost:3000 and click "Sync Now"
```

## Manual Setup (Without Docker)

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ with PostGIS extension
- Git

### Step-by-Step

1. **Install Dependencies**

```bash
npm install
```

2. **Setup Database**

If you have PostgreSQL installed locally:

```bash
npm run db:setup
```

Or manually:

```bash
# Create database
createdb pulsemap

# Enable PostGIS
psql pulsemap -c "CREATE EXTENSION postgis;"

# Run schema
psql pulsemap < lib/db/schema.sql
```

3. **Configure Environment**

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pulsemap
NEXT_PUBLIC_MAP_CENTER_LAT=59.9139
NEXT_PUBLIC_MAP_CENTER_LNG=10.7522
NEXT_PUBLIC_OSLO_DISTRICT=Oslo
```

4. **Start Development Server**

```bash
npm run dev
```

5. **Initial Sync**

- Open http://localhost:3000
- Click "🔄 Sync Now" button
- Wait for incidents to load (first sync may take 1-2 minutes)

## Troubleshooting

### Database Connection Failed

**Error**: `ECONNREFUSED` or database connection errors

**Solutions**:
1. Check PostgreSQL is running: `pg_isready`
2. Verify credentials in `.env.local`
3. If using Docker: `npm run db:docker`
4. Check database exists: `psql -l | grep pulsemap`

### PostGIS Extension Not Found

**Error**: `extension "postgis" does not exist`

**Solutions**:
1. Install PostGIS: `brew install postgis` (macOS) or `apt-get install postgis` (Ubuntu)
2. Or use Docker: `npm run db:docker` (PostGIS is included)

### Map Not Loading

**Symptoms**: Map shows "Loading map..." forever

**Solutions**:
1. Check browser console for errors
2. Verify Leaflet CSS is loading
3. Try clearing browser cache
4. Ensure you're not blocking external resources (OpenStreetMap tiles)

### No Incidents Showing

**Symptoms**: Map loads but no markers appear

**Solutions**:
1. Click "Sync Now" to fetch incidents
2. Check API health: http://localhost:3000/api/health
3. Verify database has data: `psql pulsemap -c "SELECT COUNT(*) FROM incidents;"`
4. Check if incidents have coordinates: `psql pulsemap -c "SELECT COUNT(*) FROM incidents WHERE coordinates IS NOT NULL;"`

### Geocoding Issues

**Symptoms**: Many incidents show "unknown" precision

**Solutions**:
1. Nominatim rate limit (1 req/sec): Wait for background geocoding
2. Check Nominatim is accessible: curl https://nominatim.openstreetmap.org/search?q=Oslo
3. Consider using Google Geocoding API for better results (requires API key)

### Politiloggen API Issues

**Symptoms**: Sync fails or returns no incidents

**Solutions**:
1. Check API status: https://api.politiet.no/politiloggen/index.html
2. Try different date range (API may have data retention limits)
3. Check network connectivity
4. Wait and retry (API may be temporarily down)

## Development Tips

### Type Checking

```bash
npm run type-check
```

### Database Queries

```bash
# Connect to database
psql pulsemap

# View incidents
SELECT id, title, severity, precision, published FROM incidents ORDER BY published DESC LIMIT 10;

# Check geocoding stats
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE coordinates IS NOT NULL) as geocoded,
  ROUND(AVG(geocoding_attempts), 2) as avg_attempts
FROM incidents;

# View latest incidents per thread
SELECT * FROM latest_incidents LIMIT 10;
```

### API Testing

```bash
# Health check
curl http://localhost:3000/api/health

# Fetch incidents
curl http://localhost:3000/api/incidents

# Trigger sync
curl -X POST http://localhost:3000/api/sync \
  -H "Content-Type: application/json" \
  -d '{"district":"Oslo","daysBack":7}'
```

## Production Deployment

### Environment Variables

Set these in your production environment:

```env
DATABASE_URL=postgresql://user:password@host:5432/pulsemap
POLITILOGGEN_API_URL=https://api.politiet.no/politiloggen/v1
NOMINATIM_API_URL=https://nominatim.openstreetmap.org
NOMINATIM_USER_AGENT=PulseMap/1.0 your-production-email@example.com
NEXT_PUBLIC_MAP_CENTER_LAT=59.9139
NEXT_PUBLIC_MAP_CENTER_LNG=10.7522
NEXT_PUBLIC_REFRESH_INTERVAL_MS=60000
```

### Build

```bash
npm run build
npm start
```

### Recommended Services

- **Hosting**: Vercel, Railway, Render, DigitalOcean
- **Database**: Neon, Supabase, Railway (all support PostGIS)
- **Monitoring**: Sentry, LogRocket, Better Stack

## Performance Optimization

### Database Indexes

The schema includes indexes on:
- `thread_id` (thread lookups)
- `published` (chronological queries)
- `coordinates` (spatial queries)
- `district`, `category`, `severity`, `precision` (filtering)

### Caching

- Geocoding results are cached in-memory
- Consider adding Redis for distributed caching
- Enable Next.js caching for API routes

### Rate Limiting

- Nominatim: 1 request/second (enforced in code)
- Consider self-hosting Nominatim for higher limits
- Or use Google Geocoding API (requires payment)

## Next Steps

1. ✅ Get the app running locally
2. ✅ Sync initial incidents
3. ✅ Explore the map and filters
4. 🔄 Set up production deployment
5. 🚀 Expand to more police districts
6. 🎨 Customize for your needs

Need help? Check the [README.md](./README.md) or open an issue on GitHub.

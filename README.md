# 🗺️ PulseMap - Oslo Incident Map

A real-time incident map for Oslo built on the Politiloggen API. Inspired by DeepState Map and Liveuamap, PulseMap shows police incidents with color-coded severity markers, location precision indicators, and auto-refresh capabilities.

## ✨ Features

- **Real-time Incident Tracking**: Auto-refreshes every 60 seconds
- **Incident Threading**: Groups related incidents together (initial report → updates → closure)
- **Precise Location**: Geocoding with Nominatim, showing location precision (exact, street, area, district)
- **Severity Classification**: Automatic classification based on incident type and keywords
- **Advanced Filtering**: Filter by category, status, severity, precision, and district
- **Interactive Map**: Click markers for detailed incident information
- **System Health Monitoring**: Track API status, database health, and geocoding stats

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 19, TypeScript, Tailwind CSS
- **Mapping**: Leaflet + React-Leaflet
- **Database**: PostgreSQL + PostGIS
- **Data Fetching**: React Query (TanStack Query)
- **State**: Zustand
- **APIs**: Politiloggen API, Nominatim (OpenStreetMap)

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ with PostGIS extension
- (Optional) Docker for containerized deployment

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd pulsemap
npm install
```

### 2. Setup Database

```bash
# Create database
createdb pulsemap

# Enable PostGIS
psql pulsemap -c "CREATE EXTENSION postgis;"

# Run schema
psql pulsemap < lib/db/schema.sql
```

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your settings:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/pulsemap
POLITILOGGEN_API_URL=https://api.politiet.no/politiloggen/v1
NOMINATIM_API_URL=https://nominatim.openstreetmap.org
NOMINATIM_USER_AGENT=PulseMap/1.0 your-email@example.com
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Initial Sync

Click the **"🔄 Sync Now"** button in the header to fetch incidents from Politiloggen API.

## 📊 How It Works

### Data Flow

```
Politiloggen API
    ↓
Fetch & Parse Incidents
    ↓
Thread Deduplication (group related incidents)
    ↓
Geocoding (Nominatim) → Location Precision
    ↓
Severity Classification (Norwegian keywords)
    ↓
PostgreSQL + PostGIS Storage
    ↓
Next.js API Routes
    ↓
React Frontend (Map + Filters)
```

### Incident Threading

Incidents are grouped into "threads" based on:
- Same location + category + date
- Or explicit thread ID from API

This allows tracking incident lifecycle:
1. **Initial Report** → 2. **Updates** → 3. **Closure**

### Location Precision

Each incident is classified by geocoding accuracy:

- 🟢 **Exact** (±10m): Full address with street number
- 🟡 **Street** (±100m): Street name without number
- 🟠 **Area** (±1km): Neighborhood/area
- 🔴 **District** (±5km): District/general location
- ⚪ **Unknown**: Failed geocoding

### Severity Classification

Automatic classification based on Norwegian keywords:

- **Critical**: drap, skyting, terror, bomb, alvorlig
- **High**: ran, brann, vold, ulykke, innbrudd
- **Medium**: trafikk, hærverk, støy, ordensforstyrrelser
- **Low**: melding, kontroll, hittegods
- **Info**: Default for general notices

## 🔧 API Endpoints

### `GET /api/incidents`

Fetch incidents with optional filters:

```
GET /api/incidents?severities=critical,high&statuses=active
```

Query parameters:
- `categories`: Comma-separated categories
- `statuses`: active, updated, closed
- `severities`: critical, high, medium, low, info
- `precisions`: exact, street, area, district, unknown
- `districts`: Oslo, etc.
- `dateFrom`: ISO date string
- `dateTo`: ISO date string

### `POST /api/sync`

Trigger manual sync with Politiloggen API:

```json
POST /api/sync
{
  "district": "Oslo",
  "daysBack": 7
}
```

### `GET /api/health`

System health check:

```json
GET /api/health
{
  "status": "healthy",
  "checks": {
    "database": true,
    "api": true
  },
  "stats": {
    "total": 150,
    "active": 45,
    "geocoded": 120,
    "needsGeocode": 30
  }
}
```

## 🎨 Color Coding

### Marker Fill (Severity)
- 🔴 Critical: Red (#ef4444)
- 🟠 High: Orange (#f97316)
- 🟡 Medium: Yellow (#eab308)
- 🔵 Low: Blue (#3b82f6)
- ⚪ Info: Gray (#6b7280)

### Marker Border (Precision)
- 🟢 Exact: Green (#22c55e)
- 🟡 Street: Yellow (#eab308)
- 🟠 Area: Orange (#f97316)
- 🔴 District: Red (#ef4444)
- ⚪ Unknown: Gray (#9ca3af)

## 🔄 Auto-Refresh

The app automatically refreshes incidents every 60 seconds (configurable via `NEXT_PUBLIC_REFRESH_INTERVAL_MS`).

## 🗄️ Database Schema

Key tables:
- `incidents`: Main incident data with PostGIS coordinates
- `incident_updates`: Tracks updates to incident threads
- `system_health`: Monitors system health over time

Views:
- `latest_incidents`: Latest incident per thread
- `active_mapped_incidents`: Active incidents with coordinates

## 📈 Future Enhancements (Beyond MVP)

- [ ] Expand to all Norway police districts
- [ ] WebSocket real-time updates
- [ ] Incident clustering for dense areas
- [ ] Heat maps for incident frequency
- [ ] Historical analysis and trends
- [ ] Mobile app (React Native)
- [ ] User accounts and notifications
- [ ] Export data (CSV, GeoJSON)
- [ ] Multi-language support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Credits

- **Politiet.no** for the Politiloggen API
- **OpenStreetMap** for Nominatim geocoding
- Inspired by **DeepState Map** and **Liveuamap**

## 📧 Contact

For questions or feedback, open an issue on GitHub.

---

**Built with ❤️ for safer communities**

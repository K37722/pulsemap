# PulseMap - Quick Start Guide

Get PulseMap running in 5 minutes!

## 🚀 Fastest Setup (Mac)

```bash
# 1. Clone repository
git clone <your-repo-url> pulsemap
cd pulsemap

# 2. Install dependencies
npm install

# 3. Run automated setup (creates .env.local and database)
npm run setup

# 4. Start the app
npm run dev
```

Open **http://localhost:3000** → Click **"Sync Now"** → Done! 🎉

---

## ⚠️ Common Issue: Database Connection Error

If you see:
```json
{
  "errors": ["Database: error: role \"user\" does not exist"]
}
```

**Problem:** Your `.env.local` has the wrong database username.

**Quick Fix:**

```bash
# Option 1: Auto-fix (recommended)
npm run env:setup

# Option 2: Manual fix
# Edit .env.local and change:
# FROM: DATABASE_URL=postgresql://user:password@localhost:5432/pulsemap
# TO:   DATABASE_URL=postgresql://YOUR_MAC_USERNAME@localhost:5432/pulsemap

# Find your username:
whoami
# Output: jensholm (or whatever your Mac username is)

# Then update .env.local:
DATABASE_URL=postgresql://jensholm@localhost:5432/pulsemap
```

Then restart:
```bash
npm run dev
```

---

## 📋 Pre-Flight Checklist

Before running `npm run dev`, ensure:

### ✅ 1. Homebrew Installed
```bash
brew --version
```
If not: `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`

### ✅ 2. Node.js Installed
```bash
node --version  # Should be 18+
npm --version   # Should be 9+
```
If not: `brew install node`

### ✅ 3. PostgreSQL Running
```bash
brew services list | grep postgresql
# Should show: postgresql@XX started
```
If not:
```bash
brew install postgresql@15 postgis
brew services start postgresql@15
```

### ✅ 4. Database Created
```bash
psql -l | grep pulsemap
```
If not: `createdb pulsemap`

### ✅ 5. PostGIS Extension Enabled
```bash
psql pulsemap -c "SELECT PostGIS_version();"
```
If error:
```bash
brew install postgis
psql pulsemap -c "CREATE EXTENSION postgis;"
```

### ✅ 6. Database Schema Created
```bash
psql pulsemap -c "\dt"
# Should list: incidents, incident_updates, system_health
```
If not: `psql pulsemap < lib/db/schema.sql`

### ✅ 7. Environment Configured
```bash
cat .env.local | grep DATABASE_URL
# Should show: postgresql://YOUR_USERNAME@localhost:5432/pulsemap
```
If not: `npm run env:setup`

---

## 🔧 One-Line Diagnosis

Run this to check everything:

```bash
echo "Node: $(node --version)" && \
echo "PostgreSQL: $(psql --version | head -n1)" && \
echo "Services: $(brew services list | grep postgresql)" && \
echo "Database: $(psql -l | grep pulsemap)" && \
psql pulsemap -c "SELECT PostGIS_version();" 2>&1 | head -n3 && \
psql pulsemap -c "\dt" 2>&1 | head -n5
```

---

## 🎯 Verify Installation

After `npm run dev`:

1. **Check health:** http://localhost:3000/api/health
   - Should show: `"status": "healthy"`
   - Database check: ✅
   - API check: ✅

2. **Check incidents:** http://localhost:3000/api/incidents
   - Should return: `{"success": true, "count": 0, "incidents": []}`

3. **Open map:** http://localhost:3000
   - Should show: Map interface with "Sync Now" button

4. **Sync incidents:** Click "🔄 Sync Now"
   - Wait 30-60 seconds
   - Markers should appear on map

---

## 🐛 Still Not Working?

### Database Connection Issues

```bash
# Check if PostgreSQL is listening
psql -U $(whoami) -d pulsemap -c "SELECT 1;"

# If that works but app doesn't, check .env.local:
cat .env.local

# Make sure DATABASE_URL matches:
DATABASE_URL=postgresql://$(whoami)@localhost:5432/pulsemap
```

### PostGIS Issues

```bash
# PostgreSQL 14 users:
brew install postgis
brew services restart postgresql@14
psql pulsemap -c "CREATE EXTENSION postgis;"

# PostgreSQL 15 users:
brew install postgis
brew services restart postgresql@15
psql pulsemap -c "CREATE EXTENSION postgis;"
```

### Port Already in Use

```bash
# Kill whatever is using port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

### API Not Responding

The Politiloggen API might be temporarily down. This is normal - just try again later:
```bash
# Test API directly
curl "https://api.politiet.no/politiloggen/v1/hendelser?limit=1"
```

---

## 📚 More Help

- **Full setup guide:** See [INSTALL-MAC.md](./INSTALL-MAC.md)
- **Troubleshooting:** See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Features & API:** See [README.md](./README.md)

---

## 🎉 Success!

When everything is working:

1. **Map loads** at http://localhost:3000
2. **Health check** shows green status
3. **Click "Sync Now"** fetches incidents
4. **Markers appear** on the map
5. **Click markers** for incident details

Enjoy your Oslo incident map! 🗺️

# PulseMap - macOS Installation Guide (Homebrew)

Complete setup guide for running PulseMap on macOS using Homebrew.

## Prerequisites

You need:
- **macOS** (10.15 Catalina or newer)
- **Homebrew** (package manager for Mac)
- **Command Line Tools** (usually included with Xcode)

---

## Step 1: Install Homebrew

Check if you already have Homebrew:

```bash
brew --version
```

If not installed, install it:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

After installation, follow the on-screen instructions to add Homebrew to your PATH.

For **Apple Silicon (M1/M2/M3)** Macs, you may need to add this to your `~/.zshrc`:

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
source ~/.zshrc
```

Verify it works:
```bash
brew --version
```

---

## Step 2: Install Node.js

```bash
# Install Node.js (includes npm)
brew install node

# Verify installation
node --version   # Should show v18.x or higher
npm --version    # Should show v9.x or higher
```

---

## Step 3: Install PostgreSQL with PostGIS

```bash
# Install PostgreSQL 15
brew install postgresql@15

# Install PostGIS (spatial database extension)
brew install postgis

# Start PostgreSQL service (runs automatically on login)
brew services start postgresql@15

# Verify PostgreSQL is running
brew services list | grep postgresql
# Should show: postgresql@15 started
```

**Add PostgreSQL to your PATH:**

```bash
echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verify psql works
psql --version
```

---

## Step 4: Clone PulseMap Repository

```bash
# Navigate to where you want the project
cd ~/Projects  # or wherever you keep your code

# Clone the repository
git clone <your-repo-url> pulsemap
cd pulsemap
```

---

## Step 5: Install Project Dependencies

```bash
npm install
```

This will install all the required packages (~400 MB):
- Next.js, React, TypeScript
- Leaflet (mapping library)
- PostgreSQL client
- Tailwind CSS
- And more...

---

## Step 6: Setup Database

### Create the Database

```bash
# Create a new database called 'pulsemap'
createdb pulsemap

# Verify it was created
psql -l | grep pulsemap
```

### Enable PostGIS Extension

```bash
# Add spatial data support to the database
psql pulsemap -c "CREATE EXTENSION postgis;"

# Verify PostGIS is installed
psql pulsemap -c "SELECT PostGIS_version();"
```

### Run Database Schema

```bash
# Create tables, indexes, and views
psql pulsemap < lib/db/schema.sql
```

This creates:
- `incidents` table (with spatial coordinates)
- `incident_updates` table (for tracking changes)
- `system_health` table (for monitoring)
- Indexes for performance
- Views for common queries

---

## Step 7: Configure Environment

```bash
# Copy example environment file
cp .env.example .env.local
```

The default settings work out of the box for Homebrew PostgreSQL! But verify `.env.local` contains:

```env
# Database (Homebrew default - no password needed)
DATABASE_URL=postgresql://postgres@localhost:5432/pulsemap

# APIs
POLITILOGGEN_API_URL=https://api.politiet.no/politiloggen/v1
NOMINATIM_API_URL=https://nominatim.openstreetmap.org
NOMINATIM_USER_AGENT=PulseMap/1.0 your-email@example.com

# Map center (Oslo coordinates)
NEXT_PUBLIC_MAP_CENTER_LAT=59.9139
NEXT_PUBLIC_MAP_CENTER_LNG=10.7522
NEXT_PUBLIC_MAP_DEFAULT_ZOOM=12

# Auto-refresh interval (60 seconds)
NEXT_PUBLIC_REFRESH_INTERVAL_MS=60000

# District
NEXT_PUBLIC_OSLO_DISTRICT=Oslo
```

**Important:** Update `NOMINATIM_USER_AGENT` with your email address (required by Nominatim terms).

---

## Step 8: Start the Application

```bash
npm run dev
```

You should see:

```
▲ Next.js 16.0.1
- Local:        http://localhost:3000

✓ Starting...
✓ Ready in 2.5s
```

---

## Step 9: Sync Initial Data

1. Open http://localhost:3000 in your browser
2. You'll see the map interface (empty at first)
3. Click the **"🔄 Sync Now"** button in the header
4. Wait 30-60 seconds for the initial sync
5. Incidents will appear on the map!

The first sync fetches the last 7 days of incidents from the Politiloggen API and geocodes them.

---

## Quick Installation Script

Save this as `install-mac.sh` in the project root:

```bash
#!/bin/bash
set -e

echo "🚀 PulseMap Mac Installation (Homebrew)"
echo "========================================"
echo ""

# Check Homebrew
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew not found. Installing..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # Add to PATH for Apple Silicon
    if [[ $(uname -m) == 'arm64' ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
else
    echo "✅ Homebrew found ($(brew --version | head -n1))"
fi

# Install Node.js
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    brew install node
else
    echo "✅ Node.js found ($(node --version))"
fi

# Install PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "🗄️  Installing PostgreSQL + PostGIS..."
    brew install postgresql@15 postgis

    # Add to PATH
    echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
    export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"

    # Start service
    brew services start postgresql@15
    echo "⏳ Waiting for PostgreSQL to start..."
    sleep 5
else
    echo "✅ PostgreSQL found ($(psql --version | head -n1))"

    # Make sure it's running
    brew services start postgresql@15 2>/dev/null || true
fi

# Install npm dependencies
echo "📥 Installing npm dependencies..."
npm install

# Setup database
echo "🗄️  Setting up database..."
createdb pulsemap 2>/dev/null || echo "Database already exists"
psql pulsemap -c "CREATE EXTENSION IF NOT EXISTS postgis;" 2>/dev/null
psql pulsemap < lib/db/schema.sql

# Setup environment
echo "⚙️  Setting up environment..."
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "✏️  Please update NOMINATIM_USER_AGENT in .env.local with your email"
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Update .env.local with your email in NOMINATIM_USER_AGENT"
echo "  2. npm run dev"
echo "  3. Open http://localhost:3000"
echo "  4. Click 'Sync Now' to fetch incidents"
echo ""
```

Make it executable and run:

```bash
chmod +x install-mac.sh
./install-mac.sh
```

---

## Verification Checklist

After installation, verify everything works:

```bash
# ✅ Check Homebrew
brew --version

# ✅ Check Node.js
node --version    # Should be v18+
npm --version     # Should be v9+

# ✅ Check PostgreSQL is running
brew services list | grep postgresql
# Should show: started

# ✅ Check psql command works
psql --version

# ✅ Check database exists
psql -l | grep pulsemap

# ✅ Check PostGIS extension
psql pulsemap -c "SELECT PostGIS_version();"
# Should show version number

# ✅ Check tables were created
psql pulsemap -c "\dt"
# Should list: incidents, incident_updates, system_health

# ✅ Start development server
npm run dev
# Should start on http://localhost:3000
```

If all checks pass, you're ready to go! 🎉

---

## Useful Commands

### PostgreSQL Management

```bash
# Start PostgreSQL
brew services start postgresql@15

# Stop PostgreSQL
brew services stop postgresql@15

# Restart PostgreSQL
brew services restart postgresql@15

# Check if running
brew services list | grep postgresql

# Connect to database
psql pulsemap

# View all databases
psql -l

# Drop database (careful!)
dropdb pulsemap
```

### Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

### Database Utilities

```bash
# Recreate database from scratch
dropdb pulsemap && createdb pulsemap
psql pulsemap -c "CREATE EXTENSION postgis;"
psql pulsemap < lib/db/schema.sql

# View incident count
psql pulsemap -c "SELECT COUNT(*) FROM incidents;"

# View recent incidents
psql pulsemap -c "SELECT id, title, published FROM incidents ORDER BY published DESC LIMIT 5;"

# Check geocoding stats
psql pulsemap -c "SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE coordinates IS NOT NULL) as geocoded,
  ROUND(100.0 * COUNT(*) FILTER (WHERE coordinates IS NOT NULL) / COUNT(*), 1) as percent_geocoded
FROM incidents;"
```

---

## Troubleshooting

### Problem: `createdb: command not found`

**Solution:** Add PostgreSQL to your PATH:

```bash
echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

For Intel Macs, use `/usr/local` instead of `/opt/homebrew`.

### Problem: `psql: connection to server failed`

**Solution:** PostgreSQL isn't running. Start it:

```bash
brew services start postgresql@15

# Wait a few seconds, then check
brew services list | grep postgresql
```

### Problem: Port 3000 already in use

**Solution:** Kill the process or use a different port:

```bash
# Kill whatever is using port 3000
lsof -ti:3000 | xargs kill -9

# Or run on different port
npm run dev -- -p 3001
```

### Problem: `permission denied` creating database

**Solution:** Make sure you're using the correct PostgreSQL user:

```bash
# Check current user
whoami

# Create database as current user
createdb -U $(whoami) pulsemap
```

### Problem: npm install fails with permission errors

**Solution:** Fix npm permissions:

```bash
# For Homebrew Node.js, this shouldn't happen
# But if it does, reinstall Node
brew uninstall node
brew install node
```

### Problem: PostGIS extension not found

**Solution:** Reinstall PostGIS:

```bash
brew reinstall postgis
psql pulsemap -c "CREATE EXTENSION postgis;"
```

---

## Updating Dependencies

Keep everything up to date:

```bash
# Update Homebrew itself
brew update

# Update all installed packages
brew upgrade

# Update specific packages
brew upgrade node
brew upgrade postgresql@15
brew upgrade postgis

# Update npm packages
npm update

# Check for outdated npm packages
npm outdated
```

---

## System Requirements

**Minimum:**
- macOS 10.15 Catalina
- 4 GB RAM
- 2 GB free disk space

**Recommended:**
- macOS 12 Monterey or newer
- 8 GB RAM
- 5 GB free disk space

**Disk Space Breakdown:**
- Homebrew packages: ~300 MB
- Node.js & npm: ~50 MB
- PostgreSQL + PostGIS: ~200 MB
- Project dependencies (node_modules): ~400 MB
- Database storage: ~10-100 MB (depends on incidents)

---

## What's Installed?

After running this guide, you'll have:

1. **Homebrew** - Package manager
2. **Node.js** - JavaScript runtime (~50 MB)
3. **npm** - Package manager (included with Node.js)
4. **PostgreSQL 15** - Database server (~150 MB)
5. **PostGIS** - Spatial database extension (~50 MB)
6. **PulseMap dependencies** - npm packages (~400 MB)
7. **pulsemap database** - PostgreSQL database with schema

Everything is installed via Homebrew, making it easy to update and uninstall.

---

## Clean Uninstall

If you need to remove everything:

```bash
# Stop PostgreSQL
brew services stop postgresql@15

# Uninstall packages
brew uninstall postgresql@15 postgis node

# Remove database files
rm -rf ~/Library/Application\ Support/Postgres
rm -rf /opt/homebrew/var/postgres

# Remove project
rm -rf ~/Projects/pulsemap

# Optional: Uninstall Homebrew itself
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/uninstall.sh)"
```

---

## Need Help?

- **Homebrew issues:** https://docs.brew.sh/Troubleshooting
- **PostgreSQL issues:** https://www.postgresql.org/docs/
- **Project issues:** Check SETUP.md or open a GitHub issue

---

✅ **You're all set!** Start the server with `npm run dev` and open http://localhost:3000

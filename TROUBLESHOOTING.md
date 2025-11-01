# PulseMap - Troubleshooting Guide

## Common Installation Issues & Fixes

### Issue 1: PostGIS Extension Not Found (PostgreSQL 14 vs 15)

**Error:**
```
ERROR: could not open extension control file "/opt/homebrew/share/postgresql@14/extension/postgis.control": No such file or directory
```

**Cause:** You have PostgreSQL 14 installed, but PostGIS wasn't installed for that specific version.

**Solution:**

```bash
# Find your PostgreSQL version
psql --version

# If you have PostgreSQL 14:
brew install postgis

# Link PostGIS to PostgreSQL 14
brew link postgis

# Restart PostgreSQL
brew services restart postgresql@14

# Now create the extension
psql pulsemap -c "CREATE EXTENSION postgis;"

# Verify it works
psql pulsemap -c "SELECT PostGIS_version();"
```

**Alternative: Install PostgreSQL 15 (Recommended)**

```bash
# Uninstall PostgreSQL 14
brew services stop postgresql@14
brew uninstall postgresql@14

# Install PostgreSQL 15
brew install postgresql@15

# Add to PATH
echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Start PostgreSQL 15
brew services start postgresql@15

# Recreate database
createdb pulsemap
psql pulsemap -c "CREATE EXTENSION postgis;"
psql pulsemap < lib/db/schema.sql
```

---

### Issue 2: Tailwind CSS Error with Next.js 16 Turbopack

**Error:**
```
Error: It looks like you're trying to use `tailwindcss` directly as a PostCSS plugin.
The PostCSS plugin has moved to a separate package...
```

**Cause:** Next.js 16 with Turbopack requires the new `@tailwindcss/postcss` package.

**Solution (Already Fixed in Latest Code):**

```bash
# Install the new Tailwind PostCSS plugin
npm install @tailwindcss/postcss

# The postcss.config.js should use:
# '@tailwindcss/postcss': {}
# instead of:
# tailwindcss: {}
```

**If you still get Turbopack warnings, add explicit flag:**

Update `package.json`:
```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build --turbopack"
  }
}
```

This is already configured in the latest version.

---

### Issue 3: Database Connection Refused

**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**

```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# If not running, start it
brew services start postgresql@15
# Or for PostgreSQL 14:
brew services start postgresql@14

# Wait a few seconds, then test connection
psql -l
```

---

### Issue 4: `createdb: command not found`

**Cause:** PostgreSQL binaries are not in your PATH.

**Solution:**

For PostgreSQL 15:
```bash
echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

For PostgreSQL 14:
```bash
echo 'export PATH="/opt/homebrew/opt/postgresql@14/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

For Intel Macs (use `/usr/local` instead of `/opt/homebrew`):
```bash
echo 'export PATH="/usr/local/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

---

### Issue 5: Port 3000 Already in Use

**Error:**
```
Port 3000 is already in use
```

**Solution:**

```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or run on a different port
npm run dev -- -p 3001
```

---

### Issue 6: PostGIS Version Mismatch

**Error:**
```
ERROR: PostGIS built for PostgreSQL 15.x cannot be loaded in PostgreSQL 14.x
```

**Solution:** You need to match PostGIS version with PostgreSQL version.

**For PostgreSQL 14:**
```bash
# Install specific PostGIS version for PG 14
brew uninstall postgis
brew install postgis

# Verify
psql pulsemap -c "CREATE EXTENSION postgis;"
```

**For PostgreSQL 15:**
```bash
# PostGIS should work automatically
psql pulsemap -c "CREATE EXTENSION postgis;"
```

---

### Issue 7: Permission Denied Creating Database

**Error:**
```
createdb: error: could not connect to database template1: FATAL: role "postgres" does not exist
```

**Solution:**

```bash
# Create database with your Mac username
createdb -U $(whoami) pulsemap

# Or create postgres role
createuser -s postgres

# Update .env.local to match
DATABASE_URL=postgresql://$(whoami)@localhost:5432/pulsemap
```

---

### Issue 8: npm install Fails

**Error:**
```
npm ERR! code EACCES
npm ERR! syscall access
```

**Solution:**

```bash
# Fix npm permissions (Homebrew Node.js)
brew uninstall node
brew install node

# Or use sudo (not recommended)
sudo npm install
```

---

### Issue 9: Module Not Found Errors

**Error:**
```
Module not found: Can't resolve 'leaflet'
```

**Solution:**

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Or install specific missing package
npm install leaflet react-leaflet @types/leaflet
```

---

### Issue 10: Map Not Loading

**Symptoms:** Map shows "Loading map..." forever

**Solutions:**

1. Check browser console for errors (F12)
2. Verify Leaflet CSS is loading:
   ```tsx
   // In app/layout.tsx
   import 'leaflet/dist/leaflet.css';
   ```
3. Clear browser cache
4. Check if OpenStreetMap tiles are accessible:
   - Visit: https://tile.openstreetmap.org/0/0/0.png
   - If blocked, you may need a VPN or different tile provider

---

### Issue 11: No Incidents Showing on Map

**Symptoms:** Map loads but no markers appear

**Solutions:**

1. **Sync incidents:**
   - Click "Sync Now" button in the app
   - Wait 30-60 seconds

2. **Check database has data:**
   ```bash
   psql pulsemap -c "SELECT COUNT(*) FROM incidents;"
   ```

3. **Check if incidents have coordinates:**
   ```bash
   psql pulsemap -c "SELECT COUNT(*) FROM incidents WHERE coordinates IS NOT NULL;"
   ```

4. **Check API health:**
   - Visit: http://localhost:3000/api/health
   - Should show database and API as healthy

5. **Check Politiloggen API:**
   - The API may be temporarily down
   - Try again in a few minutes

---

### Issue 12: Geocoding Not Working

**Symptoms:** All incidents show "unknown" precision

**Causes:**
- Nominatim rate limiting (1 request/second)
- Network issues
- Invalid location strings

**Solutions:**

1. **Wait for background geocoding:**
   - Geocoding happens in background
   - Check back after 5-10 minutes

2. **Check geocoding progress:**
   ```bash
   psql pulsemap -c "SELECT
     COUNT(*) as total,
     COUNT(*) FILTER (WHERE coordinates IS NOT NULL) as geocoded,
     AVG(geocoding_attempts) as avg_attempts
   FROM incidents;"
   ```

3. **Manually trigger geocoding:**
   - The sync process includes geocoding
   - Click "Sync Now" again

4. **Use Google Geocoding API (optional):**
   - Sign up for Google Geocoding API
   - Add to `.env.local`:
     ```
     GOOGLE_GEOCODING_API_KEY=your_key_here
     ```

---

### Issue 13: TypeScript Errors

**Error:**
```
Type error: Cannot find module '@/types/incident'
```

**Solution:**

```bash
# Run type checking
npm run type-check

# Fix path alias in tsconfig.json
# Should have:
"paths": {
  "@/*": ["./*"]
}

# Restart dev server
npm run dev
```

---

## Quick Diagnostic Commands

Run these to diagnose issues:

```bash
# Check all services
echo "=== Homebrew ==="
brew --version

echo "=== Node.js ==="
node --version
npm --version

echo "=== PostgreSQL ==="
psql --version
brew services list | grep postgresql

echo "=== Database ==="
psql -l | grep pulsemap

echo "=== PostGIS ==="
psql pulsemap -c "SELECT PostGIS_version();" 2>&1

echo "=== Tables ==="
psql pulsemap -c "\dt" 2>&1

echo "=== Incidents Count ==="
psql pulsemap -c "SELECT COUNT(*) FROM incidents;" 2>&1

echo "=== Geocoded Count ==="
psql pulsemap -c "SELECT COUNT(*) FROM incidents WHERE coordinates IS NOT NULL;" 2>&1
```

Save this as `diagnose.sh`, make it executable (`chmod +x diagnose.sh`), and run it:
```bash
./diagnose.sh
```

---

## Getting Help

If you're still stuck:

1. **Check the logs:**
   ```bash
   # Terminal where npm run dev is running
   # Look for error messages
   ```

2. **Check browser console:**
   - Open browser DevTools (F12)
   - Check Console and Network tabs

3. **Create a diagnostic report:**
   ```bash
   ./diagnose.sh > diagnostic-report.txt
   ```

4. **Ask for help:**
   - Include the diagnostic report
   - Include error messages
   - Mention your macOS version and chip (Intel/Apple Silicon)

---

## Clean Reinstall (Last Resort)

If nothing works, try a clean reinstall:

```bash
# Stop services
brew services stop postgresql@14
brew services stop postgresql@15

# Remove everything
cd ~/Projects/pulsemap  # or wherever your project is
rm -rf node_modules package-lock.json

# Remove database
dropdb pulsemap 2>/dev/null || true

# Reinstall
npm install

# Recreate database
createdb pulsemap
psql pulsemap -c "CREATE EXTENSION postgis;"
psql pulsemap < lib/db/schema.sql

# Copy environment
cp .env.example .env.local
# Edit .env.local with your settings

# Start fresh
npm run dev
```

---

## PostgreSQL Version Compatibility Matrix

| PostgreSQL Version | PostGIS Version | Homebrew Command | Status |
|-------------------|-----------------|------------------|--------|
| 14.x | 3.3.x | `brew install postgresql@14 postgis` | ✅ Supported |
| 15.x | 3.3.x | `brew install postgresql@15 postgis` | ✅ Recommended |
| 16.x | 3.4.x | `brew install postgresql@16 postgis` | ✅ Supported |

**Note:** PulseMap works with PostgreSQL 14, 15, or 16. Version 15 is recommended for the best compatibility.

---

## Contact & Support

- **Documentation:** See README.md and SETUP.md
- **Installation Guide:** See INSTALL-MAC.md
- **GitHub Issues:** Report bugs and ask questions

---

**Last Updated:** Based on Next.js 16, PostgreSQL 14/15, macOS Sonoma+

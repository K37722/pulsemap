#!/usr/bin/env node
/**
 * Seed script to fetch latest incidents from Politiloggen API
 * Run with: npm run seed
 */

const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function seedIncidents() {
  console.log('🌱 Seeding incidents from Politiloggen API...\n');

  try {
    // Dynamic import for ES modules
    const { getIncidentSyncService } = await import('../lib/services/incident-sync.js');

    const syncService = getIncidentSyncService();

    // Fetch incidents from last 7 days
    console.log('📡 Fetching from Politiloggen API (Oslo, last 7 days)...');
    const result = await syncService.syncIncidents('Oslo', 7);

    console.log('\n✅ Sync complete!');
    console.log(`   Fetched: ${result.fetched} incidents`);
    console.log(`   Processed: ${result.processed} incidents`);

    if (result.errors.length > 0) {
      console.log(`\n⚠️  Errors (${result.errors.length}):`);
      result.errors.forEach(err => console.log(`   - ${err}`));
    }

    // Get stats
    const stats = await syncService.getSyncStats();
    console.log('\n📊 Database stats:');
    console.log(`   Total incidents: ${stats.total}`);
    console.log(`   Active incidents: ${stats.active}`);
    console.log(`   Geocoded: ${stats.geocoded}`);
    console.log(`   Needs geocoding: ${stats.needsGeocode}`);

    console.log('\n🎉 Ready! Start the app with: npm run dev');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    console.error('\nMake sure:');
    console.error('  1. Database is running: brew services list | grep postgresql');
    console.error('  2. Schema is created: psql pulsemap < lib/db/schema.sql');
    console.error('  3. .env.local is configured: npm run env:setup');
    process.exit(1);
  }
}

// Run
seedIncidents();

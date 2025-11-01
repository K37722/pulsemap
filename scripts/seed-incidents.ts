#!/usr/bin/env ts-node
/**
 * Seed script to fetch latest incidents from Politiloggen API
 * Run with: npm run seed
 */

import { getIncidentSyncService } from '../lib/services/incident-sync';

async function seedIncidents() {
  console.log('🌱 Seeding incidents from Politiloggen API...\n');

  try {
    const syncService = getIncidentSyncService();

    // Fetch incidents from last 7 days
    const result = await syncService.syncIncidents('Oslo', 7);

    console.log('\n✅ Seed complete!');
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
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedIncidents();
}

export default seedIncidents;

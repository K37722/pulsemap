#!/usr/bin/env node
/**
 * Seed script to fetch latest incidents from Politiloggen API
 * This script starts the Next.js server temporarily and calls the sync API
 * Run with: npm run seed
 */

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const PORT = 3001; // Use different port to avoid conflicts
const API_URL = `http://localhost:${PORT}/api/sync`;
const HEALTH_URL = `http://localhost:${PORT}/api/health`;

async function waitForServer(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(HEALTH_URL, (res) => {
          if (res.statusCode === 200 || res.statusCode === 207 || res.statusCode === 503) {
            resolve();
          } else {
            reject();
          }
        });
        req.on('error', reject);
        req.setTimeout(2000, () => {
          req.destroy();
          reject();
        });
      });
      return true;
    } catch (e) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
}

async function syncViaAPI() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      district: 'Oslo',
      daysBack: 7
    });

    const req = http.request(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      },
      timeout: 120000 // 2 minutes timeout
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          reject(new Error('Failed to parse response'));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.write(postData);
    req.end();
  });
}

async function getStats() {
  return new Promise((resolve, reject) => {
    http.get(HEALTH_URL, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function seedIncidents() {
  console.log('🌱 Seeding incidents from Politiloggen API...\n');
  console.log('Starting temporary Next.js server...');

  // Start Next.js server on different port
  const server = spawn('npx', ['next', 'dev', '--turbopack', '-p', PORT.toString()], {
    env: { ...process.env, NODE_ENV: 'development' },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let serverOutput = '';
  server.stdout.on('data', (data) => {
    serverOutput += data.toString();
  });
  server.stderr.on('data', (data) => {
    serverOutput += data.toString();
  });

  try {
    // Wait for server to be ready
    console.log('⏳ Waiting for server to start...');
    const ready = await waitForServer();

    if (!ready) {
      throw new Error('Server failed to start after 30 seconds');
    }

    console.log('✅ Server ready!\n');
    console.log('📡 Fetching from Politiloggen API (Oslo, last 7 days)...');
    console.log('⏳ This may take 60-90 seconds (geocoding is rate-limited)...\n');

    // Call sync API
    const response = await syncViaAPI();

    if (!response.success) {
      throw new Error('Sync failed: ' + JSON.stringify(response));
    }

    const result = response.result;

    console.log('✅ Sync complete!');
    console.log(`   Fetched: ${result.fetched} incidents`);
    console.log(`   Processed: ${result.processed} incidents`);

    if (result.errors && result.errors.length > 0) {
      console.log(`\n⚠️  Errors (${result.errors.length}):`);
      result.errors.forEach(err => console.log(`   - ${err}`));
    }

    // Get stats
    console.log('\n📊 Getting database stats...');
    const health = await getStats();

    if (health.stats) {
      console.log('📊 Database stats:');
      console.log(`   Total incidents: ${health.stats.total}`);
      console.log(`   Active incidents: ${health.stats.active}`);
      console.log(`   Geocoded: ${health.stats.geocoded}`);
      console.log(`   Needs geocoding: ${health.stats.needsGeocode}`);
    }

    console.log('\n🎉 Ready! Start the app with: npm run dev');
    console.log('   Or view at: http://localhost:3000');

    // Clean shutdown
    server.kill('SIGTERM');
    setTimeout(() => {
      process.exit(0);
    }, 1000);

  } catch (error) {
    console.error('\n❌ Seed failed:', error.message);
    console.error('\nMake sure:');
    console.error('  1. Database is running: brew services list | grep postgresql');
    console.error('  2. Schema is created: psql pulsemap < lib/db/schema.sql');
    console.error('  3. .env.local is configured: npm run env:setup');
    console.error('  4. USE_MOCK_DATA=false in .env.local');

    if (serverOutput) {
      console.error('\nServer output:');
      console.error(serverOutput);
    }

    server.kill('SIGTERM');
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Interrupted. Cleaning up...');
  process.exit(0);
});

// Run
seedIncidents();

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getStats } from '@/lib/db/incidents';
import { getPolitiloggenService } from '@/lib/services/politiloggen';

export const dynamic = 'force-dynamic';

export async function GET() {
  const health = {
    status: 'healthy' as 'healthy' | 'degraded' | 'down',
    timestamp: new Date().toISOString(),
    checks: {
      database: false,
      api: false,
    },
    stats: null as any,
    errors: [] as string[],
  };

  // Check database connection
  try {
    await query('SELECT 1');
    health.checks.database = true;
  } catch (error) {
    health.status = 'down';
    health.checks.database = false;
    health.errors.push(`Database: ${error}`);
  }

  // Check Politiloggen API
  try {
    const politiloggen = getPolitiloggenService();
    const apiHealthy = await politiloggen.healthCheck();
    health.checks.api = apiHealthy;
    if (!apiHealthy) {
      health.status = 'degraded';
      health.errors.push('Politiloggen API is not responding');
    }
  } catch (error) {
    health.status = 'degraded';
    health.checks.api = false;
    health.errors.push(`API: ${error}`);
  }

  // Get database stats
  if (health.checks.database) {
    try {
      health.stats = await getStats();
    } catch (error) {
      health.errors.push(`Stats: ${error}`);
    }
  }

  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 207 : 503;

  return NextResponse.json(health, { status: statusCode });
}

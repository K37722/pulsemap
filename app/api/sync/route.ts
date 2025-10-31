import { NextRequest, NextResponse } from 'next/server';
import { getIncidentSyncService } from '@/lib/services/incident-sync';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const district = body.district || process.env.NEXT_PUBLIC_OSLO_DISTRICT || 'Oslo';
    const daysBack = body.daysBack || 7;

    console.log(`Starting sync for district: ${district}, days back: ${daysBack}`);

    const syncService = getIncidentSyncService();
    const result = await syncService.syncIncidents(district, daysBack);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Error syncing incidents:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync incidents',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const syncService = getIncidentSyncService();
    const stats = await syncService.getSyncStats();

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error getting sync stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get sync stats',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

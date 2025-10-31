import { NextRequest, NextResponse } from 'next/server';
import { getIncidents } from '@/lib/db/incidents';
import { IncidentFilters } from '@/types/incident';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse filters from query parameters
    const filters: IncidentFilters = {};

    const categories = searchParams.get('categories');
    if (categories) {
      filters.categories = categories.split(',');
    }

    const statuses = searchParams.get('statuses');
    if (statuses) {
      filters.statuses = statuses.split(',') as any;
    }

    const severities = searchParams.get('severities');
    if (severities) {
      filters.severities = severities.split(',') as any;
    }

    const precisions = searchParams.get('precisions');
    if (precisions) {
      filters.precisions = precisions.split(',') as any;
    }

    const districts = searchParams.get('districts');
    if (districts) {
      filters.districts = districts.split(',');
    }

    const dateFrom = searchParams.get('dateFrom');
    if (dateFrom) {
      filters.dateFrom = new Date(dateFrom);
    }

    const dateTo = searchParams.get('dateTo');
    if (dateTo) {
      filters.dateTo = new Date(dateTo);
    }

    // Fetch incidents from database
    const incidents = await getIncidents(filters);

    return NextResponse.json({
      success: true,
      count: incidents.length,
      incidents,
    });
  } catch (error) {
    console.error('Error fetching incidents:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch incidents',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

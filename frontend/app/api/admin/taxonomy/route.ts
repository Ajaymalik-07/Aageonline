import { NextRequest, NextResponse } from 'next/server';
import {
  adminCreateCategory,
  adminMapCategoryDiscovery,
  adminCreateState,
  adminCreateCity,
  adminCorrectCityDiscovery,
  adminCreateMarket,
  adminPublishMarket,
  adminSetMarketIndexability,
  adminArchiveMarket,
  adminRejectDiscovery,
  getAdminDiscoveryQueues,
  AdminActor,
} from '../../../../lib/taxonomy/admin-service';
import { getAuditLogs } from '../../../../lib/taxonomy/audit';
import { getAllMarkets } from '../../../../lib/taxonomy/markets';

// Server-side authorization guard
function getAuthorizedActor(req: NextRequest): AdminActor | null {
  const authHeader = req.headers.get('authorization');
  const roleHeader = req.headers.get('x-admin-role');
  const apiKey = req.headers.get('x-admin-key');

  // Strict check: Must have admin authorization header or internal dev key
  const validSecret = process.env.ADMIN_SECRET_KEY || 'dev-admin-secret-2026';

  if (
    apiKey === validSecret ||
    authHeader === `Bearer ${validSecret}` ||
    roleHeader === 'SUPERADMIN' ||
    roleHeader === 'TAXONOMY_ADMIN'
  ) {
    return {
      id: 'admin-1',
      name: 'Taxonomy Governance Admin',
      role: (roleHeader as 'SUPERADMIN' | 'TAXONOMY_ADMIN') || 'TAXONOMY_ADMIN',
    };
  }

  return null;
}

export async function GET(req: NextRequest) {
  const actor = getAuthorizedActor(req);
  if (!actor) {
    return NextResponse.json(
      { error: 'Unauthorized: Administrative credentials required.' },
      { status: 401 }
    );
  }

  const queues = getAdminDiscoveryQueues();
  const markets = getAllMarkets();
  const auditLogs = getAuditLogs();

  return NextResponse.json({
    queues,
    markets,
    auditLogs: auditLogs.slice(-50).reverse(), // Last 50 entries
  });
}

export async function POST(req: NextRequest) {
  const actor = getAuthorizedActor(req);
  if (!actor) {
    return NextResponse.json(
      { error: 'Unauthorized: Public users cannot execute administrative mutations.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { action, payload } = body;

    switch (action) {
      case 'CREATE_CATEGORY': {
        const category = adminCreateCategory(
          actor,
          payload,
          payload.discoveryRequestId
        );
        return NextResponse.json({ success: true, category });
      }

      case 'MAP_CATEGORY': {
        const mapped = adminMapCategoryDiscovery(
          actor,
          payload.discoveryRequestId,
          payload.targetCategoryId
        );
        return NextResponse.json({ success: true, discovery: mapped });
      }

      case 'CREATE_STATE': {
        const state = adminCreateState(actor, payload);
        return NextResponse.json({ success: true, state });
      }

      case 'CREATE_CITY': {
        const city = adminCreateCity(
          actor,
          payload,
          payload.discoveryRequestId
        );
        return NextResponse.json({ success: true, city });
      }

      case 'CORRECT_CITY': {
        const corrected = adminCorrectCityDiscovery(
          actor,
          payload.discoveryRequestId,
          payload.canonicalCityId
        );
        return NextResponse.json({ success: true, discovery: corrected });
      }

      case 'CREATE_MARKET': {
        const market = adminCreateMarket(actor, payload);
        return NextResponse.json({ success: true, market });
      }

      case 'PUBLISH_MARKET': {
        const published = adminPublishMarket(
          actor,
          payload.marketId,
          { indexable: payload.indexable }
        );
        return NextResponse.json({ success: true, market: published });
      }

      case 'SET_INDEXABILITY': {
        const updated = adminSetMarketIndexability(
          actor,
          payload.marketId,
          payload.indexable
        );
        return NextResponse.json({ success: true, market: updated });
      }

      case 'ARCHIVE_MARKET': {
        const archived = adminArchiveMarket(
          actor,
          payload.marketId,
          payload.reason
        );
        return NextResponse.json({ success: true, market: archived });
      }

      case 'REJECT_DISCOVERY': {
        const rejected = adminRejectDiscovery(
          actor,
          payload.discoveryRequestId,
          payload.reason || 'Admin rejected discovery candidate'
        );
        return NextResponse.json({ success: true, discovery: rejected });
      }

      default:
        return NextResponse.json(
          { error: `Unknown administrative action "${action}".` },
          { status: 400 }
        );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Administrative mutation failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

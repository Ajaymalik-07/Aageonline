import { NextRequest, NextResponse } from 'next/server';
import { businessClaimService } from '../../../data-access/claims/index.ts';
import { requireAuthenticatedUser } from '../../../lib/auth/server-guard.ts';
import { assertPlatformAdmin } from '../../../lib/auth/admin-guard.ts';
import { getMembership } from '../../../lib/memberships/store.ts';

export async function GET(req: NextRequest) {
  try {
    const currentUser = await requireAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');
    const claimantUserId = searchParams.get('claimantUserId');

    if (businessId) {
      // Enforce tenant isolation: user must be active member or platform admin
      const membership = getMembership(businessId, currentUser.id);
      if (!membership || membership.status !== 'ACTIVE') {
        assertPlatformAdmin(currentUser);
      }
      const claims = await businessClaimService.getClaimsByBusiness(businessId);
      return NextResponse.json({ claims });
    }

    if (claimantUserId) {
      // Enforce user isolation: user can only query own claims unless platform admin
      if (claimantUserId !== currentUser.id) {
        assertPlatformAdmin(currentUser);
      }
      const claims = await businessClaimService.getClaimsByClaimant(claimantUserId);
      return NextResponse.json({ claims });
    }

    // Default: Return claims for current authenticated user
    const claims = await businessClaimService.getClaimsByClaimant(currentUser.id);
    return NextResponse.json({ claims });
  } catch (err: unknown) {
    const errorObj = err as { statusCode?: number; message?: string };
    const status = errorObj.statusCode || (err instanceof Error && err.message.includes('Authentication') ? 401 : 500);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await requireAuthenticatedUser(req);

    const body = await req.json();
    const { businessId, claimantName, claimantEmail, claimantRoleDescription, evidenceType, evidenceReference } = body;

    if (!businessId || !evidenceType || !evidenceReference) {
      return NextResponse.json(
        { error: 'Missing required claim parameters: businessId, evidenceType, and evidenceReference.' },
        { status: 400 }
      );
    }

    const claim = await businessClaimService.submitClaim(
      {
        businessId,
        claimantName: claimantName || currentUser.displayName || 'Claimant',
        claimantEmail: claimantEmail || currentUser.email,
        claimantRoleDescription,
        evidenceType,
        evidenceReference,
      },
      currentUser.id
    );

    return NextResponse.json({ claim }, { status: 201 });
  } catch (err: unknown) {
    const errorObj = err as { statusCode?: number };
    const message = err instanceof Error ? err.message : 'Failed to submit claim';
    const status = errorObj.statusCode || (message.includes('already') ? 409 : 400);
    return NextResponse.json({ error: message }, { status });
  }
}

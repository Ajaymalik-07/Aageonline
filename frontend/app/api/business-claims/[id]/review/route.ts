import { NextRequest, NextResponse } from 'next/server';
import { businessClaimService } from '../../../../../data-access/claims/index.ts';
import { requirePlatformAdminUser } from '../../../../../lib/auth/server-guard.ts';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requirePlatformAdminUser(req);

    const body = await req.json();
    const { decision, rejectionReason } = body;

    if (decision !== 'APPROVE' && decision !== 'REJECT') {
      return NextResponse.json({ error: 'Decision must be APPROVE or REJECT' }, { status: 400 });
    }

    const claim = await businessClaimService.reviewClaim({
      claimId: id,
      decision,
      reviewedByUserId: currentUser.id,
      rejectionReason,
    });

    return NextResponse.json({ claim });
  } catch (err: unknown) {
    const errorObj = err as { statusCode?: number; message?: string };
    const status = errorObj.statusCode || 400;
    const message = err instanceof Error ? err.message : 'Failed to review claim';
    return NextResponse.json({ error: message }, { status });
  }
}

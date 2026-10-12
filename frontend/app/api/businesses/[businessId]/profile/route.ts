import { NextRequest, NextResponse } from 'next/server';
import { businessWorkspaceService } from '../../../../../data-access/workspace/index.ts';
import { requireBusinessMembership } from '../../../../../lib/auth/server-guard.ts';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params;
    const { user: currentUser } = await requireBusinessMembership(req, businessId, 'business.update');

    const body = await req.json();
    const updated = await businessWorkspaceService.updateProfile(
      { ...body, businessId },
      currentUser.id
    );

    return NextResponse.json({ business: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    const status = (err as { statusCode?: number }).statusCode || 500;
    return NextResponse.json({ error: message }, { status });
  }
}

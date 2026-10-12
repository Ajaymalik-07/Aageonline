import { NextRequest, NextResponse } from 'next/server';
import { businessWorkspaceService } from '../../../../../data-access/workspace/index.ts';
import { requireBusinessMembership } from '../../../../../lib/auth/server-guard.ts';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params;
    const { user } = await requireBusinessMembership(req, businessId, 'workspace.access');

    const overview = await businessWorkspaceService.getOverview(businessId, user.id);
    return NextResponse.json({ overview });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    const status = (err as { statusCode?: number }).statusCode || 500;
    return NextResponse.json({ error: message }, { status });
  }
}

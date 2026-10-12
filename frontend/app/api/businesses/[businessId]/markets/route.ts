import { NextRequest, NextResponse } from 'next/server';
import { businessWorkspaceService } from '../../../../../data-access/workspace/index.ts';
import { authService } from '../../../../../data-access/auth/index.ts';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params;
    const currentUser = await authService.getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const markets = await businessWorkspaceService.getMarkets(businessId, currentUser.id);
    return NextResponse.json({ markets });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    const status = (err as { statusCode?: number }).statusCode || 500;
    return NextResponse.json({ error: message }, { status });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { businessMembershipService } from '../../../../../data-access/memberships/index.ts';
import { requireBusinessMembership } from '../../../../../lib/auth/server-guard.ts';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params;
    await requireBusinessMembership(req, businessId, 'business.members.view');

    const members = await businessMembershipService.getMembershipsByBusiness(businessId);
    return NextResponse.json({ members });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    const status = (err as { statusCode?: number }).statusCode || 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params;
    const { user: currentUser } = await requireBusinessMembership(req, businessId, 'business.members.invite');

    const body = await req.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: 'Missing userId or role' }, { status: 400 });
    }

    const membership = await businessMembershipService.createMembership(
      {
        businessId,
        userId,
        role,
        invitedBy: currentUser.id,
      },
      currentUser.id
    );

    return NextResponse.json({ membership }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create membership';
    const status = (err as { statusCode?: number }).statusCode || 400;
    return NextResponse.json({ error: message }, { status });
  }
}

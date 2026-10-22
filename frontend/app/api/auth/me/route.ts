import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/auth/server-session.ts';
import { PostgresBusinessRepository } from '../../../../lib/db/repositories/business-repository.ts';
import { isDatabaseConfigured } from '../../../../lib/db/client.ts';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    let businesses: any[] = [];
    if (isDatabaseConfigured()) {
      const bizRepo = new PostgresBusinessRepository();
      const owned = await bizRepo.getBusinessesByOwner(user.id);
      businesses = owned.map((item) => ({
        id: item.business.id,
        slug: item.business.slug,
        name: item.business.name,
        legalName: item.business.legalName,
        tagline: item.business.tagline,
        description: item.business.description,
        address: item.business.address,
        phone: item.business.phone,
        whatsappPhone: item.business.whatsappPhone,
        cityName: item.cityName || item.business.primaryCityId,
        categoryName: item.categoryName,
        verificationStatus: item.business.verificationStatus,
        publicationStatus: item.business.publicationStatus,
        evidenceType: item.business.evidenceType,
        evidenceReference: item.business.evidenceReference,
        evidenceStatus: item.business.evidenceStatus,
        role: item.membershipRole,
        createdAt: item.business.createdAt,
      }));
    }

    return NextResponse.json({
      user,
      hasExistingBusinesses: businesses.length > 0,
      businessCount: businesses.length,
      businesses,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

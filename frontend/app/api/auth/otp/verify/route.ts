/**
 * AageOnline — Verify WhatsApp Business OTP API
 * Milestone 0.20.30: Business Owner Identity & Registration Flow
 *
 * POST /api/auth/otp/verify
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyOtpChallenge } from '../../../../../lib/auth/otp-service.ts';
import { PostgresUserRepository } from '../../../../../lib/db/repositories/user-repository.ts';
import { PostgresBusinessRepository } from '../../../../../lib/db/repositories/business-repository.ts';
import { isDatabaseConfigured } from '../../../../../lib/db/client.ts';
import { createPersistentSession } from '../../../../../lib/auth/server-session.ts';
import { getSessionCookieName, getSessionCookieOptions } from '../../../../../lib/auth/session-token.ts';
import { hashClientIp, extractClientIp } from '../../../../../lib/security/rate-limit.ts';
import { createOrGetUserByEmail, setActiveDevUser } from '../../../../../lib/auth/store.ts';
import type { User } from '../../../../../types/auth.ts';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const phone = body.phone;
    const code = body.code || body.otp;

    const verification = verifyOtpChallenge(phone, code);
    if (!verification.success || !verification.phone) {
      return NextResponse.json(
        { error: verification.error || 'Invalid verification code.' },
        { status: 400 }
      );
    }

    const verifiedPhone = verification.phone;
    let user: User;

    // 1. Resolve or create user in PostgreSQL
    if (isDatabaseConfigured()) {
      const userRepo = new PostgresUserRepository();
      user = await userRepo.createOrGetUserByPhone(verifiedPhone);
    } else {
      // In-memory fallback
      const phoneEmail = `${verifiedPhone}@owner.aageonline.in`;
      user = createOrGetUserByEmail(phoneEmail, undefined, 'USER');
      user.phone = verifiedPhone;
    }

    // Ensure in-memory store has user mapped
    const { registerUserInStore, setActiveDevUser: setDevUser } = await import('../../../../../lib/auth/store.ts');
    registerUserInStore(user);

    // Set active dev user for backwards-compatibility in dev
    if (process.env.NODE_ENV !== 'production') {
      setDevUser(user.id);
    }

    // 2. Query businesses associated with this authenticated owner
    let ownedBusinesses: any[] = [];
    if (isDatabaseConfigured()) {
      const bizRepo = new PostgresBusinessRepository();
      ownedBusinesses = await bizRepo.getBusinessesByOwner(user.id);
    }

    // 3. Extract telemetry for session security
    const connectionIp = (req as unknown as { ip?: string }).ip || '127.0.0.1';
    const clientIp = extractClientIp(req.headers, connectionIp);
    const ipAddressHash = hashClientIp(clientIp);
    const userAgent = req.headers.get('user-agent') || undefined;

    // 4. Create authoritative persistent server session
    const { session, rawToken } = await createPersistentSession(user.id, {
      ipAddressHash,
      userAgent,
    });

    const cookieName = getSessionCookieName();
    const cookieOptions = getSessionCookieOptions();

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone || verifiedPhone,
        email: user.email,
        displayName: user.displayName,
      },
      hasExistingBusinesses: ownedBusinesses.length > 0,
      businessCount: ownedBusinesses.length,
      businesses: ownedBusinesses.map((item) => ({
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
      })),
    });

    // 5. Set secure HttpOnly session cookie
    response.cookies.set(cookieName, rawToken, {
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      path: cookieOptions.path,
      maxAge: cookieOptions.maxAge,
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Authentication failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

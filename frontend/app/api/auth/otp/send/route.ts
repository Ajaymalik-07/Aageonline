/**
 * AageOnline — Request WhatsApp Business OTP API
 * Milestone 0.20.30: Business Owner Identity & Registration Flow
 *
 * POST /api/auth/otp/send
 */

import { NextRequest, NextResponse } from 'next/server';
import { requestOtpChallenge } from '../../../../../lib/auth/otp-service.ts';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { phone } = body;

    const result = requestOtpChallenge(phone);
    if (!result.success) {
      const status = result.cooldownSeconds ? 429 : 400;
      return NextResponse.json(
        { error: result.error || 'Failed to send verification code.' },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      cooldownSeconds: result.cooldownSeconds,
      // Debug code ONLY exposed in test/development environments for automated test runners
      ...(result.debugCode ? { _testCode: result.debugCode } : {}),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error processing verification request';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

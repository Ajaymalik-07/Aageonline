/**
 * AageOnline — WhatsApp Business Number OTP Authentication Service
 * Milestone 0.20.30: Business Owner Identity & Registration Flow
 *
 * Invariants:
 * 1. Accepts and normalizes 10-digit Indian phone numbers (starting with 6, 7, 8, or 9).
 * 2. Never exposes OTP in unauthenticated responses or production logs.
 * 3. Enforces 60-second resend cooldown, 10-minute expiry, and max 5 attempts.
 * 4. Test code bypass (123456) is strictly forbidden in production.
 */

import crypto from 'node:crypto';

export interface PhoneValidationResult {
  valid: boolean;
  normalized: string;
  formatted: string;
  error?: string;
}

export function normalizeIndianPhoneNumber(input?: string): PhoneValidationResult {
  if (!input || typeof input !== 'string') {
    return {
      valid: false,
      normalized: '',
      formatted: '',
      error: 'WhatsApp Business Number is required.',
    };
  }

  // Strip all non-digit characters
  let digits = input.trim().replace(/\D/g, '');

  // Strip country code if prefixed (+91 or 91)
  if (digits.startsWith('91') && digits.length === 12) {
    digits = digits.substring(2);
  } else if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.substring(1);
  }

  // Indian mobile numbers must be 10 digits starting with 6, 7, 8, or 9
  if (!/^[6-9]\d{9}$/.test(digits)) {
    return {
      valid: false,
      normalized: '',
      formatted: '',
      error: 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).',
    };
  }

  return {
    valid: true,
    normalized: digits,
    formatted: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`,
  };
}

interface OtpChallenge {
  phone: string;
  codeHash: string;
  attempts: number;
  maxAttempts: number;
  expiresAt: number;
  resendAvailableAt: number;
  createdAt: number;
}

const CHALLENGES_STORE = new Map<string, OtpChallenge>();

// Clean up expired challenges every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [phone, ch] of CHALLENGES_STORE.entries()) {
      if (now > ch.expiresAt) {
        CHALLENGES_STORE.delete(phone);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

export function isTestOtpAllowed(): boolean {
  const isProd =
    process.env.NODE_ENV === 'production' ||
    process.env.APP_ENV === 'production' ||
    process.env.NEXT_PUBLIC_APP_ENV === 'production';
  return !isProd;
}

export interface SendOtpResult {
  success: boolean;
  message: string;
  cooldownSeconds?: number;
  error?: string;
  debugCode?: string; // Only provided in development/test environments for automated tests
}

export function requestOtpChallenge(phoneInput: string): SendOtpResult {
  const { valid, normalized, error } = normalizeIndianPhoneNumber(phoneInput);
  if (!valid) {
    return { success: false, message: '', error };
  }

  const now = Date.now();
  const existing = CHALLENGES_STORE.get(normalized);

  // Check resend cooldown
  if (existing && now < existing.resendAvailableAt) {
    const remainingSeconds = Math.ceil((existing.resendAvailableAt - now) / 1000);
    return {
      success: false,
      message: '',
      error: `Please wait ${remainingSeconds}s before requesting a new verification code.`,
      cooldownSeconds: remainingSeconds,
    };
  }

  // Generate cryptographically secure 6-digit random code
  const code = crypto.randomInt(100000, 1000000).toString();
  const codeHash = crypto.createHash('sha256').update(code).digest('hex');

  const challenge: OtpChallenge = {
    phone: normalized,
    codeHash,
    attempts: 0,
    maxAttempts: 5,
    expiresAt: now + 10 * 60 * 1000, // 10 minutes TTL
    resendAvailableAt: now + 60 * 1000, // 60 seconds cooldown
    createdAt: now,
  };

  CHALLENGES_STORE.set(normalized, challenge);

  const debugCode = isTestOtpAllowed() ? code : undefined;

  return {
    success: true,
    message: 'Verification code sent to your registered number.',
    cooldownSeconds: 60,
    debugCode,
  };
}

export interface VerifyOtpResult {
  success: boolean;
  phone?: string;
  error?: string;
}

export function verifyOtpChallenge(phoneInput: string, codeInput: string): VerifyOtpResult {
  const { valid, normalized, error } = normalizeIndianPhoneNumber(phoneInput);
  if (!valid) {
    return { success: false, error };
  }

  if (!codeInput || typeof codeInput !== 'string') {
    return { success: false, error: 'Verification code is required.' };
  }

  const cleanCode = codeInput.trim();
  if (!/^\d{6}$/.test(cleanCode)) {
    return { success: false, error: 'Verification code must be exactly 6 digits.' };
  }

  const challenge = CHALLENGES_STORE.get(normalized);
  const now = Date.now();

  // Explicit test bypass check
  if (cleanCode === '123456' && isTestOtpAllowed()) {
    CHALLENGES_STORE.delete(normalized);
    return { success: true, phone: normalized };
  }

  if (!challenge) {
    return { success: false, error: 'No active verification code found for this number. Please request a new code.' };
  }

  if (now > challenge.expiresAt) {
    CHALLENGES_STORE.delete(normalized);
    return { success: false, error: 'Verification code has expired. Please request a new code.' };
  }

  challenge.attempts += 1;
  if (challenge.attempts > challenge.maxAttempts) {
    CHALLENGES_STORE.delete(normalized);
    return { success: false, error: 'Too many incorrect attempts. Please request a new verification code.' };
  }

  // Constant-time SHA-256 hash comparison
  const inputHash = crypto.createHash('sha256').update(cleanCode).digest('hex');
  const bufInput = Buffer.from(inputHash);
  const bufTarget = Buffer.from(challenge.codeHash);

  if (bufInput.length === bufTarget.length && crypto.timingSafeEqual(bufInput, bufTarget)) {
    CHALLENGES_STORE.delete(normalized);
    return { success: true, phone: normalized };
  }

  return {
    success: false,
    error: `Invalid verification code. ${challenge.maxAttempts - challenge.attempts} attempts remaining.`,
  };
}

export function resetOtpStoreForTesting(): void {
  CHALLENGES_STORE.clear();
}

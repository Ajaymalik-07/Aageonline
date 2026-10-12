/**
 * AageOnline — PayU India SHA-512 Hash Generation & Verification
 * Implements PayU's official hash formula and constant-time signature verification.
 *
 * Formulas:
 * 1. Request Hash:
 *    sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
 * 2. Webhook / Reverse Response Hash:
 *    If additionalCharges:
 *      sha512(additionalCharges|SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 *    Else:
 *      sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 * 3. Verify Payment API Hash:
 *    sha512(key|verify_payment|txnid|SALT)
 */

import { createHash, timingSafeEqual } from 'crypto';

export interface PayURequestHashParams {
  key: string;
  txnid: string;
  amount: string; // e.g. "28501.00" or "28501"
  productinfo: string;
  firstname: string;
  email: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
  salt: string;
}

export interface PayUReverseHashParams {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  status: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
  additionalCharges?: string;
  salt: string;
}

/**
 * Computes the SHA-512 request hash for PayU payment checkout.
 */
export function generatePayURequestHash(params: PayURequestHashParams): string {
  const {
    key,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    udf1 = '',
    udf2 = '',
    udf3 = '',
    udf4 = '',
    udf5 = '',
    salt,
  } = params;

  // Pattern: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
  const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`;
  return createHash('sha512').update(hashString).digest('hex').toLowerCase();
}

/**
 * Computes the SHA-512 reverse hash for verifying PayU webhooks and server callbacks.
 */
export function generatePayUReverseHash(params: PayUReverseHashParams): string {
  const {
    key,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    status,
    udf1 = '',
    udf2 = '',
    udf3 = '',
    udf4 = '',
    udf5 = '',
    additionalCharges,
    salt,
  } = params;

  let hashString: string;
  if (additionalCharges && additionalCharges.trim().length > 0) {
    // Pattern: additionalCharges|salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
    hashString = `${additionalCharges}|${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  } else {
    // Pattern: salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
    hashString = `${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  }

  return createHash('sha512').update(hashString).digest('hex').toLowerCase();
}

/**
 * Computes the SHA-512 hash for PayU Verify Payment API command.
 */
export function generatePayUVerifyPaymentHash(key: string, txnid: string, salt: string): string {
  // Pattern: key|verify_payment|txnid|salt
  const hashString = `${key}|verify_payment|${txnid}|${salt}`;
  return createHash('sha512').update(hashString).digest('hex').toLowerCase();
}

/**
 * Verifies a received hash against the expected reverse hash using constant-time comparison.
 */
export function verifyPayUHash(receivedHash: string, expectedHash: string): boolean {
  if (!receivedHash || !expectedHash) return false;

  const cleanReceived = receivedHash.trim().toLowerCase();
  const cleanExpected = expectedHash.trim().toLowerCase();

  if (cleanReceived.length !== 128 || cleanExpected.length !== 128) {
    return false;
  }

  const receivedBuf = Buffer.from(cleanReceived, 'hex');
  const expectedBuf = Buffer.from(cleanExpected, 'hex');

  if (receivedBuf.length !== expectedBuf.length) {
    return false;
  }

  return timingSafeEqual(receivedBuf, expectedBuf);
}

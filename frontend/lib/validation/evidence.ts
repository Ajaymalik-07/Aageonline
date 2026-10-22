/**
 * AageOnline — Business Registration Evidence Validation
 * Milestone 0.20.30: Business Owner Identity & Registration Flow
 *
 * Strict format validation and normalization for Indian commercial registration identifiers:
 * 1. GSTIN (15 characters)
 * 2. UDYAM Registration (UDYAM-XX-00-0000000)
 * 3. Shop & Establishment License (6-30 chars)
 * 4. Commercial PAN (10 characters)
 */

export type ClaimEvidenceType = 'GSTIN' | 'UDYAM' | 'SHOP_ESTABLISHMENT' | 'COMMERCIAL_PAN';

export interface EvidenceValidationResult {
  valid: boolean;
  normalized: string;
  evidenceType: ClaimEvidenceType;
  error?: string;
}

export function validateEvidenceReference(
  rawType?: string,
  rawRef?: string
): EvidenceValidationResult {
  const type = (rawType || 'GSTIN').toUpperCase().trim() as ClaimEvidenceType;

  if (!['GSTIN', 'UDYAM', 'SHOP_ESTABLISHMENT', 'COMMERCIAL_PAN'].includes(type)) {
    return {
      valid: false,
      normalized: '',
      evidenceType: 'GSTIN',
      error: `Unsupported evidence type "${rawType}". Allowed types: GSTIN, UDYAM, SHOP_ESTABLISHMENT, COMMERCIAL_PAN.`,
    };
  }

  if (!rawRef || typeof rawRef !== 'string' || rawRef.trim().length === 0) {
    return {
      valid: false,
      normalized: '',
      evidenceType: type,
      error: 'Registration Number / Reference is required for commercial verification.',
    };
  }

  const normalized = rawRef.trim().toUpperCase().replace(/\s+/g, '');

  switch (type) {
    case 'GSTIN': {
      // 15-character Goods and Services Tax Identification Number
      // State code (2 digits) + PAN (10 chars) + Entity (1 char) + 'Z' + Check digit (1 char)
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(normalized)) {
        return {
          valid: false,
          normalized,
          evidenceType: type,
          error: 'Please enter a valid 15-character GSTIN (e.g. 08AAAAA0000A1Z5).',
        };
      }
      return { valid: true, normalized, evidenceType: type };
    }

    case 'UDYAM': {
      // Udyam Registration Number format: UDYAM-XX-00-0000000
      const udyamRegex = /^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$/;
      if (!udyamRegex.test(normalized)) {
        return {
          valid: false,
          normalized,
          evidenceType: type,
          error: 'Please enter a valid Udyam Registration number in format UDYAM-XX-00-0000000 (e.g. UDYAM-RJ-14-0012345).',
        };
      }
      return { valid: true, normalized, evidenceType: type };
    }

    case 'SHOP_ESTABLISHMENT': {
      // Shop & Establishment License (State/Municipal specific registration string)
      const shopRegex = /^[A-Z0-9\/\-]{6,30}$/;
      if (!shopRegex.test(normalized)) {
        return {
          valid: false,
          normalized,
          evidenceType: type,
          error: 'Please enter a valid Shop & Establishment license reference (6-30 alphanumeric characters with optional slashes or hyphens).',
        };
      }
      return { valid: true, normalized, evidenceType: type };
    }

    case 'COMMERCIAL_PAN': {
      // 10-character Permanent Account Number: 5 letters + 4 digits + 1 letter
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(normalized)) {
        return {
          valid: false,
          normalized,
          evidenceType: type,
          error: 'Please enter a valid 10-character Commercial PAN (e.g. AAACB1234C).',
        };
      }
      return { valid: true, normalized, evidenceType: type };
    }

    default:
      return {
        valid: false,
        normalized,
        evidenceType: type,
        error: 'Invalid evidence type selected.',
      };
  }
}

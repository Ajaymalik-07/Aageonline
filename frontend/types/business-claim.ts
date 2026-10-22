/**
 * AageOnline — Business Claim Domain Types
 * First-class claim lifecycle and verification models.
 */

export type ClaimStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED';

export type ClaimEvidenceType =
  | 'BUSINESS_EMAIL'
  | 'GSTIN'
  | 'UDYAM'
  | 'SHOP_ESTABLISHMENT'
  | 'COMMERCIAL_PAN'
  | 'OFFICIAL_DOCUMENT'
  | 'PHONE_VERIFICATION'
  | 'WEBSITE_DOMAIN';

export interface BusinessClaim {
  id: string;
  businessId: string;
  claimantUserId: string;
  claimantName?: string;
  claimantEmail?: string;
  claimantRoleDescription?: string;
  status: ClaimStatus;
  evidenceType?: ClaimEvidenceType;
  evidenceReference?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitClaimInput {
  businessId: string;
  claimantName: string;
  claimantEmail: string;
  claimantRoleDescription?: string;
  evidenceType: ClaimEvidenceType;
  evidenceReference: string;
}

export interface ReviewClaimInput {
  claimId: string;
  decision: 'APPROVE' | 'REJECT';
  reviewedByUserId: string;
  rejectionReason?: string;
}

export interface CancelClaimInput {
  claimId: string;
  userId: string;
}

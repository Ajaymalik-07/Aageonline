/**
 * AageOnline — Local Business Claim Data Source Adapter
 */

import type { BusinessClaimDataSource } from './service.ts';
import type {
  BusinessClaim,
  CancelClaimInput,
  ReviewClaimInput,
  SubmitClaimInput,
} from '../../types/business-claim.ts';
import {
  cancelBusinessClaim,
  getClaimById,
  getClaimsByBusiness,
  getClaimsByClaimant,
  reviewBusinessClaim,
  submitBusinessClaim,
} from '../../lib/claims/store.ts';

export class LocalBusinessClaimDataSource implements BusinessClaimDataSource {
  async submitClaim(input: SubmitClaimInput, claimantUserId: string): Promise<BusinessClaim> {
    return submitBusinessClaim(input, claimantUserId);
  }

  async getClaimById(claimId: string): Promise<BusinessClaim | null> {
    const claim = getClaimById(claimId);
    return claim || null;
  }

  async getClaimsByBusiness(businessId: string): Promise<BusinessClaim[]> {
    return getClaimsByBusiness(businessId);
  }

  async getClaimsByClaimant(claimantUserId: string): Promise<BusinessClaim[]> {
    return getClaimsByClaimant(claimantUserId);
  }

  async reviewClaim(input: ReviewClaimInput): Promise<BusinessClaim> {
    return reviewBusinessClaim(input);
  }

  async cancelClaim(input: CancelClaimInput): Promise<BusinessClaim> {
    return cancelBusinessClaim(input);
  }
}

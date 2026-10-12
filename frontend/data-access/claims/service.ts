/**
 * AageOnline — Business Claim Domain Service & Contract
 */

import type {
  BusinessClaim,
  CancelClaimInput,
  ReviewClaimInput,
  SubmitClaimInput,
} from '../../types/business-claim.ts';

export interface BusinessClaimDataSource {
  submitClaim(input: SubmitClaimInput, claimantUserId: string): Promise<BusinessClaim>;
  getClaimById(claimId: string): Promise<BusinessClaim | null>;
  getClaimsByBusiness(businessId: string): Promise<BusinessClaim[]>;
  getClaimsByClaimant(claimantUserId: string): Promise<BusinessClaim[]>;
  reviewClaim(input: ReviewClaimInput): Promise<BusinessClaim>;
  cancelClaim(input: CancelClaimInput): Promise<BusinessClaim>;
}

export class BusinessClaimService {
  private readonly dataSource: BusinessClaimDataSource;

  constructor(dataSource: BusinessClaimDataSource) {
    this.dataSource = dataSource;
  }

  async submitClaim(input: SubmitClaimInput, claimantUserId: string): Promise<BusinessClaim> {
    return this.dataSource.submitClaim(input, claimantUserId);
  }

  async getClaimById(claimId: string): Promise<BusinessClaim | null> {
    return this.dataSource.getClaimById(claimId);
  }

  async getClaimsByBusiness(businessId: string): Promise<BusinessClaim[]> {
    return this.dataSource.getClaimsByBusiness(businessId);
  }

  async getClaimsByClaimant(claimantUserId: string): Promise<BusinessClaim[]> {
    return this.dataSource.getClaimsByClaimant(claimantUserId);
  }

  async reviewClaim(input: ReviewClaimInput): Promise<BusinessClaim> {
    return this.dataSource.reviewClaim(input);
  }

  async cancelClaim(input: CancelClaimInput): Promise<BusinessClaim> {
    return this.dataSource.cancelClaim(input);
  }
}

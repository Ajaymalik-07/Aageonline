/**
 * AageOnline — Remote API Business Claim Data Source Adapter
 */

import type { BusinessClaimDataSource } from './service.ts';
import type {
  BusinessClaim,
  CancelClaimInput,
  ReviewClaimInput,
  SubmitClaimInput,
} from '../../types/business-claim.ts';

export class ApiBusinessClaimDataSource implements BusinessClaimDataSource {
  private readonly baseUrl: string;

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  async submitClaim(input: SubmitClaimInput, claimantUserId: string): Promise<BusinessClaim> {
    const res = await fetch(`${this.baseUrl}/api/business-claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, claimantUserId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || `Claim submission failed: ${res.statusText}`);
    }
    const data = await res.json();
    return (data as { claim: BusinessClaim }).claim;
  }

  async getClaimById(claimId: string): Promise<BusinessClaim | null> {
    const res = await fetch(`${this.baseUrl}/api/business-claims/${claimId}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to fetch claim: ${res.statusText}`);
    const data = await res.json();
    return (data as { claim: BusinessClaim }).claim;
  }

  async getClaimsByBusiness(businessId: string): Promise<BusinessClaim[]> {
    const res = await fetch(`${this.baseUrl}/api/business-claims?businessId=${encodeURIComponent(businessId)}`);
    if (!res.ok) throw new Error(`Failed to fetch claims: ${res.statusText}`);
    const data = await res.json();
    return (data as { claims: BusinessClaim[] }).claims;
  }

  async getClaimsByClaimant(claimantUserId: string): Promise<BusinessClaim[]> {
    const res = await fetch(`${this.baseUrl}/api/business-claims?claimantUserId=${encodeURIComponent(claimantUserId)}`);
    if (!res.ok) throw new Error(`Failed to fetch claims: ${res.statusText}`);
    const data = await res.json();
    return (data as { claims: BusinessClaim[] }).claims;
  }

  async reviewClaim(input: ReviewClaimInput): Promise<BusinessClaim> {
    const res = await fetch(`${this.baseUrl}/api/business-claims/${input.claimId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || `Claim review failed: ${res.statusText}`);
    }
    const data = await res.json();
    return (data as { claim: BusinessClaim }).claim;
  }

  async cancelClaim(input: CancelClaimInput): Promise<BusinessClaim> {
    const res = await fetch(`${this.baseUrl}/api/business-claims/${input.claimId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || `Claim cancellation failed: ${res.statusText}`);
    }
    const data = await res.json();
    return (data as { claim: BusinessClaim }).claim;
  }
}

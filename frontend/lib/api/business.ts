import { apiClient } from './client.ts';
import type { Business, PositionHistoryRecord, BusinessClaim } from '../../types/business';

export const businessApi = {
  /**
   * Fetches public business profile information.
   */
  async getBusiness(businessId: string): Promise<Business> {
    const res = await apiClient<Business>(`/businesses/${businessId}`, {
      next: { revalidate: 60 },
    });
    return res.data;
  },

  /**
   * Fetches auditable position history for a business.
   */
  async getPositionHistory(businessId: string): Promise<PositionHistoryRecord[]> {
    const res = await apiClient<PositionHistoryRecord[]>(`/businesses/${businessId}/position-history`, {
      cache: 'no-store',
    });
    return res.data;
  },

  /**
   * Submits a claim for an unverified or existing business.
   */
  async claimBusiness(
    businessId: string,
    payload: { claimantName: string; claimantRole: string; evidenceType: string }
  ): Promise<BusinessClaim> {
    const res = await apiClient<BusinessClaim>(`/businesses/${businessId}/claim`, {
      method: 'POST',
      body: JSON.stringify(payload),
      cache: 'no-store',
      retries: 0,
    });
    return res.data;
  },
};

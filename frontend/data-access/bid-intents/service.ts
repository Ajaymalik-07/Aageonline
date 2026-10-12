/**
 * AageOnline — Bid Intent Service & Data Source Contract
 */

import type {
  BidIntent,
  BidIntentFilter,
  CancelBidIntentInput,
  CreateBidIntentInput,
} from '../../types/bid-intent.ts';

export interface BidIntentDataSource {
  createBidIntent(input: CreateBidIntentInput, actorUserId?: string): Promise<BidIntent>;
  getBidIntentById(id: string, actorUserId?: string): Promise<BidIntent>;
  cancelBidIntent(input: CancelBidIntentInput): Promise<BidIntent>;
  getBidIntentsByBusiness(
    businessId: string,
    actorUserId?: string,
    filter?: Omit<BidIntentFilter, 'businessId'>
  ): Promise<{ intents: BidIntent[]; total: number }>;
}

export class BidIntentService {
  private readonly dataSource: BidIntentDataSource;

  constructor(dataSource: BidIntentDataSource) {
    this.dataSource = dataSource;
  }

  async createBidIntent(input: CreateBidIntentInput, actorUserId?: string): Promise<BidIntent> {
    return this.dataSource.createBidIntent(input, actorUserId);
  }

  async getBidIntentById(id: string, actorUserId?: string): Promise<BidIntent> {
    return this.dataSource.getBidIntentById(id, actorUserId);
  }

  async cancelBidIntent(input: CancelBidIntentInput): Promise<BidIntent> {
    return this.dataSource.cancelBidIntent(input);
  }

  async getBidIntentsByBusiness(
    businessId: string,
    actorUserId?: string,
    filter?: Omit<BidIntentFilter, 'businessId'>
  ): Promise<{ intents: BidIntent[]; total: number }> {
    return this.dataSource.getBidIntentsByBusiness(businessId, actorUserId, filter);
  }
}

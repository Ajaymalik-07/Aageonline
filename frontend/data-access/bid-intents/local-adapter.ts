/**
 * AageOnline — Local Bid Intent Data Source Adapter
 */

import type { BidIntentDataSource } from './service.ts';
import type {
  BidIntent,
  BidIntentFilter,
  CancelBidIntentInput,
  CreateBidIntentInput,
} from '../../types/bid-intent.ts';
import {
  cancelBidIntentAsync,
  createBidIntent,
  getBidIntentByIdAsync,
  getBidIntentsByBusinessAsync,
} from '../../lib/bid-intent/store.ts';
import { getActiveDevSession } from '../../lib/auth/store.ts';

export class LocalBidIntentDataSource implements BidIntentDataSource {
  private resolveActorUserId(actorUserId?: string): string | undefined {
    if (process.env.NODE_ENV === 'production') {
      return actorUserId;
    }
    return actorUserId || getActiveDevSession()?.userId;
  }

  async createBidIntent(input: CreateBidIntentInput, actorUserId?: string): Promise<BidIntent> {
    const actor = this.resolveActorUserId(actorUserId);
    return createBidIntent(input, actor);
  }

  async getBidIntentById(id: string, actorUserId?: string): Promise<BidIntent> {
    const actor = this.resolveActorUserId(actorUserId);
    return getBidIntentByIdAsync(id, actor);
  }

  async cancelBidIntent(input: CancelBidIntentInput): Promise<BidIntent> {
    const actor = this.resolveActorUserId(input.actorUserId);
    return cancelBidIntentAsync({
      ...input,
      actorUserId: actor || '',
    });
  }

  async getBidIntentsByBusiness(
    businessId: string,
    actorUserId?: string,
    filter?: Omit<BidIntentFilter, 'businessId'>
  ): Promise<{ intents: BidIntent[]; total: number }> {
    const actor = this.resolveActorUserId(actorUserId);
    return getBidIntentsByBusinessAsync(businessId, actor, filter);
  }
}

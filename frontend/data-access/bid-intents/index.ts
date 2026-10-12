/**
 * AageOnline — Bid Intent Data Access Module Exports
 */

import { BidIntentService } from './service.ts';
import { LocalBidIntentDataSource } from './local-adapter.ts';

export * from './service.ts';
export * from './local-adapter.ts';
export * from './api-adapter.ts';

export const bidIntentService = new BidIntentService(new LocalBidIntentDataSource());

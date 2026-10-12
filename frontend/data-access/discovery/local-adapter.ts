/**
 * AageOnline — Local Discovery Data Source Adapter
 */

import type { DiscoveryDataSource } from './service.ts';
import type { DiscoveryRequestInput, DiscoveryRequestResult } from '../types.ts';
import { recordDiscoveryRequest } from '../../lib/taxonomy/discovery.ts';

export class LocalDiscoveryDataSource implements DiscoveryDataSource {
  async submitDiscoveryRequest(input: DiscoveryRequestInput): Promise<DiscoveryRequestResult> {
    const record = recordDiscoveryRequest({
      rawInput: input.rawInput,
      requestType: input.requestType,
      cityId: input.cityId,
      categoryId: input.categoryId,
    });

    return {
      id: record.id,
      requestType: record.requestType,
      normalizedValue: record.normalizedValue,
      requestCount: record.requestCount,
      status: record.status,
      success: true,
    };
  }
}

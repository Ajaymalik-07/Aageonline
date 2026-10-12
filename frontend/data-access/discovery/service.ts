/**
 * AageOnline — Discovery Request Domain Service & Contract
 */

import type { DiscoveryRequestInput, DiscoveryRequestResult } from '../types.ts';

export interface DiscoveryDataSource {
  submitDiscoveryRequest(input: DiscoveryRequestInput): Promise<DiscoveryRequestResult>;
}

export class DiscoveryService {
  private readonly dataSource: DiscoveryDataSource;

  constructor(dataSource: DiscoveryDataSource) {
    this.dataSource = dataSource;
  }

  async submitDiscoveryRequest(input: DiscoveryRequestInput): Promise<DiscoveryRequestResult> {
    return this.dataSource.submitDiscoveryRequest(input);
  }
}

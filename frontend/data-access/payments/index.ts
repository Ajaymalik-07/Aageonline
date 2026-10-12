/**
 * AageOnline — Payment Data-Access Module
 * Exports factory and singleton paymentService instance.
 */

import { LocalPaymentDataSource } from './local-adapter.ts';
import { ApiPaymentDataSource } from './api-adapter.ts';
import { PaymentService } from './service.ts';

export * from './service.ts';
export * from './local-adapter.ts';
export * from './api-adapter.ts';

const isProductionApi = process.env.NEXT_PUBLIC_USE_REMOTE_API === 'true';

export const paymentDataSource = isProductionApi
  ? new ApiPaymentDataSource()
  : new LocalPaymentDataSource();

export const paymentService = new PaymentService(paymentDataSource);

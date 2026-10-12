/**
 * AageOnline — PayU Client Configuration & Endpoints
 * Centralizes test vs production configuration and URL resolution.
 */

export type PayUEnvironment = 'test' | 'production';

export interface PayUConfig {
  env: PayUEnvironment;
  merchantKey: string;
  merchantSalt: string;
  checkoutUrl: string;
  verifyPaymentUrl: string;
}

const DEFAULT_TEST_KEY = 'gtKFFx'; // PayU standard test key for development / integration testing
const DEFAULT_TEST_SALT = 'eCwWELxi'; // PayU standard test salt for development / integration testing

export function getPayUConfig(): PayUConfig {
  const env: PayUEnvironment =
    process.env.PAYU_ENV === 'production' ? 'production' : 'test';

  const merchantKey = process.env.PAYU_MERCHANT_KEY || DEFAULT_TEST_KEY;
  const merchantSalt = process.env.PAYU_MERCHANT_SALT || DEFAULT_TEST_SALT;

  const checkoutUrl =
    env === 'production'
      ? 'https://secure.payu.in/_payment'
      : 'https://test.payu.in/_payment';

  const verifyPaymentUrl =
    env === 'production'
      ? 'https://info.payu.in/merchant/postservice?form=2'
      : 'https://test.payu.in/merchant/postservice?form=2';

  return {
    env,
    merchantKey,
    merchantSalt,
    checkoutUrl,
    verifyPaymentUrl,
  };
}

/**
 * AageOnline — Reusable Public Data Access Layer
 *
 * Provides typed domain services and contracts decoupled from internal
 * database schemas and direct component fixtures.
 *
 * Consumption Pattern:
 *   PUBLIC UI -> Typed Data Access -> API / Domain Contract -> Backend -> Database
 */

export * from './types.ts';
export * from './markets/index.ts';
export * from './locations/index.ts';
export * from './categories/index.ts';
export * from './businesses/index.ts';
export * from './discovery/index.ts';
export * from './auth/index.ts';
export * from './claims/index.ts';
export * from './memberships/index.ts';
export * from './workspace/index.ts';
export * from './pricing/index.ts';
export * from './bid-intents/index.ts';
export * from './payments/index.ts';
export * from './ranking-settlements/index.ts';

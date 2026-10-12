/**
 * AageOnline — Categories Data Access Module
 */

import { CategoryService } from './service.ts';
import { LocalCategoryDataSource } from './local-adapter.ts';

export * from './service.ts';
export * from './local-adapter.ts';
export * from './api-adapter.ts';

export function createCategoryService(): CategoryService {
  return new CategoryService(new LocalCategoryDataSource());
}

export const categoryService = createCategoryService();

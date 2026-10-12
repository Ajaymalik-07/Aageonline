/**
 * AageOnline — Category Registry
 * Authoritative registry and services for Category taxonomy entities.
 */

import type { CategoryHierarchy } from '../../types/taxonomy';

const CATEGORIES_STORE: Map<string, CategoryHierarchy> = new Map([
  [
    'cat-interior-designers',
    {
      id: 'cat-interior-designers',
      name: 'Interior Designers',
      slug: 'interior-designers',
      description: 'Residential, commercial, and modular interior designing specialists.',
      status: 'ACTIVE',
      aliases: [
        'interior designers',
        'interior designer',
        'interior designing',
        'interior design services',
        'home interior',
      ],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  [
    'cat-restaurants',
    {
      id: 'cat-restaurants',
      name: 'Restaurants',
      slug: 'restaurants',
      description: 'Fine dining, cafes, family restaurants, and culinary venues.',
      status: 'ACTIVE',
      aliases: [
        'restaurants',
        'restaurant',
        'dining',
        'food & dining',
        'eateries',
        'restaurants & dining',
      ],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  [
    'cat-dentists',
    {
      id: 'cat-dentists',
      name: 'Dentists',
      slug: 'dentists',
      description: 'Dental clinics, orthodontic specialists, and oral healthcare practices.',
      status: 'ACTIVE',
      aliases: [
        'dentists',
        'dentist',
        'dental clinic',
        'dental clinics',
        'dental care',
        'orthodontist',
      ],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
]);

export function getAllCategories(): CategoryHierarchy[] {
  return Array.from(CATEGORIES_STORE.values());
}

export function getCategoryById(id: string): CategoryHierarchy | undefined {
  return CATEGORIES_STORE.get(id);
}

export function getCategoryBySlug(slug: string): CategoryHierarchy | undefined {
  const normalized = slug.trim().toLowerCase();
  return Array.from(CATEGORIES_STORE.values()).find((c) => c.slug === normalized);
}

export function createCategory(
  data: Omit<CategoryHierarchy, 'createdAt' | 'updatedAt'>
): CategoryHierarchy {
  const normalizedSlug = data.slug.trim().toLowerCase();

  // Check unique slug
  if (getCategoryBySlug(normalizedSlug)) {
    throw new Error(`Category with slug "${normalizedSlug}" already exists.`);
  }

  // Check duplicate name
  const existingByName = Array.from(CATEGORIES_STORE.values()).find(
    (c) => c.name.toLowerCase() === data.name.trim().toLowerCase()
  );
  if (existingByName) {
    throw new Error(`Category with name "${data.name}" already exists.`);
  }

  // Verify parentId if supplied
  if (data.parentId) {
    const parent = getCategoryById(data.parentId);
    if (!parent) {
      throw new Error(`Parent category "${data.parentId}" does not exist.`);
    }
  }

  const now = new Date().toISOString();
  const newCategory: CategoryHierarchy = {
    ...data,
    name: data.name.trim(),
    slug: normalizedSlug,
    aliases: data.aliases || [data.name.trim().toLowerCase()],
    createdAt: now,
    updatedAt: now,
  };

  CATEGORIES_STORE.set(newCategory.id, newCategory);
  return newCategory;
}

export function updateCategory(
  id: string,
  updates: Partial<Omit<CategoryHierarchy, 'id' | 'createdAt'>>
): CategoryHierarchy {
  const existing = CATEGORIES_STORE.get(id);
  if (!existing) {
    throw new Error(`Category with ID "${id}" does not exist.`);
  }

  if (updates.slug && updates.slug !== existing.slug) {
    const slugClash = getCategoryBySlug(updates.slug);
    if (slugClash && slugClash.id !== id) {
      throw new Error(`Category with slug "${updates.slug}" already exists.`);
    }
  }

  const updated: CategoryHierarchy = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  CATEGORIES_STORE.set(id, updated);
  return updated;
}

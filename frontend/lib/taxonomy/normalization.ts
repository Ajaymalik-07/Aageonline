/**
 * AageOnline — Centralized Normalization & Slug Generation
 * Handles URL-safe deterministic slug generation, string canonicalization,
 * alias mapping, and entity candidate matching.
 */

import { getAllCities } from './locations.ts';
import { getAllCategories } from './categories.ts';
import type { City, CategoryHierarchy } from '../../types/taxonomy';

/**
 * Generate a deterministic, URL-safe slug from any input string.
 */
export function generateSlug(input: string): string {
  if (!input) return '';
  return input
    .trim()
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Strip diacritics
    .replace(/&+/g, 'and') // Replace ampersands with 'and'
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
    .replace(/^-+|-+$/g, ''); // Trim leading and trailing hyphens
}

/**
 * Clean and canonicalize raw text input for comparison.
 */
export function canonicalizeText(raw: string): string {
  if (!raw) return '';
  return raw
    .trim()
    .toLowerCase()
    .replace(/[,;.]+/g, ' ') // Strip punctuation
    .replace(/\s+/g, ' ') // Collapse multiple whitespace
    .trim();
}

/**
 * Normalize location inputs (e.g., "Hisar, Haryana", "Hissar", "125001", "New Delhi").
 */
export function normalizeLocationInput(rawInput: string): {
  normalized: string;
  slug: string;
  pinCode?: string;
} {
  const cleaned = canonicalizeText(rawInput);
  const pinMatch = rawInput.match(/\b\d{6}\b/);
  const pinCode = pinMatch ? pinMatch[0] : undefined;

  // Extract base city tokens, stripping common administrative suffixes
  const stripped = cleaned
    .replace(/\b(haryana|rajasthan|delhi|maharashtra|india|city|district|state)\b/gi, '')
    .replace(/\b\d{6}\b/g, '')
    .trim();

  const primaryToken = stripped || cleaned;
  const slug = generateSlug(primaryToken);

  return {
    normalized: primaryToken,
    slug,
    pinCode,
  };
}

/**
 * Match a raw location string against canonical cities using name, slug, aliases, or PIN codes.
 */
export function findMatchingCity(rawInput: string): City | undefined {
  if (!rawInput) return undefined;

  const { normalized, slug, pinCode } = normalizeLocationInput(rawInput);
  const allCities = getAllCities();

  // 1. Direct slug match
  const bySlug = allCities.find((c) => c.slug === slug);
  if (bySlug) return bySlug;

  // 2. Direct name match (case-insensitive)
  const byName = allCities.find((c) => c.name.toLowerCase() === normalized);
  if (byName) return byName;

  // 3. Pin code match if present
  if (pinCode) {
    const byPin = allCities.find((c) => c.postalCodes?.includes(pinCode));
    if (byPin) return byPin;
  }

  // 4. Aliases match
  for (const city of allCities) {
    if (city.aliases) {
      for (const alias of city.aliases) {
        if (
          alias.toLowerCase() === normalized ||
          canonicalizeText(alias) === normalized ||
          generateSlug(alias) === slug
        ) {
          return city;
        }
      }
    }
  }

  return undefined;
}

/**
 * Normalize category inputs (e.g. "interior designer", "interior designing", "food & dining").
 */
export function normalizeCategoryInput(rawInput: string): {
  normalized: string;
  slug: string;
} {
  const cleaned = canonicalizeText(rawInput);
  const slug = generateSlug(cleaned);

  return {
    normalized: cleaned,
    slug,
  };
}

/**
 * Match a raw category string against canonical categories using name, slug, or aliases.
 */
export function findMatchingCategory(rawInput: string): CategoryHierarchy | undefined {
  if (!rawInput) return undefined;

  const { normalized, slug } = normalizeCategoryInput(rawInput);
  const allCategories = getAllCategories();

  // 1. Direct slug match
  const bySlug = allCategories.find((c) => c.slug === slug);
  if (bySlug) return bySlug;

  // 2. Direct name match (case-insensitive)
  const byName = allCategories.find((c) => c.name.toLowerCase() === normalized);
  if (byName) return byName;

  // 3. Aliases match
  for (const cat of allCategories) {
    if (cat.aliases) {
      for (const alias of cat.aliases) {
        if (
          alias.toLowerCase() === normalized ||
          canonicalizeText(alias) === normalized ||
          generateSlug(alias) === slug
        ) {
          return cat;
        }
      }
    }
  }

  return undefined;
}

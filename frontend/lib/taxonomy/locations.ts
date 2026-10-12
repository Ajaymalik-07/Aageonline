/**
 * AageOnline — Canonical Location Taxonomy
 * Authoritative registry and services for Country, State, and City entities.
 */

import type { Country, StateRegion, City } from '../../types/taxonomy';

// Canonical In-Memory Datastores (Initialized with canonical Indian hierarchy)
const COUNTRIES_STORE: Map<string, Country> = new Map([
  [
    'country-india',
    {
      id: 'country-india',
      name: 'India',
      slug: 'india',
      code: 'IN',
      status: 'ACTIVE',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
]);

const STATES_STORE: Map<string, StateRegion> = new Map([
  [
    'state-rajasthan',
    {
      id: 'state-rajasthan',
      countryId: 'country-india',
      name: 'Rajasthan',
      slug: 'rajasthan',
      code: 'RJ',
      status: 'ACTIVE',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  [
    'state-delhi',
    {
      id: 'state-delhi',
      countryId: 'country-india',
      name: 'Delhi',
      slug: 'delhi',
      code: 'DL',
      status: 'ACTIVE',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  [
    'state-maharashtra',
    {
      id: 'state-maharashtra',
      countryId: 'country-india',
      name: 'Maharashtra',
      slug: 'maharashtra',
      code: 'MH',
      status: 'ACTIVE',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  [
    'state-haryana',
    {
      id: 'state-haryana',
      countryId: 'country-india',
      name: 'Haryana',
      slug: 'haryana',
      code: 'HR',
      status: 'ACTIVE',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
]);

const CITIES_STORE: Map<string, City> = new Map([
  [
    'city-jaipur',
    {
      id: 'city-jaipur',
      countryId: 'country-india',
      stateId: 'state-rajasthan',
      name: 'Jaipur',
      slug: 'jaipur',
      postalCodes: ['302001', '302002', '302004', '302015', '302017', '302020'],
      aliases: ['jaipur', 'pink city', '302001'],
      status: 'ACTIVE',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  [
    'city-delhi',
    {
      id: 'city-delhi',
      countryId: 'country-india',
      stateId: 'state-delhi',
      name: 'Delhi',
      slug: 'delhi',
      postalCodes: ['110001', '110002', '110019', '110020', '110024', '110048'],
      aliases: ['delhi', 'new delhi', 'ncr', '110001'],
      status: 'ACTIVE',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  [
    'city-mumbai',
    {
      id: 'city-mumbai',
      countryId: 'country-india',
      stateId: 'state-maharashtra',
      name: 'Mumbai',
      slug: 'mumbai',
      postalCodes: ['400001', '400050', '400051', '400053', '400076', '400099'],
      aliases: ['mumbai', 'bombay', '400001'],
      status: 'ACTIVE',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  [
    'city-hisar',
    {
      id: 'city-hisar',
      countryId: 'country-india',
      stateId: 'state-haryana',
      name: 'Hisar',
      slug: 'hisar',
      postalCodes: ['125001', '125004', '125005'],
      aliases: ['hisar', 'hissar', 'hisar haryana', '125001'],
      status: 'ACTIVE',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
]);

// Read queries
export function getAllCountries(): Country[] {
  return Array.from(COUNTRIES_STORE.values());
}

export function getCountryById(id: string): Country | undefined {
  return COUNTRIES_STORE.get(id);
}

export function getCountryBySlug(slug: string): Country | undefined {
  const normalized = slug.trim().toLowerCase();
  return Array.from(COUNTRIES_STORE.values()).find((c) => c.slug === normalized);
}

export function getAllStates(): StateRegion[] {
  return Array.from(STATES_STORE.values());
}

export function getStateById(id: string): StateRegion | undefined {
  return STATES_STORE.get(id);
}

export function getStateBySlug(slug: string): StateRegion | undefined {
  const normalized = slug.trim().toLowerCase();
  return Array.from(STATES_STORE.values()).find((s) => s.slug === normalized);
}

export function getAllCities(): City[] {
  return Array.from(CITIES_STORE.values());
}

export function getCityById(id: string): City | undefined {
  return CITIES_STORE.get(id);
}

export function getCityBySlug(slug: string): City | undefined {
  const normalized = slug.trim().toLowerCase();
  return Array.from(CITIES_STORE.values()).find((c) => c.slug === normalized);
}

// Creation and mutation with duplicate protection
export function createState(data: Omit<StateRegion, 'createdAt' | 'updatedAt'>): StateRegion {
  const country = getCountryById(data.countryId);
  if (!country) {
    throw new Error(`Country with ID "${data.countryId}" does not exist.`);
  }

  // Check unique slug and code
  const existingBySlug = getStateBySlug(data.slug);
  if (existingBySlug) {
    throw new Error(`State with slug "${data.slug}" already exists.`);
  }

  const existingByCode = Array.from(STATES_STORE.values()).find(
    (s) => s.code.toUpperCase() === data.code.toUpperCase()
  );
  if (existingByCode) {
    throw new Error(`State with code "${data.code}" already exists.`);
  }

  const now = new Date().toISOString();
  const newState: StateRegion = {
    ...data,
    code: data.code.toUpperCase(),
    createdAt: now,
    updatedAt: now,
  };

  STATES_STORE.set(newState.id, newState);
  return newState;
}

export function createCity(data: Omit<City, 'createdAt' | 'updatedAt'>): City {
  const country = getCountryById(data.countryId);
  if (!country) {
    throw new Error(`Country with ID "${data.countryId}" does not exist.`);
  }

  const state = getStateById(data.stateId);
  if (!state) {
    throw new Error(`State with ID "${data.stateId}" does not exist.`);
  }

  if (state.countryId !== data.countryId) {
    throw new Error(`State "${data.stateId}" does not belong to Country "${data.countryId}".`);
  }

  // Check unique slug
  const existingBySlug = getCityBySlug(data.slug);
  if (existingBySlug) {
    throw new Error(`City with slug "${data.slug}" already exists.`);
  }

  // Check duplicate name inside same state
  const existingByName = Array.from(CITIES_STORE.values()).find(
    (c) => c.stateId === data.stateId && c.name.toLowerCase() === data.name.trim().toLowerCase()
  );
  if (existingByName) {
    throw new Error(`City "${data.name}" already exists in State "${state.name}".`);
  }

  const now = new Date().toISOString();
  const newCity: City = {
    ...data,
    name: data.name.trim(),
    slug: data.slug.trim().toLowerCase(),
    aliases: data.aliases || [data.name.trim().toLowerCase()],
    createdAt: now,
    updatedAt: now,
  };

  CITIES_STORE.set(newCity.id, newCity);
  return newCity;
}

export function updateCity(
  id: string,
  updates: Partial<Omit<City, 'id' | 'countryId' | 'createdAt'>>
): City {
  const existing = CITIES_STORE.get(id);
  if (!existing) {
    throw new Error(`City with ID "${id}" does not exist.`);
  }

  if (updates.slug && updates.slug !== existing.slug) {
    const slugClash = getCityBySlug(updates.slug);
    if (slugClash && slugClash.id !== id) {
      throw new Error(`City with slug "${updates.slug}" already exists.`);
    }
  }

  const updated: City = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  CITIES_STORE.set(id, updated);
  return updated;
}

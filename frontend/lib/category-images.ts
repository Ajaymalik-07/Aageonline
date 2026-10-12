export const CATEGORY_IMAGES: Record<string, string> = {
  'interior-designers': '/assets/categories/interior-designers.jpg',
  'restaurants': '/assets/categories/restaurants-dining.jpg',
  'restaurants-dining': '/assets/categories/restaurants-dining.jpg',
  'architects': '/assets/categories/commercial-architects.jpg',
  'commercial-architects': '/assets/categories/commercial-architects.jpg',
  'hospitals': '/assets/categories/hospitals-healthcare.jpg',
  'hospitals-healthcare': '/assets/categories/hospitals-healthcare.jpg',
  'wedding-photographers': '/assets/categories/wedding-photographers.jpg',
  'digital-marketing': '/assets/categories/digital-marketing.jpg',
  'digital-marketing-agencies': '/assets/categories/digital-marketing.jpg',
  'software-companies': '/assets/categories/software-development.jpg',
  'software-development': '/assets/categories/software-development.jpg',
  'real-estate-advisory': '/assets/categories/real-estate-advisory.jpg',
};

export function getCategoryImage(categorySlugOrName?: string): string {
  if (!categorySlugOrName) return '/assets/categories/interior-designers.jpg';
  const normalized = categorySlugOrName.toLowerCase().trim();

  if (CATEGORY_IMAGES[normalized]) {
    return CATEGORY_IMAGES[normalized];
  }

  if (normalized.includes('interior')) return CATEGORY_IMAGES['interior-designers'];
  if (normalized.includes('restaurant') || normalized.includes('dining')) return CATEGORY_IMAGES['restaurants'];
  if (normalized.includes('architect')) return CATEGORY_IMAGES['architects'];
  if (normalized.includes('hospital') || normalized.includes('health')) return CATEGORY_IMAGES['hospitals'];
  if (normalized.includes('wedding') || normalized.includes('photo')) return CATEGORY_IMAGES['wedding-photographers'];
  if (normalized.includes('digital') || normalized.includes('market')) return CATEGORY_IMAGES['digital-marketing'];
  if (normalized.includes('software') || normalized.includes('tech') || normalized.includes('code')) return CATEGORY_IMAGES['software-companies'];
  if (normalized.includes('estate') || normalized.includes('real')) return CATEGORY_IMAGES['real-estate-advisory'];

  return '/assets/categories/interior-designers.jpg';
}

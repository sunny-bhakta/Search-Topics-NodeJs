// Shared type definitions for the monorepo

export type CatalogMetrics = {
  popularity?: number;
  inventoryHealth?: number;
  margin?: number;
  freshnessDays?: number;
};

export type CatalogDomain = 'product' | 'category' | 'editorial';

export type Catalog = {
  id: number;
  name: string;
  description: string;
  tags: string[];
  domain?: CatalogDomain;
  category?: string;
  attributes?: Record<string, string>;
  metrics?: CatalogMetrics;
  vector?: number[];
};

export type InventorySnapshot = {
  available: number;
  reserved: number;
  backorderLimit?: number;
};

export type Product = Catalog & {
  domain: 'product';
  sku: string;
  price: number;
  currency: string;
  inventory: InventorySnapshot;
  categoryPath: string[];
  brand: string;
};

export type Category = Catalog & {
  domain: 'category';
  slug: string;
  parentId?: number;
  childIds: number[];
  path: string[];
  merchandisingPriority?: number;
};

export type EditorialEntry = Catalog & {
  domain: 'editorial';
  author: string;
  publishedAt: string;
  readingTimeMinutes: number;
  heroImageUrl?: string;
  relatedProductIds?: number[];
  featuredCategorySlugs?: string[];
};

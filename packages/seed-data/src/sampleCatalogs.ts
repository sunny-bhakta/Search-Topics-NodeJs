import { sampleCategories } from './sampleCategories';
import { sampleEditorialEntries } from './sampleEditorialEntries';
import { sampleProducts } from './sampleProducts';
import type { Catalog } from '@search/types';

export const sampleCatalogs: Catalog[] = [
  ...sampleProducts,
  ...sampleCategories,
  ...sampleEditorialEntries
];

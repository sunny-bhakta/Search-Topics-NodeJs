import type { Catalog } from '../index';
import { sampleProducts } from './sampleProducts';
import { sampleCategories } from './sampleCategories';
import { sampleEditorialEntries } from './sampleEditorialEntries';

export const sampleCatalogs: Catalog[] = [
  ...sampleProducts,
  ...sampleCategories,
  ...sampleEditorialEntries
];

export { sampleProducts, sampleCategories, sampleEditorialEntries };

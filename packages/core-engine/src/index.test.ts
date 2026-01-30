import { Catalog, RankedCatalog, searchCatalogs, searchCatalogsAdvanced } from './index';

const buildCatalog = (overrides: Partial<Catalog>): Catalog => ({
  id: 0,
  name: 'Placeholder',
  description: 'Placeholder',
  tags: [],
  ...overrides
});

describe('searchCatalogs advanced ranking', () => {
  const catalogs: Catalog[] = [
    buildCatalog({
      id: 1,
      name: 'Node Streams',
      description: 'Process streaming data',
      tags: ['nodejs', 'streams'],
      category: 'runtime',
      metrics: { popularity: 0.7, inventoryHealth: 0.9, margin: 0.4, freshnessDays: 3 },
      vector: [0.8, 0.7, 0.6]
  }),
  buildCatalog({
      id: 2,
      name: 'TypeScript Generics',
      description: 'Deep dive into advanced types',
      tags: ['typescript', 'generics'],
      category: 'language',
      metrics: { popularity: 0.9, inventoryHealth: 0.6, margin: 0.5, freshnessDays: 15 },
      vector: [0.9, 0.6, 0.4]
  }),
  buildCatalog({
      id: 3,
      name: 'Fresh Drop',
      description: 'Newly released content',
      tags: ['release'],
      category: 'announcements',
      metrics: { popularity: 0.4, inventoryHealth: 0.5, margin: 0.9, freshnessDays: 1 },
      vector: [0.5, 0.5, 0.5]
    })
  ];

  it('expands queries with synonyms and fuzzy matching', () => {
    const results = searchCatalogs('streems', catalogs);
    expect(results[0].id).toBe(1);

    const advanced = searchCatalogsAdvanced('js', catalogs);
    expect(advanced.results[0].catalog.tags).toContain('nodejs');
  });

  it('applies boosters to elevate high-margin fresh items', () => {
    const ranked = searchCatalogsAdvanced('fresh', catalogs).results;
    const freshDrop = ranked.find((entry) => entry.catalog.id === 3) as RankedCatalog;
    expect(freshDrop.breakdown.booster).toBeGreaterThan(0.5);
  });

  it('returns facets honoring pinned values', () => {
    const response = searchCatalogsAdvanced('type', catalogs, {
      faceting: [{ field: 'category', pinnedValues: ['language'] }]
    });
    expect(response.facets.category?.[0]).toMatchObject({ value: 'language', pinned: true });
  });

  it('supports custom weighting for semantic emphasis', () => {
    const semanticHeavy = searchCatalogsAdvanced('stream', catalogs, {
      lexicalWeight: 0.1,
      semanticWeight: 0.8
    });
    expect(semanticHeavy.results[0].catalog.id).toBe(1);
  });

  it('falls back to all catalogs when query empty', () => {
    expect(searchCatalogs('')).toHaveLength(3);
  });
});

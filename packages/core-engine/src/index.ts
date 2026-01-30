import { sampleCatalogs } from "@search/seed-data";
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

export type FacetBucket = {
  value: string;
  count: number;
  pinned?: boolean;
};

export type ScoreBreakdown = {
  lexical: number;
  semantic: number;
  booster: number;
};

export type RankedCatalog = {
  catalog: Catalog;
  score: number;
  breakdown: ScoreBreakdown;
};

export type SearchResponse = {
  results: RankedCatalog[];
  facets: Record<string, FacetBucket[]>;
  expansions: string[];
};

export type SearchOptions = {
  caseSensitive?: boolean;
  synonyms?: Record<string, string[]>;
  allowFuzzy?: boolean;
  lexicalWeight?: number;
  semanticWeight?: number;
  boosters?: Array<(item: Catalog) => number>;
  faceting?: {
  field: keyof Catalog | 'category' | 'tags';
    limit?: number;
    pinnedValues?: string[];
  }[];
};

/**
 * Implements: Query expansion & reformulation (synonym dictionary, fuzzy matching, spell correction)
 */
const DEFAULT_SYNONYMS: Record<string, string[]> = {
  js: ['javascript', 'node', 'nodejs'],
  ts: ['typescript'],
  testing: ['qa', 'quality'],
  stream: ['streams', 'flow'],
  jest: ['testing']
};

const DEFAULT_LEXICAL_WEIGHT = 0.6;
const DEFAULT_SEMANTIC_WEIGHT = 0.3;

const DEFAULT_BOOSTERS: Array<(item: Catalog) => number> = [
  (item) => item.metrics?.popularity ?? 0,
  (item) => (item.metrics?.inventoryHealth ?? 0) * 0.3,
  (item) => (item.metrics?.margin ?? 0) * 0.2,
  (item) => {
    const freshness = item.metrics?.freshnessDays ?? 90;
    return Math.max(0, 1 - freshness / 90) * 0.2;
  }
];

/**
 * Implements: Tokenization for lexical ranking and faceting
 */
const tokenize = (text: string, caseSensitive = false): string[] => {
  const normalized = caseSensitive ? text : text.toLowerCase();
  return normalized.split(/[^a-z0-9]+/i).filter(Boolean);
};

const dedupe = <T>(values: T[]): T[] => Array.from(new Set(values));

/**
 * Implements: Vocabulary extraction for query expansion and fuzzy matching
 */
const vocabularyFromCatalogs = (items: Catalog[]): string[] => {
  const vocab = new Set<string>();
  items.forEach((item) => {
    tokenize(`${item.name} ${item.description} ${item.tags.join(' ')}`).forEach((token) =>
      vocab.add(token)
    );
  });
  return Array.from(vocab);
};

/**
 * Implements: Levenshtein-based fuzzy expansion (spell correction)
 */
const levenshtein = (a: string, b: string): number => {
  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= b.length; j += 1) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
};

/**
 * Implements: Query expansion (synonyms, fuzzy, spell correction)
 */
const expandTokens = (
  tokens: string[],
  synonyms: Record<string, string[]>,
  vocabulary: string[],
  allowFuzzy: boolean
): string[] => {
  const expanded = new Set(tokens);

  tokens.forEach((token) => {
    const syns = synonyms[token];
    syns?.forEach((synonym) => expanded.add(synonym));
  });

  if (allowFuzzy) {
    tokens.forEach((token) => {
      vocabulary.forEach((candidate) => {
        if (levenshtein(token, candidate) === 1) {
          expanded.add(candidate);
        }
      });
    });
  }

  return Array.from(expanded.values());
};

/**
 * Implements: Lexical ranking (BM25-like, token similarity)
 */
const lexicalScore = (tokens: string[], item: Catalog, caseSensitive: boolean): number => {
  const haystack = `${item.name} ${item.description} ${item.tags.join(' ')}`;
  const normalizedHaystack = caseSensitive ? haystack : haystack.toLowerCase();
  const tf = tokens.reduce((sum, token) => sum + (normalizedHaystack.includes(token) ? 1 : 0), 0);
  return tokens.length ? tf / tokens.length : 0;
};

/**
 * Implements: Lightweight vector embedding for semantic ranking
 */
const tokenVector = (token: string): number[] => {
  const base = token.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return [
    ((base % 97) + 1) / 100,
    ((base * 3) % 89) / 100,
    ((base * 7) % 83) / 100
  ];
};

const normalizeVector = (vector: number[]): number[] => {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (!magnitude) {
    return vector;
  }
  return vector.map((value) => value / magnitude);
};

const vectorFromTokens = (tokens: string[]): number[] => {
  if (!tokens.length) {
    return [0, 0, 0];
  }
  const sums = tokens.reduce(
    (acc, token) => {
      const vec = tokenVector(token);
      return [acc[0] + vec[0], acc[1] + vec[1], acc[2] + vec[2]];
    },
    [0, 0, 0]
  );
  return normalizeVector(sums.map((value) => value / tokens.length));
};

/**
 * Implements: Cosine similarity for semantic ranking
 */
const cosineSimilarity = (a: number[], b: number[]): number => {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < length; i += 1) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (!magA || !magB) {
    return 0;
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
};

/**
 * Implements: Semantic ranking (vector similarity)
 */
const semanticScore = (queryVector: number[], item: Catalog): number => {
  const itemVector = item.vector ?? vectorFromTokens(item.tags);
  return cosineSimilarity(queryVector, normalizeVector(itemVector));
};

/**
 * Implements: Boosting rules (margin, inventory health, freshness, merchant priorities)
 */
const boosterScore = (item: Catalog, boosters: Array<(item: Catalog) => number>): number =>
  boosters.reduce((sum, booster) => sum + booster(item), 0);

/**
 * Implements: Dynamic faceting (per-category facet orders, value pinning)
 */
const buildFacets = (
  items: Catalog[],
  configs: NonNullable<SearchOptions['faceting']>
): Record<string, FacetBucket[]> => {
  const result: Record<string, FacetBucket[]> = {};
  configs.forEach((config) => {
    const counts = new Map<string, number>();
    items.forEach((item) => {
      if (config.field === 'tags') {
        item.tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1));
        return;
      }
      const value = (item[config.field as keyof Catalog] as string | undefined) ?? '';
      if (value) {
        counts.set(value, (counts.get(value) ?? 0) + 1);
      }
    });
    let buckets = Array.from(counts.entries()).map(([value, count]) => ({
      value,
      count,
      pinned: config.pinnedValues?.includes(value)
    }));
    buckets = buckets.sort((a, b) => {
      if (a.pinned && !b.pinned) {
        return -1;
      }
      if (!a.pinned && b.pinned) {
        return 1;
      }
      return b.count - a.count || a.value.localeCompare(b.value);
    });
    result[String(config.field)] = buckets.slice(0, config.limit ?? buckets.length);
  });
  return result;
};

/**
 * Implements: Hybrid lexical + semantic ranking, boosting, faceting, query expansion
 * Exposed as the main advanced search entry point
 */
export const searchCatalogsAdvanced = (
  query: string,
  catalogs: Catalog[] = sampleCatalogs,
  options: SearchOptions = {}
): SearchResponse => {
  const caseSensitive = options.caseSensitive ?? false;
  const trimmedQuery = query.trim();
  const normalizedQuery = caseSensitive ? trimmedQuery : trimmedQuery.toLowerCase();

  const synonyms = { ...DEFAULT_SYNONYMS, ...(options.synonyms ?? {}) };
  const boosters = options.boosters ?? DEFAULT_BOOSTERS;
  const lexicalWeight = options.lexicalWeight ?? DEFAULT_LEXICAL_WEIGHT;
  const semanticWeight = options.semanticWeight ?? DEFAULT_SEMANTIC_WEIGHT;
  const vocabulary = vocabularyFromCatalogs(catalogs);

  if (!normalizedQuery) {
    const fallbackResults: RankedCatalog[] = catalogs.map((item) => ({
      catalog: item,
      score: 1,
      breakdown: { lexical: 1, semantic: 0, booster: boosterScore(item, boosters) }
    }));
    const fallbackFacets = options.faceting ? buildFacets(catalogs, options.faceting) : {};
    return {
      results: fallbackResults,
      facets: fallbackFacets,
      expansions: []
    };
  }

  const baseTokens = tokenize(normalizedQuery, caseSensitive);
  const expandedTokens = expandTokens(
    baseTokens,
    synonyms,
    vocabulary,
    options.allowFuzzy ?? true
  );
  const queryVector = vectorFromTokens(expandedTokens);

  const ranked: RankedCatalog[] = catalogs
    .map((item) => {
      const lexical = lexicalScore(expandedTokens, item, caseSensitive);
      const semantic = semanticScore(queryVector, item);
      const boostersScore = boosterScore(item, boosters);
      const score = lexicalWeight * lexical + semanticWeight * semantic + boostersScore;
      return {
        catalog: item,
        score,
        breakdown: { lexical, semantic, booster: boostersScore }
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const facets = options.faceting ? buildFacets(ranked.map((entry) => entry.catalog), options.faceting) : {};

  return {
    results: ranked,
    facets,
    expansions: expandedTokens.filter((token) => !baseTokens.includes(token))
  };
};

export const searchCatalogs = (
  query: string,
  catalogs: Catalog[] = sampleCatalogs,
  options: SearchOptions = {}
): Catalog[] =>
  searchCatalogsAdvanced(query, catalogs, options).results.map((entry) => entry.catalog);

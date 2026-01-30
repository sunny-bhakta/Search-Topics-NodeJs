import { Catalog, sampleCatalogs } from '@search/core-engine';

export type Domain = 'product' | 'category' | 'editorial';

/**
 * Locale-specific overrides that can be attached to any event. These let merchandisers
 * inject localized copy and tags without duplicating the entire payload per locale.
 */
export type LocaleOverrides = {
  name?: string;
  description?: string;
  tags?: string[];
};

/**
 * Shared shape for every ingest event flowing through the pipeline.
 */
type BaseContentEvent = {
  id: number;
  domain: Domain;
  name: string;
  description: string;
  tags: string[];
  deleted?: boolean;
  localeOverrides?: Record<string, LocaleOverrides>;
  synonyms?: string[];
};

export type InventoryInfo = {
  available: number;
  backorder?: number;
};

export type ProductEvent = BaseContentEvent & {
  domain: 'product';
  priceByCurrency?: Record<string, number>;
  inventory?: InventoryInfo;
  categoryId?: number;
  categoryPath?: string[];
};

export type CategoryEvent = BaseContentEvent & {
  domain: 'category';
  parentId?: number;
  path?: string[];
};

export type EditorialEvent = BaseContentEvent & {
  domain: 'editorial';
  author?: string;
  publishedAt?: string;
  heroImageUrl?: string;
};

export type CatalogEvent = ProductEvent | CategoryEvent | EditorialEvent;

/**
 * Small abstraction around the current state of the catalog. Implementations can range from the
 * in-memory helper below to production-grade datastores.
 */
export interface CatalogRepository {
  list(): Promise<Catalog[]>;
  upsert(event: CatalogEvent): Promise<void>;
  remove(id: number): Promise<void>;
}

/**
 * Development-friendly repository that keeps all catalog items in memory. This is what the CLI and
 * sample HTTP service use when you bootstrap the workspace locally.
 *
 * Implements: Incremental indexing pipeline (listens to catalog events and updates in-memory state)
 */
export class InMemoryCatalogRepository implements CatalogRepository {
  private readonly catalogs = new Map<number, Catalog>();

  constructor(seed: Catalog[] = sampleCatalogs) {
    seed.forEach((catalog) => this.catalogs.set(catalog.id, catalog));
  }

  async list(): Promise<Catalog[]> {
    return Array.from(this.catalogs.values());
  }

  async upsert(event: CatalogEvent): Promise<void> {
    this.catalogs.set(event.id, {
      id: event.id,
      name: event.name,
      description: event.description,
      tags: event.tags
    });
  }

  async remove(id: number): Promise<void> {
    this.catalogs.delete(id);
  }
}

export const bootstrapRepository = (): CatalogRepository => new InMemoryCatalogRepository();

/**
 * Applies a batch of catalog events to the repository (and optional snapshot store). Think of it
 * as the write-model counterpart to the read-models served to search clients.
 *
 * Implements: Incremental indexing pipeline (applies events to repo and snapshot store)
 */
export const applyCatalogEvents = async (
  repo: CatalogRepository,
  events: CatalogEvent[],
  snapshotStore?: CatalogSnapshotStore
): Promise<void> => {
  for (const event of events) {
    if (event.deleted) {
      await repo.remove(event.id);
    } else {
      await repo.upsert(event);
    }

    snapshotStore?.apply(event);
  }
};

/**
 * Fully denormalized document ready to be indexed. These are derived from catalog events so the
 * search layer can support multi-locale/multi-currency queries without additional joins.
 *
 * Implements: Multi-locale and multi-currency awareness
 */
export type IndexDocument = {
  id: string;
  catalogId: number;
  domain: Domain;
  locale: string;
  currency: string;
  name: string;
  description: string;
  tags: string[];
  price: number | null;
  synonyms: string[];
  metadata: Record<string, unknown>;
};

/**
 * Mutable synonym store used by `DocumentBuilder` to expand tags/names before indexing.
 *
 * Implements: Synonym, stop-word, and stemming dictionaries (with lifecycle management)
 *
 * Example:
 * ```ts
 * const dictionary = new SynonymDictionary();
 * dictionary.add('javascript', ['js']);
 * dictionary.expand(['JavaScript']); // => ['javascript', 'js']
 * ```
 */
export class SynonymDictionary {
  private readonly entries = new Map<string, Set<string>>();

  add(term: string, synonyms: string[]): void {
    const normalizedTerm = term.toLowerCase();
    const bucket = this.entries.get(normalizedTerm) ?? new Set<string>();
    synonyms.forEach((synonym) => bucket.add(synonym.toLowerCase()));
    this.entries.set(normalizedTerm, bucket);
  }

  expand(values: string[]): string[] {
    const result = new Set<string>();
    values.forEach((value) => {
      const normalized = value.toLowerCase();
      result.add(normalized);
      const bucket = this.entries.get(normalized);
      bucket?.forEach((synonym) => result.add(synonym));
    });
    return Array.from(result.values());
  }
}

/**
 * Converts catalog events into indexable documents across locales/currencies while enriching the
 * payload with synonym-expanded tags.
 *
 * Implements: Multi-locale/multi-currency awareness, synonym enrichment
 *
 * Example:
 * ```ts
 * const builder = new DocumentBuilder(dictionary);
 * const docs = builder.build(catalogEvent, ['en-US'], ['USD']);
 * // docs now includes `${event.id}:en-US:USD` with localized copy + synonyms
 * ```
 */
export class DocumentBuilder {
  constructor(private readonly dictionary: SynonymDictionary = new SynonymDictionary()) {}

  build(event: CatalogEvent, locales: string[], currencies: string[]): IndexDocument[] {
    if (event.deleted) {
      return [];
    }

    const documents: IndexDocument[] = [];
    const synonyms = this.dictionary.expand([event.name, ...event.tags, ...(event.synonyms ?? [])]);
    const metadata = getMetadataForEvent(event);

    locales.forEach((locale) => {
      const overrides = event.localeOverrides?.[locale];
      const localizedName = overrides?.name ?? event.name;
      const localizedDescription = overrides?.description ?? event.description;
      const localizedTags = overrides?.tags ?? event.tags;

      currencies.forEach((currency) => {
        documents.push({
          id: `${event.id}:${locale}:${currency}`,
          catalogId: event.id,
          domain: event.domain,
          locale,
          currency,
          name: localizedName,
          description: localizedDescription,
          tags: localizedTags,
          price: getPriceForCurrency(event, currency),
          synonyms,
          metadata
        });
      });
    });

    return documents;
  }
}

const getPriceForCurrency = (event: CatalogEvent, currency: string): number | null => {
  if (event.domain === 'product') {
    return event.priceByCurrency?.[currency] ?? null;
  }
  return null;
};

const getMetadataForEvent = (event: CatalogEvent): Record<string, unknown> => {
  if (event.domain === 'product') {
    return {
      categoryId: event.categoryId ?? null,
      categoryPath: event.categoryPath ?? [],
      inventoryAvailable: event.inventory?.available ?? null,
      inventoryBackorder: event.inventory?.backorder ?? null
    };
  }

  if (event.domain === 'category') {
    return {
      parentId: event.parentId ?? null,
      path: event.path ?? []
    };
  }

  return {
    author: event.author ?? null,
    publishedAt: event.publishedAt ?? null,
    heroImageUrl: event.heroImageUrl ?? null
  };
};

/**
 * Contract implemented by whatever persistence layer ultimately serves search queries. A
 * production deployment might map these methods to Algolia, Elasticsearch, or a custom engine.
 *
 * Implements: IndexWriter contract for full reindex workflow (begin, write, finalize, rollback)
 *
 * Example:
 * ```ts
 * const writer: IndexWriter = new InMemoryIndexWriter();
 * await writer.beginFullReindex();
 * await writer.writeBatch(docs);
 * await writer.finalizeFullReindex();
 * ```
 */
export interface IndexWriter {
  beginFullReindex(): Promise<void>;
  writeBatch(documents: IndexDocument[]): Promise<void>;
  finalizeFullReindex(): Promise<void>;
  rollbackFullReindex(): Promise<void>;
  replaceCatalogDocuments(catalogId: number, documents: IndexDocument[]): Promise<void>;
  deleteCatalog(catalogId: number): Promise<void>;
}

/**
 * Lightweight index writer that keeps documents in memory. Handy for tests or the local CLI;
 * not intended for production use but mirrors the sequencing of a real index writer.
 *
 * Implements: Full reindex workflow (begin, write, finalize, rollback), supports local testing
 *
 * Example:
 * ```ts
 * const writer = new InMemoryIndexWriter();
 * await writer.replaceCatalogDocuments(42, docs);
 * console.log(writer.snapshot());
 * ```
 */
export class InMemoryIndexWriter implements IndexWriter {
  private readonly liveDocuments = new Map<number, IndexDocument[]>();
  private stagingDocuments = new Map<number, IndexDocument[]>();
  private reindexing = false;

  async beginFullReindex(): Promise<void> {
    this.reindexing = true;
    this.stagingDocuments = new Map();
  }

  async writeBatch(documents: IndexDocument[]): Promise<void> {
    const target = this.reindexing ? this.stagingDocuments : this.liveDocuments;
    documents.forEach((doc) => {
      const bucket = target.get(doc.catalogId) ?? [];
      const filtered = bucket.filter((existing) => existing.id !== doc.id);
      target.set(doc.catalogId, [...filtered, doc]);
    });
  }

  async finalizeFullReindex(): Promise<void> {
    if (this.reindexing) {
      this.liveDocuments.clear();
      this.stagingDocuments.forEach((value, key) => this.liveDocuments.set(key, value));
      this.reindexing = false;
    }
  }

  async rollbackFullReindex(): Promise<void> {
    this.reindexing = false;
    this.stagingDocuments.clear();
  }

  async replaceCatalogDocuments(catalogId: number, documents: IndexDocument[]): Promise<void> {
    this.liveDocuments.set(catalogId, documents);
  }

  async deleteCatalog(catalogId: number): Promise<void> {
    this.liveDocuments.delete(catalogId);
  }

  snapshot(): IndexDocument[] {
    return Array.from(this.liveDocuments.values()).flat();
  }
}

/**
 * Captures the latest non-deleted catalog event for every catalog item. Reindex jobs iterate this
 * snapshot to rebuild indexes without replaying the entire event history.
 *
 * Implements: CatalogSnapshotStore for full reindex snapshotting
 *
 * Example:
 * ```ts
 * const store = new CatalogSnapshotStore();
 * events.forEach((event) => store.apply(event));
 * const snapshot = store.snapshot();
 * ```
 */
export class CatalogSnapshotStore {
  private readonly snapshots = new Map<number, CatalogEvent>();

  apply(event: CatalogEvent): void {
    if (event.deleted) {
      this.snapshots.delete(event.id);
    } else {
      this.snapshots.set(event.id, event);
    }
  }

  snapshot(): CatalogEvent[] {
    return Array.from(this.snapshots.values());
  }

  size(): number {
    return this.snapshots.size;
  }
}

type Listener = (event: CatalogEvent) => Promise<void> | void;

/**
 * Simple pub/sub bus so multiple projections (repository, index writer, analytics, etc.) can
 * react to the same stream of catalog events.
 *
 * Implements: Event bus for incremental indexing pipeline
 *
 * Example:
 * ```ts
 * const bus = new CatalogEventBus();
 * bus.subscribe((event) => console.log('saw event', event.id));
 * await bus.publish(catalogEvent);
 * ```
 */
export class CatalogEventBus {
  private readonly listeners = new Set<Listener>();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async publish(event: CatalogEvent): Promise<void> {
    for (const listener of this.listeners) {
      await listener(event);
    }
  }

  async publishBatch(events: CatalogEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
}

export type ReindexState = 'idle' | 'running' | 'paused' | 'completed' | 'failed';

export type ReindexStatus = {
  state: ReindexState;
  processed: number;
  total: number;
  error?: string;
};

/**
 * Coordinates a full rebuild of the search index by iterating the snapshot store in batches and
 * writing the resulting documents through the provided writer.
 *
 * Implements: Full reindex workflow with pause/resume/rollback
 *
 * Example:
 * ```ts
 * const job = new ReindexJob(store, builder, writer, ['en-US'], ['USD']);
 * await job.start(100);
 * console.log(job.status());
 * ```
 */
export class ReindexJob {
  private state: ReindexState = 'idle';
  private processed = 0;
  private error?: Error;
  private batchSize = 50;

  constructor(
    private readonly snapshotStore: CatalogSnapshotStore,
    private readonly builder: DocumentBuilder,
    private readonly writer: IndexWriter,
    private readonly locales: string[],
    private readonly currencies: string[]
  ) {}

  status(): ReindexStatus {
    return {
      state: this.state,
      processed: this.processed,
      total: this.snapshotStore.size(),
      error: this.error?.message
    };
  }

  async start(batchSize = 50): Promise<void> {
    if (this.state === 'running') {
      return;
    }

    this.batchSize = batchSize;
    if (this.state === 'idle' || this.state === 'failed' || this.state === 'completed') {
      this.processed = 0;
      this.error = undefined;
      await this.writer.beginFullReindex();
    }

    this.state = 'running';
    await this.processLoop();
  }

  pause(): void {
    if (this.state === 'running') {
      this.state = 'paused';
    }
  }

  async resume(): Promise<void> {
    if (this.state !== 'paused') {
      return;
    }
    this.state = 'running';
    await this.processLoop();
  }

  private async processLoop(): Promise<void> {
    const events = this.snapshotStore.snapshot();

    try {
      while (this.processed < events.length && this.state === 'running') {
        const slice = events.slice(this.processed, this.processed + this.batchSize);
        const documents = slice.flatMap((event) =>
          this.builder.build(event, this.locales, this.currencies)
        );
        await this.writer.writeBatch(documents);
        this.processed += slice.length;
      }

      if (this.processed >= events.length && this.state === 'running') {
        await this.writer.finalizeFullReindex();
        this.state = 'completed';
      }
    } catch (error) {
      this.error = error as Error;
      this.state = 'failed';
      await this.writer.rollbackFullReindex();
      throw error;
    }
  }
}

/**
 * Factory that returns a per-event handler suitable for wiring straight into an event bus. Each
 * event either deletes a catalog item from the index or rebuilds its documents in place.
 *
 * Implements: createIncrementalProcessor for incremental indexing pipeline
 *
 * Example:
 * ```ts
 * const processor = createIncrementalProcessor(writer, builder, ['en-US'], ['USD']);
 * await processor(catalogEvent);
 * ```
 */
export const createIncrementalProcessor = (
  writer: IndexWriter,
  builder: DocumentBuilder,
  locales: string[],
  currencies: string[]
) =>
  async (event: CatalogEvent): Promise<void> => {
    if (event.deleted) {
      await writer.deleteCatalog(event.id);
      return;
    }

    const documents = builder.build(event, locales, currencies);
    await writer.replaceCatalogDocuments(event.id, documents);
  };

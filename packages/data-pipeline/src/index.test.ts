import {
  applyCatalogEvents,
  bootstrapRepository,
  CatalogEvent,
  CatalogEventBus,
  CatalogSnapshotStore,
  createIncrementalProcessor,
  DocumentBuilder,
  InMemoryIndexWriter,
  IndexDocument,
  ReindexJob,
  SynonymDictionary
} from './index';

const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('data-pipeline repository', () => {
  it('applies catalog events to the repository', async () => {
    const repo = bootstrapRepository();
    const events: CatalogEvent[] = [
      { id: 101, domain: 'product', name: 'New Catalog Item', description: 'Fresh drop', tags: ['new'], priceByCurrency: { USD: 10 } },
      { id: 1, domain: 'category', name: 'Patched Name', description: 'Updated', tags: ['patched'] },
      { id: 2, domain: 'editorial', name: 'Delete Me', description: 'Bye', tags: [], deleted: true }
    ];

    await applyCatalogEvents(repo, events);

    const catalogs = await repo.list();

    expect(catalogs.find((item) => item.id === 101)).toMatchObject({ name: 'New Catalog Item' });
    expect(catalogs.find((item) => item.id === 1)).toMatchObject({ name: 'Patched Name' });
    expect(catalogs.find((item) => item.id === 2)).toBeUndefined();
  });
});

describe('DocumentBuilder', () => {
  it('produces locale + currency aware documents with synonyms', () => {
    const dictionary = new SynonymDictionary();
    dictionary.add('dress', ['gown']);
    const builder = new DocumentBuilder(dictionary);
    const event: CatalogEvent = {
      id: 42,
      domain: 'product',
      name: 'Dress',
      description: 'Nice outfit',
      tags: ['fashion'],
      localeOverrides: {
        'fr-FR': { name: 'Robe', description: 'Tenue', tags: ['mode'] }
      },
      priceByCurrency: { USD: 120, EUR: 99 },
      inventory: { available: 12 }
    };

    const docs = builder.build(event, ['en-US', 'fr-FR'], ['USD', 'EUR']);

    expect(docs).toHaveLength(4);
    expect(docs.find((doc) => doc.locale === 'fr-FR' && doc.currency === 'EUR')).toMatchObject({
      name: 'Robe',
      price: 99,
      tags: ['mode']
    });
    const synonyms = docs[0].synonyms;
    expect(synonyms).toContain('dress');
    expect(synonyms).toContain('gown');
    expect(docs[0]).toMatchObject({ domain: 'product', metadata: { inventoryAvailable: 12 } });
  });

  it('enriches editorial entries with descriptive metadata', () => {
    const builder = new DocumentBuilder();
    const doc = builder.build(
      {
        id: 7,
        domain: 'editorial',
        name: 'Holiday Guide',
        description: 'Editorial planning',
        tags: ['guide'],
        author: 'Content Team',
        publishedAt: '2025-10-01T00:00:00Z'
      },
      ['en-US'],
      ['USD']
    )[0];

    expect(doc.metadata).toMatchObject({ author: 'Content Team', publishedAt: '2025-10-01T00:00:00Z' });
    expect(doc.domain).toBe('editorial');
  });
});

describe('CatalogEventBus + incremental processor', () => {
  it('routes events to processor and updates writer', async () => {
    const bus = new CatalogEventBus();
    const writer = new InMemoryIndexWriter();
    const processor = createIncrementalProcessor(
      writer,
      new DocumentBuilder(),
      ['en-US'],
      ['USD']
    );
    bus.subscribe(processor);

    await bus.publish({ id: 1, domain: 'product', name: 'Node', description: 'Runtime', tags: ['node'] });
    await bus.publish({ id: 1, domain: 'product', name: 'Node.js', description: 'Runtime', tags: ['node'] });
    await bus.publish({ id: 1, domain: 'product', name: 'Node.js', description: 'Runtime', tags: ['node'], deleted: true });

    expect(writer.snapshot()).toHaveLength(0);
  });
});

describe('ReindexJob', () => {
  it('runs, pauses, and resumes a reindex', async () => {
    const snapshot = new CatalogSnapshotStore();
    snapshot.apply({ id: 1, domain: 'category', name: 'Node', description: 'Runtime', tags: ['node'] });
    snapshot.apply({ id: 2, domain: 'editorial', name: 'React', description: 'UI', tags: ['react'] });

    class ControlledWriter extends InMemoryIndexWriter {
      private pendingResolvers: Array<() => void> = [];
      async writeBatch(documents: IndexDocument[]) {
        await super.writeBatch(documents);
        await new Promise<void>((resolve) => {
          this.pendingResolvers.push(resolve);
        });
      }

      release() {
        const resolver = this.pendingResolvers.shift();
        resolver?.();
      }
    }

    const writer = new ControlledWriter();
    const job = new ReindexJob(
      snapshot,
      new DocumentBuilder(),
      writer,
      ['en-US'],
      ['USD']
    );

    const startPromise = job.start(1);
    await flush();
    job.pause();
    writer.release();
    await startPromise;

    expect(job.status().state).toBe('paused');

    const resumePromise = job.resume();
    await flush();
    writer.release();
    await resumePromise;

    expect(job.status().state).toBe('completed');
    expect(writer.snapshot()).toHaveLength(2);
  });
});

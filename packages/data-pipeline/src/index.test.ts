import { applyCatalogEvents, bootstrapRepository, CatalogEvent } from './index';

describe('data-pipeline repository', () => {
  it('applies catalog events to the repository', async () => {
    const repo = bootstrapRepository();
    const events: CatalogEvent[] = [
      { id: 101, name: 'New Topic', description: 'Fresh drop', tags: ['new'] },
      { id: 1, name: 'Patched Name', description: 'Updated', tags: ['patched'] },
      { id: 2, name: 'Delete Me', description: 'Bye', tags: [], deleted: true }
    ];

    await applyCatalogEvents(repo, events);

    const topics = await repo.list();

    expect(topics.find((topic) => topic.id === 101)).toMatchObject({ name: 'New Topic' });
    expect(topics.find((topic) => topic.id === 1)).toMatchObject({ name: 'Patched Name' });
    expect(topics.find((topic) => topic.id === 2)).toBeUndefined();
  });
});

import { Topic, sampleTopics } from '@search/core-engine';

export type CatalogEvent = {
  id: number;
  name: string;
  description: string;
  tags: string[];
  deleted?: boolean;
};

export interface TopicRepository {
  list(): Promise<Topic[]>;
  upsert(event: CatalogEvent): Promise<void>;
  remove(id: number): Promise<void>;
}

export class InMemoryTopicRepository implements TopicRepository {
  private readonly topics = new Map<number, Topic>();

  constructor(seed: Topic[] = sampleTopics) {
    seed.forEach((topic) => this.topics.set(topic.id, topic));
  }

  async list(): Promise<Topic[]> {
    return Array.from(this.topics.values());
  }

  async upsert(event: CatalogEvent): Promise<void> {
    this.topics.set(event.id, {
      id: event.id,
      name: event.name,
      description: event.description,
      tags: event.tags
    });
  }

  async remove(id: number): Promise<void> {
    this.topics.delete(id);
  }
}

export const applyCatalogEvents = async (
  repo: TopicRepository,
  events: CatalogEvent[]
): Promise<void> => {
  for (const event of events) {
    if (event.deleted) {
      await repo.remove(event.id);
      continue;
    }

    await repo.upsert(event);
  }
};

export const bootstrapRepository = (): TopicRepository => new InMemoryTopicRepository();

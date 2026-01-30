import request from 'supertest';
import { createServer } from './server';
import type { CatalogRepository } from '@search/data-pipeline';

const mockRepository: CatalogRepository = {
  list: async () => [
    { id: 1, name: 'Node Search', description: 'Node', tags: ['node'] },
    { id: 2, name: 'React Search', description: 'React', tags: ['react'] }
  ],
  upsert: async () => undefined,
  remove: async () => undefined
};

describe('search-service server', () => {
  it('returns search results', async () => {
    const server = createServer({ repository: mockRepository, baseUrl: 'http://localhost' });

    const response = await request(server).get('/search').query({ q: 'react' });

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.items[0]).toMatchObject({ title: 'React Search' });
    expect(response.body.facets).toBeDefined();
    expect(Array.isArray(response.body.expansions)).toBe(true);
  });
});

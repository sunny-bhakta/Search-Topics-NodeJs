import { createHttpHandlers, createSearchController } from './index';

const mockRepository = {
  list: jest.fn(async () => [
    { id: 1, name: 'Node Search', description: 'Node', tags: ['node'] },
    { id: 2, name: 'React Search', description: 'React', tags: ['react'] }
  ]),
  upsert: jest.fn(async () => undefined),
  remove: jest.fn(async () => undefined)
};

describe('api-gateway controller', () => {
  it('produces search payloads', async () => {
    const controller = createSearchController({ repository: mockRepository });
    const handlers = createHttpHandlers(controller);

    const payload = await handlers.searchHandler('react');

    expect(payload.total).toBe(1);
    expect(payload.items[0]).toMatchObject({ title: 'React Search' });
  });
});

import { searchTopics, sampleTopics, Topic } from './index';

describe('searchTopics', () => {
  const data: Topic[] = [
    { id: 1, name: 'Node Basics', description: 'Learn Node.js runtime', tags: ['node'] },
    {
      id: 2,
      name: 'Advanced TypeScript',
      description: 'Deep dive into generics',
      tags: ['typescript', 'generics']
    }
  ];

  it('returns all topics when query is empty', () => {
    expect(searchTopics('', data)).toHaveLength(2);
  });

  it('matches on name, description, and tags', () => {
    expect(searchTopics('node', data)).toEqual([data[0]]);
    expect(searchTopics('generics', data)).toEqual([data[1]]);
  });

  it('is case insensitive by default and trims whitespace', () => {
    expect(searchTopics('  NODE  ', data)).toEqual([data[0]]);
  });

  it('respects caseSensitive option', () => {
    expect(searchTopics('node', data, { caseSensitive: true })).toHaveLength(0);
    expect(searchTopics('Node', data, { caseSensitive: true })).toEqual([data[0]]);
  });

  it('falls back to sampleTopics when dataset not provided', () => {
    expect(searchTopics('jest')).toEqual([sampleTopics[2]]);
  });
});

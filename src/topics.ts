export type Topic = {
  id: number;
  name: string;
  description: string;
  tags: string[];
};

export const sampleTopics: Topic[] = [
  {
    id: 1,
    name: 'TypeScript Basics',
    description: 'Understand types, interfaces, and generics in TypeScript.',
    tags: ['typescript', 'basics', 'types']
  },
  {
    id: 2,
    name: 'Node.js Streams',
    description: 'Work efficiently with Node.js streaming APIs for data processing.',
    tags: ['nodejs', 'streams']
  },
  {
    id: 3,
    name: 'Testing with Jest',
    description: 'Write unit and integration tests using Jest and ts-jest.',
    tags: ['testing', 'jest', 'typescript']
  }
];

export const searchTopics = (query: string, topics: Topic[] = sampleTopics): Topic[] => {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return topics;
  }

  return topics.filter((topic) => {
    const haystack = `${topic.name} ${topic.description} ${topic.tags.join(' ')}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });
};

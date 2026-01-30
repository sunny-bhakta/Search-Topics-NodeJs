import type { EditorialEntry } from '@search/types/src/catalogTypes';

export const sampleEditorialEntries: EditorialEntry[] = [
  {
    id: 3001,
    domain: 'editorial',
    name: 'Scaling Search for Flash Sales',
    description: 'Playbook for keeping relevance high during 10x traffic spikes.',
    tags: ['guide', 'search', 'flash-sale'],
    category: 'editorial',
    attributes: { format: 'case-study' },
    metrics: { popularity: 0.61, inventoryHealth: 0.0, margin: 0.0, freshnessDays: 4 },
    vector: [0.55, 0.47, 0.59],
    author: 'Lena Torres',
    publishedAt: '2025-11-18T09:00:00.000Z',
    readingTimeMinutes: 7,
    heroImageUrl: 'https://cdn.example.com/editorial/flash-sales.png',
    relatedProductIds: [1003],
    featuredCategorySlugs: ['runtime-platforms']
  },
  {
    id: 3002,
    domain: 'editorial',
    name: 'Composable Commerce Starter',
    description: 'Editorial walkthrough that pairs must-have APIs with merch tactics.',
    tags: ['composable', 'guide'],
    category: 'editorial',
    attributes: { format: 'long-form' },
    metrics: { popularity: 0.58, inventoryHealth: 0.0, margin: 0.0, freshnessDays: 15 },
    vector: [0.52, 0.44, 0.6],
    author: 'Miguel Avery',
    publishedAt: '2025-10-02T15:30:00.000Z',
    readingTimeMinutes: 9,
    heroImageUrl: 'https://cdn.example.com/editorial/composable.png',
    relatedProductIds: [1002],
    featuredCategorySlugs: ['frontend-experience']
  },
  {
    id: 3003,
    domain: 'editorial',
    name: 'Merchandising with Generative AI',
    description: 'How editorial teams blend AI copy with curated brand guardrails.',
    tags: ['ai', 'editorial'],
    category: 'editorial',
    attributes: { format: 'interview' },
    metrics: { popularity: 0.64, inventoryHealth: 0.0, margin: 0.0, freshnessDays: 1 },
    vector: [0.57, 0.5, 0.63],
    author: 'Rina Patel',
    publishedAt: '2026-01-22T11:00:00.000Z',
    readingTimeMinutes: 6,
    heroImageUrl: 'https://cdn.example.com/editorial/genai.png',
    relatedProductIds: [1001],
    featuredCategorySlugs: ['runtime-platforms', 'frontend-experience']
  }
];

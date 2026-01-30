import type { Category } from '@search/types/src/catalogTypes';

export const sampleCategories: Category[] = [
  {
    id: 2001,
    domain: 'category',
    name: 'Runtime & Platforms',
    description: 'Languages, runtimes, and compute surfaces for modern commerce.',
    tags: ['runtime', 'platforms'],
    category: 'navigation',
    attributes: { depth: '1' },
    metrics: { popularity: 0.81, inventoryHealth: 0.9, margin: 0.3, freshnessDays: 12 },
    vector: [0.66, 0.58, 0.47],
    slug: 'runtime-platforms',
    childIds: [2002, 2003],
    path: ['runtime-platforms'],
    merchandisingPriority: 0.84
  },
  {
    id: 2002,
    domain: 'category',
    name: 'Node.js & Edge',
    description: 'Edge runtimes, streaming primitives, and observability for Node.js.',
    tags: ['nodejs', 'edge'],
    category: 'navigation',
    attributes: { depth: '2' },
    metrics: { popularity: 0.77, inventoryHealth: 0.88, margin: 0.28, freshnessDays: 8 },
    vector: [0.7, 0.6, 0.52],
    slug: 'node-edge',
    parentId: 2001,
    childIds: [],
    path: ['runtime-platforms', 'node-edge'],
    merchandisingPriority: 0.9
  },
  {
    id: 2003,
    domain: 'category',
    name: 'Frontend Experience',
    description: 'Design systems, rendering strategies, and UX accelerators.',
    tags: ['frontend', 'ux'],
    category: 'navigation',
    attributes: { depth: '2' },
    metrics: { popularity: 0.69, inventoryHealth: 0.73, margin: 0.25, freshnessDays: 20 },
    vector: [0.61, 0.56, 0.44],
    slug: 'frontend-experience',
    parentId: 2001,
    childIds: [],
    path: ['runtime-platforms', 'frontend-experience'],
    merchandisingPriority: 0.72
  }
];

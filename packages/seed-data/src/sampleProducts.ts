import type { Product } from '@search/types/src/catalogTypes';

export const sampleProducts: Product[] = [
  {
    id: 1001,
    domain: 'product',
    name: 'Pro Node Hoodie',
    description: 'Soft fleece hoodie built for late-night debugging sessions.',
    tags: ['apparel', 'nodejs', 'merch'],
    category: 'merchandise',
    attributes: { material: 'cotton blend', fit: 'unisex', color: 'charcoal' },
    metrics: { popularity: 0.92, inventoryHealth: 0.78, margin: 0.45, freshnessDays: 18 },
    vector: [0.78, 0.62, 0.41],
    sku: 'HOOD-NODE-001',
    price: 79,
    currency: 'USD',
    inventory: { available: 140, reserved: 12 },
    categoryPath: ['apparel', 'hoodies'],
    brand: 'CodeThreads'
  },
  {
    id: 1002,
    domain: 'product',
    name: 'TypeScript Studio License',
    description: 'Annual subscription that bundles advanced TypeScript tooling and priority support.',
    tags: ['software', 'typescript', 'productivity'],
    category: 'software',
    attributes: { delivery: 'digital', seatCount: 'single' },
    metrics: { popularity: 0.88, inventoryHealth: 0.98, margin: 0.72, freshnessDays: 6 },
    vector: [0.84, 0.59, 0.66],
    sku: 'TS-STUDIO-ANNUAL',
    price: 299,
    currency: 'USD',
    inventory: { available: 10000, reserved: 0, backorderLimit: 0 },
    categoryPath: ['software', 'developer-tools'],
    brand: 'DevFlow'
  },
  {
    id: 1003,
    domain: 'product',
    name: 'Edge Deploy Toolkit',
    description: 'Hardware starter kit plus playbook for rolling out edge functions worldwide.',
    tags: ['edge', 'hardware', 'starter-kit'],
    category: 'infrastructure',
    attributes: { includes: 'gateway, sensors, cables' },
    metrics: { popularity: 0.74, inventoryHealth: 0.52, margin: 0.38, freshnessDays: 42 },
    vector: [0.71, 0.49, 0.57],
    sku: 'EDGE-KIT-START',
    price: 1249,
    currency: 'USD',
    inventory: { available: 38, reserved: 7 },
    categoryPath: ['hardware', 'edge'],
    brand: 'Northwind Devices'
  }
];

import { buildAutocompleteOptions, formatSearchResults } from './index';

const topics = [
  { id: 1, name: 'Node Basics', description: 'Intro', tags: ['node'] },
  { id: 2, name: 'React Search', description: 'UI', tags: ['react'] },
  { id: 3, name: 'Rust Search', description: 'Fast', tags: ['rust'] }
];

describe('ux-experience helpers', () => {
  it('formats results for UI consumption', () => {
    const formatted = formatSearchResults(topics as any);
    expect(formatted[0]).toMatchObject({ title: 'Node Basics', snippet: 'Intro' });
  });

  it('builds autocomplete suggestions', () => {
    const suggestions = buildAutocompleteOptions('re', topics as any);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]).toMatchObject({ label: 'React Search' });
  });
});

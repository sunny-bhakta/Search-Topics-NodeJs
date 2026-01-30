import { Catalog } from '@search/core-engine';

export type SearchResultView = {
  id: number;
  title: string;
  snippet: string;
  tags: string[];
};

export type Suggestion = {
  label: string;
  value: number;
};

export const formatSearchResults = (catalogs: Catalog[]): SearchResultView[] =>
  catalogs.map((item) => ({
    id: item.id,
    title: item.name,
    snippet: item.description,
    tags: item.tags
  }));

export const buildAutocompleteOptions = (query: string, catalogs: Catalog[]): Suggestion[] => {
  if (!query) {
    return catalogs.slice(0, 5).map((item) => ({ label: item.name, value: item.id }));
  }

  const normalized = query.toLowerCase();

  return catalogs
    .filter((item) => item.name.toLowerCase().includes(normalized))
    .slice(0, 5)
    .map((item) => ({ label: item.name, value: item.id }));
};

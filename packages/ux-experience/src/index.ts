import { Topic } from '@search/core-engine';

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

export const formatSearchResults = (topics: Topic[]): SearchResultView[] =>
  topics.map((topic) => ({
    id: topic.id,
    title: topic.name,
    snippet: topic.description,
    tags: topic.tags
  }));

export const buildAutocompleteOptions = (query: string, topics: Topic[]): Suggestion[] => {
  if (!query) {
    return topics.slice(0, 5).map((topic) => ({ label: topic.name, value: topic.id }));
  }

  const normalized = query.toLowerCase();

  return topics
    .filter((topic) => topic.name.toLowerCase().includes(normalized))
    .slice(0, 5)
    .map((topic) => ({ label: topic.name, value: topic.id }));
};

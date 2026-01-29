import { searchTopics, Topic } from '@search/core-engine';
import { TopicRepository } from '@search/data-pipeline';
import { buildAutocompleteOptions, formatSearchResults, Suggestion } from '@search/ux-experience';

export type SearchController = {
  search(query: string): Promise<{ query: string; results: Topic[]; total: number }>;
  autocomplete(query: string): Promise<Suggestion[]>;
};

export type ControllerDeps = {
  repository: TopicRepository;
};

export const createSearchController = ({ repository }: ControllerDeps): SearchController => ({
  async search(query: string) {
    const topics = await repository.list();
    const matched = searchTopics(query, topics);

    return {
      query,
      results: matched,
      total: matched.length
    };
  },
  async autocomplete(query: string) {
    const topics = await repository.list();
    return buildAutocompleteOptions(query, topics);
  }
});

export type HttpHandler<TRes> = (body: unknown) => Promise<TRes>;

export const createHttpHandlers = (controller: SearchController) => ({
  searchHandler: async (query: string) => {
    const { results, total } = await controller.search(query);
    return {
      total,
      items: formatSearchResults(results)
    };
  },
  autocompleteHandler: async (query: string) => controller.autocomplete(query)
});

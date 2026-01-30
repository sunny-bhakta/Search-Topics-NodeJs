import { Catalog, FacetBucket, RankedCatalog, searchCatalogsAdvanced } from '@search/core-engine';
import { CatalogRepository } from '@search/data-pipeline';
import { buildAutocompleteOptions, formatSearchResults, Suggestion } from '@search/ux-experience';

export type SearchResultsPayload = {
  query: string;
  results: Catalog[];
  ranked: RankedCatalog[];
  total: number;
  facets: Record<string, FacetBucket[]>;
  expansions: string[];
};

export type SearchController = {
  search(query: string): Promise<SearchResultsPayload>;
  autocomplete(query: string): Promise<Suggestion[]>;
};

export type ControllerDeps = {
  repository: CatalogRepository;
};

export const createSearchController = ({ repository }: ControllerDeps): SearchController => ({
  async search(query: string) {
    const catalogs = await repository.list();
    const response = searchCatalogsAdvanced(query, catalogs, {
      faceting: [{ field: 'category', limit: 5, pinnedValues: ['language', 'runtime'] }]
    });

    return {
      query,
      results: response.results.map((entry) => entry.catalog),
      ranked: response.results,
      total: response.results.length,
      facets: response.facets,
      expansions: response.expansions
    };
  },
  async autocomplete(query: string) {
    const catalogs = await repository.list();
    return buildAutocompleteOptions(query, catalogs);
  }
});

export type HttpHandler<TRes> = (body: unknown) => Promise<TRes>;

export const createHttpHandlers = (controller: SearchController) => ({
  searchHandler: async (query: string) => {
    const { results, total, facets, expansions } = await controller.search(query);
    return {
      total,
      items: formatSearchResults(results),
      facets,
      expansions
    };
  },
  autocompleteHandler: async (query: string) => controller.autocomplete(query)
});

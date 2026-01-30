#!/usr/bin/env node
import { bootstrapRepository } from '@search/data-pipeline';
import { createHttpHandlers, createSearchController } from '@search/api-gateway';

const printUsage = () => {
  console.log('Usage: search-cli <query>');
  console.log('Add --suggest to see autocomplete options.');
};

const run = async () => {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const showSuggestions = args.includes('--suggest');
  const query = args.filter((arg) => arg !== '--suggest').join(' ');

  const repository = bootstrapRepository();
  const controller = createSearchController({ repository });
  const handlers = createHttpHandlers(controller);

  const payload = await handlers.searchHandler(query);

  if (payload.total === 0) {
    console.log('No catalog items found.');
  } else {
    console.log(`Found ${payload.total} catalog item(s):`);
    payload.items.forEach((item) => {
      console.log(`\n[${item.id}] ${item.title}`);
      console.log(item.snippet);
      console.log(`Tags: ${item.tags.join(', ')}`);
    });

    if (payload.expansions?.length) {
      console.log('\nQuery expansions used:', payload.expansions.join(', '));
    }

    const facetKeys = Object.keys(payload.facets ?? {});
    if (facetKeys.length) {
      console.log('\nTop facets:');
      facetKeys.forEach((facetKey) => {
        const buckets = payload.facets[facetKey] ?? [];
        const formatted = buckets
          .slice(0, 5)
          .map((bucket) => `${bucket.value} (${bucket.count})${bucket.pinned ? '*' : ''}`)
          .join(', ');
        console.log(`- ${facetKey}: ${formatted}`);
      });
    }
  }

  if (showSuggestions) {
    const suggestions = await handlers.autocompleteHandler(query);
    console.log('\nSuggestions:');
    suggestions.forEach((suggestion) => {
      console.log(`- ${suggestion.label}`);
    });
  }
};

run().catch((error) => {
  console.error('CLI error:', error);
  process.exit(1);
});

import { searchTopics, sampleTopics } from './topics';

const query = process.argv.slice(2).join(' ');
const results = searchTopics(query, sampleTopics);

if (!query) {
  console.log('Showing all topics:');
} else {
  console.log(`Results for "${query}":`);
}

if (!results.length) {
  console.log('No topics found.');
  process.exit(0);
}

results.forEach((topic) => {
  console.log(`\n[${topic.id}] ${topic.name}`);
  console.log(`Description: ${topic.description}`);
  console.log(`Tags: ${topic.tags.join(', ')}`);
});

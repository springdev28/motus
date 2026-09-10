import assert from 'node:assert/strict';
import test from 'node:test';
import { discoverySearch, readDiscoveryFilters } from './motus-discovery.ts';
import { filterLibraryWorks } from './motus-library.ts';
import type { LibraryWork } from './motus-library.ts';
const work: LibraryWork = {
  slug: 'test-work',
  title: 'Filter fixture',
  creatorId: 'test-creator',
  creator: 'Test creator',
  creatorHandle: '@test',
  origin: 'original',
  contentWarningIds: [],
  genre: 'Action',
  communitySlugs: [],
  format: 'Vertical scroll',
  status: 'Ongoing',
  rating: 'General',
  language: 'Spanish',
  chapterCount: 1,
  description: 'A searchable description',
  tags: [],
  characters: [],
  fandom: null,
  palette: '#fff',
  accent: '#000',
  updatedLabel: '',
  popularity: 0,
};

void test('all discovery controls survive sharing and reloading the URL', () => {
  const filters = readDiscoveryFilters(
    new URLSearchParams(
      'entity=works&q=creator&format=Vertical+scroll&status=Ongoing&rating=General&genre=Action&origin=original&language=Spanish&sort=title&view=following',
    ),
  );
  assert.deepEqual(
    readDiscoveryFilters(new URLSearchParams(discoverySearch(filters))),
    filters,
  );
  assert.equal(filters.language, 'Spanish');
  assert.equal(filters.sort, 'title');
});
void test('invalid URL controls reset to supported defaults', () => {
  const defaults = readDiscoveryFilters(new URLSearchParams());
  assert.equal(discoverySearch(defaults), '');
  assert.deepEqual(
    readDiscoveryFilters(
      new URLSearchParams(
        'entity=unknown&language=Klingon&format=broken&sort=bad&community=missing',
      ),
    ),
    defaults,
  );
});
void test('language filtering finds international works and combines with search', () => {
  const works = filterLibraryWorks([work], {
    language: 'Spanish',
    query: 'searchable description',
  });
  assert.deepEqual(
    works.map((work) => work.slug),
    ['test-work'],
  );
  assert.equal(
    filterLibraryWorks([work], {
      language: 'Japanese',
      query: 'searchable description',
    }).length,
    0,
  );
});

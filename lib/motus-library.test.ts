import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MOTUS_LIBRARY_WORKS,
  MOTUS_LIBRARY_CREATORS,
  MOTUS_LIBRARY_COMMUNITIES,
  LIBRARY_CREATOR_IDS,
  LIBRARY_COMMUNITY_SLUGS,
  LIBRARY_WORK_FORMATS,
  filterLibraryWorks,
  getLibraryWork,
  getLibraryCreatorProfile,
  getLibraryCommunityBySlug,
  parseStoredSlugSet,
  parseStoredCreatorIdSet,
  migrateStoredCreatorHandles,
  parseStoredReadingProgress,
  getCatalogPreviewLayout,
  type LibraryWork,
} from './motus-library.ts';

export const filterTestWork: LibraryWork = {
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
  chapterCount: 2,
  description: 'A searchable description',
  tags: ['test-tag'],
  characters: ['Test character'],
  fandom: null,
  palette: '#ffffff',
  accent: '#000000',
  updatedLabel: '',
  popularity: 0,
};

void test('public catalog starts without fabricated people, work, or communities', () => {
  for (const collection of [
    MOTUS_LIBRARY_WORKS,
    MOTUS_LIBRARY_CREATORS,
    MOTUS_LIBRARY_COMMUNITIES,
    LIBRARY_CREATOR_IDS,
    LIBRARY_COMMUNITY_SLUGS,
  ]) {
    assert.deepEqual(collection, []);
  }
});
void test('retired public demo links do not resolve to previews or profiles', () => {
  assert.equal(getLibraryWork('the-last-signal'), null);
  assert.equal(getLibraryCreatorProfile('miravale'), null);
  assert.equal(getLibraryCommunityBySlug('motion-makers'), null);
});
void test('old sample follows and reading history cannot repopulate the catalog', () => {
  assert.equal(parseStoredSlugSet('["the-last-signal"]').size, 0);
  assert.equal(parseStoredCreatorIdSet('["creator-miravale"]').size, 0);
  assert.equal(migrateStoredCreatorHandles('["@miravale"]').size, 0);
  assert.deepEqual(
    parseStoredReadingProgress(
      '{"the-last-signal":{"sceneIndex":1,"updatedAt":"2026-09-01T00:00:00Z"}}',
    ),
    {},
  );
});
void test('malformed preference data is safely ignored', () => {
  for (const value of [null, 'not json', '{}', '[]', '[null, 42]']) {
    assert.equal(parseStoredSlugSet(value).size, 0);
    assert.equal(parseStoredCreatorIdSet(value).size, 0);
    assert.deepEqual(parseStoredReadingProgress(value), {});
  }
});
void test('search matches creator, metadata and tags without requiring seeded users', () => {
  for (const query of [
    'TEST CREATOR',
    'test-tag',
    'Test character',
    'searchable description',
  ]) {
    assert.equal(filterLibraryWorks([filterTestWork], { query }).length, 1);
  }
  assert.equal(
    filterLibraryWorks([filterTestWork], { query: 'unmatched' }).length,
    0,
  );
});
void test('combined filters and following constrain results', () => {
  const works = [
    filterTestWork,
    { ...filterTestWork, slug: 'second', language: 'Japanese' },
  ];
  assert.deepEqual(
    filterLibraryWorks(works, {
      language: 'Spanish',
      genre: 'Action',
      status: 'Ongoing',
      rating: 'General',
      format: 'Vertical scroll',
      origin: 'original',
      followedOnly: true,
      followedSlugs: new Set(['test-work']),
    }),
    [filterTestWork],
  );
  assert.equal(
    filterLibraryWorks(works, { followedOnly: true, followedSlugs: new Set() })
      .length,
    0,
  );
  assert.equal(
    filterLibraryWorks(works, { communitySlug: 'unknown' }).length,
    0,
  );
  assert.equal(filterLibraryWorks(works, { genre: 'Romance' }).length, 0);
});
void test('supported reading formats remain available in an empty catalog', () => {
  assert.equal(LIBRARY_WORK_FORMATS.length, 5);
  assert.equal(getCatalogPreviewLayout('Page').projectFormat, 'page');
  assert.equal(getCatalogPreviewLayout('Spread').projectFormat, 'spread');
  assert.equal(getCatalogPreviewLayout('Vertical scroll').native, true);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_READING_PREFERENCES,
  parseReadingPreferences,
  normalizeHandle,
  validateHandle,
  filterPlatformWorks,
  type PlatformWork,
} from './motus-platform.ts';
void test('untrusted stored preferences are allowlisted without losing explicit motion opt-outs', () => {
  assert.deepEqual(parseReadingPreferences(null), DEFAULT_READING_PREFERENCES);
  assert.deepEqual(
    parseReadingPreferences({
      format: 'unknown',
      direction: 'right',
      motion: 'false',
      rememberPosition: 0,
    }),
    DEFAULT_READING_PREFERENCES,
  );
  assert.deepEqual(
    parseReadingPreferences({
      format: 'spread',
      direction: 'rtl',
      motion: false,
      rememberPosition: false,
      extra: 'ignored',
    }),
    {
      format: 'spread',
      direction: 'rtl',
      motion: false,
      rememberPosition: false,
    },
  );
});
void test('profile and community handles normalize consistently and reject unsafe URL characters', () => {
  assert.equal(normalizeHandle('  Story_Maker  '), 'story_maker');
  assert.equal(validateHandle(normalizeHandle('  Story_Maker  ')), null);
  for (const value of [
    'ab',
    '4abc',
    'a/b',
    'a?b',
    'a'.repeat(31),
    'MOTUS',
    'a b',
  ])
    assert.ok(validateHandle(value));
  assert.equal(validateHandle('a'.repeat(30)), null);
});
void test('archive search combines tags, ratings, language and display without changing work order', () => {
  const base: PlatformWork = {
    id: '1',
    owner_id: 'creator',
    title: 'A story',
    summary: 'A moonlit voyage',
    author: 'Writer',
    tags: ['found family', 'space'],
    language: 'English',
    rating: 'General',
    status: 'Ongoing',
    format: 'spread',
    page_count: 5,
    animated: true,
    cover: '',
    edition_path: 'creator/1.json',
    community_id: null,
    published: true,
    updated_at: '2026-09-10T00:00:00Z',
  };
  const works = [
    base,
    {
      ...base,
      id: '2',
      language: 'Turkish',
      rating: 'Teen',
      format: 'scroll' as const,
    },
  ];
  assert.deepEqual(
    filterPlatformWorks(
      works,
      ' FOUND FAMILY ',
      'General',
      'spread',
      'English',
    ).map((w) => w.id),
    ['1'],
  );
  assert.equal(
    filterPlatformWorks(works, 'voyage', 'all', 'all', 'all').length,
    2,
  );
  assert.equal(
    filterPlatformWorks(works, 'no match', 'all', 'all', 'all').length,
    0,
  );
  assert.equal(works.length, 2);
});

void test('public configuration never exposes secret keys or credential-bearing URLs', async () => {
  const { publicPlatformConfig } = await import('./motus-platform-config.ts');
  const closed = {
    configured: false,
    url: null,
    publishableKey: null,
  };
  assert.deepEqual(publicPlatformConfig(undefined, undefined), closed);
  assert.deepEqual(
    publicPlatformConfig('https://example.supabase.co', 'sb_secret_private'),
    closed,
  );
  assert.deepEqual(
    publicPlatformConfig(
      'https://example.supabase.co',
      'eyJhbGciOiJIUzI1NiJ9.service_role',
    ),
    closed,
  );
  assert.deepEqual(
    publicPlatformConfig(
      'https://user:secret@example.supabase.co',
      'sb_publishable_public',
    ),
    closed,
  );
  assert.deepEqual(
    publicPlatformConfig(
      'https://example.supabase.co/?secret=private',
      'sb_publishable_public',
    ),
    closed,
  );
  assert.deepEqual(
    publicPlatformConfig('javascript:alert(1)', 'sb_publishable_public'),
    closed,
  );
  assert.deepEqual(
    publicPlatformConfig(
      'https://example.supabase.co/',
      'sb_publishable_public',
    ),
    {
      configured: true,
      url: 'https://example.supabase.co',
      publishableKey: 'sb_publishable_public',
    },
  );
});

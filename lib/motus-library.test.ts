import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LIBRARY_CONTENT_WARNING_IDS,
  LIBRARY_CREATOR_IDS,
  LIBRARY_WORK_FORMATS,
  LIBRARY_WORK_RATINGS,
  LIBRARY_WORK_STATUSES,
  MOTUS_LIBRARY_COMMUNITIES,
  MOTUS_LIBRARY_CREATORS,
  MOTUS_LIBRARY_WORKS,
  createCatalogPreviewProject,
  filterLibraryWorks,
  getCatalogPreviewLayout,
  getCatalogChapterId,
  getCatalogSceneId,
  getLibraryCreatorByHandle,
  getLibraryCreatorById,
  getLibraryCreatorProfile,
  getLibraryWorksForCreator,
  getLibraryWork,
  migrateStoredCreatorHandles,
  parseStoredCreatorIdSet,
  parseStoredReadingProgress,
  parseStoredSlugSet,
} from './motus-library.ts';
import { getProjectScenes, isMotionEventBlockKind } from './motus-model.ts';

void test('library preserves every specified format as catalog metadata', () => {
  assert.deepEqual(LIBRARY_WORK_FORMATS, [
    'Vertical scroll',
    'Page',
    'Spread',
    'Motion comic',
    'Hybrid',
  ]);
  for (const format of LIBRARY_WORK_FORMATS) {
    assert.ok(MOTUS_LIBRARY_WORKS.some((work) => work.format === format));
  }
  assert.deepEqual(getCatalogPreviewLayout('Vertical scroll'), {
    projectFormat: 'vertical-scroll',
    label: 'Vertical',
    native: true,
  });
  assert.deepEqual(getCatalogPreviewLayout('Page'), {
    projectFormat: 'page',
    label: 'Page',
    native: true,
  });
  assert.deepEqual(getCatalogPreviewLayout('Spread'), {
    projectFormat: 'page',
    label: 'Page',
    native: false,
  });
  for (const format of ['Motion comic', 'Hybrid'] as const) {
    assert.deepEqual(getCatalogPreviewLayout(format), {
      projectFormat: 'vertical-scroll',
      label: 'Vertical',
      native: false,
    });
  }
});

void test('work filtering searches metadata, tags, characters, and fandoms', () => {
  assert.deepEqual(
    filterLibraryWorks(MOTUS_LIBRARY_WORKS, { query: 'Frame 17' }).map(
      (work) => work.slug,
    ),
    ['afterimage-archive'],
  );
  assert.deepEqual(
    filterLibraryWorks(MOTUS_LIBRARY_WORKS, { query: 'solarpunk' }).map(
      (work) => work.slug,
    ),
    ['iron-orchard'],
  );
  assert.deepEqual(
    filterLibraryWorks(MOTUS_LIBRARY_WORKS, {
      format: 'Vertical scroll',
      status: 'Ongoing',
      rating: 'General',
    }).map((work) => work.slug),
    ['cloudbreak-courier'],
  );
});

void test('following filter only returns followed work slugs', () => {
  const results = filterLibraryWorks(MOTUS_LIBRARY_WORKS, {
    followedOnly: true,
    followedSlugs: new Set(['the-last-signal', 'neon-hearts-club']),
  });
  assert.deepEqual(
    results.map((work) => work.slug),
    ['the-last-signal', 'neon-hearts-club'],
  );
});

void test('stored follow data discards malformed and unknown entries', () => {
  assert.deepEqual(
    [...parseStoredSlugSet('["the-last-signal", "unknown", 4, null]')],
    ['the-last-signal'],
  );
  assert.deepEqual([...parseStoredSlugSet('{"slug":"the-last-signal"}')], []);
  assert.deepEqual([...parseStoredSlugSet('not json')], []);
});

void test('library exposes every status and complete source rating taxonomy', () => {
  assert.deepEqual(LIBRARY_WORK_STATUSES, ['Ongoing', 'Completed', 'Hiatus']);
  assert.deepEqual(LIBRARY_WORK_RATINGS, [
    'General',
    'Teen',
    'Mature',
    'Adults only',
  ]);
  for (const status of LIBRARY_WORK_STATUSES) {
    assert.ok(MOTUS_LIBRARY_WORKS.some((work) => work.status === status));
  }
  for (const rating of LIBRARY_WORK_RATINGS) {
    assert.ok(MOTUS_LIBRARY_WORKS.some((work) => work.rating === rating));
  }
});

void test('combined filters and normalized search never leak nonmatching works', () => {
  assert.deepEqual(
    filterLibraryWorks(MOTUS_LIBRARY_WORKS, {
      query: '  MIRA   VALE ',
      format: 'Vertical scroll',
      status: 'Ongoing',
      rating: 'Teen',
      followedOnly: true,
      followedSlugs: new Set(['the-last-signal', 'iron-orchard']),
    }).map((work) => work.slug),
    ['the-last-signal'],
  );
  assert.deepEqual(
    filterLibraryWorks(MOTUS_LIBRARY_WORKS, {
      followedOnly: true,
      followedSlugs: new Set(),
    }),
    [],
  );
});

void test('stored reading progress keeps only safe finite entries for known works', () => {
  const parsed = parseStoredReadingProgress(
    JSON.stringify({
      'the-last-signal': {
        sceneIndex: 2,
        updatedAt: '2026-08-29T08:00:00.000Z',
      },
      'iron-orchard': {
        sceneIndex: {},
        updatedAt: '2026-08-29T08:00:00.000Z',
      },
      unknown: {
        sceneIndex: 1,
        updatedAt: '2026-08-29T08:00:00.000Z',
      },
      constructor: {
        sceneIndex: 1,
        updatedAt: '2026-08-29T08:00:00.000Z',
      },
    }),
  );
  assert.deepEqual(parsed, {
    'the-last-signal': {
      chapterId: getCatalogChapterId('the-last-signal', 0),
      sceneId: getCatalogSceneId('the-last-signal', 0, 2),
      updatedAt: '2026-08-29T08:00:00.000Z',
    },
  });
  assert.deepEqual(parseStoredReadingProgress('[]'), {});
  assert.deepEqual(parseStoredReadingProgress('not json'), {});
});

void test('stable reader projects preserve work metadata and editable motion', () => {
  const work = getLibraryWork('the-last-signal');
  assert.ok(work);
  const project = createCatalogPreviewProject(work, 0);
  const rebuiltAtAnotherCatalogPosition = createCatalogPreviewProject(work, 7);
  assert.equal(project.title, work.title);
  assert.equal(project.creatorName, work.creator);
  assert.equal(project.visibility, 'public');
  assert.equal(project.publishedRevision, 0);
  assert.equal(project.chapters.length, work.chapterCount);
  assert.equal(project.chapters[0].scenes.length, 3);
  assert.equal(getProjectScenes(project).length, work.chapterCount * 3);
  assert.equal(project.coverSceneId, project.chapters[0].scenes[0].id);
  assert.deepEqual(rebuiltAtAnotherCatalogPosition, project);
  assert.equal(project.id, `catalog-preview-${work.slug}`);
  assert.ok(
    getProjectScenes(project).every((scene) =>
      scene.elements.every(
        (element) =>
          isMotionEventBlockKind(element.motion.blocks[0]?.kind) &&
          element.motion.blocks.length > 1,
      ),
    ),
  );
});

void test('reading progress rejects cross-chapter scene pairs', () => {
  const slug = 'the-last-signal';
  const updatedAt = '2026-08-29T08:00:00.000Z';
  const valid = parseStoredReadingProgress(
    JSON.stringify({
      [slug]: {
        chapterId: getCatalogChapterId(slug, 1),
        sceneId: getCatalogSceneId(slug, 1, 2),
        updatedAt,
      },
    }),
  );
  assert.deepEqual(valid[slug], {
    chapterId: getCatalogChapterId(slug, 1),
    sceneId: getCatalogSceneId(slug, 1, 2),
    updatedAt,
  });

  const mismatched = parseStoredReadingProgress(
    JSON.stringify({
      [slug]: {
        chapterId: getCatalogChapterId(slug, 0),
        sceneId: getCatalogSceneId(slug, 1, 2),
        updatedAt,
      },
    }),
  );
  assert.deepEqual(mismatched, {});
});

void test('catalog preview chapters do not share mutable motion graphs', () => {
  const work = getLibraryWork('the-last-signal');
  assert.ok(work);
  const project = createCatalogPreviewProject(work);
  const firstBlock = project.chapters[0].scenes[0].elements[0].motion.blocks[1];
  const secondBlock =
    project.chapters[1].scenes[0].elements[0].motion.blocks[1];
  assert.notEqual(firstBlock, secondBlock);
  const originalSecondDuration = secondBlock.durationMs;
  firstBlock.durationMs = 9_999;
  assert.equal(secondBlock.durationMs, originalSecondDuration);
});

void test('creator records and routes are unique and resolve every work', () => {
  assert.equal(MOTUS_LIBRARY_CREATORS.length, LIBRARY_CREATOR_IDS.length);
  assert.equal(
    new Set(MOTUS_LIBRARY_CREATORS.map((creator) => creator.id)).size,
    MOTUS_LIBRARY_CREATORS.length,
  );
  assert.equal(
    new Set(MOTUS_LIBRARY_CREATORS.map((creator) => creator.routeHandle)).size,
    MOTUS_LIBRARY_CREATORS.length,
  );
  assert.equal(
    new Set(MOTUS_LIBRARY_CREATORS.map((creator) => creator.displayHandle))
      .size,
    MOTUS_LIBRARY_CREATORS.length,
  );
  for (const work of MOTUS_LIBRARY_WORKS) {
    const creator = getLibraryCreatorById(work.creatorId);
    assert.ok(creator);
    assert.equal(creator.name, work.creator);
    assert.equal(creator.displayHandle, work.creatorHandle);
    assert.equal(
      getLibraryCreatorByHandle(creator.routeHandle)?.id,
      creator.id,
    );
    assert.equal(
      getLibraryCreatorByHandle(creator.displayHandle)?.id,
      creator.id,
    );
  }
  assert.equal(getLibraryCreatorByHandle('unknown'), null);
});

void test('creator profiles derive deterministic portfolios and affiliations', () => {
  const communitySlugs = new Set(
    MOTUS_LIBRARY_COMMUNITIES.map((community) => community.slug),
  );
  for (const creator of MOTUS_LIBRARY_CREATORS) {
    const works = getLibraryWorksForCreator(creator.id);
    const profile = getLibraryCreatorProfile(creator.routeHandle);
    assert.ok(profile);
    assert.deepEqual(profile.works, works);
    assert.equal(profile.featuredWork.slug, creator.featuredWorkSlug);
    assert.equal(profile.featuredWork.creatorId, creator.id);
    assert.equal(
      profile.totalChapters,
      works.reduce((total, work) => total + work.chapterCount, 0),
    );
    assert.deepEqual(
      profile.genres,
      [...new Set(works.map((work) => work.genre))].sort(),
    );
    for (const slug of creator.communitySlugs) {
      assert.ok(communitySlugs.has(slug));
    }
  }
  assert.equal(getLibraryCreatorProfile('unknown'), null);
});

void test('work origin and warning metadata use the supported taxonomy', () => {
  const supportedWarnings = new Set<string>(LIBRARY_CONTENT_WARNING_IDS);
  for (const work of MOTUS_LIBRARY_WORKS) {
    assert.equal(
      new Set(work.contentWarningIds).size,
      work.contentWarningIds.length,
    );
    for (const warning of work.contentWarningIds) {
      assert.ok(supportedWarnings.has(warning));
    }
    if (work.origin === 'fanwork') assert.ok(work.fandom);
    else {
      assert.equal(work.origin, 'original');
      assert.equal(work.fandom, null);
    }
  }
  assert.ok(MOTUS_LIBRARY_WORKS.some((work) => work.origin === 'fanwork'));
  assert.ok(MOTUS_LIBRARY_WORKS.some((work) => work.contentWarningIds.length));
});

void test('creator follow data migrates handles to stable IDs safely', () => {
  assert.deepEqual(
    [...parseStoredCreatorIdSet('["creator-miravale", "unknown", 4]')],
    ['creator-miravale'],
  );
  assert.deepEqual([...parseStoredCreatorIdSet('not json')], []);
  assert.deepEqual(
    [
      ...migrateStoredCreatorHandles(
        '["@miravale", "junipermoss", "UNKNOWN", null]',
      ),
    ],
    ['creator-miravale', 'creator-junipermoss'],
  );
  assert.deepEqual(
    [...migrateStoredCreatorHandles('{"handle":"@miravale"}')],
    [],
  );
});

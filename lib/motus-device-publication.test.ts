import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DRAFT_POINTER_KEY,
  DRAFT_SLOT_A_KEY,
  DRAFT_SLOT_B_KEY,
} from './motus-draft-storage.ts';
import {
  DEVICE_PUBLICATION_SLUG_PREFIX,
  DEVICE_PUBLICATION_REGISTRY_STORAGE_KEY,
  getCurrentDevicePublication,
  getDevicePublicationSlug,
  isDevicePublicationSlug,
  listDevicePublications,
  parseDeviceFollowedSlugs,
  parseDeviceReadingProgress,
  resolveDevicePublication,
  saveDevicePublication,
} from './motus-device-publication.ts';
import {
  PROJECT_SCHEMA_VERSION,
  createDefaultProject,
  createPublicationRevision,
  type MotusProject,
} from './motus-model.ts';

class MemoryStorage {
  private readonly values = new Map<string, string>();
  failNextSetFor: string | null = null;

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    if (this.failNextSetFor === key) {
      this.failNextSetFor = null;
      throw new Error('simulated quota failure');
    }
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

class ThrowingReadStorage extends MemoryStorage {
  override getItem(_key: string): string | null {
    throw new Error('simulated blocked storage');
  }
}

function saveProject(storage: MemoryStorage, project: MotusProject) {
  storage.setItem(DRAFT_SLOT_A_KEY, JSON.stringify(project));
  storage.setItem(DRAFT_POINTER_KEY, 'a');
}

function publishProject(project = createDefaultProject()) {
  const revision = createPublicationRevision(
    project,
    '2026-08-30T07:00:00.000Z',
  );
  project.publications.push(revision);
  project.publishedRevision = revision.revision;
  project.updatedAt = revision.createdAt;
  return { project, revision };
}

void test('device publication resolves only an immutable current revision', () => {
  const storage = new MemoryStorage();
  const { project, revision } = publishProject();
  saveProject(storage, project);

  const publication = getCurrentDevicePublication(storage);
  assert.ok(publication);
  assert.equal(publication.source.mode, 'revision');
  assert.equal(publication.source.revision, 1);
  assert.equal(publication.source.title, revision.title);
  assert.deepEqual(publication.source.metadata, revision.metadata);
  assert.deepEqual(
    JSON.parse(JSON.stringify(publication.source.chapters)),
    JSON.parse(JSON.stringify(revision.chapters)),
  );

  project.title = 'Draft-only title';
  project.metadata.themes.push('Draft-only theme');
  project.chapters[0].scenes[0].name = 'Draft-only scene';
  project.updatedAt = '2026-08-30T07:05:00.000Z';
  saveProject(storage, project);

  const afterDraftEdit = resolveDevicePublication(storage, publication.slug);
  assert.ok(afterDraftEdit);
  assert.equal(afterDraftEdit.source.title, revision.title);
  assert.equal(
    afterDraftEdit.source.metadata.themes.includes('Draft-only theme'),
    false,
  );
  assert.equal(
    afterDraftEdit.source.chapters[0].scenes[0].name,
    revision.chapters[0].scenes[0].name,
  );
});

void test('publishing an update keeps the route and replaces its snapshot', () => {
  const storage = new MemoryStorage();
  const { project } = publishProject();
  saveProject(storage, project);
  const first = getCurrentDevicePublication(storage);
  assert.ok(first);

  project.title = 'Second edition';
  const secondRevision = createPublicationRevision(
    project,
    '2026-08-30T08:00:00.000Z',
  );
  project.publications.push(secondRevision);
  project.publishedRevision = secondRevision.revision;
  project.updatedAt = secondRevision.createdAt;
  saveProject(storage, project);

  const second = getCurrentDevicePublication(storage);
  assert.ok(second);
  assert.equal(second.slug, first.slug);
  assert.equal(second.source.revision, 2);
  assert.equal(second.source.title, 'Second edition');
});

void test('registered publications survive replacing the active draft', () => {
  const storage = new MemoryStorage();
  const { project, revision } = publishProject();
  saveProject(storage, project);
  assert.equal(saveDevicePublication(storage, project.id, revision), true);
  const slug = getDevicePublicationSlug(project.id);

  const replacement = createDefaultProject();
  replacement.id = 'different-draft';
  replacement.title = 'Different draft';
  replacement.publications = [];
  replacement.publishedRevision = 0;
  replacement.updatedAt = '2026-08-30T09:00:00.000Z';
  saveProject(storage, replacement);

  assert.equal(getCurrentDevicePublication(storage), null);
  const retained = resolveDevicePublication(storage, slug);
  assert.ok(retained);
  assert.equal(retained.source.title, revision.title);
  assert.deepEqual(
    listDevicePublications(storage).map((publication) => publication.slug),
    [slug],
  );
});

void test('registry updates replace one project route without duplicating it', () => {
  const storage = new MemoryStorage();
  const { project, revision } = publishProject();
  assert.equal(saveDevicePublication(storage, project.id, revision), true);

  project.title = 'Registry revision two';
  const second = createPublicationRevision(project, '2026-08-30T09:30:00.000Z');
  assert.equal(saveDevicePublication(storage, project.id, second), true);
  const registered = listDevicePublications(storage);
  assert.equal(registered.length, 1);
  assert.equal(registered[0].slug, getDevicePublicationSlug(project.id));
  assert.equal(registered[0].source.revision, 2);
  assert.equal(registered[0].source.title, 'Registry revision two');
});

void test('device registry migrates schema 9 publication layers to the current rig schema', () => {
  const storage = new MemoryStorage();
  const { project, revision } = publishProject();
  const legacyRevision = structuredClone(revision) as unknown as Record<
    string,
    unknown
  >;
  for (const chapter of legacyRevision.chapters as Array<
    Record<string, unknown>
  >) {
    for (const scene of chapter.scenes as Array<Record<string, unknown>>) {
      for (const element of scene.elements as Array<Record<string, unknown>>) {
        delete element.parentId;
        delete element.pivotX;
        delete element.pivotY;
      }
    }
  }
  storage.setItem(
    DEVICE_PUBLICATION_REGISTRY_STORAGE_KEY,
    JSON.stringify({
      schemaVersion: 1,
      publications: [{ projectId: project.id, revision: legacyRevision }],
    }),
  );

  const publications = listDevicePublications(storage);
  assert.equal(publications.length, 1);
  assert.equal(publications[0].project.schemaVersion, PROJECT_SCHEMA_VERSION);
  for (const element of publications[0].project.chapters[0].scenes[0]
    .elements) {
    assert.equal(element.parentId, null);
    assert.equal(element.pivotX, 50);
    assert.equal(element.pivotY, 50);
  }
});

void test('failed registry writes preserve the previously verified publication', () => {
  const storage = new MemoryStorage();
  const first = publishProject();
  assert.equal(
    saveDevicePublication(storage, first.project.id, first.revision),
    true,
  );
  const second = publishProject();
  second.project.id = 'another-project';
  second.revision.id = 'another-project-revision-1';
  storage.failNextSetFor = DEVICE_PUBLICATION_REGISTRY_STORAGE_KEY;
  assert.equal(
    saveDevicePublication(storage, second.project.id, second.revision),
    false,
  );
  assert.deepEqual(
    listDevicePublications(storage).map((publication) => publication.projectId),
    [first.project.id],
  );
});

void test('a newer journal revision wins when its registry update fails', () => {
  const storage = new MemoryStorage();
  const { project, revision } = publishProject();
  saveProject(storage, project);
  assert.equal(saveDevicePublication(storage, project.id, revision), true);

  project.title = 'Journal-only second edition';
  const second = createPublicationRevision(project, '2026-08-30T10:00:00.000Z');
  project.publications.push(second);
  project.publishedRevision = second.revision;
  project.updatedAt = second.createdAt;
  saveProject(storage, project);
  storage.failNextSetFor = DEVICE_PUBLICATION_REGISTRY_STORAGE_KEY;
  assert.equal(saveDevicePublication(storage, project.id, second), false);

  const resolved = resolveDevicePublication(
    storage,
    getDevicePublicationSlug(project.id),
  );
  assert.ok(resolved);
  assert.equal(resolved.revision.revision, 2);
  assert.equal(resolved.source.title, 'Journal-only second edition');
});

void test('registry stores one compact immutable snapshot per publication', () => {
  const storage = new MemoryStorage();
  const first = publishProject();
  const second = publishProject();
  second.project.id = 'compact-second-project';
  second.revision.id = 'compact-second-project-revision-1';

  assert.equal(
    saveDevicePublication(storage, first.project.id, first.revision),
    true,
  );
  assert.equal(
    saveDevicePublication(storage, second.project.id, second.revision),
    true,
  );
  const encoded = storage.getItem(DEVICE_PUBLICATION_REGISTRY_STORAGE_KEY);
  assert.ok(encoded);
  const envelope = JSON.parse(encoded) as {
    publications: Array<{ projectId: string; revision: unknown }>;
    schemaVersion: number;
  };
  assert.equal(envelope.schemaVersion, 1);
  assert.equal(envelope.publications.length, 2);
  assert.deepEqual(
    envelope.publications.map((record) => record.projectId).sort(),
    [first.project.id, second.project.id].sort(),
  );
  assert.equal(encoded.includes('"projects"'), false);
  assert.ok(
    encoded.length <
      JSON.stringify(first.project).length +
        JSON.stringify(second.project).length,
  );
});

void test('blocked storage reads fail closed without throwing from registry APIs', () => {
  const storage = new ThrowingReadStorage();
  const { project, revision } = publishProject();
  assert.deepEqual(listDevicePublications(storage), []);
  assert.equal(getCurrentDevicePublication(storage), null);
  assert.equal(saveDevicePublication(storage, project.id, revision), false);
  assert.equal(
    resolveDevicePublication(storage, getDevicePublicationSlug(project.id)),
    null,
  );
});

void test('device publication preserves reader format, cover, rating, visibility, and metadata', () => {
  const storage = new MemoryStorage();
  const project = createDefaultProject();
  project.format = 'page';
  project.coverSceneId = project.chapters[0].scenes[2].id;
  project.contentRating = 'adults-only';
  project.visibility = 'public';
  project.metadata.workStatus = 'completed';
  project.metadata.origin = 'original';
  project.metadata.genres = ['Mystery', 'Science fiction'];
  project.metadata.contentWarnings = ['Distressing imagery'];
  const { project: published } = publishProject(project);
  saveProject(storage, published);

  const publication = getCurrentDevicePublication(storage);
  assert.ok(publication);
  assert.equal(publication.source.format, 'page');
  assert.equal(publication.source.coverSceneId, project.coverSceneId);
  assert.equal(publication.source.contentRating, 'adults-only');
  assert.equal(publication.source.visibility, 'public');
  assert.equal(publication.source.metadata.workStatus, 'completed');
  assert.deepEqual(publication.source.metadata.genres, [
    'Mystery',
    'Science fiction',
  ]);
  assert.deepEqual(publication.source.metadata.contentWarnings, [
    'Distressing imagery',
  ]);

  project.format = 'vertical-scroll';
  project.contentRating = 'all-ages';
  project.visibility = 'private';
  project.metadata.genres = ['Draft-only genre'];
  assert.equal(publication.source.format, 'page');
  assert.equal(publication.source.contentRating, 'adults-only');
  assert.equal(publication.source.visibility, 'public');
  assert.deepEqual(publication.source.metadata.genres, [
    'Mystery',
    'Science fiction',
  ]);
});

void test('unpublished, corrupt, stale, and unknown device routes fail closed', () => {
  const storage = new MemoryStorage();
  saveProject(storage, createDefaultProject());
  assert.equal(getCurrentDevicePublication(storage), null);

  storage.setItem(DRAFT_SLOT_A_KEY, 'not json');
  storage.setItem(DRAFT_SLOT_B_KEY, '{"schemaVersion":999}');
  assert.equal(getCurrentDevicePublication(storage), null);

  const { project } = publishProject();
  saveProject(storage, project);
  const publication = getCurrentDevicePublication(storage);
  assert.ok(publication);
  assert.equal(resolveDevicePublication(storage, 'the-last-signal'), null);
  assert.equal(
    resolveDevicePublication(storage, `${publication.slug}-stale`),
    null,
  );
  assert.ok(resolveDevicePublication(storage, publication.slug));
});

void test('device slugs are stable, route-safe, and namespaced from catalog work', () => {
  const unsafeId = '  Mötus / Work ? #42  ';
  const first = getDevicePublicationSlug(unsafeId);
  const second = getDevicePublicationSlug(unsafeId);
  assert.equal(first, second);
  assert.ok(first.startsWith(DEVICE_PUBLICATION_SLUG_PREFIX));
  assert.ok(isDevicePublicationSlug(first));
  assert.match(first, /^[a-z0-9-]+$/);
  assert.equal(first.includes('motus'), false);
  assert.equal(getDevicePublicationSlug('I'), getDevicePublicationSlug('I'));
  assert.notEqual(getDevicePublicationSlug('I'), getDevicePublicationSlug('ı'));
  assert.equal(isDevicePublicationSlug('the-last-signal'), false);
  assert.notEqual(first, getDevicePublicationSlug('Motus Work 42'));
});

void test('device follow parsing accepts only the resolved local publication', () => {
  const storage = new MemoryStorage();
  const { project } = publishProject();
  saveProject(storage, project);
  const publication = getCurrentDevicePublication(storage);
  assert.ok(publication);

  assert.deepEqual(
    [
      ...parseDeviceFollowedSlugs(
        JSON.stringify([publication.slug]),
        publication,
      ),
    ],
    [publication.slug],
  );
  assert.deepEqual(
    [
      ...parseDeviceFollowedSlugs(
        JSON.stringify(['the-last-signal', `${publication.slug}-old`]),
        publication,
      ),
    ],
    [],
  );
  const anotherSlug = getDevicePublicationSlug('another-project');
  assert.deepEqual(
    [
      ...parseDeviceFollowedSlugs(
        JSON.stringify([publication.slug, anotherSlug]),
        publication,
      ),
    ],
    [publication.slug, anotherSlug],
  );
  assert.deepEqual([...parseDeviceFollowedSlugs('not json', publication)], []);
});

void test('device progress requires a chapter and scene from the published revision', () => {
  const storage = new MemoryStorage();
  const { project } = publishProject();
  saveProject(storage, project);
  const publication = getCurrentDevicePublication(storage);
  assert.ok(publication);
  const chapter = publication.project.chapters[0];
  const scene = chapter.scenes[1];
  const valid = {
    [publication.slug]: {
      chapterId: chapter.id,
      sceneId: scene.id,
      updatedAt: '2026-08-30T08:05:00.000Z',
    },
    constructor: {
      chapterId: chapter.id,
      sceneId: scene.id,
      updatedAt: '2026-08-30T08:05:00.000Z',
    },
  };
  assert.deepEqual(
    parseDeviceReadingProgress(JSON.stringify(valid), publication),
    {
      [publication.slug]: valid[publication.slug],
    },
  );

  const anotherSlug = getDevicePublicationSlug('another-project');
  const anotherProgress = {
    chapterId: 'other-chapter',
    sceneId: 'other-scene',
    updatedAt: '2026-08-30T08:06:00.000Z',
  };
  assert.deepEqual(
    parseDeviceReadingProgress(
      JSON.stringify({
        [publication.slug]: valid[publication.slug],
        [anotherSlug]: anotherProgress,
      }),
      publication,
    ),
    {
      [publication.slug]: valid[publication.slug],
      [anotherSlug]: anotherProgress,
    },
  );

  for (const progress of [
    { ...valid[publication.slug], chapterId: 'missing' },
    { ...valid[publication.slug], sceneId: 'missing' },
    { ...valid[publication.slug], updatedAt: 'not a date' },
  ]) {
    assert.deepEqual(
      parseDeviceReadingProgress(
        JSON.stringify({ [publication.slug]: progress }),
        publication,
      ),
      {},
    );
  }
});

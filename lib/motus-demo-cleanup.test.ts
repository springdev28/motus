import assert from 'node:assert/strict';
import test from 'node:test';
import demo from './test-fixtures/retired-demo.json' with { type: 'json' };
import { isUntouchedRetiredDemo } from './motus-demo-cleanup.ts';
import {
  readNewestMotusDraft,
  DRAFT_SLOT_A_KEY,
  DRAFT_SLOT_B_KEY,
} from './motus-draft-storage.ts';
import { createDefaultProject, createBlankProject } from './motus-model.ts';

void test('new Studio projects have no generated story, creator identity, or artwork', () => {
  const project = createDefaultProject();
  assert.equal(project.title, 'Untitled work');
  assert.equal(project.creatorName, 'New creator');
  assert.equal(project.description, '');
  assert.deepEqual(project.tags, []);
  assert.equal(project.chapters.length, 1);
  assert.deepEqual(project.chapters[0].scenes[0].elements, []);
});
void test('retired demo cleanup matches the complete project, ignoring save time only', () => {
  assert.equal(isUntouchedRetiredDemo(JSON.stringify(demo)), true);
  assert.equal(
    isUntouchedRetiredDemo(
      JSON.stringify({ ...demo, updatedAt: '2026-09-08T00:00:00Z' }),
    ),
    true,
  );
  assert.equal(
    isUntouchedRetiredDemo(JSON.stringify({ ...demo, title: 'My own work' })),
    false,
  );
  const edited = structuredClone(demo);
  edited.chapters[0].scenes[0].elements[0].text = 'My own writing';
  assert.equal(isUntouchedRetiredDemo(JSON.stringify(edited)), false);
  assert.equal(isUntouchedRetiredDemo('not json'), false);
});
void test('draft cleanup deletes only an untouched demo slot and preserves the real draft', () => {
  const own = createBlankProject('own-work');
  own.title = 'My work';
  const data = new Map([
    [DRAFT_SLOT_A_KEY, JSON.stringify(demo)],
    [DRAFT_SLOT_B_KEY, JSON.stringify(own)],
    ['unrelated', 'keep'],
  ]);
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    removeItem: (key: string) => {
      data.delete(key);
    },
  };
  assert.equal(readNewestMotusDraft(storage)?.project.id, 'own-work');
  assert.equal(data.has(DRAFT_SLOT_A_KEY), false);
  assert.equal(data.get('unrelated'), 'keep');
  assert.equal(data.has(DRAFT_SLOT_B_KEY), true);
});
void test('read-only storage still ignores the untouched demo without throwing', () => {
  assert.equal(
    readNewestMotusDraft({
      getItem: (key) =>
        key === DRAFT_SLOT_A_KEY ? JSON.stringify(demo) : null,
    }),
    null,
  );
});

void test('retired browser-test edition is removed without deleting other editions', async () => {
  const { default: edition } = await import(
    './test-fixtures/retired-edition.json',
    { with: { type: 'json' } }
  );
  const { isRetiredTestEdition } = await import('./motus-demo-cleanup.ts');
  const { listDevicePublications, DEVICE_PUBLICATION_REGISTRY_STORAGE_KEY } =
    await import('./motus-device-publication.ts');
  const record = { projectId: edition.projectId, revision: edition.revision };
  assert.equal(isRetiredTestEdition(record), true);
  assert.equal(
    isRetiredTestEdition({ ...record, projectId: 'real-work' }),
    false,
  );
  assert.equal(
    isRetiredTestEdition({
      ...record,
      revision: { ...record.revision, title: 'Edited work' },
    }),
    false,
  );
  let encoded = JSON.stringify({
    schemaVersion: 1,
    publications: [record, { ...record, projectId: 'real-work' }],
  });
  const storage = {
    getItem: (key: string) =>
      key === DEVICE_PUBLICATION_REGISTRY_STORAGE_KEY ? encoded : null,
    setItem: (_key: string, value: string) => {
      encoded = value;
    },
  };
  assert.deepEqual(
    listDevicePublications(storage).map((p) => p.projectId),
    ['real-work'],
  );
  assert.deepEqual(
    JSON.parse(encoded).publications.map(
      (p: { projectId: string }) => p.projectId,
    ),
    ['real-work'],
  );
});

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MOTION_SCHEMA_VERSION,
  PROJECT_SCHEMA_VERSION,
  compileElementMotion,
  createDefaultProject,
  createPublicationRevision,
  restoreNewestProject,
  restoreProject,
} from './motus-model.ts';

void test('motion compilation is deterministic and produces a final element state', () => {
  const element = createDefaultProject().scenes[0].elements[0];
  element.rotation = 12;
  element.opacity = 0.8;
  element.motion.moveX = 120;
  element.motion.moveY = -40;
  element.motion.fromRotation = -35;
  element.motion.fromScale = 0.6;
  element.motion.fromOpacity = 0.2;
  element.motion.delayMs = 300;

  const first = compileElementMotion(element);
  const second = compileElementMotion(element);

  assert.deepEqual(first, second);
  assert.deepEqual(first.from, {
    translateX: -120,
    translateY: 40,
    opacity: 0.2,
    scale: 0.6,
    rotation: -23,
  });
  assert.deepEqual(first.to, {
    translateX: 0,
    translateY: 0,
    opacity: 0.8,
    scale: 1,
    rotation: 12,
  });
  assert.equal(first.delayMs, 300);
});

void test('version 2 drafts migrate without losing scenes or element motion', () => {
  const legacy = structuredClone(createDefaultProject()) as unknown as {
    schemaVersion: number;
    title: string;
    scenes: Array<{
      elements: Array<{
        motion: Record<string, unknown>;
      }>;
    }>;
  };
  legacy.schemaVersion = 2;
  legacy.title = 'Recovered legacy draft';
  delete legacy.scenes[0].elements[0].motion.delayMs;
  delete legacy.scenes[0].elements[0].motion.fromScale;
  delete legacy.scenes[0].elements[0].motion.fromRotation;
  delete legacy.scenes[0].elements[0].motion.schemaVersion;
  delete legacy.scenes[0].elements[0].motion.event;

  const restored = restoreProject(JSON.stringify(legacy));

  assert.ok(restored);
  assert.equal(restored.schemaVersion, PROJECT_SCHEMA_VERSION);
  assert.equal(restored.title, 'Recovered legacy draft');
  assert.equal(restored.scenes.length, 3);
  assert.equal(restored.scenes[0].elements[0].motion.schemaVersion, MOTION_SCHEMA_VERSION);
  assert.equal(restored.scenes[0].elements[0].motion.event, 'scene-enter');
  assert.equal(restored.scenes[0].elements[0].motion.delayMs, 0);
  assert.equal(restored.scenes[0].elements[0].motion.fromScale, 1);
  assert.equal(restored.scenes[0].elements[0].motion.fromRotation, 0);
});

void test('invalid project data is rejected', () => {
  assert.equal(restoreProject('{"schemaVersion":4,"title":"Broken","scenes":[]}'), null);
  assert.equal(restoreProject('not json'), null);
});

void test('published revisions remain immutable when the draft changes', () => {
  const project = createDefaultProject();
  const revision = createPublicationRevision(project, '2026-08-29T00:00:00.000Z');

  project.title = 'Changed draft title';
  project.tags.push('new tag');
  project.scenes[0].elements[0].text = 'Changed draft scene';

  assert.equal(revision.revision, 1);
  assert.equal(revision.createdAt, '2026-08-29T00:00:00.000Z');
  assert.equal(revision.title, 'Signal in the Fog');
  assert.deepEqual(revision.tags, ['science fiction', 'mystery']);
  assert.equal(revision.scenes[0].elements[0].text, 'Something moved beyond the fog.');
});

void test('version 3 drafts receive safe publication defaults', () => {
  const legacy = structuredClone(createDefaultProject()) as unknown as Record<
    string,
    unknown
  >;
  legacy.schemaVersion = 3;
  delete legacy.description;
  delete legacy.tags;
  delete legacy.language;
  delete legacy.contentRating;
  delete legacy.visibility;
  delete legacy.publications;

  const restored = restoreProject(JSON.stringify(legacy));

  assert.ok(restored);
  assert.equal(restored.description, '');
  assert.deepEqual(restored.tags, []);
  assert.equal(restored.language, 'en');
  assert.equal(restored.contentRating, 'all-ages');
  assert.equal(restored.visibility, 'private');
  assert.deepEqual(restored.publications, []);
});

void test('draft recovery selects the newest valid journal slot', () => {
  const older = createDefaultProject();
  older.title = 'Older valid draft';
  older.updatedAt = '2026-08-29T00:01:00.000Z';
  const newer = createDefaultProject();
  newer.title = 'Newest valid draft';
  newer.updatedAt = '2026-08-29T00:02:00.000Z';

  const restored = restoreNewestProject([
    { source: 'corrupt', value: '{bad json' },
    { source: 'slot-a', value: JSON.stringify(older) },
    { source: 'slot-b', value: JSON.stringify(newer) },
  ]);

  assert.ok(restored);
  assert.equal(restored.source, 'slot-b');
  assert.equal(restored.project.title, 'Newest valid draft');
});

void test('draft recovery returns null when every candidate is invalid', () => {
  assert.equal(
    restoreNewestProject([
      { source: 'empty', value: null },
      { source: 'corrupt', value: 'not json' },
    ]),
    null,
  );
});

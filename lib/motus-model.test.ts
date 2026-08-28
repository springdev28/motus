import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MOTION_SCHEMA_VERSION,
  PROJECT_SCHEMA_VERSION,
  compileElementMotion,
  createDefaultProject,
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
  assert.equal(restoreProject('{"schemaVersion":3,"title":"Broken","scenes":[]}'), null);
  assert.equal(restoreProject('not json'), null);
});

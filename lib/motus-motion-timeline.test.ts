import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildMotionTimelineTracks,
  clampMotionTimelineTime,
  getMotionTimelineDuration,
  getMotionTimelineSpanPercentages,
  getMotionTimelineTicks,
} from './motus-motion-timeline.ts';
import { createElement, createMotionBlock } from './motus-model.ts';

void test('timeline time and percentages stay inside the compiled duration', () => {
  assert.equal(clampMotionTimelineTime(-100, 900), 0);
  assert.equal(clampMotionTimelineTime(450, 900), 450);
  assert.equal(clampMotionTimelineTime(1_200, 900), 900);
  assert.deepEqual(
    getMotionTimelineSpanPercentages(
      { startsAtMs: 250, durationMs: 500 },
      1_000,
    ),
    { left: 25, width: 50 },
  );
  assert.deepEqual(
    getMotionTimelineSpanPercentages(
      { startsAtMs: 900, durationMs: 500 },
      1_000,
    ),
    { left: 90, width: 10 },
  );
});

void test('timeline ticks include exact start and end times', () => {
  assert.deepEqual(
    getMotionTimelineTicks(2_000, 4),
    [0, 500, 1_000, 1_500, 2_000],
  );
  assert.deepEqual(getMotionTimelineTicks(Number.NaN), [0, 0, 0, 0, 0, 0]);
});

void test('selected timeline exposes sequential waits and actions', () => {
  const element = createElement('shape', 1, { id: 'hero', name: 'Hero' });
  const wait = createMotionBlock('wait', 'wait');
  wait.durationMs = 250;
  const move = createMotionBlock('move', 'move');
  move.durationMs = 750;
  element.motion.blocks = [element.motion.blocks[0], wait, move];

  const [track] = buildMotionTimelineTracks([element], 'selected', 'hero');
  assert.equal(track.elementName, 'Hero');
  assert.equal(track.durationMs, 1_000);
  assert.deepEqual(
    track.spans.map((span) => [span.blockId, span.startsAtMs, span.durationMs]),
    [
      ['wait', 0, 250],
      ['move', 250, 750],
    ],
  );
  assert.equal(track.laneCount, 1);
});

void test('parallel blocks occupy separate lanes at the same time', () => {
  const element = createElement('shape', 1, { id: 'hero' });
  const parallel = createMotionBlock('parallel', 'parallel');
  const move = createMotionBlock('move', 'move');
  const rotate = createMotionBlock('rotate', 'rotate');
  move.durationMs = 800;
  rotate.durationMs = 800;
  parallel.children = [move, rotate];
  element.motion.blocks = [element.motion.blocks[0], parallel];

  const [track] = buildMotionTimelineTracks([element], 'selected', 'hero');
  assert.equal(track.laneCount, 2);
  assert.deepEqual(
    track.spans.map((span) => [span.startsAtMs, span.durationMs, span.lane]),
    [
      [0, 800, 0],
      [0, 800, 1],
    ],
  );
});

void test('repeated blocks expose every compiled instance in chronological order', () => {
  const element = createElement('shape', 1, { id: 'looping' });
  const repeat = createMotionBlock('repeat', 'repeat');
  repeat.repetitions = 3;
  const move = createMotionBlock('move', 'move');
  move.durationMs = 300;
  repeat.children = [move];
  element.motion.blocks = [element.motion.blocks[0], repeat];

  const [track] = buildMotionTimelineTracks([element], 'selected', 'looping');
  assert.equal(track.durationMs, 900);
  assert.deepEqual(
    track.spans.map((span) => [span.blockId, span.startsAtMs, span.endMs]),
    [
      ['move', 0, 300],
      ['move', 300, 600],
      ['move', 600, 900],
    ],
  );
  assert.equal(new Set(track.spans.map((span) => span.instanceId)).size, 3);
});

void test('scene timelines omit hidden and actionless layers and use the longest duration', () => {
  const short = createElement('shape', 1, { id: 'short', name: 'Short' });
  const shortMove = createMotionBlock('move', 'short-move');
  shortMove.durationMs = 400;
  short.motion.blocks = [short.motion.blocks[0], shortMove];

  const long = createElement('shape', 2, { id: 'long', name: 'Long' });
  const longMove = createMotionBlock('move', 'long-move');
  longMove.durationMs = 1_200;
  long.motion.blocks = [long.motion.blocks[0], longMove];

  const hidden = createElement('shape', 3, { id: 'hidden', visible: false });
  const idle = createElement('shape', 4, { id: 'idle' });
  idle.motion.blocks = [idle.motion.blocks[0]];
  const tracks = buildMotionTimelineTracks(
    [short, long, hidden, idle],
    'scene',
  );
  assert.deepEqual(
    tracks.map((track) => track.elementId),
    ['short', 'long'],
  );
  assert.equal(getMotionTimelineDuration(tracks), 1_200);
});

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  extractHolisticRigJoints,
  getRigJointPivot,
} from './motus-ai/holistic-joints.ts';

function createPoseLandmarks() {
  return Array.from({ length: 33 }, (_, index) => ({
    x: index / 100,
    y: (index + 10) / 100,
    z: 0,
    visibility: index === 13 ? 0.82 : 0.9,
  }));
}

void test('Holistic pose landmarks map to named rig joints', () => {
  const joints = extractHolisticRigJoints(createPoseLandmarks());

  assert.equal(joints.length, 15);
  assert.deepEqual(
    joints.find((joint) => joint.id === 'left-elbow'),
    {
      id: 'left-elbow',
      label: 'Performer left elbow',
      x: 0.13,
      y: 0.23,
      confidence: 0.82,
    },
  );
  const neck = joints.find((joint) => joint.id === 'neck');
  assert.equal(neck?.id, 'neck');
  assert.equal(neck?.label, 'Neck');
  assert.ok(Math.abs((neck?.x ?? 0) - 0.115) < Number.EPSILON);
  assert.equal(neck?.y, 0.215);
  assert.equal(neck?.confidence, 0.9);
});

void test('joint positions convert into crop-local pivot coordinates', () => {
  const crop = { cropX: 20, cropY: 30, cropWidth: 40, cropHeight: 20 };

  assert.deepEqual(getRigJointPivot({ x: 0.4, y: 0.4 }, crop), {
    x: 50,
    y: 50,
    inside: true,
  });
  assert.deepEqual(getRigJointPivot({ x: 0.1, y: 0.7 }, crop), {
    x: 0,
    y: 100,
    inside: false,
  });
});

void test('freeform part masks exclude joints outside the actual silhouette', () => {
  const crop = {
    cropX: 20,
    cropY: 20,
    cropWidth: 60,
    cropHeight: 60,
    maskPoints: [
      { x: 20, y: 20 },
      { x: 80, y: 20 },
      { x: 20, y: 80 },
    ],
  };

  assert.equal(getRigJointPivot({ x: 0.3, y: 0.3 }, crop).inside, true);
  assert.equal(getRigJointPivot({ x: 0.7, y: 0.7 }, crop).inside, false);
});

void test('out-of-frame landmarks do not become clamped edge joints', () => {
  const landmarks = createPoseLandmarks();
  landmarks[13].x = 1.1;
  assert.equal(
    extractHolisticRigJoints(landmarks).some(
      (joint) => joint.id === 'left-elbow',
    ),
    false,
  );
});

void test('short landmark arrays produce no misleading rig joints', () => {
  assert.deepEqual(
    extractHolisticRigJoints(createPoseLandmarks().slice(0, 28)),
    [],
  );
});

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MAX_ELEMENT_NAME_LENGTH,
  validateElementRigPartName,
} from './motus-model.ts';

void test('normalizes a meaningful rig part name', () => {
  assert.deepEqual(validateElementRigPartName('  Front hair  ', ['Head']), {
    issue: null,
    name: 'Front hair',
  });
});

void test('rejects blank rig part names', () => {
  assert.deepEqual(validateElementRigPartName(' \n\t ', []), {
    issue: 'required',
    name: '',
  });
});

void test('rejects duplicate sibling part names without case or width loopholes', () => {
  assert.deepEqual(validateElementRigPartName('HEAD', ['  Head  ']), {
    issue: 'duplicate',
    name: 'HEAD',
  });
  assert.deepEqual(validateElementRigPartName('Ｈａｉｒ', ['Hair']), {
    issue: 'duplicate',
    name: 'Ｈａｉｒ',
  });
});

void test('allows the same semantic role under another source branch', () => {
  assert.deepEqual(validateElementRigPartName('Head', ['Hair', 'Left arm']), {
    issue: null,
    name: 'Head',
  });
});

void test('rejects names beyond the persisted layer-name limit', () => {
  const name = 'x'.repeat(MAX_ELEMENT_NAME_LENGTH + 1);
  assert.deepEqual(validateElementRigPartName(name, []), {
    issue: 'too-long',
    name,
  });
});

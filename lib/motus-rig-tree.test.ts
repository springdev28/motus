import assert from 'node:assert/strict';
import test from 'node:test';

import { createElement, type MotusElement } from './motus-model.ts';
import {
  buildCollapsibleRigLayerTree,
  type FlatRigLayerRow,
} from './motus-rig-tree.ts';

function layer(id: string, parentId: string | null): MotusElement {
  return createElement('shape', 1, { id, name: id, parentId });
}

function row(
  id: string,
  parentId: string | null,
  depth: number,
): FlatRigLayerRow {
  return { element: layer(id, parentId), depth };
}

void test('collapses nested branches while preserving full row order', () => {
  const fullRows = [
    row('body', null, 0),
    row('arm', 'body', 1),
    row('hand', 'arm', 2),
    row('head', 'body', 1),
    row('hair', 'head', 2),
    row('prop', null, 0),
  ];

  const tree = buildCollapsibleRigLayerTree(fullRows, new Set(['arm']));

  assert.deepEqual(
    tree.rows.map((item) => item.element.id),
    ['body', 'arm', 'head', 'hair', 'prop'],
  );
  assert.deepEqual(tree.activeCollapsedIds, ['arm']);
  assert.deepEqual(tree.rowById.get('body')?.childIds, ['arm', 'head']);
  assert.equal(tree.rowById.get('arm')?.parentId, 'body');
  assert.equal(tree.rowById.get('arm')?.firstChildId, 'hand');
  assert.equal(tree.rowById.get('arm')?.isCollapsed, true);
  assert.equal(tree.rowById.get('arm')?.previousVisibleId, 'body');
  assert.equal(tree.rowById.get('arm')?.nextVisibleId, 'head');
  assert.equal(tree.focusTargetIdByElementId.get('hand'), 'arm');
  assert.equal(tree.focusTargetIdByElementId.get('hair'), 'hair');

  const rootCollapsed = buildCollapsibleRigLayerTree(fullRows, ['body']);
  assert.deepEqual(
    rootCollapsed.rows.map((item) => item.element.id),
    ['body', 'prop'],
  );
  assert.equal(rootCollapsed.focusTargetIdByElementId.get('hand'), 'body');
  assert.equal(rootCollapsed.focusTargetIdByElementId.get('hair'), 'body');
});

void test('prunes stale collapse IDs after branches are deleted', () => {
  const survivingRows = [row('survivor', null, 0)];
  const tree = buildCollapsibleRigLayerTree(survivingRows, [
    'deleted-parent',
    'survivor',
  ]);

  assert.deepEqual(tree.activeCollapsedIds, []);
  assert.deepEqual(
    tree.rows.map((item) => item.element.id),
    ['survivor'],
  );
  assert.equal(tree.rowById.get('survivor')?.isCollapsed, false);
  assert.equal(tree.focusTargetIdByElementId.has('deleted-parent'), false);
});

void test('normalizes malformed rows into a finite acyclic navigation tree', () => {
  const malformed = [
    row('cycle-a', 'cycle-b', 40),
    row('cycle-b', 'cycle-a', 1),
    row('cycle-a', null, 0),
    row('orphan', 'missing', Number.NaN),
  ];

  const tree = buildCollapsibleRigLayerTree(malformed, ['cycle-a']);

  assert.deepEqual(
    tree.rows.map((item) => [item.element.id, item.depth, item.parentId]),
    [
      ['cycle-a', 0, null],
      ['orphan', 0, null],
    ],
  );
  assert.deepEqual(tree.activeCollapsedIds, ['cycle-a']);
  assert.equal(tree.focusTargetIdByElementId.get('cycle-b'), 'cycle-a');
});

void test('handles very deep rows iteratively', () => {
  const template = layer('level-0', null);
  const fullRows = Array.from({ length: 2_000 }, (_, index) => ({
    depth: index,
    element: {
      ...template,
      id: `level-${index}`,
      name: `level-${index}`,
      parentId: index === 0 ? null : `level-${index - 1}`,
    },
  }));

  const tree = buildCollapsibleRigLayerTree(fullRows, ['level-1500']);

  assert.equal(tree.rows.length, 1_501);
  assert.equal(tree.rows.at(-1)?.element.id, 'level-1500');
  assert.equal(tree.rows.at(-1)?.depth, 1_500);
  assert.equal(tree.focusTargetIdByElementId.get('level-1999'), 'level-1500');
});

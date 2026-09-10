import assert from 'node:assert/strict';
import test from 'node:test';
import { getPageTurnGeometry } from './motus-page-turn.ts';
import { getReaderNavigationPresentation } from './motus-reader-navigation.ts';
for (const direction of ['ltr', 'rtl'] as const) {
  for (const intent of ['next', 'previous'] as const) {
    void test(`${direction} ${intent}: the outgoing sheet lands across the spine`, () => {
      const edge = getReaderNavigationPresentation(direction, intent).entryEdge;
      const turn = getPageTurnGeometry(edge);
      const right = (direction === 'ltr') === (intent === 'next');
      assert.equal(turn.departingIndex, right ? 1 : 0);
      assert.equal(turn.landingIndex, right ? 0 : 1);
      assert.equal(turn.rotation, right ? -180 : 180);
      assert.equal(turn.slideSign, right ? 1 : -1);
    });
  }
}

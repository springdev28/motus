import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {
  APPEARANCE_BOOTSTRAP,
  parseAppearance,
  resolveAppearance,
} from './motus-appearance.ts';

void test('appearance defaults to light, regardless of the device theme', () => {
  for (const value of [null, '', 'unknown', 'light']) {
    assert.equal(resolveAppearance(parseAppearance(value), true), 'light');
  }
});
void test('only the explicit system option follows device appearance', () => {
  assert.equal(resolveAppearance('system', true), 'dark');
  assert.equal(resolveAppearance('system', false), 'light');
  assert.equal(resolveAppearance('dark', false), 'dark');
  assert.equal(resolveAppearance('light', true), 'light');
});
void test('pre-paint bootstrap restores a saved theme on every document navigation', () => {
  for (const [value, expected] of [
    ['dark', 'dark'],
    ['light', 'light'],
    ['system', 'dark'],
    [null, 'light'],
  ]) {
    const html = {
      dataset: {} as Record<string, string>,
      style: {} as Record<string, string>,
      classList: {
        toggle: (_name: string, active: boolean) =>
          assert.equal(active, expected === 'dark'),
      },
    };
    vm.runInNewContext(APPEARANCE_BOOTSTRAP, {
      document: { documentElement: html },
      localStorage: { getItem: () => value },
      matchMedia: () => ({ matches: true }),
    });
    assert.equal(html.dataset.theme, expected);
    assert.equal(html.style.colorScheme, expected);
  }
});
void test('blocked storage still paints the documented light default', () => {
  const html = {
    dataset: {} as Record<string, string>,
    style: {} as Record<string, string>,
  };
  vm.runInNewContext(APPEARANCE_BOOTSTRAP, {
    document: { documentElement: html },
    localStorage: {
      getItem: () => {
        throw new Error('blocked');
      },
    },
  });
  assert.equal(html.dataset.theme, 'light');
});

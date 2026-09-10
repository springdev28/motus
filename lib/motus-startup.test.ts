import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

void test('Hostinger can require the entry and startup errors remain visible', () => {
  const result = spawnSync(
    process.execPath,
    ['-e', "require('./server.js'); console.log('entry-loaded');"],
    {
      cwd: fileURLToPath(new URL('../', import.meta.url)),
      env: { ...process.env, PORT: 'invalid-test-port' },
      encoding: 'utf8',
      timeout: 15000,
    },
  );
  assert.ifError(result.error);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /entry-loaded/);
  assert.match(result.stderr, /Motus failed to start:[\s\S]*Invalid PORT/);
  assert.doesNotMatch(result.stderr, /ERR_REQUIRE_ASYNC_MODULE/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { parseChecksManifest } from '../src/checks-manifest.mjs';

const manifest = (mountCount) => JSON.stringify({
  schemaVersion: 1,
  dependencyMounts: ['node_modules', ...Array.from({ length: mountCount - 1 }, (_, index) => `packages/p${index}/node_modules`)],
  checks: [{ id: 'unit', argv: ['node', '-e', '0'], timeoutMs: 1000 }],
});

test('a checks manifest takes a node_modules per package of a large workspace', () => {
  assert.equal(parseChecksManifest(manifest(64)).dependencyMounts.length, 64);
});

test('a checks manifest refuses more than 64 dependency mounts', () => {
  assert.throws(() => parseChecksManifest(manifest(65)), (error) => error.code === 'CHECKS_MANIFEST_INVALID' && /at most 64/u.test(error.message));
});

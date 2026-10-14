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

const withAddressSpace = (addressSpaceBytes) => JSON.stringify({
  schemaVersion: 1,
  dependencyMounts: [],
  checks: [{ id: 'unit', argv: ['node', '-e', '0'], timeoutMs: 1000, addressSpaceBytes }],
});

test('a check may raise its address-space limit up to 64 GiB', () => {
  assert.equal(parseChecksManifest(withAddressSpace(32 * 1024 ** 3)).checks[0].addressSpaceBytes, 32 * 1024 ** 3);
  assert.equal(parseChecksManifest(JSON.stringify({ schemaVersion: 1, dependencyMounts: [], checks: [{ id: 'unit', argv: ['node'] }] })).checks[0].addressSpaceBytes, undefined);
});

test('a check address-space limit outside 1 GiB to 64 GiB is refused', () => {
  for (const value of [64 * 1024 ** 3 + 1, 1024 ** 3 - 1, 1.5, '8']) {
    assert.throws(() => parseChecksManifest(withAddressSpace(value)), (error) => error.code === 'CHECKS_MANIFEST_INVALID' && /addressSpaceBytes/u.test(error.message), String(value));
  }
});

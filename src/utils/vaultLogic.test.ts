import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateStorageStats,
  classifyMimeType,
  countProjectFiles,
  filterVaultFiles,
  formatBytes,
  getExpiryDateFromPreset,
  isShareExpired,
  validateProjectInput,
  validateShareAvailability,
} from './vaultLogic';
import type { Project, VaultFile } from '../types/vault';

const sampleFiles: VaultFile[] = [
  {
    id: 'f1',
    ownerId: 'u1',
    projectId: 'p1',
    name: 'Brand-Guidelines.pdf',
    mimeType: 'application/pdf',
    size: 1024 * 1024 * 4,
    category: 'document',
    isFavorite: true,
    isTrashed: false,
    trashedAt: null,
    description: 'Core brand guide',
    previewUrl: null,
    createdAt: '2026-11-01T10:00:00Z',
    updatedAt: '2026-11-01T10:00:00Z',
  },
  {
    id: 'f2',
    ownerId: 'u1',
    projectId: 'p1',
    name: 'Hero-Artwork.png',
    mimeType: 'image/png',
    size: 1024 * 1024 * 2,
    category: 'image',
    isFavorite: false,
    isTrashed: false,
    trashedAt: null,
    description: 'Product hero render',
    previewUrl: '/img.png',
    createdAt: '2026-11-02T10:00:00Z',
    updatedAt: '2026-11-02T10:00:00Z',
  },
  {
    id: 'f3',
    ownerId: 'u1',
    projectId: 'p2',
    name: 'Old-Draft.fig',
    mimeType: 'application/octet-stream',
    size: 1024 * 1024 * 6,
    category: 'design',
    isFavorite: true,
    isTrashed: true,
    trashedAt: '2026-11-03T10:00:00Z',
    description: 'Archived draft',
    previewUrl: null,
    createdAt: '2026-11-01T10:00:00Z',
    updatedAt: '2026-11-03T10:00:00Z',
  },
];

const sampleProjects: Project[] = [
  {
    id: 'p1',
    ownerId: 'u1',
    name: 'Aether Packaging',
    clientName: 'Aether Skincare',
    clientEmail: 'brand@aether.co',
    description: 'Identity launch',
    status: 'active',
    accentColor: 'cyan',
    createdAt: '2026-11-01T10:00:00Z',
    updatedAt: '2026-11-01T10:00:00Z',
  },
  {
    id: 'p2',
    ownerId: 'u1',
    name: 'Coral Studio',
    clientName: 'Coral Ventures',
    clientEmail: 'team@coral.io',
    description: 'Web redesign',
    status: 'review',
    accentColor: 'purple',
    createdAt: '2026-11-01T10:00:00Z',
    updatedAt: '2026-11-01T10:00:00Z',
  },
];

test('formatBytes formats sizes cleanly', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(512), '512 B');
  assert.equal(formatBytes(1536), '1.5 KB');
  assert.equal(formatBytes(1024 * 1024 * 12), '12 MB');
});

test('classifyMimeType maps design, image, media, and docs accurately', () => {
  assert.equal(classifyMimeType('image/jpeg', 'photo.jpg'), 'image');
  assert.equal(classifyMimeType('application/octet-stream', 'system.fig'), 'design');
  assert.equal(classifyMimeType('video/mp4', 'reel.mp4'), 'media');
  assert.equal(classifyMimeType('application/pdf', 'contract.pdf'), 'document');
  assert.equal(classifyMimeType('application/zip', 'bundle.zip'), 'archive');
});

test('calculateStorageStats sums totals and categories accurately', () => {
  const stats = calculateStorageStats(sampleFiles, 1024 * 1024 * 24);
  assert.equal(stats.activeCount, 2);
  assert.equal(stats.trashedCount, 1);
  assert.equal(stats.usedBytes, 1024 * 1024 * 12);
  assert.equal(stats.percentUsed, 50);
  assert.equal(stats.byCategory.document, 1024 * 1024 * 4);
  assert.equal(stats.byCategory.image, 1024 * 1024 * 2);
  assert.equal(stats.byCategory.design, 1024 * 1024 * 6);
});

test('share expiration and availability rules behave strictly', () => {
  const now = Date.parse('2026-11-10T12:00:00Z');
  assert.equal(isShareExpired(null, now), false);
  assert.equal(isShareExpired('2026-11-09T12:00:00Z', now), true);
  assert.equal(isShareExpired('2026-11-15T12:00:00Z', now), false);

  assert.deepEqual(validateShareAvailability({ isRevoked: true, expiresAt: null }, now), {
    valid: false,
    reason: 'revoked',
  });
  assert.deepEqual(
    validateShareAvailability({ isRevoked: false, expiresAt: '2026-11-01T00:00:00Z' }, now),
    { valid: false, reason: 'expired' }
  );
  assert.deepEqual(
    validateShareAvailability({ isRevoked: false, expiresAt: '2026-11-20T00:00:00Z' }, now),
    { valid: true }
  );

  const plus7d = getExpiryDateFromPreset('7d', undefined, now);
  assert.equal(plus7d, '2026-11-17T12:00:00.000Z');
  assert.equal(getExpiryDateFromPreset('never', undefined, now), null);
});

test('filterVaultFiles respects view, search query, category, and project', () => {
  assert.equal(filterVaultFiles(sampleFiles, { view: 'all' }).length, 2);
  assert.equal(filterVaultFiles(sampleFiles, { view: 'favorites' }).length, 1);
  assert.equal(filterVaultFiles(sampleFiles, { view: 'trash' }).length, 1);
  assert.equal(filterVaultFiles(sampleFiles, { view: 'all', query: 'hero' })[0].id, 'f2');
  assert.equal(filterVaultFiles(sampleFiles, { view: 'all', category: 'document' })[0].id, 'f1');
});

test('countProjectFiles ignores trashed files', () => {
  const counts = countProjectFiles(sampleFiles, sampleProjects);
  assert.equal(counts.p1.count, 2);
  assert.equal(counts.p2.count, 0);
});

test('validateProjectInput rejects empty or invalid inputs', () => {
  assert.ok(validateProjectInput({ name: 'A', clientName: 'Acme' }));
  assert.ok(validateProjectInput({ name: 'Site', clientName: 'X' }));
  assert.ok(validateProjectInput({ name: 'Site', clientName: 'Acme', clientEmail: 'bad-email' }));
  assert.equal(
    validateProjectInput({ name: 'Ocean Brand', clientName: 'Acme', clientEmail: 'hi@acme.co' }),
    null
  );
});

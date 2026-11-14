import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLanguage, OWNER_NAME, OWNER_WORKSPACE, translations } from './translations';

function collectLeafKeys(obj: unknown, prefix = ''): string[] {
  if (typeof obj === 'string') {
    return [prefix];
  }
  if (Array.isArray(obj)) {
    return obj.flatMap((item, idx) => collectLeafKeys(item, `${prefix}[${idx}]`));
  }
  if (obj && typeof obj === 'object') {
    return Object.entries(obj).flatMap(([key, val]) =>
      collectLeafKeys(val, prefix ? `${prefix}.${key}` : key)
    );
  }
  return [];
}

function getValueAtPath(obj: unknown, path: string): unknown {
  const normalized = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let current: unknown = obj;
  for (const part of normalized) {
    if (current && typeof current === 'object') {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

test('English and Bangla translation trees have identical structure and non-empty values', () => {
  const enKeys = collectLeafKeys(translations.en);
  const bnKeys = collectLeafKeys(translations.bn);

  assert.deepEqual(bnKeys, enKeys);
  assert.ok(enKeys.length > 100, 'Expected comprehensive bilingual dictionary');

  for (const key of enKeys) {
    const enVal = getValueAtPath(translations.en, key);
    const bnVal = getValueAtPath(translations.bn, key);
    assert.equal(typeof enVal, 'string', `Missing string in en at ${key}`);
    assert.equal(typeof bnVal, 'string', `Missing string in bn at ${key}`);
    assert.ok((enVal as string).trim().length > 0, `Empty en string at ${key}`);
    assert.ok((bnVal as string).trim().length > 0, `Empty bn string at ${key}`);
  }
});

test('Owner branding uses RAKIB and normalizeLanguage handles safe fallbacks', () => {
  assert.equal(OWNER_NAME, 'RAKIB');
  assert.equal(OWNER_WORKSPACE, "RAKIB's ClientVault");
  assert.equal(normalizeLanguage('bn'), 'bn');
  assert.equal(normalizeLanguage('en'), 'en');
  assert.equal(normalizeLanguage(null), 'en');
  assert.equal(normalizeLanguage('fr'), 'en');
});

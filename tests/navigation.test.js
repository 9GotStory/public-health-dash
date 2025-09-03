import test from 'node:test';
import assert from 'node:assert/strict';

import { deriveBackLevelFromTarget, deriveBackLevelFromDetail } from '../src/lib/navigation.ts';

const rec = (group, main, sub, target) => ({
  ['ประเด็นขับเคลื่อน']: group,
  ['ตัวชี้วัดหลัก']: main,
  ['ตัวชี้วัดย่อย']: sub,
  ['กลุ่มเป้าหมาย']: target,
  ['เป้าหมาย']: 100,
  ['ผลงาน']: 50,
  ['เกณฑ์ผ่าน (%)']: 80,
});

test('deriveBackLevelFromTarget returns main when no subs', () => {
  const data = [rec('G', 'M1', '', 'T1')];
  assert.equal(deriveBackLevelFromTarget(data, 'G', 'M1'), 'main');
});

test('deriveBackLevelFromTarget returns sub when subs exist', () => {
  const data = [rec('G', 'M1', 'S1', 'T1')];
  assert.equal(deriveBackLevelFromTarget(data, 'G', 'M1'), 'sub');
});

test('deriveBackLevelFromDetail prefers target when targets exist', () => {
  const data = [rec('G', 'M1', 'S1', 'T1')];
  assert.equal(deriveBackLevelFromDetail(data, 'G', 'M1', 'S1'), 'target');
});

test('deriveBackLevelFromDetail falls back to sub then main', () => {
  const dataNoTarget = [rec('G', 'M1', 'S1', '')];
  assert.equal(deriveBackLevelFromDetail(dataNoTarget, 'G', 'M1', 'S1'), 'sub');

  const dataNoSub = [rec('G', 'M1', '', '')];
  assert.equal(deriveBackLevelFromDetail(dataNoSub, 'G', 'M1', ''), 'main');
});


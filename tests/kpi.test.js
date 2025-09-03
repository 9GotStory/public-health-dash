import test from 'node:test';
import assert from 'node:assert/strict';

// Import TS module with tsx loader support
import { calculatePercentage, getThresholdStatus, getAbsoluteStatus, getStatusColor, getProgressClass } from '../src/lib/kpi.ts';

test('calculatePercentage handles blanks and zero target', () => {
  assert.equal(calculatePercentage({ เป้าหมาย: '', ผลงาน: '' }), null);
  assert.equal(calculatePercentage({ เป้าหมาย: '0', ผลงาน: '0' }), null);
  assert.equal(calculatePercentage({ เป้าหมาย: 0, ผลงาน: 10 }), null);
});

test('calculatePercentage computes correct percentage', () => {
  const pct = calculatePercentage({ เป้าหมาย: 200, ผลงาน: 50 });
  assert.ok(pct !== null);
  assert.equal(Math.round(pct * 10) / 10, 25);
});

test('getThresholdStatus classifies by threshold', () => {
  assert.equal(getThresholdStatus(80, 80), 'passed');
  assert.equal(getThresholdStatus(79, 80), 'near');
  assert.equal(getThresholdStatus(64, 80), 'near'); // exactly 80% of threshold
  assert.equal(getThresholdStatus(63, 80), 'failed');
  assert.equal(getThresholdStatus(63, 70), 'near');
  assert.equal(getThresholdStatus(55, 70), 'failed');
  assert.equal(getThresholdStatus(null, 70), 'failed');
});

test('getAbsoluteStatus classifies by absolute cutoffs', () => {
  assert.equal(getAbsoluteStatus(81), 'passed');
  assert.equal(getAbsoluteStatus(80), 'passed');
  assert.equal(getAbsoluteStatus(60), 'near');
  assert.equal(getAbsoluteStatus(59.9), 'failed');
});

test('UI class helpers return consistent classes', () => {
  assert.match(getStatusColor(85), /success/);
  assert.match(getStatusColor(65), /warning/);
  assert.match(getStatusColor(10), /destructive/);

  assert.match(getProgressClass(85), /success/);
  assert.match(getProgressClass(65), /warning/);
  assert.match(getProgressClass(10), /destructive/);
});

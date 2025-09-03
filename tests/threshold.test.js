import test from 'node:test';
import assert from 'node:assert/strict';

import { getThresholdStatus, getStatusColorByThreshold, getProgressClassByThreshold } from '../src/lib/kpi.ts';

test('getThresholdStatus falls back when threshold invalid', () => {
  // invalid threshold -> absolute policy (80/60)
  assert.equal(getThresholdStatus(81, 0), 'passed');
  assert.equal(getThresholdStatus(65, Number.NaN), 'near');
  assert.equal(getThresholdStatus(59, -10), 'failed');
});

test('threshold-aware helpers map to classes correctly', () => {
  assert.match(getStatusColorByThreshold(90, 90), /success/);
  assert.match(getStatusColorByThreshold(75, 90), /warning/);
  assert.match(getStatusColorByThreshold(10, 90), /destructive/);

  assert.match(getProgressClassByThreshold(95, 90), /success/);
  assert.match(getProgressClassByThreshold(75, 90), /warning/);
  assert.match(getProgressClassByThreshold(20, 90), /destructive/);
});

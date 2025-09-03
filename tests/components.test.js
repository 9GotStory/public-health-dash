import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { TooltipProvider } from '../src/components/ui/tooltip.tsx';

// TS components via tsx loader
import { ContextPath } from '../src/components/dashboard/ContextPath.tsx';
import { TargetBadges } from '../src/components/dashboard/TargetBadges.tsx';

test('ContextPath renders labels and badges as expected', () => {
  const html = renderToString(
    React.createElement(
      TooltipProvider,
      null,
      React.createElement(ContextPath, {
        groupName: 'กลุ่ม A',
        mainKPIName: 'หลัก 1',
        subKPIName: 'ย่อย 1',
        targets: ['T1', 'T2', 'T3'],
        showBadges: true,
      })
    )
  );
  assert.match(html, /กลุ่ม A/);
  assert.match(html, /ตัวชี้วัดหลัก:.*หลัก 1/);
  assert.match(html, /ตัวชี้วัดย่อย:.*ย่อย 1/);
  assert.match(html, /กลุ่มเป้าหมาย/);
});

test('TargetBadges shows +N when exceeding maxShown', () => {
  const items = ['A','B','C','D','E','F']; // 6 items, default maxShown=5
  const html = renderToString(
    React.createElement(TooltipProvider, null, React.createElement(TargetBadges, { items, withTooltip: false }))
  );
  // Expect an indicator of more items exists
  assert.match(html, /เพิ่มเติม/);
});

import {describe, expect, it} from 'vitest';
import {
  buildRescueReport,
  createRescueCase,
  getRescueActionPlan,
  parseRescueCase,
  rescueReportAsText,
} from './rescue-case.js';

describe('local Rescue case contract', () => {
  it('starts every safety step pending and builds an honest local report', () => {
    const rescueCase = createRescueCase({now: '2026-08-09T12:00:00.000Z', id: 'case-test'});
    const report = buildRescueReport({
      ...rescueCase,
      amountVnd: '800000',
      completedAt: {bank: '2026-08-09T12:02:00.000Z'},
      evidence: [{
        id: 'file-1',
        name: 'bien-chung.png',
        type: 'image/png',
        size: 2048,
        addedAt: '2026-08-09T12:03:00.000Z',
      }],
    }, '2026-08-09T12:04:00.000Z');

    expect(rescueCase.completedAt).toEqual({});
    expect(report.storage).toBe('local_device');
    expect(report.completedActions).toEqual([{step: 'bank', completedAt: '2026-08-09T12:02:00.000Z'}]);
    expect(rescueReportAsText(report)).toContain('bien-chung.png');
    expect(rescueReportAsText(report)).toContain('chưa được gửi tới ngân hàng');
  });

  it('rejects invalid stored state and normalizes the amount', () => {
    const rescueCase = createRescueCase({now: '2026-08-09T12:00:00.000Z', id: 'case-test'});
    expect(parseRescueCase({...rescueCase, amountVnd: '1.200.000 đ'})?.amountVnd).toBe('1200000');
    expect(parseRescueCase({...rescueCase, scenario: 'invalid'})).toBeUndefined();
    expect(parseRescueCase({...rescueCase, completedAt: {bank: 'not-a-date'}})).toBeUndefined();
  });

  it('uses deterministic safety policy instead of asking AI to invent urgent actions', () => {
    expect(getRescueActionPlan('none')[0]).toMatchObject({id: 'bank', title: expect.stringContaining('Dừng')});
    expect(getRescueActionPlan('money')[0]).toMatchObject({id: 'bank', title: expect.stringContaining('ngân hàng')});
    expect(getRescueActionPlan('otp')[0]).toMatchObject({id: 'bank', title: expect.stringContaining('Khóa giao dịch')});
    expect(getRescueActionPlan('otp').map((item) => item.id)).toEqual(['bank', 'account', 'evidence', 'report']);
  });
});

import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

describe('product truth guard', () => {
  it('keeps resolved mock labels and hard-coded Rescue receipts out of production UI', () => {
    const app = source('./App.tsx');
    const rescue = source('./features/rescue/RescueView.tsx');
    const productionUi = `${app}\n${rescue}`;

    ['AI đang hoạt động', 'Chặn & cảnh báo', 'Gọi ngay', '2 tệp', '13:42, hôm nay']
      .forEach((claim) => expect(productionUi).not.toContain(claim));
  });

  it('does not render Workspace as connected before OAuth receipts exist', () => {
    const rescue = source('./features/rescue/RescueView.tsx');
    expect(rescue).toContain('Chưa kết nối');
    expect(rescue).not.toContain('checked={true}');
    expect(rescue).not.toContain('driveEnabled');
    expect(rescue).not.toContain('calendarEnabled');
  });
});

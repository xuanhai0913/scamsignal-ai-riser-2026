import {beforeEach, describe, expect, it} from 'vitest';

import {clearPendingIntake, consumePendingIntake, setPendingIntake} from './pending-intake';

describe('pending intake handoff', () => {
  beforeEach(clearPendingIntake);

  it('keeps sensitive content in memory and consumes it only once', () => {
    const draft = {kind: 'text' as const, text: 'Tin nhắn đáng ngờ'};
    setPendingIntake(draft);

    expect(consumePendingIntake()).toEqual(draft);
    expect(consumePendingIntake()).toBeUndefined();
  });
});

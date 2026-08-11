export type RedactionKind = 'otp' | 'password' | 'card';

export type RedactionResult = {
  value: string;
  kinds: RedactionKind[];
  count: number;
};

const REDACTION_RULES: Array<{
  kind: RedactionKind;
  pattern: RegExp;
  replacement: string;
}> = [
  {
    kind: 'password',
    pattern: /\b(mật\s*khẩu|password|passcode)\s*[:=\-]?\s*([^\s,;.]{4,})/giu,
    replacement: '$1: [ĐÃ ẨN]',
  },
  {
    kind: 'otp',
    pattern: /\b(otp|mã\s*(?:xác\s*thực|bảo\s*mật|giao\s*dịch))\s*[:=\-]?\s*(\d{4,8})\b/giu,
    replacement: '$1: [ĐÃ ẨN]',
  },
  {
    kind: 'card',
    pattern: /\b(?:\d[ -]?){13,19}\b/g,
    replacement: '[DÃY SỐ THẺ ĐÃ ẨN]',
  },
];

export function redactSensitiveText(input: string): RedactionResult {
  const kinds: RedactionKind[] = [];
  let count = 0;
  let value = input;

  for (const rule of REDACTION_RULES) {
    value = value.replace(rule.pattern, (...args: unknown[]) => {
      count += 1;
      kinds.push(rule.kind);
      const match = String(args[0]);
      if (rule.replacement.includes('$1')) {
        return rule.replacement.replace('$1', String(args[1] || match));
      }
      return rule.replacement;
    });
  }

  return {value, kinds: [...new Set(kinds)], count};
}

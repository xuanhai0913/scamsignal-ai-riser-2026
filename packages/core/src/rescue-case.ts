export const RESCUE_CASE_VERSION = 1 as const;

export type RescueScenario = 'none' | 'money' | 'otp';
export type RescueStepId = 'bank' | 'account' | 'evidence' | 'report';

export type RescueEvidence = {
  id: string;
  name: string;
  type: string;
  size: number;
  addedAt: string;
};

export type RescueCase = {
  version: typeof RESCUE_CASE_VERSION;
  id: string;
  scenario: RescueScenario;
  createdAt: string;
  updatedAt: string;
  amountVnd: string;
  completedAt: Partial<Record<RescueStepId, string>>;
  evidence: RescueEvidence[];
};

export type RescueReport = {
  reportVersion: 'v1';
  generatedAt: string;
  storage: 'local_device';
  disclaimer: string;
  incident: {
    caseId: string;
    scenario: RescueScenario;
    detectedAt: string;
    amountVnd?: string;
  };
  completedActions: Array<{step: RescueStepId; completedAt: string}>;
  evidenceManifest: RescueEvidence[];
};

export type RescueActionDefinition = {
  id: RescueStepId;
  time: string;
  title: string;
  description: string;
  action: string;
};

export const rescueStepLabels: Record<RescueStepId, string> = {
  bank: 'Tìm kênh ngân hàng chính thức',
  account: 'Bảo vệ tài khoản',
  evidence: 'Lưu bằng chứng',
  report: 'Tạo hồ sơ báo cáo',
};

const evidenceAndReportSteps: RescueActionDefinition[] = [
  {
    id: 'evidence',
    time: '05:00',
    title: 'Lưu bằng chứng trên thiết bị',
    description: 'Thêm ảnh, PDF hoặc văn bản. Tệp chỉ được lưu trong trình duyệt này.',
    action: 'Chọn tệp',
  },
  {
    id: 'report',
    time: '10:00',
    title: 'Tạo hồ sơ hỗ trợ',
    description: 'Xem trước và tải báo cáo gồm mốc thời gian, bước đã làm và danh mục bằng chứng.',
    action: 'Tạo hồ sơ',
  },
];

export function getRescueActionPlan(scenario: RescueScenario): RescueActionDefinition[] {
  const urgentSteps: Record<RescueScenario, [RescueActionDefinition, RescueActionDefinition]> = {
    none: [
      {
        id: 'bank',
        time: '00:00',
        title: 'Dừng giao dịch và xác minh độc lập',
        description: 'Không chuyển tiền hoặc nhập OTP. Tự mở ứng dụng hay website chính thức để kiểm tra.',
        action: 'Cách xác minh an toàn',
      },
      {
        id: 'account',
        time: '02:00',
        title: 'Chặn kênh liên hệ đáng ngờ',
        description: 'Không trả lời thêm, không cài ứng dụng và không chia sẻ màn hình với người lạ.',
        action: 'Mở hướng dẫn',
      },
    ],
    money: [
      {
        id: 'bank',
        time: '00:00',
        title: 'Liên hệ ngân hàng qua kênh chính thức',
        description: 'Không gọi số trong tin nhắn đáng ngờ. Mở ứng dụng ngân hàng hoặc tự nhập website chính thức.',
        action: 'Cách liên hệ an toàn',
      },
      {
        id: 'account',
        time: '02:00',
        title: 'Bảo vệ tài khoản và thiết bị',
        description: 'Đăng xuất thiết bị lạ, đổi mật khẩu trên thiết bị an toàn và không chia sẻ mã xác thực.',
        action: 'Mở hướng dẫn',
      },
    ],
    otp: [
      {
        id: 'bank',
        time: '00:00',
        title: 'Khóa giao dịch qua kênh ngân hàng chính thức',
        description: 'Mở ứng dụng ngân hàng đã cài từ trước; không gọi lại số đã xin OTP và không đọc mã mới.',
        action: 'Cách liên hệ an toàn',
      },
      {
        id: 'account',
        time: '02:00',
        title: 'Đổi mật khẩu và đăng xuất thiết bị lạ',
        description: 'Ưu tiên email và tài khoản ngân hàng; kiểm tra phiên đăng nhập trên thiết bị tin cậy.',
        action: 'Mở hướng dẫn',
      },
    ],
  };
  return [...urgentSteps[scenario], ...evidenceAndReportSteps].map((item) => ({...item}));
}

const scenarios: readonly RescueScenario[] = ['none', 'money', 'otp'];
const stepIds: readonly RescueStepId[] = ['bank', 'account', 'evidence', 'report'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function validIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

export function createRescueCase(options: {now?: string; id?: string} = {}): RescueCase {
  const now = options.now || new Date().toISOString();
  const randomId = globalThis.crypto?.randomUUID?.() || `case-${Date.now()}`;
  return {
    version: RESCUE_CASE_VERSION,
    id: options.id || randomId,
    scenario: 'money',
    createdAt: now,
    updatedAt: now,
    amountVnd: '',
    completedAt: {},
    evidence: [],
  };
}

export function parseRescueCase(input: unknown): RescueCase | undefined {
  if (!isRecord(input) || input.version !== RESCUE_CASE_VERSION) return undefined;
  if (typeof input.id !== 'string' || !input.id || !validIsoDate(input.createdAt) || !validIsoDate(input.updatedAt)) return undefined;
  if (typeof input.scenario !== 'string' || !scenarios.includes(input.scenario as RescueScenario)) return undefined;
  if (typeof input.amountVnd !== 'string' || !isRecord(input.completedAt) || !Array.isArray(input.evidence)) return undefined;

  const completedAt: Partial<Record<RescueStepId, string>> = {};
  for (const [step, timestamp] of Object.entries(input.completedAt)) {
    if (!stepIds.includes(step as RescueStepId) || !validIsoDate(timestamp)) return undefined;
    completedAt[step as RescueStepId] = timestamp;
  }

  const evidence: RescueEvidence[] = [];
  for (const item of input.evidence) {
    if (
      !isRecord(item)
      || typeof item.id !== 'string'
      || typeof item.name !== 'string'
      || typeof item.type !== 'string'
      || typeof item.size !== 'number'
      || item.size < 0
      || !validIsoDate(item.addedAt)
    ) return undefined;
    evidence.push({
      id: item.id,
      name: item.name,
      type: item.type,
      size: item.size,
      addedAt: item.addedAt,
    });
  }

  return {
    version: RESCUE_CASE_VERSION,
    id: input.id,
    scenario: input.scenario as RescueScenario,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
    amountVnd: input.amountVnd.replace(/\D/gu, '').slice(0, 15),
    completedAt,
    evidence,
  };
}

export function buildRescueReport(rescueCase: RescueCase, generatedAt = new Date().toISOString()): RescueReport {
  return {
    reportVersion: 'v1',
    generatedAt,
    storage: 'local_device',
    disclaimer: 'Hồ sơ do người dùng tự tạo, không xác nhận giao dịch và chưa được gửi tới ngân hàng hoặc cơ quan chức năng.',
    incident: {
      caseId: rescueCase.id,
      scenario: rescueCase.scenario,
      detectedAt: rescueCase.createdAt,
      ...(rescueCase.amountVnd ? {amountVnd: rescueCase.amountVnd} : {}),
    },
    completedActions: stepIds.flatMap((step) => {
      const completedAt = rescueCase.completedAt[step];
      return completedAt ? [{step, completedAt}] : [];
    }),
    evidenceManifest: rescueCase.evidence.map((item) => ({...item})),
  };
}

export function rescueReportAsText(report: RescueReport) {
  const scenarioLabels: Record<RescueScenario, string> = {
    none: 'Chưa chuyển tiền',
    money: 'Đã chuyển tiền',
    otp: 'Đã lộ OTP',
  };
  const completed = report.completedActions.length
    ? report.completedActions.map((item) => `- ${rescueStepLabels[item.step]} — ${item.completedAt}`).join('\n')
    : '- Chưa có bước nào được người dùng đánh dấu hoàn tất.';
  const evidence = report.evidenceManifest.length
    ? report.evidenceManifest.map((item) => `- ${item.name} (${item.type || 'không rõ định dạng'}, ${item.size} bytes)`).join('\n')
    : '- Chưa có tệp bằng chứng.';

  return [
    'SCAMSIGNAL AI — HỒ SƠ HỖ TRỢ KHẨN CẤP',
    `Mã hồ sơ: ${report.incident.caseId}`,
    `Tạo báo cáo: ${report.generatedAt}`,
    `Tình huống: ${scenarioLabels[report.incident.scenario]}`,
    `Thời điểm phát hiện: ${report.incident.detectedAt}`,
    `Giá trị giao dịch: ${report.incident.amountVnd || 'Chưa nhập'}`,
    '',
    'CÁC BƯỚC NGƯỜI DÙNG ĐÃ XÁC NHẬN',
    completed,
    '',
    'DANH MỤC BẰNG CHỨNG',
    evidence,
    '',
    `LƯU Ý: ${report.disclaimer}`,
  ].join('\n');
}

import {describe, expect, it} from 'vitest';
import {analyzeDeterministically} from './deterministic-analysis.js';

describe('deterministic safety fallback', () => {
  it('detects the fictional typosquat and urgent OTP combination without inventing an AI score', () => {
    const analysis = analyzeDeterministically({
      message: 'NOVABANK: chuyển khoản 18.500.000đ đang bị giữ. Xác minh OTP trong 10 phút tại https://novabarnk.vn/secure',
      extraInfo: 'Tên miền chính thức: novabank.vn',
    });

    expect(analysis.level).toBe('Nguy hiểm');
    expect(analysis.score).toBe(0);
    expect(analysis.confidence).toBe(0);
    expect(analysis.pipeline.model).toBe('deterministic-safety-engine-v1');
    expect(analysis.domain?.observed).toBe('novabarnk.vn');
    expect(analysis.urlInspections).toHaveLength(1);
    expect(analysis.evidence.some((item) => item.id.startsWith('typosquat-'))).toBe(true);
  });

  it('stays inconclusive when local checks have no checkable risk signal', () => {
    const analysis = analyzeDeterministically({
      message: 'Xin chào, đây là một nội dung trao đổi thông thường.',
      extraInfo: '',
    });

    expect(analysis.level).toBe('Chưa đủ dữ kiện');
    expect(analysis.evidence[0].verification).toBe('unknown');
  });

  it('does not treat negated credential language as a credential request', () => {
    const analysis = analyzeDeterministically({
      message: 'Mình chuyển bạn 150.000đ. Không có đường link, không yêu cầu OTP hoặc mật khẩu.',
      extraInfo: '',
    });

    expect(analysis.level).toBe('Chưa đủ dữ kiện');
    expect(analysis.evidence.some((item) => item.id === 'credential-request')).toBe(false);
  });

  it('does not turn a protective instruction into a scam signal', () => {
    const analysis = analyzeDeterministically({
      message: 'Tuyệt đối không cung cấp OTP, mật khẩu hoặc mã PIN cho bất kỳ ai.',
      extraInfo: '',
    });

    expect(analysis.level).toBe('Chưa đủ dữ kiện');
    expect(analysis.evidence.some((item) => item.id === 'credential-request')).toBe(false);
  });

  it('still detects an affirmed request after an adversative clause', () => {
    const analysis = analyzeDeterministically({
      message: 'Họ nói không yêu cầu OTP, nhưng sau đó bắt nhập OTP trong 5 phút để tránh khóa tài khoản.',
      extraInfo: '',
    });

    expect(analysis.level).toBe('Nguy hiểm');
    expect(analysis.evidence.some((item) => item.id === 'credential-request')).toBe(true);
    expect(analysis.evidence.some((item) => item.id === 'urgency-pressure')).toBe(true);
  });

  it('keeps a single neutral money mention below the suspicious threshold', () => {
    const analysis = analyzeDeterministically({
      message: 'Tôi đã chuyển khoản tiền ăn trưa cho người bạn quen từ trước.',
      extraInfo: '',
    });

    expect(analysis.level).toBe('Chưa đủ dữ kiện');
  });

  it.each([
    'Tin nhắn này không yêu cầu OTP.',
    'Ngân hàng chính thức không bao giờ yêu cầu khách hàng cung cấp mật khẩu.',
    'Đừng nhập mã PIN vào đường link do người lạ gửi.',
    'Chưa có yêu cầu chuyển tiền hoặc giao dịch nào.',
    'Không phải công an, cũng không phải ngân hàng.',
    'Không khẩn cấp và không cần thực hiện giao dịch.',
    'Tôi chưa từng gửi mật khẩu cho ai.',
    'Trang này nói rằng không cần nhập OTP.',
    'Tôi không chuyển khoản cho tài khoản lạ.',
  ])('keeps protective or negated content inconclusive: %s', (message) => {
    const analysis = analyzeDeterministically({message, extraInfo: ''});
    expect(analysis.level).toBe('Chưa đủ dữ kiện');
  });

  it.each([
    ['Gửi OTP cho tôi ngay để tiếp tục.', 'Đáng ngờ'],
    ['Vui lòng nhập mật khẩu để tiếp tục.', 'Đáng ngờ'],
    ['Công an yêu cầu chuyển tiền vào số tài khoản này.', 'Đáng ngờ'],
    ['Ngân hàng sẽ khóa tài khoản trong 5 phút, nhập OTP ngay.', 'Nguy hiểm'],
    ['Không chia sẻ OTP cho ai, nhưng vui lòng gửi OTP tại đây.', 'Đáng ngờ'],
    ['Chuyển khoản 2.000.000đ trong 5 phút.', 'Đáng ngờ'],
    ['Đừng tin người lạ; họ yêu cầu mã xác thực để đăng nhập.', 'Đáng ngờ'],
    ['Tôi chưa chuyển tiền; giờ họ bắt chuyển khoản ngay lập tức.', 'Đáng ngờ'],
  ] as const)('still escalates an affirmed risk signal: %s', (message, expectedLevel) => {
    const analysis = analyzeDeterministically({message, extraInfo: ''});
    expect(analysis.level).toBe(expectedLevel);
  });
});

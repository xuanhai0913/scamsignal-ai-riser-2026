export const MAX_SHARED_TEXT_LENGTH = 1500;

export type RawSharePayload = {
  value?: string;
  mimeType?: string;
  shareType?: string;
};

export type ShareDraft =
  | {
      kind: 'text';
      text: string;
      warning?: string;
    }
  | {
      kind: 'image';
      text: '';
      imageUri: string;
      mimeType: string;
    };

export type ShareNormalizationResult =
  | {status: 'ready'; draft: ShareDraft}
  | {status: 'empty'; message: string}
  | {status: 'unsupported'; message: string};

const LOCAL_IMAGE_SCHEMES = ['content://', 'file://', 'blob:'];

export function normalizeIncomingShare(
  payloads: readonly RawSharePayload[],
): ShareNormalizationResult {
  if (payloads.length === 0) {
    return {
      status: 'empty',
      message: 'Chưa có nội dung nào được chia sẻ vào ScamSignal AI.',
    };
  }

  if (payloads.length !== 1) {
    return {
      status: 'unsupported',
      message: 'Hiện tại ứng dụng chỉ nhận một đoạn văn bản hoặc một ảnh mỗi lần.',
    };
  }

  const [payload] = payloads;
  const value = payload.value?.trim() ?? '';
  const mimeType = payload.mimeType?.toLowerCase().trim() ?? '';
  const shareType = payload.shareType?.toLowerCase().trim() ?? '';

  if (!value) {
    return {
      status: 'empty',
      message: 'Nội dung được chia sẻ đang trống. Bạn có thể quay lại và dán thủ công.',
    };
  }

  if (shareType === 'text' || shareType === 'url' || mimeType.startsWith('text/')) {
    const wasTruncated = value.length > MAX_SHARED_TEXT_LENGTH;

    return {
      status: 'ready',
      draft: {
        kind: 'text',
        text: value.slice(0, MAX_SHARED_TEXT_LENGTH),
        warning: wasTruncated
          ? `Nội dung dài hơn ${MAX_SHARED_TEXT_LENGTH} ký tự nên đã được rút gọn trước khi xem xét.`
          : undefined,
      },
    };
  }

  if (shareType === 'image' && mimeType.startsWith('image/')) {
    const hasLocalScheme = LOCAL_IMAGE_SCHEMES.some((scheme) => value.startsWith(scheme));

    if (!hasLocalScheme) {
      return {
        status: 'unsupported',
        message: 'Ảnh chia sẻ phải là tệp cục bộ trên thiết bị. Ứng dụng sẽ không tải ảnh từ URL.',
      };
    }

    return {
      status: 'ready',
      draft: {
        kind: 'image',
        text: '',
        imageUri: value,
        mimeType,
      },
    };
  }

  return {
    status: 'unsupported',
    message: 'Định dạng này chưa được hỗ trợ. Hãy chia sẻ văn bản hoặc một ảnh JPG, PNG hay WebP.',
  };
}

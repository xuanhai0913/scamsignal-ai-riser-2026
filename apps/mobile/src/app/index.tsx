import {Camera} from 'expo-camera';
import {Image} from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import {useFocusEffect} from 'expo-router';
import {useCallback, useEffect, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {firstQrData} from '@/features/capture/qr';
import {runLocalCheck, type LocalCheckResult} from '@/features/check/local-analysis';
import {consumePendingIntake} from '@/features/share/pending-intake';

const DEMO_MESSAGE = `NOVABANK: Giao dịch chuyển khoản 18.500.000đ đang bị tạm giữ.

Để tránh khóa tài khoản, xác minh ngay tại https://novabarnk.vn/secure và nhập OTP 123456.`;
const DEMO_REFERENCE = 'Tên miền chính thức: novabank.vn (dữ liệu minh họa)';
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

type SelectedEvidenceImage = {
  uri: string;
  width: number;
  height: number;
  fileName: string;
  fileSize?: number;
  mimeType: string;
  source: 'picker' | 'share';
};

export default function HomeScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [message, setMessage] = useState('');
  const [reference, setReference] = useState('');
  const [result, setResult] = useState<LocalCheckResult>();
  const [selectedImage, setSelectedImage] = useState<SelectedEvidenceImage>();
  const [imageError, setImageError] = useState<string>();
  const [qrValue, setQrValue] = useState<string>();
  const [qrStatus, setQrStatus] = useState<string>();
  const [isScanningQr, setIsScanningQr] = useState(false);

  const canCheck = message.trim().length >= 16;

  const acceptPickerResult = useCallback((pickerResult: ImagePicker.ImagePickerResult) => {
    if (pickerResult.canceled || !pickerResult.assets[0]) return;

    const asset = pickerResult.assets[0];
    const mimeType = inferImageMimeType(asset.mimeType, asset.fileName, asset.uri);

    if (asset.type && asset.type !== 'image') {
      setImageError('Hãy chọn một ảnh thay vì video hoặc Live Photo.');
      return;
    }

    if (!mimeType || !SUPPORTED_IMAGE_TYPES.has(mimeType)) {
      setImageError('Ảnh phải có định dạng JPG, PNG hoặc WebP.');
      return;
    }

    if (asset.fileSize && asset.fileSize > MAX_IMAGE_BYTES) {
      setImageError('Ảnh lớn hơn 8 MB. Hãy chọn ảnh nhẹ hơn để xử lý ổn định trên thiết bị.');
      return;
    }

    setSelectedImage({
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      fileName: asset.fileName ?? 'Ảnh đã chọn',
      fileSize: asset.fileSize,
      mimeType,
      source: 'picker',
    });
    setImageError(undefined);
    setQrValue(undefined);
    setQrStatus(undefined);
    setResult(undefined);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    void ImagePicker.getPendingResultAsync().then((pendingResult) => {
      if (!pendingResult) return;
      if ('code' in pendingResult) {
        setImageError('Android chưa thể khôi phục ảnh đã chọn. Vui lòng chọn lại ảnh.');
        return;
      }
      acceptPickerResult(pendingResult);
    });
  }, [acceptPickerResult]);

  useFocusEffect(
    useCallback(() => {
      const incoming = consumePendingIntake();
      if (!incoming) return;

      setResult(undefined);
      setQrValue(undefined);
      setQrStatus(undefined);
      setImageError(undefined);

      if (incoming.kind === 'text') {
        setMessage(incoming.text);
        return;
      }

      setSelectedImage({
        uri: incoming.imageUri,
        width: 0,
        height: 0,
        fileName: 'Ảnh được chia sẻ',
        mimeType: incoming.mimeType,
        source: 'share',
      });
    }, []),
  );

  function loadDemo() {
    setMessage(DEMO_MESSAGE);
    setReference(DEMO_REFERENCE);
    setResult(undefined);
  }

  async function pickImage() {
    setImageError(undefined);

    try {
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
        exif: false,
        base64: false,
        selectionLimit: 1,
      });
      acceptPickerResult(pickerResult);
    } catch {
      setImageError('Không thể mở bộ chọn ảnh. Bạn vẫn có thể dán nội dung thủ công.');
    }
  }

  function removeImage() {
    setSelectedImage(undefined);
    setImageError(undefined);
    setQrValue(undefined);
    setQrStatus(undefined);
  }

  async function scanSelectedImage() {
    if (!selectedImage || isScanningQr) return;

    setIsScanningQr(true);
    setQrValue(undefined);
    setQrStatus('Đang quét QR cục bộ…');

    try {
      const scanResults = await Camera.scanFromURLAsync(selectedImage.uri, ['qr']);
      const data = firstQrData(scanResults);

      if (!data) {
        setQrStatus('Không tìm thấy mã QR rõ ràng trong ảnh này.');
        return;
      }

      setQrValue(data);
      setQrStatus('Đã đọc QR nhưng chưa mở hay sử dụng nội dung.');
    } catch {
      setQrStatus('Không thể đọc QR từ ảnh này. Hãy thử ảnh rõ hơn, để QR chiếm phần lớn khung hình.');
    } finally {
      setIsScanningQr(false);
    }
  }

  function useQrContent() {
    if (!qrValue) return;

    setMessage((current) => {
      const prefix = current.trim().length > 0 ? `${current.trim()}\n\nNội dung QR: ` : 'Nội dung QR: ';
      return `${prefix}${qrValue}`.slice(0, 1500);
    });
    setResult(undefined);
    setQrStatus('Đã thêm nội dung QR vào vùng kiểm tra. Liên kết vẫn chưa được mở.');
    AccessibilityInfo.announceForAccessibility('Đã thêm nội dung QR để kiểm tra');
  }

  function checkLocally() {
    if (!canCheck) return;
    const nextResult = runLocalCheck(message, reference);
    setResult(nextResult);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({animated: true});
      AccessibilityInfo.announceForAccessibility(nextResult.label);
    });
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.masthead}>
            <View style={styles.brandRow}>
              <View style={styles.brandMark} accessibilityElementsHidden>
                <Text style={styles.brandMarkText}>S</Text>
              </View>
              <View style={styles.brandCopy}>
                <Text style={styles.brandName}>ScamSignal AI</Text>
                <Text style={styles.brandTagline}>Bằng chứng trước, hành động sau</Text>
              </View>
              <View style={styles.localStatus}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Cục bộ</Text>
              </View>
            </View>

            <Text style={styles.eyebrow}>KIỂM TRA AN TOÀN</Text>
            <Text style={styles.heroTitle}>Dừng lại trước khi chuyển tiền.</Text>
            <Text style={styles.heroDescription}>
              Dán tin nhắn hoặc liên kết đáng ngờ. Máy sẽ kiểm tra cấu trúc URL mà
              không mở trang đó.
            </Text>
          </View>

          <View style={styles.workspace}>
            <View style={styles.sectionHeadingRow}>
              <View>
                <Text style={styles.sectionLabel}>NỘI DUNG CẦN KIỂM TRA</Text>
                <Text style={styles.sectionTitle}>Bạn vừa nhận được gì?</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Điền dữ liệu lừa đảo minh họa"
                hitSlop={8}
                onPress={loadDemo}
                style={({pressed}) => [styles.sampleButton, pressed && styles.pressed]}
              >
                <Text style={styles.sampleButtonText}>Dùng mẫu</Text>
              </Pressable>
            </View>

            <View style={styles.inputSurface}>
              <TextInput
                accessibilityLabel="Nội dung tin nhắn hoặc liên kết đáng ngờ"
                accessibilityHint="Nhập ít nhất 16 ký tự"
                maxLength={1500}
                multiline
                onChangeText={(value) => {
                  setMessage(value);
                  setResult(undefined);
                }}
                placeholder="Ví dụ: Tài khoản sắp bị khóa, xác minh ngay tại..."
                placeholderTextColor="#778894"
                style={styles.messageInput}
                textAlignVertical="top"
                value={message}
              />
              <View style={styles.inputMeta}>
                <Text style={styles.inputMetaText}>Không tự mở liên kết</Text>
                <Text style={styles.counter}>{message.length}/1500</Text>
              </View>
            </View>

            <View style={styles.captureRow}>
              <View style={styles.captureCopy}>
                <Text style={styles.captureTitle}>Có ảnh chụp màn hình hoặc mã QR?</Text>
                <Text style={styles.captureDescription}>Chỉ ảnh bạn chọn được cấp quyền truy cập.</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Chọn ảnh hoặc ảnh mã QR"
                onPress={pickImage}
                style={({pressed}) => [styles.captureButton, pressed && styles.pressed]}
              >
                <Text style={styles.captureButtonText}>Chọn ảnh / QR</Text>
              </Pressable>
            </View>

            {imageError && (
              <Text accessibilityRole="alert" style={styles.imageError}>
                {imageError}
              </Text>
            )}

            {selectedImage && (
              <EvidenceImage
                image={selectedImage}
                isScanning={isScanningQr}
                onRemove={removeImage}
                onScan={scanSelectedImage}
                onUseQr={useQrContent}
                qrStatus={qrStatus}
                qrValue={qrValue}
              />
            )}

            <Text style={styles.referenceLabel}>Kênh chính thức để đối chiếu (không bắt buộc)</Text>
            <TextInput
              accessibilityLabel="Tên miền chính thức để đối chiếu"
              maxLength={300}
              onChangeText={(value) => {
                setReference(value);
                setResult(undefined);
              }}
              placeholder="Ví dụ: Tên miền chính thức: tennganhang.vn"
              placeholderTextColor="#778894"
              style={styles.referenceInput}
              value={reference}
            />

            <View style={styles.privacyLine}>
              <View style={styles.privacyGlyph}><Text style={styles.privacyGlyphText}>✓</Text></View>
              <Text style={styles.privacyText}>
                OTP, mật khẩu và số thẻ được che trước khi nội dung rời thiết bị.
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{disabled: !canCheck}}
              onPress={checkLocally}
              style={({pressed}) => [
                styles.primaryButton,
                !canCheck && styles.primaryButtonDisabled,
                pressed && canCheck && styles.primaryButtonPressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>Kiểm tra tín hiệu cục bộ</Text>
              <Text style={styles.primaryButtonArrow}>→</Text>
            </Pressable>

            {result && <LocalResult result={result} />}
          </View>
        </ScrollView>

        <View style={styles.bottomRail} accessibilityRole="tablist">
          <RailItem active label="Kiểm tra" index="01" />
          <RailItem label="Xác minh" index="02" />
          <RailItem label="Ứng cứu" index="03" />
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function EvidenceImage({
  image,
  isScanning,
  onRemove,
  onScan,
  onUseQr,
  qrStatus,
  qrValue,
}: {
  image: SelectedEvidenceImage;
  isScanning: boolean;
  onRemove: () => void;
  onScan: () => void;
  onUseQr: () => void;
  qrStatus?: string;
  qrValue?: string;
}) {
  const dimensions = image.width > 0 && image.height > 0 ? `${image.width} × ${image.height}` : 'Kích thước chưa rõ';
  const size = image.fileSize ? formatBytes(image.fileSize) : 'Tệp cục bộ';

  return (
    <View style={styles.evidenceSection}>
      <View style={styles.evidenceHeader}>
        <View style={styles.evidenceHeaderCopy}>
          <Text style={styles.evidenceEyebrow}>BẰNG CHỨNG ẢNH</Text>
          <Text numberOfLines={1} style={styles.evidenceName}>{image.fileName}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Bỏ ảnh đã chọn"
          hitSlop={8}
          onPress={onRemove}
          style={({pressed}) => [styles.removeButton, pressed && styles.pressed]}
        >
          <Text style={styles.removeButtonText}>Bỏ ảnh</Text>
        </Pressable>
      </View>

      <Image
        accessibilityLabel="Ảnh bằng chứng đã chọn"
        contentFit="contain"
        source={{uri: image.uri}}
        style={styles.evidenceImage}
      />

      <View style={styles.evidenceMetaRow}>
        <Text style={styles.evidenceMeta}>{dimensions}</Text>
        <View style={styles.evidenceMetaDot} />
        <Text style={styles.evidenceMeta}>{size}</Text>
        <View style={styles.evidenceMetaDot} />
        <Text style={styles.evidenceMeta}>{image.mimeType.replace('image/', '').toUpperCase()}</Text>
      </View>

      <View style={styles.localImageNote}>
        <View style={styles.localImageDot} />
        <Text style={styles.localImageText}>Ảnh chưa được tải lên trong bước cục bộ này.</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{busy: isScanning}}
        disabled={isScanning}
        onPress={onScan}
        style={({pressed}) => [
          styles.qrScanButton,
          isScanning && styles.qrScanButtonDisabled,
          pressed && !isScanning && styles.pressed,
        ]}
      >
        <Text style={styles.qrScanButtonText}>{isScanning ? 'Đang quét…' : 'Quét QR trong ảnh'}</Text>
        <Text style={styles.qrScanGlyph}>⌗</Text>
      </Pressable>

      {qrStatus && <Text style={styles.qrStatus}>{qrStatus}</Text>}

      {qrValue && (
        <View style={styles.qrResult}>
          <Text style={styles.qrResultLabel}>NỘI DUNG QR — CHƯA TIN CẬY</Text>
          <Text selectable style={styles.qrResultValue}>{qrValue}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onUseQr}
            style={({pressed}) => [styles.useQrButton, pressed && styles.pressed]}
          >
            <Text style={styles.useQrButtonText}>Dùng nội dung QR để kiểm tra</Text>
            <Text style={styles.useQrArrow}>→</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function inferImageMimeType(
  declaredMimeType?: string | null,
  fileName?: string | null,
  uri?: string,
): string | undefined {
  const declared = declaredMimeType?.toLowerCase().trim();
  if (declared) return declared;

  const source = `${fileName ?? ''} ${uri ?? ''}`.toLowerCase();
  if (/\.(jpe?g)(?:[?#\s]|$)/.test(source)) return 'image/jpeg';
  if (/\.png(?:[?#\s]|$)/.test(source)) return 'image/png';
  if (/\.webp(?:[?#\s]|$)/.test(source)) return 'image/webp';
  return undefined;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function LocalResult({result}: {result: LocalCheckResult}) {
  return (
    <View style={[styles.resultSection, result.band === 'critical_signal' && styles.resultCritical]}>
      <Text style={styles.resultEyebrow}>KẾT QUẢ TRÊN THIẾT BỊ</Text>
      <Text style={styles.resultTitle}>{result.label}</Text>
      <Text style={styles.resultSummary}>{result.summary}</Text>

      <View style={styles.resultMetrics}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{result.inspections.length}</Text>
          <Text style={styles.metricLabel}>URL đã tách</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{result.findings.length}</Text>
          <Text style={styles.metricLabel}>tín hiệu cấu trúc</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{result.redactionCount}</Text>
          <Text style={styles.metricLabel}>dữ liệu đã che</Text>
        </View>
      </View>

      {result.findings.slice(0, 3).map((finding) => (
        <View key={finding.id} style={styles.findingRow}>
          <View style={styles.findingRule} />
          <View style={styles.findingCopy}>
            <Text style={styles.findingLabel}>{finding.label}</Text>
            <Text style={styles.findingDetail}>{finding.detail}</Text>
          </View>
        </View>
      ))}

      <Text style={styles.resultDisclaimer}>
        Đây chưa phải kết luận cuối của AI. Bước tiếp theo sẽ đối chiếu nguồn độc lập
        và bổ sung các điều chưa biết.
      </Text>
    </View>
  );
}

function RailItem({active = false, label, index}: {active?: boolean; label: string; index: string}) {
  return (
    <View
      accessibilityRole="tab"
      accessibilityState={{selected: active}}
      style={styles.railItem}
    >
      <Text style={[styles.railIndex, active && styles.railActiveText]}>{index}</Text>
      <Text style={[styles.railLabel, active && styles.railActiveText]}>{label}</Text>
      {active && <View style={styles.railIndicator} />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F2F6F8',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#0B2B43',
  },
  scrollContent: {
    paddingBottom: 32,
    backgroundColor: '#F2F6F8',
  },
  masthead: {
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 30,
    backgroundColor: '#0B2B43',
    borderBottomColor: '#2CD5C4',
    borderBottomWidth: 3,
  },
  brandRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 34,
  },
  brandMark: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: '#D8FFF8',
  },
  brandMarkText: {
    color: '#0B2B43',
    fontSize: 20,
    fontWeight: '900',
  },
  brandCopy: {
    flex: 1,
    marginLeft: 11,
  },
  brandName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  brandTagline: {
    color: '#AAC1CE',
    fontSize: 11,
    marginTop: 2,
  },
  localStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    height: 28,
    borderColor: '#31516A',
    borderWidth: 1,
    borderRadius: 14,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2CD5C4',
  },
  statusText: {
    color: '#D7E5EB',
    fontSize: 11,
    fontWeight: '700',
  },
  eyebrow: {
    color: '#2CD5C4',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  heroTitle: {
    maxWidth: 330,
    marginTop: 9,
    color: '#FFFFFF',
    fontSize: 33,
    lineHeight: 39,
    fontWeight: '800',
    letterSpacing: -0.9,
  },
  heroDescription: {
    maxWidth: 350,
    marginTop: 13,
    color: '#C9D8E0',
    fontSize: 15,
    lineHeight: 22,
  },
  workspace: {
    paddingHorizontal: 22,
    paddingTop: 28,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  sectionLabel: {
    color: '#617481',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  sectionTitle: {
    marginTop: 5,
    color: '#102D3F',
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.35,
  },
  sampleButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  sampleButtonText: {
    color: '#075A68',
    fontSize: 13,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: 0.6,
  },
  inputSurface: {
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD8DE',
    borderRadius: 15,
  },
  messageInput: {
    minHeight: 158,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    color: '#102D3F',
    fontSize: 16,
    lineHeight: 23,
  },
  inputMeta: {
    minHeight: 39,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopColor: '#E2E9EC',
    borderTopWidth: 1,
    backgroundColor: '#F8FAFB',
  },
  inputMetaText: {
    color: '#3D6871',
    fontSize: 11,
    fontWeight: '700',
  },
  counter: {
    color: '#788994',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  captureRow: {
    minHeight: 72,
    marginTop: 13,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#D5E0E4',
  },
  captureCopy: {
    flex: 1,
    paddingRight: 12,
  },
  captureTitle: {
    color: '#244452',
    fontSize: 12,
    fontWeight: '800',
  },
  captureDescription: {
    marginTop: 4,
    color: '#667A84',
    fontSize: 10,
    lineHeight: 15,
  },
  captureButton: {
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: '#0C6970',
    borderRadius: 11,
    backgroundColor: '#F7FFFD',
  },
  captureButtonText: {
    color: '#075E65',
    fontSize: 11,
    fontWeight: '900',
  },
  imageError: {
    marginTop: 11,
    color: '#A13D30',
    fontSize: 12,
    lineHeight: 18,
  },
  evidenceSection: {
    marginTop: 18,
    paddingTop: 18,
    borderTopWidth: 2,
    borderTopColor: '#14877B',
  },
  evidenceHeader: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  evidenceHeaderCopy: {
    flex: 1,
    paddingRight: 12,
  },
  evidenceEyebrow: {
    color: '#158579',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  evidenceName: {
    marginTop: 4,
    color: '#173748',
    fontSize: 14,
    fontWeight: '800',
  },
  removeButton: {
    minHeight: 42,
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#8B4137',
    fontSize: 11,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  evidenceImage: {
    width: '100%',
    height: 245,
    borderRadius: 12,
    backgroundColor: '#E0E8EB',
  },
  evidenceMetaRow: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
  },
  evidenceMeta: {
    color: '#6A7E88',
    fontSize: 10,
    fontWeight: '700',
  },
  evidenceMetaDot: {
    width: 3,
    height: 3,
    marginHorizontal: 7,
    borderRadius: 2,
    backgroundColor: '#91A3AA',
  },
  localImageNote: {
    minHeight: 39,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: '#1DC9B8',
    backgroundColor: '#E7F7F4',
  },
  localImageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10897E',
  },
  localImageText: {
    flex: 1,
    marginLeft: 9,
    color: '#315F63',
    fontSize: 11,
    fontWeight: '700',
  },
  qrScanButton: {
    minHeight: 48,
    marginTop: 12,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#AFC4CC',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  qrScanButtonDisabled: {
    opacity: 0.55,
  },
  qrScanButtonText: {
    color: '#173E4E',
    fontSize: 12,
    fontWeight: '900',
  },
  qrScanGlyph: {
    color: '#11867B',
    fontSize: 20,
    fontWeight: '700',
  },
  qrStatus: {
    marginTop: 10,
    color: '#5A707B',
    fontSize: 11,
    lineHeight: 17,
  },
  qrResult: {
    marginTop: 11,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#CBD8DE',
  },
  qrResultLabel: {
    color: '#A13D30',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.05,
  },
  qrResultValue: {
    marginTop: 7,
    color: '#163746',
    fontSize: 13,
    lineHeight: 19,
  },
  useQrButton: {
    minHeight: 46,
    marginTop: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 11,
    backgroundColor: '#D9FFF8',
  },
  useQrButtonText: {
    color: '#075D63',
    fontSize: 11,
    fontWeight: '900',
  },
  useQrArrow: {
    color: '#075D63',
    fontSize: 18,
  },
  referenceLabel: {
    marginTop: 18,
    marginBottom: 8,
    color: '#334F5F',
    fontSize: 12,
    fontWeight: '700',
  },
  referenceInput: {
    minHeight: 50,
    paddingHorizontal: 15,
    color: '#102D3F',
    fontSize: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD8DE',
    borderRadius: 13,
  },
  privacyLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 15,
  },
  privacyGlyph: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#D8FFF8',
  },
  privacyGlyphText: {
    color: '#00695F',
    fontSize: 11,
    fontWeight: '900',
  },
  privacyText: {
    flex: 1,
    marginLeft: 9,
    color: '#526975',
    fontSize: 12,
    lineHeight: 18,
  },
  primaryButton: {
    minHeight: 56,
    marginTop: 20,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0B2B43',
    borderRadius: 14,
  },
  primaryButtonDisabled: {
    backgroundColor: '#8B9BA5',
  },
  primaryButtonPressed: {
    backgroundColor: '#123D58',
    transform: [{scale: 0.995}],
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  primaryButtonArrow: {
    color: '#2CD5C4',
    fontSize: 23,
    lineHeight: 25,
  },
  resultSection: {
    marginTop: 28,
    paddingTop: 23,
    paddingBottom: 10,
    borderTopWidth: 2,
    borderTopColor: '#178B80',
  },
  resultCritical: {
    borderTopColor: '#D64C3B',
  },
  resultEyebrow: {
    color: '#617481',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  resultTitle: {
    marginTop: 7,
    color: '#102D3F',
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '900',
    letterSpacing: -0.55,
  },
  resultSummary: {
    marginTop: 9,
    color: '#455E6C',
    fontSize: 14,
    lineHeight: 21,
  },
  resultMetrics: {
    minHeight: 73,
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E7EEF1',
    borderRadius: 12,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    color: '#102D3F',
    fontSize: 20,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  metricLabel: {
    marginTop: 2,
    color: '#60737F',
    fontSize: 9,
    fontWeight: '700',
  },
  metricDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#C7D4DA',
  },
  findingRow: {
    flexDirection: 'row',
    paddingVertical: 15,
    borderBottomColor: '#D9E2E6',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  findingRule: {
    width: 3,
    minHeight: 38,
    marginRight: 12,
    backgroundColor: '#D64C3B',
    borderRadius: 2,
  },
  findingCopy: {
    flex: 1,
  },
  findingLabel: {
    color: '#173748',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  findingDetail: {
    marginTop: 4,
    color: '#60737F',
    fontSize: 12,
    lineHeight: 18,
  },
  resultDisclaimer: {
    marginTop: 15,
    color: '#5A6E79',
    fontSize: 11,
    lineHeight: 17,
  },
  bottomRail: {
    height: 69,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopColor: '#D6E0E4',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  railItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  railIndex: {
    color: '#91A0A8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  railLabel: {
    marginTop: 3,
    color: '#667A85',
    fontSize: 11,
    fontWeight: '700',
  },
  railActiveText: {
    color: '#0B5861',
  },
  railIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 30,
    height: 3,
    backgroundColor: '#2CD5C4',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
});

import {Image} from 'expo-image';
import {router, useFocusEffect} from 'expo-router';
import {clearSharedPayloads, getSharedPayloads} from 'expo-sharing';
import {useCallback, useState} from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {
  MAX_SHARED_TEXT_LENGTH,
  normalizeIncomingShare,
  type ShareDraft,
  type ShareNormalizationResult,
} from '@/features/share/incoming-share';
import {setPendingIntake} from '@/features/share/pending-intake';

const INITIAL_STATE: ShareNormalizationResult = {
  status: 'empty',
  message: 'Đang đọc nội dung được chia sẻ…',
};

export default function ShareIntakeScreen() {
  const [intake, setIntake] = useState<ShareNormalizationResult>(INITIAL_STATE);
  const [textDraft, setTextDraft] = useState('');

  useFocusEffect(
    useCallback(() => {
      const next = normalizeIncomingShare(readSharedPayloads());
      setIntake(next);
      setTextDraft(next.status === 'ready' && next.draft.kind === 'text' ? next.draft.text : '');
    }, []),
  );

  function cancel() {
    clearIncomingShare();
    router.replace('/');
  }

  function confirm() {
    if (intake.status !== 'ready') return;

    const confirmedDraft: ShareDraft =
      intake.draft.kind === 'text'
        ? {
            ...intake.draft,
            text: textDraft.trim().slice(0, MAX_SHARED_TEXT_LENGTH),
          }
        : intake.draft;

    if (confirmedDraft.kind === 'text' && confirmedDraft.text.length === 0) return;

    setPendingIntake(confirmedDraft);
    clearIncomingShare();
    router.replace('/');
  }

  const canConfirm =
    intake.status === 'ready' &&
    (intake.draft.kind === 'image' || textDraft.trim().length > 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Hủy nhận nội dung"
          accessibilityRole="button"
          hitSlop={8}
          onPress={cancel}
          style={({pressed}) => [styles.cancelButton, pressed && styles.pressed]}
        >
          <Text style={styles.cancelText}>Hủy</Text>
        </Pressable>
        <View style={styles.titleGroup}>
          <Text style={styles.topEyebrow}>SCAMSIGNAL AI</Text>
          <Text style={styles.topTitle}>Xem trước nội dung</Text>
        </View>
        <View style={styles.stepBadge}>
          <Text style={styles.stepText}>1/2</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.securityNotice}>
          <View style={styles.securityDot} />
          <Text style={styles.securityText}>
            Chưa phân tích, chưa tải lên và chưa mở bất kỳ liên kết nào.
          </Text>
        </View>

        {intake.status === 'ready' ? (
          <>
            <Text style={styles.eyebrow}>NỘI DUNG ĐƯỢC CHIA SẺ</Text>
            <Text style={styles.heading}>
              {intake.draft.kind === 'text' ? 'Kiểm tra lại văn bản' : 'Kiểm tra lại ảnh'}
            </Text>
            <Text style={styles.description}>
              Chỉ giữ lại nội dung bạn muốn đưa vào bước kiểm tra cục bộ tiếp theo.
            </Text>

            {intake.draft.kind === 'text' ? (
              <View style={styles.textSurface}>
                <TextInput
                  accessibilityLabel="Nội dung được chia sẻ, có thể chỉnh sửa"
                  maxLength={MAX_SHARED_TEXT_LENGTH}
                  multiline
                  onChangeText={setTextDraft}
                  style={styles.textInput}
                  textAlignVertical="top"
                  value={textDraft}
                />
                <View style={styles.textMeta}>
                  <Text style={styles.textMetaLabel}>Có thể chỉnh sửa trước khi tiếp tục</Text>
                  <Text style={styles.textCounter}>{textDraft.length}/{MAX_SHARED_TEXT_LENGTH}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.imageSurface}>
                <Image
                  accessibilityLabel="Ảnh được chia sẻ để kiểm tra"
                  contentFit="contain"
                  source={{uri: intake.draft.imageUri}}
                  style={styles.previewImage}
                />
                <View style={styles.imageMeta}>
                  <Text style={styles.imageMetaTitle}>Ảnh cục bộ</Text>
                  <Text style={styles.imageMetaValue}>{intake.draft.mimeType}</Text>
                </View>
              </View>
            )}

            {intake.draft.kind === 'text' && intake.draft.warning && (
              <Text accessibilityRole="alert" style={styles.warningText}>
                {intake.draft.warning}
              </Text>
            )}

            <View style={styles.boundaryLine}>
              <Text style={styles.boundaryIndex}>02</Text>
              <View style={styles.boundaryCopy}>
                <Text style={styles.boundaryTitle}>Bạn vẫn là người quyết định</Text>
                <Text style={styles.boundaryDescription}>
                  Xác nhận chỉ đưa dữ liệu sang màn hình kiểm tra. App không tự gửi lên máy chủ.
                </Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyCode}>{intake.status === 'unsupported' ? '!' : '—'}</Text>
            <Text style={styles.emptyTitle}>
              {intake.status === 'unsupported' ? 'Chưa hỗ trợ nội dung này' : 'Không có dữ liệu chia sẻ'}
            </Text>
            <Text style={styles.emptyDescription}>{intake.message}</Text>
            {Platform.OS === 'web' && (
              <Text style={styles.webNote}>Share Sheet cần bản Android cài trên thiết bị.</Text>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{disabled: !canConfirm}}
          disabled={!canConfirm}
          onPress={confirm}
          style={({pressed}) => [
            styles.confirmButton,
            !canConfirm && styles.confirmButtonDisabled,
            pressed && canConfirm && styles.confirmButtonPressed,
          ]}
        >
          <Text style={styles.confirmText}>Xác nhận và tiếp tục</Text>
          <Text style={styles.confirmArrow}>→</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function readSharedPayloads() {
  if (Platform.OS === 'web') return [];

  try {
    return getSharedPayloads();
  } catch {
    return [];
  }
}

function clearIncomingShare(): void {
  if (Platform.OS === 'web') return;

  try {
    clearSharedPayloads();
  } catch {
    // The manual paste and Photo Picker paths remain available when native intake is unavailable.
  }
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#F2F6F8'},
  topBar: {
    minHeight: 72,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#CDD9DE',
    backgroundColor: '#FFFFFF',
  },
  cancelButton: {width: 58, minHeight: 44, justifyContent: 'center'},
  cancelText: {color: '#315464', fontSize: 14, fontWeight: '700'},
  titleGroup: {flex: 1, alignItems: 'center'},
  topEyebrow: {color: '#14877B', fontSize: 9, fontWeight: '900', letterSpacing: 1.2},
  topTitle: {marginTop: 3, color: '#102D3F', fontSize: 15, fontWeight: '800'},
  stepBadge: {
    width: 44,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C7D6DC',
    borderRadius: 14,
  },
  stepText: {color: '#617681', fontSize: 10, fontWeight: '800'},
  content: {paddingHorizontal: 22, paddingTop: 20, paddingBottom: 30},
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 20,
    marginBottom: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#D7E1E5',
  },
  securityDot: {width: 7, height: 7, borderRadius: 4, backgroundColor: '#1DC9B8'},
  securityText: {flex: 1, marginLeft: 10, color: '#44616E', fontSize: 12, lineHeight: 18},
  eyebrow: {color: '#687B85', fontSize: 10, fontWeight: '900', letterSpacing: 1.35},
  heading: {
    marginTop: 7,
    color: '#102D3F',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  description: {marginTop: 9, color: '#526975', fontSize: 14, lineHeight: 21},
  textSurface: {
    marginTop: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#BACBD2',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
  },
  textInput: {minHeight: 230, padding: 16, color: '#102D3F', fontSize: 16, lineHeight: 24},
  textMeta: {
    minHeight: 42,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E0E8EB',
    backgroundColor: '#F8FAFB',
  },
  textMetaLabel: {color: '#52717A', fontSize: 10, fontWeight: '700'},
  textCounter: {color: '#788B95', fontSize: 10, fontVariant: ['tabular-nums']},
  imageSurface: {
    marginTop: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#BACBD2',
    borderRadius: 14,
    backgroundColor: '#E6ECEF',
  },
  previewImage: {width: '100%', height: 330},
  imageMeta: {
    minHeight: 52,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  imageMetaTitle: {color: '#173748', fontSize: 12, fontWeight: '800'},
  imageMetaValue: {color: '#667C87', fontSize: 11},
  warningText: {marginTop: 12, color: '#975D00', fontSize: 12, lineHeight: 18},
  boundaryLine: {
    marginTop: 25,
    paddingTop: 21,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#D4E0E4',
  },
  boundaryIndex: {width: 36, color: '#13887D', fontSize: 11, fontWeight: '900'},
  boundaryCopy: {flex: 1},
  boundaryTitle: {color: '#173748', fontSize: 13, fontWeight: '800'},
  boundaryDescription: {marginTop: 5, color: '#607580', fontSize: 12, lineHeight: 18},
  emptyState: {paddingTop: 55, alignItems: 'center'},
  emptyCode: {color: '#1A9D90', fontSize: 34, fontWeight: '300'},
  emptyTitle: {marginTop: 13, color: '#102D3F', fontSize: 21, fontWeight: '900'},
  emptyDescription: {
    maxWidth: 310,
    marginTop: 9,
    color: '#5C707B',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  webNote: {marginTop: 15, color: '#778993', fontSize: 11},
  footer: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#CFDADF',
    backgroundColor: '#FFFFFF',
  },
  confirmButton: {
    minHeight: 56,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    backgroundColor: '#0B2B43',
  },
  confirmButtonDisabled: {backgroundColor: '#95A3AA'},
  confirmButtonPressed: {backgroundColor: '#123D58', transform: [{scale: 0.995}]},
  confirmText: {color: '#FFFFFF', fontSize: 15, fontWeight: '900'},
  confirmArrow: {color: '#2CD5C4', fontSize: 23},
  pressed: {opacity: 0.58},
});

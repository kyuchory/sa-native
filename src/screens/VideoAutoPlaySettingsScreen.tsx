import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { TYPOGRAPHY, SPACING } from '../constants/theme';
import { useVideoSettingsStore } from '../stores/videoSettingsStore';
import { useThemeStore } from '../stores/themeStore';
import CommonHeader from '../components/CommonHeader';
import CustomAlertModal from '../components/CustomAlertModal';

type VideoAutoPlayMode = 'always' | 'wifi_only' | 'cellular_only' | 'manual';

export default function VideoAutoPlaySettingsScreen() {
  const { autoPlayMode, setAutoPlayMode } = useVideoSettingsStore();
  const { colors } = useThemeStore();
  const [alertModal, setAlertModal] = useState<{visible: boolean, title: string, message: string, buttons: any[]} | null>(null);

  const handleAutoPlayModeChange = async (option: VideoAutoPlayMode) => {
    // 이미 선택된 옵션이면 API 호출하지 않음
    if (autoPlayMode === option) return;

    try {
      // 자동 재생 모드 변경
      setAutoPlayMode(option);

      // 성공 메시지
      const modeText = {
        always: '항상 자동 재생',
        wifi_only: 'Wi-Fi에서만 자동 재생',
        cellular_only: '데이터에서만 자동 재생',
        manual: '수동 재생'
      };

      setAlertModal({
        visible: true,
        title: '설정 완료',
        message: `비디오 재생이 ${modeText[option]}으로 설정되었습니다.`,
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });

    } catch (error) {
      console.error('자동 재생 모드 변경 실패:', error);
      setAlertModal({
        visible: true,
        title: '오류',
        message: '설정 변경에 실패했습니다. 다시 시도해주세요.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
    }
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <CommonHeader title="자동 재생 설정" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* 항상 옵션 */}
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => handleAutoPlayModeChange('always')}
          >
            <View style={styles.radioContainer}>
              <View
                style={[
                  styles.radioOuter,
                  {
                    borderColor: autoPlayMode === 'always' ? colors.PRIMARY : colors.GRAY_400,
                  },
                ]}
              >
                {autoPlayMode === 'always' && (
                  <View
                    style={[
                      styles.radioInner,
                      { backgroundColor: colors.PRIMARY },
                    ]}
                  />
                )}
              </View>
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.optionTitle, { color: colors.GRAY_900 }]}>
                항상 자동 재생
              </Text>
              <Text style={[styles.optionDescription, { color: colors.GRAY_600 }]}>
                Wi-Fi와 데이터 모두에서 자동으로 재생됩니다.
              </Text>
            </View>
          </TouchableOpacity>

          {/* Wi-Fi에서만 옵션 */}
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => handleAutoPlayModeChange('wifi_only')}
          >
            <View style={styles.radioContainer}>
              <View
                style={[
                  styles.radioOuter,
                  {
                    borderColor: autoPlayMode === 'wifi_only' ? colors.PRIMARY : colors.GRAY_400,
                  },
                ]}
              >
                {autoPlayMode === 'wifi_only' && (
                  <View
                    style={[
                      styles.radioInner,
                      { backgroundColor: colors.PRIMARY },
                    ]}
                  />
                )}
              </View>
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.optionTitle, { color: colors.GRAY_900 }]}>
                Wi-Fi에서만 자동 재생
              </Text>
              <Text style={[styles.optionDescription, { color: colors.GRAY_600 }]}>
                Wi-Fi 연결 시에만 자동으로 재생됩니다.
              </Text>
            </View>
          </TouchableOpacity>

          {/* 데이터에서만 옵션 */}
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => handleAutoPlayModeChange('cellular_only')}
          >
            <View style={styles.radioContainer}>
              <View
                style={[
                  styles.radioOuter,
                  {
                    borderColor: autoPlayMode === 'cellular_only' ? colors.PRIMARY : colors.GRAY_400,
                  },
                ]}
              >
                {autoPlayMode === 'cellular_only' && (
                  <View
                    style={[
                      styles.radioInner,
                      { backgroundColor: colors.PRIMARY },
                    ]}
                  />
                )}
              </View>
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.optionTitle, { color: colors.GRAY_900 }]}>
                데이터에서만 자동 재생
              </Text>
              <Text style={[styles.optionDescription, { color: colors.GRAY_600 }]}>
                LTE, 5G 등 데이터 연결 시에만 자동으로 재생됩니다.
              </Text>
            </View>
          </TouchableOpacity>

          {/* 수동 옵션 */}
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => handleAutoPlayModeChange('manual')}
          >
            <View style={styles.radioContainer}>
              <View
                style={[
                  styles.radioOuter,
                  {
                    borderColor: autoPlayMode === 'manual' ? colors.PRIMARY : colors.GRAY_400,
                  },
                ]}
              >
                {autoPlayMode === 'manual' && (
                  <View
                    style={[
                      styles.radioInner,
                      { backgroundColor: colors.PRIMARY },
                    ]}
                  />
                )}
              </View>
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.optionTitle, { color: colors.GRAY_900 }]}>
                수동 재생
              </Text>
              <Text style={[styles.optionDescription, { color: colors.GRAY_600 }]}>
                사용자가 직접 재생 버튼을 눌러야 재생됩니다.
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Custom Alert Modal */}
      {alertModal && (
        <CustomAlertModal
          visible={alertModal.visible}
          title={alertModal.title}
          message={alertModal.message}
          buttons={alertModal.buttons}
          onClose={() => setAlertModal(null)}
        />
      )}
    </View>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.WHITE,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: SPACING.SM,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: colors.GRAY_200,
  },
  radioContainer: {
    marginRight: SPACING.MD,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  textContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_500,
  },
});

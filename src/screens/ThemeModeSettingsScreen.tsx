import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { TYPOGRAPHY, SPACING } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import CommonHeader from '../components/CommonHeader';

type ThemeModeOption = 'system' | 'light' | 'dark';

export default function ThemeModeSettingsScreen() {
  const { themeMode, setThemeMode, colors } = useThemeStore();

  const handleThemeModeChange = async (option: ThemeModeOption) => {
    // 이미 선택된 옵션이면 API 호출하지 않음
    if (themeMode === option) return;

    try {
      // 테마 모드 변경
      setThemeMode(option);

      // 성공 메시지
      const modeText = {
        system: '시스템',
        light: '라이트',
        dark: '다크'
      };

      Alert.alert(
        '설정 완료',
        `테마가 ${modeText[option]} 모드로 설정되었습니다.`
      );

    } catch (error) {
      console.error('테마 모드 변경 실패:', error);
      Alert.alert('오류', '설정 변경에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <CommonHeader title="다크 모드 설정" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* 시스템 옵션 */}
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => handleThemeModeChange('system')}
          >
            <View style={styles.radioContainer}>
              <View
                style={[
                  styles.radioOuter,
                  {
                    borderColor: themeMode === 'system' ? colors.PRIMARY : colors.GRAY_400,
                  },
                ]}
              >
                {themeMode === 'system' && (
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
                시스템
              </Text>
              <Text style={[styles.optionDescription, { color: colors.GRAY_600 }]}>
                기기의 설정에 따라 자동으로 변경됩니다.
              </Text>
            </View>
          </TouchableOpacity>

          {/* 라이트 옵션 */}
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => handleThemeModeChange('light')}
          >
            <View style={styles.radioContainer}>
              <View
                style={[
                  styles.radioOuter,
                  {
                    borderColor: themeMode === 'light' ? colors.PRIMARY : colors.GRAY_400,
                  },
                ]}
              >
                {themeMode === 'light' && (
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
                라이트
              </Text>
              <Text style={[styles.optionDescription, { color: colors.GRAY_600 }]}>
                밝은 테마를 사용합니다.
              </Text>
            </View>
          </TouchableOpacity>

          {/* 다크 옵션 */}
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => handleThemeModeChange('dark')}
          >
            <View style={styles.radioContainer}>
              <View
                style={[
                  styles.radioOuter,
                  {
                    borderColor: themeMode === 'dark' ? colors.PRIMARY : colors.GRAY_400,
                  },
                ]}
              >
                {themeMode === 'dark' && (
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
                다크
              </Text>
              <Text style={[styles.optionDescription, { color: colors.GRAY_600 }]}>
                어두운 테마를 사용합니다.
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
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

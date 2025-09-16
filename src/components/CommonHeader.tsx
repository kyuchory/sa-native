import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { TYPOGRAPHY, SPACING, SHADOWS } from '../constants/theme';
import { BackIcon } from './CommonIcons';
import { useThemeStore } from '../stores/themeStore';

interface CommonHeaderProps {
  title: string;
  rightComponent?: React.ReactNode;
  onBackPress?: () => void;
  showBackButton?: boolean;
}

export default function CommonHeader({
  title,
  rightComponent,
  onBackPress,
  showBackButton = true
}: CommonHeaderProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { isDark, colors } = useThemeStore();
  const styles = createStyles(colors);

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        {/* 왼쪽 영역 - 뒤로가기 버튼 */}
        <View style={styles.leftSection}>
          {showBackButton && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackPress}
              activeOpacity={0.7}
            >
              <BackIcon size={24} color={colors.GRAY_700} />
            </TouchableOpacity>
          )}
        </View>

        {/* 중앙 영역 - 제목 */}
        <View style={styles.centerSection}>
          <Text style={styles.title}>{title}</Text>
        </View>

        {/* 우측 영역 - 추가 컴포넌트 */}
        <View style={styles.rightSection}>
          {rightComponent}
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    backgroundColor: colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: colors.GRAY_200,
    ...SHADOWS.SMALL,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    minHeight: 56,
  },

  // 왼쪽 섹션
  leftSection: {
    width: 48,
    alignItems: 'flex-start',
  },
  backButton: {
    padding: SPACING.XS,
    borderRadius: 20,
  },

  // 중앙 섹션
  centerSection: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.SM,
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE.LG,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: colors.GRAY_900,
    textAlign: 'center',
  },

  // 우측 섹션
  rightSection: {
    width: 48,
    alignItems: 'flex-end',
  },
});

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, TEXT_COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../constants/theme';
import { BackIcon } from './CommonIcons';

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

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.WHITE} />
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
                <BackIcon size={24} color={COLORS.GRAY_700} />
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
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
    color: TEXT_COLORS.PRIMARY,
    textAlign: 'center',
  },
  
  // 우측 섹션
  rightSection: {
    width: 48,
    alignItems: 'flex-end',
  },
});

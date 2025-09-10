import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TYPOGRAPHY, SPACING, TEXT_COLORS, COLORS } from '../constants/theme';
import ToggleSwitch from './ToggleSwitch';

interface SettingItemProps {
  title: string;
  subtitle?: string;
  showArrow?: boolean;
  showToggle?: boolean;
  toggleValue?: boolean;
  toggleSize?: 'small' | 'medium';
  onPress?: () => void;
  onToggleChange?: (value: boolean) => void;
  isLast?: boolean;
  // 다크모드 지원을 위한 옵스
  colors?: Record<string, string>;
}

const SettingItem: React.FC<SettingItemProps> = ({
  title,
  subtitle,
  showArrow = false,
  showToggle = false,
  toggleValue = false,
  toggleSize = 'medium',
  onPress,
  onToggleChange,
  isLast = false,
  colors = {}
}) => {
  const handlePress = () => {
    if (!showToggle && onPress) {
      onPress();
    }
  };

  const handleToggle = (value: boolean) => {
    onToggleChange?.(value);
  };

  // 스타일 생성
  const itemStyles = createStyles(colors);

  return (
    <>
      <TouchableOpacity
        style={[itemStyles.container, isLast && itemStyles.lastItem]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={itemStyles.textContainer}>
          <Text style={itemStyles.title}>{title}</Text>
          {subtitle && (
            <Text style={itemStyles.subtitle}>{subtitle}</Text>
          )}
        </View>

        <View style={itemStyles.actionContainer}>
          {showToggle && onToggleChange && (
            <ToggleSwitch
              value={toggleValue}
              onValueChange={handleToggle}
              size={toggleSize}
            />
          )}
          {showArrow && !showToggle && (
            <View style={itemStyles.arrow}>
              <Text style={itemStyles.arrowText}>›</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {!isLast && <View style={itemStyles.separator} />}
    </>
  );
};

// createStyles 함수 생성
const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.MD,
    backgroundColor: colors.WHITE || COLORS.WHITE,
    minHeight: 50,
  },

  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },

  title: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: colors.GRAY_900 || TEXT_COLORS.PRIMARY,
    lineHeight: 20,
  },

  subtitle: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_700 || TEXT_COLORS.SECONDARY,
    marginTop: 2,
    lineHeight: 16,
  },

  actionContainer: {
    marginLeft: SPACING.SM,
  },

  arrow: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  arrowText: {
    fontSize: 20,
    color: colors.GRAY_500 || COLORS.GRAY_500,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
  },

  separator: {
    height: 1,
    backgroundColor: colors.GRAY_200 || COLORS.GRAY_200,
    marginLeft: SPACING.MD,
  },

  lastItem: {
    marginBottom: SPACING.SM,
  },
});

export default SettingItem;

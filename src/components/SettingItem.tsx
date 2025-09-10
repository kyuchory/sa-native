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
  isLast = false
}) => {
  const handlePress = () => {
    if (!showToggle && onPress) {
      onPress();
    }
  };

  const handleToggle = (value: boolean) => {
    onToggleChange?.(value);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.container, isLast && styles.lastItem]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && (
            <Text style={styles.subtitle}>{subtitle}</Text>
          )}
        </View>

        <View style={styles.actionContainer}>
          {showToggle && onToggleChange && (
            <ToggleSwitch
              value={toggleValue}
              onValueChange={handleToggle}
              size={toggleSize}
            />
          )}
          {showArrow && !showToggle && (
            <View style={styles.arrow}>
              <Text style={styles.arrowText}>›</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {!isLast && <View style={styles.separator} />}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    minHeight: 50,
  },

  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },

  title: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: TEXT_COLORS.PRIMARY,
    lineHeight: 20,
  },

  subtitle: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: TEXT_COLORS.SECONDARY,
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
    color: COLORS.GRAY_500,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
  },

  separator: {
    height: 1,
    backgroundColor: COLORS.GRAY_200,
    marginLeft: SPACING.MD,
  },

  lastItem: {
    marginBottom: SPACING.SM,
  },
});

export default SettingItem;

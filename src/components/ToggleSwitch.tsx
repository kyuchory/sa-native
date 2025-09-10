import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Circle, Rect, G } from 'react-native-svg';
import { COLORS, SPACING } from '../constants/theme';

interface ToggleSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  size?: 'small' | 'medium';
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  value,
  onValueChange,
  size = 'medium',
  disabled = false
}) => {
  const switchSize = size === 'small' ? 36 : 44;
  const circleSize = size === 'small' ? 20 : 24;
  const circleOffset = value ? switchSize - circleSize - 4 : 4;

  const handlePress = () => {
    if (!disabled) {
      onValueChange(!value);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={disabled}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <View style={[styles.container, { width: switchSize, height: switchSize * 0.6, borderRadius: switchSize * 0.3 }]}>
        <Svg width={switchSize} height={switchSize * 0.6} viewBox={`0 0 ${switchSize} ${switchSize * 0.6}`}>
          {/* 배경 트랙 */}
          <Rect
            x="0"
            y="0"
            width={switchSize}
            height={switchSize * 0.6}
            rx={switchSize * 0.3}
            fill={value ? COLORS.PRIMARY : COLORS.GRAY_300}
          />

          {/* 동그라미 핸들 */}
          <Circle
            cx={circleSize / 2 + circleOffset}
            cy={switchSize * 0.3}
            r={circleSize / 2 - 1}
            fill="white"
          />
        </Svg>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ToggleSwitch;

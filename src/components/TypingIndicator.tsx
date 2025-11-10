import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../stores/themeStore';
import { SPACING, TYPOGRAPHY } from '../constants/theme';

interface TypingIndicatorProps {
  typingUsers: Array<{ user_id: number; nickname: string; timestamp: number }>;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = React.memo(({ typingUsers }) => {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  if (typingUsers.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {typingUsers.map(u => u.nickname).join(', ')}님이 입력 중...
      </Text>
    </View>
  );
});

TypingIndicator.displayName = 'TypingIndicator';

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.XS,
    backgroundColor: colors.GRAY_100,
  },
  text: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_700,
    fontStyle: 'italic',
  },
});

export default TypingIndicator;

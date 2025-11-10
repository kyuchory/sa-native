import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatMessageDate } from '../utils/timeUtils';
import { useThemeStore } from '../stores/themeStore';
import { SPACING, TYPOGRAPHY } from '../constants/theme';

interface MessageDateSeparatorProps {
  dateString: string;
}

const MessageDateSeparator: React.FC<MessageDateSeparatorProps> = React.memo(({ dateString }) => {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.dateText}>
        {formatMessageDate(dateString)}
      </Text>
      <View style={styles.line} />
    </View>
  );
});

MessageDateSeparator.displayName = 'MessageDateSeparator';

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.LG,
    paddingHorizontal: SPACING.MD,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.GRAY_300,
  },
  dateText: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.GRAY_700,
    backgroundColor: colors.GRAY_50,
    paddingHorizontal: SPACING.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
});

export default MessageDateSeparator;

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TYPOGRAPHY, SPACING } from '../constants/theme';
import { ChatType } from '../types/chat';
import { useThemeStore } from '../stores/themeStore';

interface EmptyStateProps {
  selectedTab: ChatType;
}

export default function ChatScreenEmptyState({ selectedTab }: EmptyStateProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const emptyText =
    selectedTab === 'private'
      ? '1:1 채팅방이 없습니다.'
      : '그룹 채팅방이 없습니다.';

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{emptyText}</Text>
    </View>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.XXL,
  },
  text: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_700,
    textAlign: 'center',
  },
});

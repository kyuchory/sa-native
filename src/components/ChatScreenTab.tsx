import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { TYPOGRAPHY, SPACING } from '../constants/theme';
import { ChatType } from '../types/chat';
import { useThemeStore } from '../stores/themeStore';

interface TabButtonProps {
  type: ChatType;
  label: string;
  isSelected: boolean;
  onPress: (type: ChatType) => void;
}

function TabButton({ type, label, isSelected, onPress }: TabButtonProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  return (
    <TouchableOpacity
      style={[styles.button, isSelected && styles.buttonActive]}
      onPress={() => onPress(type)}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, isSelected && styles.textActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

interface ChatScreenTabProps {
  selectedTab: ChatType;
  onTabChange: (tab: ChatType) => void;
}

export default function ChatScreenTab({ selectedTab, onTabChange }: ChatScreenTabProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <TabButton
        type="private"
        label="채팅"
        isSelected={selectedTab === 'private'}
        onPress={onTabChange}
      />
      <TabButton
        type="group"
        label="그룹채팅"
        isSelected={selectedTab === 'group'}
        onPress={onTabChange}
      />
    </View>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: colors.GRAY_200,
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.MD,
    alignItems: 'center',
    backgroundColor: colors.WHITE,
  },
  buttonActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.PRIMARY,
  },
  text: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: colors.GRAY_700,
  },
  textActive: {
    color: colors.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
  },
});

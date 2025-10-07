import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TYPOGRAPHY, SPACING, SHADOWS } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import CommonHeader from './CommonHeader';
import { PlusCircleIcon } from './ChatDetailIcons';



interface ChatHeaderProps {
  onCreateChat: () => void;
}

export default function ChatHeader({ onCreateChat }: ChatHeaderProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <CommonHeader
        title="채팅"
        rightComponent={
          <TouchableOpacity
            style={styles.createButton}
            onPress={onCreateChat}
            activeOpacity={0.7}
          >
            <PlusCircleIcon size={18} color={colors.PRIMARY} />
          </TouchableOpacity>
        }
      />
    </View>
  );
}

// 스타일 생성 함수
const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    backgroundColor: colors.WHITE,
  },
  createButton: {
    width: 30,
    height: 30,
    borderRadius: 20,
    backgroundColor: colors.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.SMALL,
    borderWidth: 1,
    borderColor: colors.GRAY_200,
  },
  iconContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBar: {
    position: 'absolute',
    borderRadius: 1,
  },
  horizontalBar: {
    width: 12,
    height: 2,
  },
  verticalBar: {
    width: 2,
    height: 12,
  },
});

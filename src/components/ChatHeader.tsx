import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { TYPOGRAPHY, SPACING, SHADOWS } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import CommonHeader from './CommonHeader';

// + 모양 SVG 아이콘 컴포넌트 (styles 없이 스타일 직접 적용)
const PlusIcon = ({ size = 24, color }: { size?: number; color?: string }) => {
  return (
    <View style={[{ width: size, height: size, position: 'relative' }]}>
      <View style={[{ position: 'absolute', width: 12, height: 2, backgroundColor: color, borderRadius: 1 }]} />
      <View style={[{ position: 'absolute', width: 2, height: 12, backgroundColor: color, borderRadius: 1 }]} />
    </View>
  );
};

interface ChatHeaderProps {
  onCreateChat: () => void;
}

export default function ChatHeader({ onCreateChat }: ChatHeaderProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);
  const handleCreateChatPress = () => {
    Alert.alert(
      '채팅방 생성',
      '새로운 채팅방을 생성하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '생성',
          onPress: onCreateChat,
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <CommonHeader 
        title="채팅" 
        rightComponent={
          <TouchableOpacity 
            style={styles.createButton}
            onPress={handleCreateChatPress}
            activeOpacity={0.7}
          >
            <PlusIcon size={15} color={colors.PRIMARY} />
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

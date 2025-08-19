import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { COLORS, TEXT_COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../constants/theme';
import CommonHeader from './CommonHeader';

// + 모양 SVG 아이콘 컴포넌트
const PlusIcon = ({ size = 24, color = COLORS.PRIMARY }: { size?: number; color?: string }) => {
  return (
    <View style={[styles.iconContainer, { width: size, height: size }]}>
      <View style={[styles.iconBar, styles.horizontalBar, { backgroundColor: color }]} />
      <View style={[styles.iconBar, styles.verticalBar, { backgroundColor: color }]} />
    </View>
  );
};

interface ChatHeaderProps {
  onCreateChat: () => void;
}

export default function ChatHeader({ onCreateChat }: ChatHeaderProps) {
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
            <PlusIcon size={20} color={COLORS.PRIMARY} />
          </TouchableOpacity>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.WHITE,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.SMALL,
    borderWidth: 1,
    borderColor: COLORS.GRAY_200,
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

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { TYPOGRAPHY, SPACING } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';

interface UserAvatarProps {
  profileImg?: string | null;
  nickname: string;
  size?: number;
  style?: any;
}

export default function UserAvatar({ 
  profileImg, 
  nickname, 
  size = 40,
  style 
}: UserAvatarProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors, size);

  if (profileImg) {
    return (
      <Image 
        source={{ uri: profileImg }} 
        style={[styles.avatar, style]}
      />
    );
  }

  return (
    <View style={[styles.avatar, styles.avatarPlaceholder, style]}>
      <Text style={styles.avatarText}>
        {nickname.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

const createStyles = (colors: Record<string, string>, size: number) => StyleSheet.create({
  avatar: {
    width: size,
    height: size,
    borderRadius: size / 2,
  },
  avatarPlaceholder: {
    backgroundColor: colors.GRAY_300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: size * 0.4,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: colors.WHITE,
  },
});

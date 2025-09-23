import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { TYPOGRAPHY, SPACING } from '../constants/theme';
import { StoryUser, getAllStoryUsers } from '../data/storyMockData';
import { useThemeStore } from '../stores/themeStore';
import Svg, { Circle } from 'react-native-svg';
import UserAvatar from './UserAvatar';

interface StorySectionProps {
  onStoryPress?: (user: StoryUser) => void;
  onAddStoryPress?: () => void;
}

// 플러스 아이콘 컴포넌트
const PlusIcon = ({ size = 20, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" fill={color} />
    <Circle cx="12" cy="12" r="10" stroke="#FF6B35" strokeWidth="2" />
    <Text style={{ fontSize: 16, color: '#FF6B35', textAlign: 'center', lineHeight: 20 }}>+</Text>
  </Svg>
);

// 개별 스토리 아이템 컴포넌트
const StoryItem = ({ user, isMyProfile = false, onPress, colors, styles }: {
  user: StoryUser;
  isMyProfile?: boolean;
  onPress: () => void;
  colors: Record<string, string>;
  styles: any;
}) => {
  const borderColor = user.has_story
    ? (user.is_viewed ? colors.GRAY_300 : colors.PRIMARY)
    : colors.GRAY_300;

  return (
    <TouchableOpacity style={styles.storyItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.storyImageContainer}>
        <View style={[styles.storyImageBorder, { borderColor }]}>
          <UserAvatar 
            profileImg={user.profile_img} 
            nickname={user.nickname}
            size={60}
          />
        </View>
        {isMyProfile && !user.has_story && (
          <View style={styles.addStoryButton}>
            <View style={styles.plusIconContainer}>
              <Text style={styles.plusIcon}>+</Text>
            </View>
          </View>
        )}
      </View>
      <Text style={styles.storyNickname} numberOfLines={1}>
        {user.nickname}
      </Text>
    </TouchableOpacity>
  );
};

export default function StorySection({ onStoryPress, onAddStoryPress }: StorySectionProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);
  const storyUsers = getAllStoryUsers();

  const handleStoryPress = (user: StoryUser) => {
    if (user.id === 0 && !user.has_story) {
      // 내 프로필이고 스토리가 없으면 스토리 추가
      onAddStoryPress?.();
    } else {
      // 스토리 보기
      onStoryPress?.(user);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {storyUsers.map((user, index) => (
          <StoryItem
            key={user.id}
            user={user}
            isMyProfile={user.id === 0}
            onPress={() => handleStoryPress(user)}
            colors={colors}
            styles={styles}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// 스타일 생성 함수
const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    backgroundColor: colors.WHITE,
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: colors.GRAY_100,
  },
  scrollContent: {
    paddingHorizontal: SPACING.MD,
    gap: SPACING.MD,
  },
  storyItem: {
    alignItems: 'center',
    width: 70,
  },
  storyImageContainer: {
    position: 'relative',
    marginBottom: SPACING.XS,
  },
  storyImageBorder: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addStoryButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.GRAY_200,
  },
  plusIconContainer: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusIcon: {
    color: colors.WHITE,
    fontSize: 12,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    lineHeight: 12,
    textAlign: 'center',
  },
  storyNickname: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.GRAY_900, // TEXT_COLORS.PRIMARY
    textAlign: 'center',
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
});

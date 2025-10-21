import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { TYPOGRAPHY, SPACING } from '../constants/theme';
import { StoryListResponse } from '../types/story';
import { useThemeStore } from '../stores/themeStore';
import Svg, { Circle } from 'react-native-svg';
import UserAvatar from './UserAvatar';

interface StorySectionProps {
  stories: StoryListResponse | null;
  loading?: boolean;
  onStoryPress?: (user: any, storyId?: number) => void;
  onAddStoryPress?: () => void;
}

// UI용 스토리 사용자 타입 (기존 mock 데이터 호환용)
interface StoryUser {
  id: number;
  nickname: string;
  profile_img: string | null;
  has_story: boolean;
  is_viewed: boolean;
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
const StoryItem = ({ user, isMyProfile = false, onPress, onPlusPress, colors, styles }: {
  user: StoryUser;
  isMyProfile?: boolean;
  onPress: () => void;
  onPlusPress?: () => void;
  colors: Record<string, string>;
  styles: any;
}) => {
  const borderColor = user.has_story
    ? (user.is_viewed ? colors.GRAY_300 : colors.PRIMARY)
    : colors.GRAY_300;

  return (
    <TouchableOpacity style={styles.storyItem} onPress={() => onPress()} activeOpacity={0.7}>
      <View style={styles.storyImageContainer}>
        <View style={[styles.storyImageBorder, { borderColor }]}>
          <UserAvatar
            profileImg={user.profile_img}
            nickname={user.nickname}
            size={60}
          />
        </View>
        {isMyProfile && (  // 자신 스토리인 경우 항상 + 아이콘 표시 (스토리 추가 기능)
          <TouchableOpacity style={styles.addStoryButton} onPress={() => onPlusPress?.()}>
            <View style={styles.plusIconContainer}>
              <Text style={styles.plusIcon}>+</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.storyNickname} numberOfLines={1}>
        {user.nickname}
      </Text>
    </TouchableOpacity>
  );
};

export default React.memo(function StorySection({ stories, onStoryPress, onAddStoryPress }: StorySectionProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  // API 데이터를 UI용 데이터로 변환
  const storyItems: StoryUser[] = useMemo(() => {
    // 1. 첫 번째 아이템은 항상 자신 프로필 (고정)
    const myStoryItem: StoryUser = {
      id: 0,
      nickname: '나',
      profile_img: stories?.own?.[0]?.user?.profile_img || null,
      has_story: stories?.own?.[0]?.has_unseen_story !== undefined,
      is_viewed: stories?.own?.[0]?.has_unseen_story === false,
    };

    const items: StoryUser[] = [myStoryItem];

    // 2. 팔로우 스토리들 추가 (서버에서 정렬된 배열로 제공)
    if (stories?.following &&Array.isArray(stories.following)) {
      stories.following.forEach(story => {
        items.push({
          id: story.user.id,
          nickname: story.user.nickname,
          profile_img: story.user.profile_img,
          has_story: true,
          is_viewed: !story.has_unseen_story,
        });
      });
    }

    return items;
  }, [stories]);

  const handleStoryPress = (user: StoryUser) => {
    if (isMyProfile(user)) {
      // 자신의 스토리의 경우: 스토리 보기 (나중으로 이동함)
      // TODO: 내 스토리 화면으로 이동
    } else {
      // 팔로우 스토리인 경우 스토리 보기 - storyId 포함해서 호출
      const storyData = stories?.following?.find(story => story.user.id === user.id);
      const storyId = storyData?.id;
      onStoryPress?.(user, storyId);
    }
  };

  // 자신 프로필인지 확인하는 헬퍼 함수
  const isMyProfile = (user: StoryUser) => {
    return user.id === 0 || user.nickname === '나';
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {storyItems.map((user, index) => (
          <StoryItem
            key={user.id}
            user={user}
            isMyProfile={user.id === 0}
            onPress={() => handleStoryPress(user)}
            onPlusPress={onAddStoryPress}
            colors={colors}
            styles={styles}
          />
        ))}
      </ScrollView>
    </View>
  );
});

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

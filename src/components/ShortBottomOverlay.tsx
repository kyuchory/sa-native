import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronDownIcon, ChevronUpIcon } from './CutIcons';
import UserAvatar from './UserAvatar';
import { formatRelativeTime } from '../utils/timeUtils';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';

interface Category {
  id: number;
  name: string;
}

interface ShortBottomOverlayProps {
  username: string;
  profileImg: string | null;
  createdAt: string;
  description?: string;
  categories: Category[];
  onProfilePress?: () => void;
  extraBottomMargin?: number;
}

export const ShortBottomOverlay = React.memo<ShortBottomOverlayProps>(({
  username,
  profileImg,
  createdAt,
  description,
  categories,
  onProfilePress,
  extraBottomMargin,
}) => {
  // 🔥 자체적으로 상태 관리하여 부모 컴포넌트 리렌더링 영향 제거
  const [isExpanded, setIsExpanded] = useState(true);

  // 🔥 useCallback으로 이벤트 핸들러 최적화
  const handleToggleExpand = useCallback(() => setIsExpanded((prev) => !prev), []);

  const containerStyle = extraBottomMargin
    ? [styles.container, { marginBottom: extraBottomMargin }]
    : styles.container;

  // 🔥 시간 포맷 결과 메모이제이션
  const formattedTime = useMemo(() => formatRelativeTime(createdAt), [createdAt]);

  // 🔥 카테고리 렌더링 메모이제이션
  const renderedCategories = useMemo(() =>
    categories.map((category) => (
      <Text key={category.id} style={styles.tag}>
        #{category.name}
      </Text>
    )), [categories]
  );

  // 🔥 조건부 콘텐츠 메모이제이션
  const conditionalContent = useMemo(() => {
    if (!isExpanded) return null;

    return (
      <>
        {description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.description} numberOfLines={2}>
              {description}
            </Text>
          </View>
        )}

        <View style={styles.tagsContainer}>
          {renderedCategories}
        </View>
      </>
    );
  }, [isExpanded, description, renderedCategories]);

  return (
    <View style={containerStyle}>
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={handleToggleExpand}
        activeOpacity={0.8}
      >
        {isExpanded ? (
          <ChevronDownIcon size={20} color={COLORS.WHITE} />
        ) : (
          <ChevronUpIcon size={20} color={COLORS.WHITE} />
        )}
      </TouchableOpacity>

      <View style={styles.contentArea}>
        <View style={styles.userInfo}>
          <TouchableOpacity style={styles.profileTouchable} onPress={onProfilePress} activeOpacity={0.8}>
            <UserAvatar profileImg={profileImg} nickname={username} size={30} />
            <Text style={styles.username}>{username}</Text>
          </TouchableOpacity>
          <Text style={styles.timeText}>{formattedTime}</Text>
        </View>

        {conditionalContent}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: SPACING.MD,
    right: SPACING.MD,
    bottom: SPACING.MD,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: BORDER_RADIUS.LG,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.SMD,
  },
  toggleButton: {
    position: 'absolute',
    top: SPACING.SM,
    right: SPACING.SM,
    padding: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
  },
  contentArea: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: SPACING.XS,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SM,
    gap: SPACING.SM,
  },
  profileTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  username: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: COLORS.WHITE,
  },
  timeText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  descriptionContainer: {
    marginBottom: SPACING.XS,
  },
  description: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: COLORS.WHITE,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
  },
  tag: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: COLORS.WHITE,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
});

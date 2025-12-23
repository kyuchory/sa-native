import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import UserAvatar from './UserAvatar';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';

interface Category {
  id: number;
  name: string;
}

interface ShortBottomAdOverlayProps {
  nickname: string;
  profileImg: string | null;
  sponsoredInfo: string; // SPONSORED 정보 (시간 대신)
  description?: string;
  categories: Category[];
  onProfilePress?: () => void;
  bottomInsets?: number;
}

export const ShortBottomAdOverlay = React.memo<ShortBottomAdOverlayProps>(({
  nickname,
  profileImg,
  sponsoredInfo,
  description,
  categories,
  onProfilePress,
  bottomInsets,
}) => {
  // 🔥 동적 스타일 생성 (CutDetailScreen에서만 사용)
  const styles = useMemo(() => bottomInsets ? createDynamicStyles(bottomInsets) : defaultStyles, [bottomInsets]);

  return (
    <View style={styles.bottomOverlay}>
      <View style={styles.profileSection}>
        <TouchableOpacity
          onPress={onProfilePress}
          activeOpacity={0.7}
          disabled={!onProfilePress}
        >
          <UserAvatar profileImg={profileImg} nickname={nickname} size={40} />
        </TouchableOpacity>

        <View style={styles.textSection}>
          <TouchableOpacity
            style={styles.nicknameTouchable}
            onPress={onProfilePress}
            activeOpacity={0.7}
            disabled={!onProfilePress}
          >
            <Text style={styles.nickname}>{nickname}</Text>
          </TouchableOpacity>
          <Text style={styles.sponsoredText}>{sponsoredInfo}</Text>
        </View>
      </View>

      <View style={styles.descriptionSection}>
        {description && (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        )}

        {description && categories.length > 0 && (
          <View style={styles.descriptionGap} />
        )}

        {categories.length > 0 && (
          <View style={styles.categoryContainer}>
            {categories.map((category) => (
              <TouchableOpacity key={category.id} style={styles.categoryChip}>
                <Text style={styles.categoryText}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
});

// 🔥 기본 스타일 (CutScreen에서 사용)
const defaultStyles = StyleSheet.create({
  // 필수 스타일들
  nickname: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: COLORS.WHITE,
  },
  nicknameTouchable: {
    alignSelf: 'flex-start',
  },
  description: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: COLORS.WHITE,
    lineHeight: 20,
  },

  // CutPreview 디자인 스타일들
  bottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SPACING.SMD,
    paddingTop: SPACING.MD,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 25,
    marginBottom: SPACING.SM,
    marginHorizontal: SPACING.SM,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  textSection: {
    flex: 1,
    marginLeft: SPACING.SM,
  },
  sponsoredText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: COLORS.WHITE,
    opacity: 0.7,
  },
  descriptionSection: {
    marginBottom: SPACING.MD,
  },
  descriptionGap: {
    height: SPACING.SM,
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: SPACING.XS,
  },
  categoryChip: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
  },
  categoryText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: COLORS.WHITE,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
});

// 🔥 동적 스타일을 위한 함수 (CutDetailScreen에서만 사용)
const createDynamicStyles = (bottomInsets: number) => StyleSheet.create({
  ...defaultStyles,
  bottomOverlay: {
    ...defaultStyles.bottomOverlay,
    marginBottom: bottomInsets + SPACING.SM,
  },
});

export default ShortBottomAdOverlay;

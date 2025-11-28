import React from 'react';
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
  isExpanded: boolean;
  onToggleExpand: () => void;
  onProfilePress?: () => void;
  extraBottomMargin?: number;
}

export const ShortBottomOverlay = React.memo<ShortBottomOverlayProps>(({
  username,
  profileImg,
  createdAt,
  description,
  categories,
  isExpanded,
  onToggleExpand,
  onProfilePress,
  extraBottomMargin,
}) => {
  const containerStyle = extraBottomMargin
    ? [styles.container, { marginBottom: extraBottomMargin }]
    : styles.container;

  return (
    <View style={containerStyle}>
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={onToggleExpand}
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
          <Text style={styles.timeText}>{formatRelativeTime(createdAt)}</Text>
        </View>

        {isExpanded && (
          <>
            {description && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.description} numberOfLines={2}>
                  {description}
                </Text>
              </View>
            )}

            <View style={styles.tagsContainer}>
              {categories.map((category) => (
                <Text key={category.id} style={styles.tag}>
                  #{category.name}
                </Text>
              ))}
            </View>
          </>
        )}
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

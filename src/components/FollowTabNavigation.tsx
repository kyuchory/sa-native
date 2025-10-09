import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';

type FollowTabType = 'followers' | 'following';

interface FollowTabNavigationProps {
  activeTab: FollowTabType;
  onTabChange: (tab: FollowTabType) => void;
  followerCount?: number;
  followingCount?: number;
}

export default function FollowTabNavigation({
  activeTab,
  onTabChange,
  followerCount = 0,
  followingCount = 0
}: FollowTabNavigationProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${Math.floor(num / 100000) / 10}M`;
    if (num >= 1000) return `${Math.floor(num / 100) / 10}K`;
    return num.toString();
  };

  const tabs = [
    { key: 'followers' as FollowTabType, label: '팔로워', count: followerCount },
    { key: 'following' as FollowTabType, label: '팔로잉', count: followingCount },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
          onPress={() => onTabChange(tab.key)}
        >
      <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
        {tab.label}
      </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.MD,
    marginBottom: SPACING.SM,
  },
  tabItem: {
    flex: 1,
    paddingVertical: SPACING.MD,
    marginHorizontal: SPACING.XS,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
  },
  tabItemActive: {
    borderBottomColor: colors.PRIMARY,
  },
  tabText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_700,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
  tabTextActive: {
    color: colors.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
  },
});

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { SPACING, BORDER_RADIUS } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { GridIcon, ListIcon, VideoIcon, CharacterIcon } from './ProfileIcons';

export type ProfileTabType = 'feed' | 'posts' | 'videos' | 'character';

interface ProfileTabNavigationProps {
  activeTab: ProfileTabType;
  onTabChange: (tab: ProfileTabType) => void;
}

export default function ProfileTabNavigation({
  activeTab,
  onTabChange,
}: ProfileTabNavigationProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const tabs = [
    { id: 'feed' as ProfileTabType, icon: GridIcon, label: '피드' },
    { id: 'posts' as ProfileTabType, icon: ListIcon, label: '게시물' },
    { id: 'videos' as ProfileTabType, icon: VideoIcon, label: '컷' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComponent = tab.icon;
          
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabItem,
                isActive && styles.activeTabItem,
              ]}
              onPress={() => onTabChange(tab.id)}
              activeOpacity={0.7}
            >
              <IconComponent
                size={24}
                color={isActive ? colors.PRIMARY : colors.GRAY_500}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// 스타일 생성 함수
const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    backgroundColor: colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: colors.GRAY_200,
  },
  tabsContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  tabItem: {
    flex: 1, // 각 탭이 정확히 1/4씩 차지
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.MD,
  },
  activeTabItem: {
    backgroundColor: colors.PRIMARY + '10', // 10% 투명도
  },
});

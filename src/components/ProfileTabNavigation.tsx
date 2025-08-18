import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
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
  const tabs = [
    { id: 'feed' as ProfileTabType, icon: GridIcon, label: '피드' },
    { id: 'posts' as ProfileTabType, icon: ListIcon, label: '게시물' },
    { id: 'videos' as ProfileTabType, icon: VideoIcon, label: '컷' },
    { id: 'character' as ProfileTabType, icon: CharacterIcon, label: '캐릭터' },
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
                color={isActive ? COLORS.PRIMARY : COLORS.GRAY_500}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
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
    backgroundColor: COLORS.PRIMARY + '10', // 10% 투명도
  },
});

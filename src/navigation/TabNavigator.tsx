import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabParamList } from '../types/navigation';
import { CleanTabIconComponents } from '../components/CleanTabIcons';
import { COLORS, BG_COLORS, SHADOWS } from '../constants/theme';

// Screens
import HomeScreen from '../screens/HomeScreen';
import FeedScreen from '../screens/FeedScreen';
import SearchScreen from '../screens/SearchScreen';
import CutScreen from '../screens/CutScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.PRIMARY,
        tabBarInactiveTintColor: COLORS.GRAY_500,
        tabBarShowLabel: false, // 텍스트 완전 제거
        tabBarStyle: {
          backgroundColor: BG_COLORS.PRIMARY,
          borderTopWidth: 0, // 상단 테두리 제거
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 16, // 실제 Safe Area 사용
          paddingTop: 8, // 상단 여백 대폭 축소 (16 → 8)
          height: Platform.OS === 'ios' ? 56 + insets.bottom : 64, // 동적 높이
          ...SHADOWS.MEDIUM, // 통일된 그림자 적용
        },
        tabBarItemStyle: {
          paddingVertical: 4, // 아이템 내부 여백도 축소 (8 → 4)
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <CleanTabIconComponents.HomeTab 
              size={26} 
              focused={focused}
            />
          ),
        }}
      />
      <Tab.Screen
        name="FeedTab"
        component={FeedScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <CleanTabIconComponents.FeedTab 
              size={26} 
              focused={focused}
            />
          ),
        }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <CleanTabIconComponents.SearchTab 
              size={26} 
              focused={focused}
            />
          ),
        }}
      />
      <Tab.Screen
        name="CutTab"
        component={CutScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <CleanTabIconComponents.CutTab 
              size={26} 
              focused={focused}
            />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <CleanTabIconComponents.ProfileTab 
              size={26} 
              focused={focused}
            />
          ),
        }}
      />
    </Tab.Navigator>
    {/* 하단 Safe Area를 탭바 색상으로 채우기 */}
    <View style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: insets.bottom,
      backgroundColor: BG_COLORS.PRIMARY,
    }} />
  </View>
  );
}

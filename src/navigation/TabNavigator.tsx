import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, TouchableOpacity, DeviceEventEmitter } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabParamList } from '../types/navigation';
import { CleanTabIconComponents } from '../components/CleanTabIcons';
import { useThemeStore } from '../stores/themeStore';

// Screens
import HomeScreen from '../screens/HomeScreen';
import FeedScreen from '../screens/FeedScreen';
import SearchScreen from '../screens/SearchScreen';
import CutScreen from '../screens/CutScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.PRIMARY,
        tabBarInactiveTintColor: colors.GRAY_500,
        tabBarShowLabel: false,

        tabBarButton: (props: any) => (
          <TouchableOpacity
            {...props}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[props.style, { overflow: 'hidden' }]}
          />
        ),
        tabBarStyle: {
          backgroundColor: colors.WHITE,
          // Safe Area는 자동으로 처리됨 (SafeAreaProvider 덕분에)
          paddingBottom: 8 + insets.bottom, // 상단 패딩(8)과 동일하게 맞춤
          paddingTop: 8,
          height: 56 + insets.bottom, // 56 + 8(하단 패딩)으로 높이 조절
          shadowColor: colors.BLACK,
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 8,
          overflow: 'hidden',
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
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // 이미 CutTab이 active 상태라면
            const state = navigation.getState();
            const currentRoute = state.routes[state.index];

            if (currentRoute.name === 'CutTab') {
              // CutScreen으로 refresh 이벤트 전달
              DeviceEventEmitter.emit('CutTab:rePress');
            }
          },
        })}
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
  );
}

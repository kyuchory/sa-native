import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../stores/authStore';
import { AuthStackParamList } from '../types/navigation';
// 🔧 개선된 소켓 초기화 로직으로 더 안정적인 연결 관리

// 소켓 서비스 초기화
import { initializeSocketServices } from '../utils/socketInitializer';
// 앱 상태 감지 훅
import { useSocketAppState } from '../hooks/useAppState';
// FCM 서비스 초기화
import { FCMService } from '../services/fcmService';

// Screens
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import CreateFeedScreen from '../screens/CreateFeedScreen';
import PostDetailScreen from '../screens/PostDetailScreen';
import EditPostScreen from '../screens/EditPostScreen';
import FeedDetailScreen from '../screens/FeedDetailScreen';
import EditFeedScreen from '../screens/EditFeedScreen';
// import ProfileScreen from '../screens/ProfileScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';
import NicknameEditScreen from '../screens/NicknameEditScreen';
import BioEditScreen from '../screens/BioEditScreen';
import ProfileImageEditScreen from '../screens/ProfileImageEditScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ChatScreen from '../screens/ChatScreen';
import SelectChatUserScreen from '../screens/SelectChatUserScreen';
import ChatDetailScreen from '../screens/ChatDetailScreen';
import ChatRoomMediaScreen from '../screens/ChatRoomMediaScreen';
import NotificationScreen from '../screens/NotificationScreen';
import BlockedUsersScreen from '../screens/BlockedUsersScreen';
import ProfileVisibilityScreen from '../screens/ProfileVisibilityScreen';
import ThemeModeSettingsScreen from '../screens/ThemeModeSettingsScreen';
import VideoAutoPlaySettingsScreen from '../screens/VideoAutoPlaySettingsScreen';
import SupportListScreen from '../screens/SupportListScreen';
import SupportCreateScreen from '../screens/SupportCreateScreen';
import SupportDetailScreen from '../screens/SupportDetailScreen';
import FollowRequestsScreen from '../screens/FollowRequestsScreen';
import FollowListScreen from '../screens/FollowListScreen';
import DailyCutAddScreen from '../screens/DailyCutAddScreen';
import DailyCutDetailScreen from '../screens/DailyCutDetailScreen';
import CanvasEditorScreen from '../screens/CanvasEditorScreen';
import MediaTestScreen from '../screens/MediaTestScreen';
import VideoTrimCropScreen from '../screens/VideoTrimCropScreen';
import CutUploadSelectScreen from '../screens/CutUploadSelectScreen';
import CutUploadFinalizeScreen from '../screens/CutUploadFinalizeScreen';
import CutDetailScreen from '../screens/CutDetailScreen';
import SavedItemsScreen from '../screens/SavedItemsScreen';

// Components for notifications
import { NotificationBanner } from '../components/NotificationBanner';

// Tab Navigator
import TabNavigator from './TabNavigator';

const Stack = createStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  const { isAuthenticated, tokens } = useAuthStore();

  // 앱 상태 감지 및 소켓 재연결 자동 관리
  useSocketAppState();

  // 소켓 서비스 초기화 (로그인 상태 확인 후)
  useEffect(() => {
    if (isAuthenticated && tokens?.accessToken) {
      console.log('🔗 로그인 확인됨, 서비스 초기화 시작...');

      // 소켓 서비스 초기화 (비동기로 실행)
      initializeSocketServices().catch(error => {
        console.error('❌ 소켓 서비스 초기화 실패:', error);
      });

      // FCM 초기화 및 디바이스 토큰 등록
      FCMService.initializeFCMAndRegisterDevice().catch(error => {
        console.error('❌ FCM 초기화 실패:', error);
      });
    } else {
      console.log('🔐 로그인되지 않음 또는 토큰 없음 - 서비스 초기화 스킵');
    }
  }, [isAuthenticated, tokens?.accessToken]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NotificationBanner />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false
          }}
        >
        {isAuthenticated ? (
          // 인증된 사용자: 메인 앱
          <>
        <Stack.Screen
          name="MainApp"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CreatePost"
          component={CreatePostScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="EditPost"
          component={EditPostScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CreateFeed"
          component={CreateFeedScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PostDetail"
          component={PostDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="FeedDetail"
          component={FeedDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="EditFeed"
          component={EditFeedScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ProfileEdit"
          component={ProfileEditScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="NicknameEdit"
          component={NicknameEditScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="BioEdit"
          component={BioEditScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ProfileImageEdit"
          component={ProfileImageEditScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="UserProfile"
          component={ProfileScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ headerShown: false }}
        />
                <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SelectChatUser"
          component={SelectChatUserScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ChatDetail"
          component={ChatDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ChatRoomMedia"
          component={ChatRoomMediaScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Notifications"
          component={NotificationScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="BlockedUsers"
          component={BlockedUsersScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ProfileVisibility"
          component={ProfileVisibilityScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ThemeModeSettings"
          component={ThemeModeSettingsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="VideoAutoPlaySettings"
          component={VideoAutoPlaySettingsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SupportList"
          component={SupportListScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SupportCreate"
          component={SupportCreateScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SupportDetail"
          component={SupportDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="FollowRequests"
          component={FollowRequestsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="FollowList"
          component={FollowListScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="DailyCutAdd"
          component={DailyCutAddScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="DailyCutDetail"
          component={DailyCutDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CanvasEditor"
          component={CanvasEditorScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MediaTest"
          component={MediaTestScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="VideoTrimCrop"
          component={VideoTrimCropScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CutUploadSelect"
          component={CutUploadSelectScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CutUploadFinalize"
          component={CutUploadFinalizeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CutDetail"
          component={CutDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SavedItems"
          component={SavedItemsScreen}
          options={{ headerShown: false }}
        />
          </>
        ) : (
          // 인증되지 않은 사용자: 로그인/회원가입 화면
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
    </GestureHandlerRootView>
  );
}

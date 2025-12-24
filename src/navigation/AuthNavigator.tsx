import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { setNavigationRef } from '../utils/navigationUtils';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../stores/authStore';
import { AuthStackParamList } from '../types/navigation';
// 권한 체크
import { checkNotificationPermissionWithSkip, AlertButton } from '../utils/notificationPermission';
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
import AccountDeleteScreen from '../screens/AccountDeleteScreen';
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
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import SupportCreateScreen from '../screens/SupportCreateScreen';
import TermsAndPoliciesScreen from '../screens/TermsAndPoliciesScreen';
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
import CutPreviewScreen from '../screens/CutPreviewScreen';
import SavedItemsScreen from '../screens/SavedItemsScreen';
import PopularPostScreen from '../screens/PopularPostScreen';
import TestAdScreen from '../screens/TestAdScreen';
import TestCutsAdScreen from '../screens/TestCutsAdScreen';

// Components for notifications
import { NotificationBanner } from '../components/NotificationBanner';
import CustomAlertModal from '../components/CustomAlertModal';

// Tab Navigator
import TabNavigator from './TabNavigator';

const Stack = createStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  const { isAuthenticated, tokens } = useAuthStore();

  const navigationRef = useRef<NavigationContainerRef<AuthStackParamList>>(null);

  // 권한 체크 알림 모달 상태
  const [permissionAlert, setPermissionAlert] = useState<{
    visible: boolean;
    title?: string;
    message: string;
    buttons: AlertButton[];
  } | null>(null);

  // 앱 상태 감지 및 소켓 재연결 자동 관리
  useSocketAppState();

  // 네비게이션 ref 설정
  useEffect(() => {
    if (navigationRef.current) {
      setNavigationRef(navigationRef.current);
    }
  }, []);

  // 소켓 서비스 초기화 (로그인 상태 확인 후)
  useEffect(() => {
    if (isAuthenticated && tokens?.accessToken) {
      // 소켓 서비스 초기화 (비동기로 실행)
      initializeSocketServices().catch(error => {
        console.error('❌ 소켓 서비스 초기화 실패:', error);
      });

      // FCM 초기화 및 디바이스 토큰 등록
      FCMService.initializeFCMAndRegisterDevice().catch(error => {
        console.error('❌ FCM 초기화 실패:', error);
      });

      // 푸시 권한 체크
      checkNotificationPermissionWithSkip(
        (alertConfig) => {
          setPermissionAlert({ ...alertConfig, visible: true });
        },
        () => {
          setPermissionAlert(null);
        }
      ).catch(error => {
        console.error('❌ 푸시 권한 체크 실패:', error);
      });
    }
  }, [isAuthenticated, tokens?.accessToken]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NotificationBanner />
      <NavigationContainer ref={navigationRef}>
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
          name="AccountDelete"
          component={AccountDeleteScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="TestAd"
          component={TestAdScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="TestCutsAd"
          component={TestCutsAdScreen}
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
          name="NotificationSettings"
          component={NotificationSettingsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SupportCreate"
          component={SupportCreateScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="TermsAndPolicies"
          component={TermsAndPoliciesScreen}
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
          name="CutPreview"
          component={CutPreviewScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SavedItems"
          component={SavedItemsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PopularPosts"
          component={PopularPostScreen}
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

    {/* 권한 체크 알림 모달 */}
    {permissionAlert && (
      <CustomAlertModal
        visible={permissionAlert.visible}
        title={permissionAlert.title}
        message={permissionAlert.message}
        buttons={permissionAlert.buttons}
        onClose={() => setPermissionAlert(null)}
      />
    )}
    </GestureHandlerRootView>
  );
}

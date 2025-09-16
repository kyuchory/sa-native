import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../stores/authStore';
import { useSocketStore } from '../stores/socketStore';
import { useChatStore } from '../stores/chatStore';
import { useNotificationStore } from '../stores/notificationStore';
import { AuthStackParamList } from '../types/navigation';

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
import NotificationScreen from '../screens/NotificationScreen';

// Tab Navigator
import TabNavigator from './TabNavigator';

const Stack = createStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  const { isAuthenticated } = useAuthStore();
  const socketStore = useSocketStore();
  const chatStore = useChatStore();
  const notificationStore = useNotificationStore();

  // 글로벌 소켓 초기화 (인증된 상태에서만)
  useEffect(() => {
    if (isAuthenticated) {
      const initializeGlobalSockets = async () => {
        try {
          // /chat 네임스페이스 글로벌 연결 및 초기화
          await socketStore.connect('/chat');
          console.log('📡 Global chat socket connected');

          await chatStore.initializeChatEvents();
          console.log('📡 Global chat event listeners registered');

          // /notification 네임스페이스 글로벌 연결 및 초기화
          await socketStore.connect('/notification');
          console.log('🔔 Global notification socket connected');

          await notificationStore.initializeNotificationEvents();
          console.log('🔔 Global notification event listeners registered');
        } catch (error) {
          console.error('❌ Failed to initialize global sockets:', error);
        }
      };

      initializeGlobalSockets();
    } else {
      // 인증 해제 시 모든 연결 해제
      socketStore.disconnectAll();
      console.log('🎯 All socket connections disconnected due to logout');
    }
  }, [isAuthenticated]);

  return (
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
          name="Notifications"
          component={NotificationScreen}
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
  );
}

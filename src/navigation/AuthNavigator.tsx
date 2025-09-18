import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useSocketStore } from '../stores/socketStore';
import { useChatStore } from '../stores/chatStore';
import { useNotificationStore } from '../stores/notificationStore';
import { AuthStackParamList } from '../types/navigation';
// 🔧 개선된 소켓 초기화 로직으로 더 안정적인 연결 관리

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
  const appState = useRef(AppState.currentState);

  // 🔧 개선된 글로벌 소켓 초기화 (인증된 상태에서만)
  useEffect(() => {
    if (isAuthenticated) {
      const initializeGlobalSockets = async () => {
        console.log('🚀 글로벌 소켓 초기화 시작...');
        
        try {
          // 💬 Chat 네임스페이스 연결 및 이벤트 초기화
          console.log('💬 Chat 소켓 연결 시작...');
          await socketStore.connect('/chat');
          console.log('✅ Chat 소켓 연결 완료');
          
          // Chat 이벤트 초기화 (연결 후 즉시)
          await chatStore.initializeChatEvents();
          console.log('✅ Chat 이벤트 리스너 등록 완료');
          
          // 🔔 Notification 네임스페이스 연결 및 이벤트 초기화
          console.log('🔔 Notification 소켓 연결 시작...');
          await socketStore.connect('/notification');
          console.log('✅ Notification 소켓 연결 완료');
          
          // Notification 이벤트 초기화 (연결 후 즉시)
          await notificationStore.initializeNotificationEvents();
          console.log('✅ Notification 이벤트 리스너 등록 완료');
          
          console.log('🎉 모든 글로벌 소켓 초기화 완료!');
          
        } catch (error) {
          console.error('❌ 글로벌 소켓 초기화 실패:', error);
          
          // 부분적 실패 시 재시도 로직 (5초 후)
          console.log('🔄 5초 후 소켓 연결 재시도...');
          setTimeout(() => {
            initializeGlobalSockets();
          }, 5000);
        }
      };

      // 즉시 시작 (지연 없이)
      initializeGlobalSockets();
      
    } else {
      // 인증 해제 시 모든 연결 해제
      console.log('🚪 로그아웃 - 모든 소켓 연결 해제...');
      socketStore.disconnectAll();
      console.log('✅ 모든 소켓 연결 해제 완료');
    }
  }, [isAuthenticated]);

  // 🔥 AppState 기반 백업 재연결 시스템 (Socket.IO 자동 재연결 보완용)
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log(`📱 AppState 변경: ${appState.current} → ${nextAppState}`);
      
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('🔄 앱 포어그라운드 복귀 - 소켓 상태 확인...');
        
        // 짧은 지연 후 연결 상태 확인 및 복구
        setTimeout(async () => {
          try {
            const chatConnected = socketStore.isConnected('/chat');
            const notificationConnected = socketStore.isConnected('/notification');
            
            console.log(`📊 연결 상태 - 채팅: ${chatConnected}, 알림: ${notificationConnected}`);
            
            // Socket.IO 자동 재연결이 실패한 경우를 대비한 백업 재연결
            if (!chatConnected) {
              console.log('💬 채팅 소켓 백업 재연결 시도...');
              await socketStore.forceReconnect('/chat').catch(error => {
                console.error('❌ 채팅 백업 재연결 실패:', error);
              });
            }
            
            if (!notificationConnected) {
              console.log('🔔 알림 소켓 백업 재연결 시도...');
              await socketStore.forceReconnect('/notification').catch(error => {
                console.error('❌ 알림 백업 재연결 실패:', error);
              });
            }
            
            console.log('✅ 포어그라운드 복귀 처리 완료');
          } catch (error) {
            console.error('❌ 포어그라운드 복귀 처리 실패:', error);
          }
        }, 1000); // 1초 후 실행 (Socket.IO 자동 재연결에 시간을 줌)
      }
      
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, [isAuthenticated, socketStore]);

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

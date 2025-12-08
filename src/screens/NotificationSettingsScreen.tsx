import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TYPOGRAPHY, SPACING } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { NotificationService } from '../services/notificationService';
import CommonHeader from '../components/CommonHeader';
import SettingItem from '../components/SettingItem';
import CustomAlertModal from '../components/CustomAlertModal';
import { NotificationSettingsUpdate } from '../types/notification';

export default function NotificationSettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // Zustand store 사용
  const { colors } = useThemeStore();

  // 로딩 상태
  const [isLoading, setIsLoading] = useState(true);

  // 알림 토글 상태 관리
  const [notificationStates, setNotificationStates] = useState({
    // 게시글 관련
    posts_like: true,
    posts_new: true,
    posts_comment: true,

    // 피드 관련
    feeds_like: true,
    feeds_new: true,
    feeds_comment: true,

    // 컷츠 관련
    cuts_like: true,
    cuts_new: true,
    cuts_comment: true,

    // 팔로우 관련
    follow_notifications: true,

    // 채팅 관련
    chat_message: true,
  });

  // 전체 알림 토글 상태 (computed)
  const globalNotificationsEnabled = useMemo(() => {
    return Object.values(notificationStates).every(Boolean);
  }, [notificationStates]);

  // 글로벌 알림 로딩 상태
  const [globalNotificationLoading, setGlobalNotificationLoading] = useState(false);

  // 각 토글별 로딩 상태 (연속 클릭 방지)
  const [notificationLoadingStates, setNotificationLoadingStates] = useState<Record<string, boolean>>({});

  // 성공 alert 상태
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // 컴포넌트 상태 키를 API 필드로 매핑
  const mapping = {
    posts_like: 'post_like_notification',
    posts_new: 'post_created_notification',
    posts_comment: 'post_comment_notification',
    feeds_like: 'feed_like_notification',
    feeds_new: 'feed_created_notification',
    feeds_comment: 'feed_comment_notification',
    cuts_like: 'short_like_notification',
    cuts_new: 'short_created_notification',
    cuts_comment: 'short_comment_notification',
    follow_notifications: 'follow_notification',
    chat_message: 'dm_notification',
  };

  // 토글 이름 매핑 (알림 메시지용)
  const notificationTitles = {
    posts_like: '게시글 좋아요 알림',
    posts_new: '게시글 작성 알림',
    posts_comment: '게시글 댓글 알림',
    feeds_like: '피드 좋아요 알림',
    feeds_new: '피드 작성 알림',
    feeds_comment: '피드 댓글 알림',
    cuts_like: '컷츠 좋아요 알림',
    cuts_new: '컷츠 작성 알림',
    cuts_comment: '컷츠 댓글 알림',
    follow_notifications: '팔로우 알림',
    chat_message: '채팅 알림',
  };

  // 알림 설정 데이터 로드
  useEffect(() => {
    const loadNotificationSettings = async () => {
      try {
        const response = await NotificationService.getNotificationSettings();

        if (response.data) {
          // API 데이터를 컴포넌트 상태로 매핑
          setNotificationStates({
            posts_like: response.data.post_like_notification,
            posts_new: response.data.post_created_notification,
            posts_comment: response.data.post_comment_notification,
            feeds_like: response.data.feed_like_notification,
            feeds_new: response.data.feed_created_notification,
            feeds_comment: response.data.feed_comment_notification,
            cuts_like: response.data.short_like_notification,
            cuts_new: response.data.short_created_notification,
            cuts_comment: response.data.short_comment_notification,
            follow_notifications: response.data.follow_notification,
            chat_message: response.data.dm_notification,
          });


        }
      } catch (error) {
        console.warn('알림 설정 로드 실패:', error);
        // 실패 시 기본값 유지
      } finally {
        setIsLoading(false);
      }
    };

    loadNotificationSettings();
  }, []);

  // 새로운 알림 토글 핸들러 (API 호출 포함)
  const updateNotification = async (key: string, value: boolean) => {
    console.log('updateNotification called:', key, value);

    // 이미 로딩 중이면 무시
    if (notificationLoadingStates[key]) return;

    // 로딩 시작
    setNotificationLoadingStates(prev => ({ ...prev, [key]: true }));

    // 낙관적 업데이트: UI 먼저 변경
    setNotificationStates(prev => ({
      ...prev,
      [key]: value
    }));

    try {
      const apiField = mapping[key as keyof typeof mapping];
      const updateData: NotificationSettingsUpdate = {
        [apiField]: value,
      };

      await NotificationService.updateNotificationSettings(updateData);

      // 성공 시 알림 메시지 표시
      const title = notificationTitles[key as keyof typeof notificationTitles];
      const action = value ? '받습니다' : '받지 않습니다';
      setAlertMessage(`${title}을(를) ${action}.`);
      setAlertVisible(true);

    } catch (error) {
      console.warn('알림 설정 업데이트 실패:', error);

      // 실패 시 UI 롤백
      setNotificationStates(prev => ({
        ...prev,
        [key]: !value // 원래 값으로 복원
      }));
    } finally {
      // 로딩 종료
      setNotificationLoadingStates(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleGlobalToggle = async (value: boolean) => {
    console.log('handleGlobalToggle called:', value);

    // 이미 로딩 중이면 무시
    if (globalNotificationLoading) return;

    // 로딩 시작
    setGlobalNotificationLoading(true);

    // 낙관적 업데이트: UI 먼저 변경
    const newStates = {
      posts_like: value,
      posts_new: value,
      posts_comment: value,
      feeds_like: value,
      feeds_new: value,
      feeds_comment: value,
      cuts_like: value,
      cuts_new: value,
      cuts_comment: value,
      follow_notifications: value,
      chat_message: value,
    };
    setNotificationStates(newStates);

    try {
      // 전체 설정 데이터 생성
      const updateData: NotificationSettingsUpdate = {
        post_like_notification: value,
        post_created_notification: value,
        post_comment_notification: value,
        feed_like_notification: value,
        feed_created_notification: value,
        feed_comment_notification: value,
        short_like_notification: value,
        short_created_notification: value,
        short_comment_notification: value,
        follow_notification: value,
        dm_notification: value,
      };

      await NotificationService.updateNotificationSettings(updateData);

      // 성공 시 알림 메시지 표시
      const action = value ? '받습니다' : '받지 않습니다';
      setAlertMessage(`전체 알림을(를) ${action}.`);
      setAlertVisible(true);

    } catch (error) {
      console.warn('전체 알림 설정 업데이트 실패:', error);

      // 실패 시 UI 롤백 (반대로 되돌리기)
      setNotificationStates({
        posts_like: !value,
        posts_new: !value,
        posts_comment: !value,
        feeds_like: !value,
        feeds_new: !value,
        feeds_comment: !value,
        cuts_like: !value,
        cuts_new: !value,
        cuts_comment: !value,
        follow_notifications: !value,
        chat_message: !value,
      });
    } finally {
      // 로딩 종료
      setGlobalNotificationLoading(false);
    }
  };

  // 스타일 생성
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <CommonHeader title="알림 설정" />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
      >
        {/* 전체 알림 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionContainer}>
            <SettingItem
              title="전체 알림"
              subtitle="모든 알림 설정을 한 번에 켜거나 끌 수 있습니다"
              showToggle={true}
              toggleValue={globalNotificationsEnabled}
              onToggleChange={handleGlobalToggle}
              colors={colors}
              isLast={true}
            />
          </View>
        </View>

        {/* 게시글 알림 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>게시글 알림</Text>
          <View style={styles.sectionContainer}>
            <SettingItem
              title="좋아요 알림"
              subtitle="내 게시물에 좋아요가 달렸을 때"
              showToggle={true}
              toggleValue={notificationStates.posts_like}
              onToggleChange={(value) => updateNotification('posts_like', value)}
              colors={colors}
            />
            <SettingItem
              title="게시글 알림"
              subtitle="새 게시물이 올라올 때"
              showToggle={true}
              toggleValue={notificationStates.posts_new}
              onToggleChange={(value) => updateNotification('posts_new', value)}
              colors={colors}
            />
            <SettingItem
              title="댓글 알림"
              subtitle="내 게시물이나 댓글에 답글이 달렸을 때"
              showToggle={true}
              toggleValue={notificationStates.posts_comment}
              onToggleChange={(value) => updateNotification('posts_comment', value)}
              colors={colors}
              isLast={true}
            />
          </View>
        </View>

        {/* 피드 알림 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>피드 알림</Text>
          <View style={styles.sectionContainer}>
            <SettingItem
              title="좋아요 알림"
              subtitle="내 피드에 좋아요가 달렸을 때"
              showToggle={true}
              toggleValue={notificationStates.feeds_like}
              onToggleChange={(value) => updateNotification('feeds_like', value)}
              colors={colors}
            />
            <SettingItem
              title="피드 알림"
              subtitle="새 피드가 올라올 때"
              showToggle={true}
              toggleValue={notificationStates.feeds_new}
              onToggleChange={(value) => updateNotification('feeds_new', value)}
              colors={colors}
            />
            <SettingItem
              title="댓글 알림"
              subtitle="내 피드나 댓글에 답글이 달렸을 때"
              showToggle={true}
              toggleValue={notificationStates.feeds_comment}
              onToggleChange={(value) => updateNotification('feeds_comment', value)}
              colors={colors}
              isLast={true}
            />
          </View>
        </View>

        {/* 컷츠 알림 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>컷츠 알림</Text>
          <View style={styles.sectionContainer}>
            <SettingItem
              title="좋아요 알림"
              subtitle="내 컷츠에 좋아요가 달렸을 때"
              showToggle={true}
              toggleValue={notificationStates.cuts_like}
              onToggleChange={(value) => updateNotification('cuts_like', value)}
              colors={colors}
            />
            <SettingItem
              title="컷츠 알림"
              subtitle="새 컷츠가 올라올 때"
              showToggle={true}
              toggleValue={notificationStates.cuts_new}
              onToggleChange={(value) => updateNotification('cuts_new', value)}
              colors={colors}
            />
            <SettingItem
              title="댓글 알림"
              subtitle="내 컷츠나 댓글에 답글이 달렸을 때"
              showToggle={true}
              toggleValue={notificationStates.cuts_comment}
              onToggleChange={(value) => updateNotification('cuts_comment', value)}
              colors={colors}
              isLast={true}
            />
          </View>
        </View>

        {/* 팔로우 알림 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>팔로우 알림</Text>
          <View style={styles.sectionContainer}>
            <SettingItem
              title="팔로우 알림"
              subtitle="팔로우, 팔로잉, 팔로우 요청 관련 알림"
              showToggle={true}
              toggleValue={notificationStates.follow_notifications}
              onToggleChange={(value) => updateNotification('follow_notifications', value)}
              colors={colors}
              isLast={true}
            />
          </View>
        </View>

        {/* 채팅 알림 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>채팅 알림</Text>
          <View style={styles.sectionContainer}>
            <SettingItem
              title="채팅 알림"
              subtitle="새 메시지가 도착할 때"
              showToggle={true}
              toggleValue={notificationStates.chat_message}
              onToggleChange={(value) => updateNotification('chat_message', value)}
              colors={colors}
              isLast={true}
            />
          </View>
        </View>
      </ScrollView>

      {/* 성공 알림 모달 */}
      <CustomAlertModal
        visible={alertVisible}
        message={alertMessage}
        buttons={[
          {
            text: '확인',
            onPress: () => setAlertVisible(false),
          }
        ]}
        onClose={() => setAlertVisible(false)}
      />
    </View>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.GRAY_50,
  },

  scrollView: {
    flex: 1,
  },

  section: {
    marginTop: SPACING.SM,
  },

  sectionHeader: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_700,
    paddingHorizontal: SPACING.MD,
    paddingTop: SPACING.SM,
    paddingBottom: SPACING.XS,
  },

  sectionContainer: {
    backgroundColor: colors.WHITE,
    marginHorizontal: SPACING.MD,
    borderRadius: SPACING.SM,
    overflow: 'hidden',
  },
});

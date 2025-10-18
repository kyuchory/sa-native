import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TYPOGRAPHY, SPACING } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { useAuthStore } from '../stores/authStore';
import CommonHeader from '../components/CommonHeader';
import SettingItem from '../components/SettingItem';

export default function SettingsScreen() {
  const navigation = useNavigation();

  // Zustand store 사용
  const { isDark, toggleTheme, colors } = useThemeStore();
  const { logout, isLoading } = useAuthStore();

  // Toggle 상태 관리 (다크 모드를 제외한 나머지)
  const [isNotifications, setIsNotifications] = useState(true);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [isHDQuality, setIsHDQuality] = useState(true);

  // 네비게이션 핸들러들
  const handleProfileEdit = () => {
    console.log('프로필 편집');
  };

  const handlePasswordChange = () => {
    console.log('비밀번호 변경');
  };

  const handleAccountDelete = () => {
    // 계정 삭제는 확인 팝업 필요
    console.log('계정 삭제');
  };

  const handleBlockedUsers = () => {
    navigation.navigate('BlockedUsers' as never);
  };

  const handlePrivacy = () => {
    navigation.navigate('ProfileVisibility' as never);
  };

  const handleThemeSettings = () => {
    navigation.navigate('ThemeModeSettings' as never);
  };

  const handleNotifications = () => {
    console.log('알림 설정 상세');
  };

  const handleLanguage = () => {
    console.log('언어 설정');
  };

  const handleSupport = () => {
    navigation.navigate('SupportList' as never);
  };

  const handleAppInfo = () => {
    console.log('앱 정보');
  };

  const handleMediaSelectorTest = () => {
    navigation.navigate('MediaSelector' as never);
  };

  const handleCanvasEditorTest = () => {
    navigation.navigate('CanvasEditor' as never);
  };

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              console.log('✅ 로그아웃 완료');
            } catch (error) {
              console.error('❌ 로그아웃 실패:', error);
              Alert.alert('오류', '로그아웃 중 오류가 발생했습니다.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // 스타일 생성
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <CommonHeader title="설정" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 계정 관리 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionContainer}>
            <SettingItem
              title="내 정보 수정"
              showArrow={true}
              onPress={handleProfileEdit}
              colors={colors}
            />
            <SettingItem
              title="비밀번호 변경"
              showArrow={true}
              onPress={handlePasswordChange}
              colors={colors}
            />
            <SettingItem
              title="차단 목록"
              showArrow={true}
              onPress={handleBlockedUsers}
              colors={colors}
              isLast={true}
            />
          </View>
        </View>

        {/* 개인 정보 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionContainer}>
            <SettingItem
              title="개인정보 보호"
              subtitle="프로필 공개 범위 설정"
              showArrow={true}
              onPress={handlePrivacy}
              colors={colors}
              isLast={true}
            />
          </View>
        </View>

        {/* 앱 설정 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionContainer}>
            <SettingItem
              title="다크 모드"
              subtitle="테마 설정"
              showArrow={true}
              onPress={handleThemeSettings}
              colors={colors}
            />
            <SettingItem
              title="알림"
              subtitle="푸시 알림, 마케팅 알림"
              showToggle={true}
              toggleValue={isNotifications}
              onToggleChange={setIsNotifications}
              colors={colors}
            />
            <SettingItem
              title="자동 재생"
              subtitle="Wi-Fi에서만"
              showToggle={true}
              toggleValue={isAutoPlay}
              onToggleChange={setIsAutoPlay}
              colors={colors}
              isLast={true}
            />
            {/* <SettingItem
              title="HD 품질"
              subtitle="더 높은 화질로 재생"
              showToggle={true}
              toggleValue={isHDQuality}
              onToggleChange={setIsHDQuality}
              colors={colors}
            />
            <SettingItem
              title="언어"
              showArrow={true}
              onPress={handleLanguage}
              colors={colors}
              isLast={true}
            /> */}
          </View>
        </View>

        {/* 지원 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionContainer}>
            <SettingItem
              title="고객센터"
              subtitle="문의하기"
              showArrow={true}
              onPress={handleSupport}
              colors={colors}
            />
            <SettingItem
              title="앱 정보"
              subtitle="버전 및 약관"
              showArrow={true}
              onPress={handleAppInfo}
              colors={colors}
              isLast={true}
            />
          </View>
        </View>

        {/* 위험한 액션들 - 따로 분리 */}
        <View style={styles.dangerSection}>
          <View style={styles.sectionContainer}>
            <SettingItem
              title="로그아웃"
              onPress={handleLogout}
              colors={colors}
            />
            <SettingItem
              title="계정 삭제"
              onPress={handleAccountDelete}
              colors={colors}
            />
            <SettingItem
              title="미디어 선택기 테스트"
              subtitle="이미지/비디오 선택 화면 테스트"
              showArrow={true}
              onPress={handleMediaSelectorTest}
              colors={colors}
            />
            <SettingItem
              title="캔버스 에디터"
              subtitle="그림판 기능 테스트"
              showArrow={true}
              onPress={handleCanvasEditorTest}
              colors={colors}
              isLast={true}
            />
          </View>

          {/* 앱 버전 정보 */}
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>버전 1.0.0</Text>
          </View>
        </View>
      </ScrollView>
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

  sectionContainer: {
    backgroundColor: colors.WHITE,
    marginHorizontal: SPACING.MD,
    borderRadius: SPACING.SM,
    overflow: 'hidden',
  },

  dangerSection: {
    marginTop: SPACING.LG,
    marginBottom: SPACING.XL,
  },

  versionContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.MD,
  },

  versionText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_500,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
});

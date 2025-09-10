import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TYPOGRAPHY, COLORS, SPACING, BG_COLORS, TEXT_COLORS } from '../constants/theme';
import CommonHeader from '../components/CommonHeader';
import SettingItem from '../components/SettingItem';

export default function SettingsScreen() {
  const navigation = useNavigation();

  // Toggle 상태 관리
  const [isDarkMode, setIsDarkMode] = useState(false);
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
    console.log('차단된 사용자 목록');
  };

  const handlePrivacy = () => {
    console.log('개인정보 설정');
  };

  const handleNotifications = () => {
    console.log('알림 설정 상세');
  };

  const handleLanguage = () => {
    console.log('언어 설정');
  };

  const handleSupport = () => {
    console.log('고객센터');
  };

  const handleAppInfo = () => {
    console.log('앱 정보');
  };

  const handleLogout = () => {
    console.log('로그아웃');
  };

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
            />
            <SettingItem
              title="비밀번호 변경"
              showArrow={true}
              onPress={handlePasswordChange}
            />
            <SettingItem
              title="차단 목록"
              showArrow={true}
              onPress={handleBlockedUsers}
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
              isLast={true}
            />
          </View>
        </View>

        {/* 앱 설정 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionContainer}>
            <SettingItem
              title="다크 모드"
              showToggle={true}
              toggleValue={isDarkMode}
              onToggleChange={setIsDarkMode}
            />
            <SettingItem
              title="알림"
              subtitle="푸시 알림, 마케팅 알림"
              showToggle={true}
              toggleValue={isNotifications}
              onToggleChange={setIsNotifications}
            />
            <SettingItem
              title="자동 재생"
              subtitle="Wi-Fi에서만"
              showToggle={true}
              toggleValue={isAutoPlay}
              onToggleChange={setIsAutoPlay}
            />
            <SettingItem
              title="HD 품질"
              subtitle="더 높은 화질로 재생"
              showToggle={true}
              toggleValue={isHDQuality}
              onToggleChange={setIsHDQuality}
            />
            <SettingItem
              title="언어"
              showArrow={true}
              onPress={handleLanguage}
              isLast={true}
            />
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
            />
            <SettingItem
              title="앱 정보"
              subtitle="버전 및 약관"
              showArrow={true}
              onPress={handleAppInfo}
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
            />
            <SettingItem
              title="계정 삭제"
              onPress={handleAccountDelete}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLORS.SECONDARY,
  },

  scrollView: {
    flex: 1,
  },

  section: {
    marginTop: SPACING.SM,
  },

  sectionContainer: {
    backgroundColor: COLORS.WHITE,
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
    color: TEXT_COLORS.DISABLED,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
});

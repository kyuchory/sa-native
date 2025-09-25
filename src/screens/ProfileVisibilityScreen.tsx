import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { TYPOGRAPHY, SPACING } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { useAuthStore } from '../stores/authStore';
import { ProfileService } from '../services/profileService';
import CommonHeader from '../components/CommonHeader';
import LoadingOverlay from '../components/LoadingOverlay';

type VisibilityOption = 'public' | 'followers';

export default function ProfileVisibilityScreen() {
  const { colors } = useThemeStore();
  const { user: currentUser } = useAuthStore();
  const [selectedVisibility, setSelectedVisibility] = useState<VisibilityOption>('public');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // 컴포넌트 마운트 시 현재 설정값 로드
  useEffect(() => {
    loadCurrentProfile();
  }, []);

  const loadCurrentProfile = async () => {
    if (!currentUser?.id) return;
    
    try {
      setInitialLoading(true);
      const response = await ProfileService.getProfile(currentUser.id);
      setSelectedVisibility(response.data.profile_visibility);
    } catch (error) {
      console.error('프로필 정보 조회 실패:', error);
      Alert.alert('오류', '프로필 정보를 불러오는데 실패했습니다.');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleVisibilityChange = async (option: VisibilityOption) => {
    if (!currentUser?.id) return;
    
    // 이미 선택된 옵션이면 API 호출하지 않음
    if (selectedVisibility === option) return;

    try {
      setLoading(true);
      
      // API 호출
      await ProfileService.updateProfileVisibility({ 
        profile_visibility: option 
      });
      
      // 성공 시 로컬 상태 업데이트
      setSelectedVisibility(option);
      
      // 성공 메시지
      Alert.alert(
        '설정 완료', 
        `프로필이 ${option === 'public' ? '공개' : '팔로워만'}로 설정되었습니다.`
      );
      
    } catch (error) {
      console.error('프로필 공개여부 수정 실패:', error);
      Alert.alert('오류', '설정 변경에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(colors);

  if (initialLoading) {
    return (
      <View style={styles.container}>
        <CommonHeader title="프로필 공개 범위 설정" />
        <LoadingOverlay visible={true} message='프로필 공개 범위 불러오는중...' />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CommonHeader title="프로필 공개 범위 설정" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* 공개 옵션 */}
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => handleVisibilityChange('public')}
            disabled={loading}
          >
            <View style={styles.radioContainer}>
              <View
                style={[
                  styles.radioOuter,
                  { 
                    borderColor: selectedVisibility === 'public' ? colors.PRIMARY : colors.GRAY_400,
                    opacity: loading ? 0.5 : 1
                  },
                ]}
              >
                {selectedVisibility === 'public' && (
                  <View
                    style={[
                      styles.radioInner,
                      { backgroundColor: colors.PRIMARY },
                    ]}
                  />
                )}
              </View>
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.optionTitle, { color: colors.GRAY_900 }]}>
                공개
              </Text>
              <Text style={[styles.optionDescription, { color: colors.GRAY_600 }]}>
                모든 사용자가 프로필을 볼 수 있습니다.
              </Text>
            </View>
          </TouchableOpacity>

          {/* 팔로워만 옵션 */}
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => handleVisibilityChange('followers')}
            disabled={loading}
          >
            <View style={styles.radioContainer}>
              <View
                style={[
                  styles.radioOuter,
                  { 
                    borderColor: selectedVisibility === 'followers' ? colors.PRIMARY : colors.GRAY_400,
                    opacity: loading ? 0.5 : 1
                  },
                ]}
              >
                {selectedVisibility === 'followers' && (
                  <View
                    style={[
                      styles.radioInner,
                      { backgroundColor: colors.PRIMARY },
                    ]}
                  />
                )}
              </View>
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.optionTitle, { color: colors.GRAY_900 }]}>
                팔로워만
              </Text>
              <Text style={[styles.optionDescription, { color: colors.GRAY_600 }]}>
                팔로워만 프로필을 볼 수 있습니다.
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {loading && <LoadingOverlay visible={true} message='프로필 공개 범위 설정중...' />}
    </View>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.WHITE,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: SPACING.SM,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: colors.GRAY_200,
  },
  radioContainer: {
    marginRight: SPACING.MD,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  textContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_500,
  },
});
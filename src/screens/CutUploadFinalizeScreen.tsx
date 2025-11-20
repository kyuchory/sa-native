import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
  TextInput,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Image } from 'expo-image';
import { useThemeStore } from '../stores/themeStore';
import { useCutStore } from '../stores/cutStore';
import useProfileStore from '../stores/profileStore';
import { CutService } from '../services/cutService';
import CommonHeader from '../components/CommonHeader';
import LoadingOverlay from '../components/LoadingOverlay';
import UserAvatar from '../components/UserAvatar';
import { ShortCategory } from '../types/cut';


import { HeartIcon, CommentIcon, ShareIcon, UploadIcon, BackIcon, MoreVerticalIcon } from '../components/CutIcons';
import { SPACING, TYPOGRAPHY, COLORS, BORDER_RADIUS } from '../constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type AuthStackParamList = {
  CutUploadFinalize: {
    videoUri: string;
    trimStart: number;
    trimEnd: number;
    cropArea: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    thumbnailUri?: string;
  };
};

type CutUploadFinalizeRouteProp = RouteProp<AuthStackParamList, 'CutUploadFinalize'>;
type CutUploadFinalizeNavigationProp = StackNavigationProp<AuthStackParamList, 'CutUploadFinalize'>;

export default function CutUploadFinalizeScreen() {
  const { colors } = useThemeStore();
  const navigation = useNavigation<CutUploadFinalizeNavigationProp>();
  const route = useRoute<CutUploadFinalizeRouteProp>();

  const { categories, isLoadingCategories, error, fetchCategories } = useCutStore();

  const { videoUri, trimStart, trimEnd, cropArea, thumbnailUri } = route.params;

  const [description, setDescription] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<ShortCategory[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const styles = createStyles(colors);

  // 카테고리 로드
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCategorySelect = useCallback((category: ShortCategory) => {
    setSelectedCategories(prev => {
      const isSelected = prev.some(cat => cat.id === category.id);
      if (isSelected) {
        return prev.filter(cat => cat.id !== category.id);
      } else {
        if (prev.length >= 3) return prev; // 최대 3개 제한
        return [...prev, category];
      }
    });
  }, []);

  const validateAndUpload = useCallback(async () => {
    // valida tion
    if (selectedCategories.length === 0) {
      Alert.alert('오류', '최소 1개의 카테고리를 선택해주세요.');
      return;
    }

    if (description.trim().length > 300) {
      Alert.alert('오류', '설명은 300자 이내로 입력해주세요.');
      return;
    }

    try {
      setIsUploading(true);

      const uploadData = {
        file: { uri: videoUri, type: 'video/mp4', name: `cut_${Date.now()}.mp4` },
        type: 'video' as const,
        category_ids: selectedCategories.map(cat => cat.id),
        description: description.trim(),
        trimStart,
        trimEnd,
        cropArea,
      };

      // 최종 업로드 데이터 로그 출력
      console.log('🚀 컷츠 업로드 FormData 최종 데이터:', uploadData);

      // 실제 업로드 호출 (현재 API 없으므로 목데이터 응답)
      const response = await CutService.uploadShorts(uploadData);

      Alert.alert('성공', '컷츠가 성공적으로 업로드되었습니다!', [
        {
          text: '확인',
          onPress: () => {
            // 프로필 숏츠 목록 새로고침 플래그 설정
            useProfileStore.getState().setShouldRefreshProfileShorts(true);
            // 컷츠 탭으로 돌아가기
            navigation.popToTop();
          },
        },
      ]);
    } catch (error: any) {
      console.error('업로드 실패:', error);
      Alert.alert('업로드 실패', error.message || '컷츠 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  }, [videoUri, trimStart, trimEnd, cropArea, description, selectedCategories, navigation]);

  // 플레이스홀더 텍스트 (키보드 입력 시 안내)
  const placeholderText = description.length > 0 ? '' : '컷츠에 대한 설명을 추가하세요... (필요한 경우)';

  return (
    <>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <CommonHeader
          title="컷츠 게시"
          onBackPress={() => navigation.goBack()}
          rightComponent={
            <TouchableOpacity
              onPress={validateAndUpload}
              disabled={isUploading}
              style={styles.uploadButton}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color={colors.WHITE} />
              ) : (
                <Text style={styles.uploadButtonText}>게시</Text>
              )}
            </TouchableOpacity>
          }
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 미디어 프리뷰 - CutScreen 스타일 */}
          <View style={styles.mediaContainer}>
            {/* CutScreen 스타일 헤더 */}
            <View style={styles.cutHeader}>
              <TouchableOpacity style={styles.cutBackButton} activeOpacity={0.8}>
                <BackIcon size={24} color={colors.WHITE} />
              </TouchableOpacity>
              <Text style={styles.cutHeaderTitle}>Cuts</Text>
              <TouchableOpacity style={styles.cutMoreButton} activeOpacity={0.8}>
                <MoreVerticalIcon size={32} color={colors.WHITE} />
              </TouchableOpacity>
            </View>

            {/* 배경 비디오 썸네일 */}
              <Image
                source={{ uri: thumbnailUri || videoUri }}
                style={styles.cutBackgroundImage}
                contentFit="contain"
                cachePolicy="memory-disk"
              />

            {/* 오른쪽 액션 버튼들 */}
            <View style={styles.cutRightActions}>
              {/* 좋아요 */}
              <View style={styles.cutActionButton}>
                <HeartIcon size={28} color={colors.WHITE} filled={false} />
                <Text style={styles.cutActionText}>0</Text>
              </View>

              {/* 댓글 */}
              <View style={styles.cutActionButton}>
                <CommentIcon size={28} color={colors.WHITE} />
                <Text style={styles.cutActionText}>0</Text>
              </View>

              {/* 공유 */}
              <View style={styles.cutActionButton}>
                <ShareIcon size={28} color={colors.WHITE} />
                <Text style={styles.cutActionText}>0</Text>
              </View>

              {/* 업로드 버튼 (미리보기용) */}
              <View style={styles.cutActionButton}>
                <UploadIcon size={28} color={colors.PRIMARY} />
                <Text style={styles.cutActionText}>게시예정</Text>
              </View>
            </View>

            {/* 하단 콘텐츠 오버레이 */}
            <View style={styles.cutBottomOverlay}>
              <View style={styles.cutContentArea}>
                {/* 사용자 정보 */}
                <View style={styles.cutUserInfo}>
                  <Text style={styles.cutUsername}>@나의 컷츠</Text>
                  <Text style={styles.cutTimeText}>방금 전</Text>
                </View>

                {/* 설명 미리보기 */}
                <View style={styles.cutDescriptionContainer}>
                  <Text style={styles.cutDescription} numberOfLines={2}>
                    {description.trim() || '컷츠에 대한 설명을 추가하세요...'}
                  </Text>
                </View>

                {/* 카테고리 태그 미리보기 */}
                {selectedCategories.length > 0 && (
                  <View style={styles.cutTagsContainer}>
                    {selectedCategories.slice(0, 3).map((category) => (
                      <Text key={category.id} style={styles.cutTag}>
                        #{category.name}
                      </Text>
                    ))}
                    {selectedCategories.length > 3 && (
                      <Text style={styles.cutTag}>외 {selectedCategories.length - 3}개</Text>
                    )}
                  </View>
                )}
              </View>
            </View>


          </View>

          {/* 설명 입력 */}
          <View style={styles.section}>
            <TextInput
              style={styles.descriptionInput}
              placeholder="컷츠에 대한 설명을 추가하세요... (필요한 경우)"
              placeholderTextColor={colors.GRAY_400}
              multiline
              maxLength={300}
              onChangeText={setDescription}
              value={description}
              textAlignVertical="top"
            />
            {description.length > 0 && (
              <Text style={styles.characterCount}>
                {description.length}/300
              </Text>
            )}
          </View>

          {/* 카테고리 선택 */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              카테고리 (최소 1개, 최대 3개)
            </Text>
            {isLoadingCategories ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.PRIMARY} />
                <Text style={styles.loadingText}>카테고리를 불러오는 중...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={fetchCategories} style={styles.retryButton}>
                  <Text style={styles.retryText}>다시 시도</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.categoryContainer}>
                {categories.map(category => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      selectedCategories.some(cat => cat.id === category.id) && styles.categoryChipSelected
                    ]}
                    onPress={() => handleCategorySelect(category)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        selectedCategories.some(cat => cat.id === category.id) && styles.categoryTextSelected
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      <LoadingOverlay
        visible={isUploading}
        message="컷츠를 업로드 중입니다..."
      />
    </>
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
  scrollContent: {
    paddingHorizontal: SPACING.MD,
    paddingBottom: SPACING.XL,
  },
  uploadButton: {
    backgroundColor: colors.PRIMARY,
    borderRadius: BORDER_RADIUS.XL,
    minWidth: 60,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.SM,
  },
  uploadButtonText: {
    color: colors.WHITE,
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
  },

  // 미디어 프리뷰
  mediaContainer: {
    marginTop: SPACING.LG,
    marginBottom: SPACING.XL,
    position: 'relative',
  },

  // 입력 섹션
  section: {
    marginBottom: SPACING.XL,
  },
  sectionLabel: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: colors.GRAY_900,
    marginBottom: SPACING.SM,
  },

  // 설명 입력
  descriptionInput: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_900,
    minHeight: 100,
    lineHeight: 24,
    textAlign: 'left',
    backgroundColor: colors.GRAY_100, // 다크모드에서는 더 밝은 회색, 라이트모드에서는 밝은 회색 - 배경과 구분되게
    borderRadius: BORDER_RADIUS.MD,
    borderWidth: 1,
    borderColor: colors.GRAY_200,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.GRAY_600,
    textAlign: 'right',
    marginTop: SPACING.XS,
  },

  // 카테고리
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
  },
  categoryChip: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.ROUND,
    borderWidth: 1,
    borderColor: colors.GRAY_200,
  },
  categoryChipSelected: {
    backgroundColor: colors.PRIMARY,
    borderColor: colors.PRIMARY,
  },
  categoryText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_600,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
  categoryTextSelected: {
    color: colors.WHITE,
  },

  // 로딩 및 에러 상태
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.LG,
    gap: SPACING.SM,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_600,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.LG,
    gap: SPACING.SM,
  },
  errorText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.ERROR || colors.GRAY_700,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.XS,
    backgroundColor: colors.PRIMARY,
    borderRadius: BORDER_RADIUS.MD,
  },
  retryText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.WHITE,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },

  // CutScreen 스타일 (미리보기용)
  cutHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: (StatusBar.currentHeight || 44) + SPACING.SM,
    paddingHorizontal: SPACING.MD,
    paddingBottom: SPACING.SM,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  cutBackButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cutHeaderTitle: {
    fontSize: TYPOGRAPHY.SIZE.LG,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: colors.WHITE,
  },
  cutMoreButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cutBackgroundImage: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.7,
    resizeMode: 'cover',
  },
  cutRightActions: {
    position: 'absolute',
    right: SPACING.XS,
    bottom: 140, // CutScreen 200의 70% = 140 (축소 비율 반영)
    alignItems: 'center',
    gap: SPACING.LG,
  },
  cutActionButton: {
    alignItems: 'center',
    gap: SPACING.XS,
  },
  cutActionText: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.WHITE,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cutProfileContainer: {
    marginTop: SPACING.MD,
  },
  cutBottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: SPACING.MD,
    paddingTop: SPACING.MD,
    paddingBottom: SPACING.LG,
  },
  cutContentArea: {
    flex: 1,
  },
  cutUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.XS,
    gap: SPACING.SM,
  },
  cutUsername: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: colors.WHITE,
  },
  cutTimeText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  cutDescriptionContainer: {
    marginBottom: SPACING.XS,
  },
  cutDescription: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.WHITE,
    lineHeight: 20,
  },
  cutTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
  },
  cutTag: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.WHITE,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
});

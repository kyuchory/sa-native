import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { AuthStackParamList } from '../types/navigation';
import type { ContentBlock, ContentBlockType, Category } from '../types/post';
import { openSettings } from 'react-native-permissions';

// Components
import CommonHeader from '../components/CommonHeader';
import CategoryPicker from '../components/CategoryPicker';
import { ContentBlockComponent } from '../components/ContentBlocks';
import { AddTextIcon, AddImageIcon, AddVideoIcon } from '../components/CommonIcons';
import { WriteIcon } from '../components/HomeHeaderIcons';
import LoadingOverlay from '../components/LoadingOverlay';
import CustomAlertModal from '../components/CustomAlertModal';

// Services
import { PostService } from '../services/postService';

// Stores
import usePostStore from '../stores/postStore';
import useProfileStore from '../stores/profileStore';

type CreatePostNavigationProp = StackNavigationProp<AuthStackParamList, 'CreatePost'>;

export default function CreatePostScreen() {
  const navigation = useNavigation<CreatePostNavigationProp>();
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  // 상태 관리
  const [title, setTitle] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(0);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number>(0);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [alertModal, setAlertModal] = useState<{visible: boolean, title: string, message: string, buttons: any[]} | null>(null);

  // Zustand 스토어
  const { setShouldRefreshPosts, videoEditResult, setVideoEditResult } = usePostStore();
  const { setShouldRefreshProfilePosts } = useProfileStore();

  // 컴포넌트 마운트 시 카테고리 로드 및 기본 텍스트 블록 추가
  useEffect(() => {
    loadCategories();
    addDefaultTextBlock();
  }, []);

  // 비디오 편집 결과 처리 (로컬 데이터만 저장)
  useFocusEffect(
    React.useCallback(() => {
      if (videoEditResult) {
        // 비디오 블록 추가 (로컬 URI와 편집 정보 저장)
        const newVideoBlock: ContentBlock = {
          id: `video_${Date.now()}`,
          type: 'video',
          value: videoEditResult.videoUri, // 로컬 비디오 URI
          sequence: contentBlocks.length,
          editInfo: videoEditResult.editInfo, // 편집 정보
        };

        setContentBlocks(prev => [...prev, newVideoBlock]);

        // 처리 완료 후 결과 클리어
        setVideoEditResult(null);
      }
    }, [videoEditResult, contentBlocks.length, setVideoEditResult])
  );

  // 카테고리 로드
  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const categoriesData = await PostService.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      setAlertModal({
        visible: true,
        title: '오류',
        message: '카테고리를 불러오는데 실패했습니다.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
      console.error('카테고리 로드 실패:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // 기본 텍스트 블록 추가
  const addDefaultTextBlock = () => {
    const defaultBlock: ContentBlock = {
      id: `text_${Date.now()}`,
      type: 'text',
      value: '',
      sequence: 0,
    };
    setContentBlocks([defaultBlock]);
  };

  // 블록 추가
  const addBlock = (type: ContentBlockType) => {
    const newBlock: ContentBlock = {
      id: `${type}_${Date.now()}`,
      type,
      value: '',
      sequence: contentBlocks.length, // 현재 블록 개수를 sequence로 사용
    };
    setContentBlocks(prev => [...prev, newBlock]);
  };

  // 블록 내용 변경
  const updateBlockContent = useCallback((blockId: string, content: string) => {
    setContentBlocks(prev =>
      prev.map(block =>
        block.id === blockId ? { ...block, value: content } : block
      )
    );
  }, []);

  // 블록 삭제
  const deleteBlock = useCallback((blockId: string) => {
    setContentBlocks(prev => {
      const filteredBlocks = prev.filter(block => block.id !== blockId);
      // sequence 재정렬 (0부터 시작)
      return filteredBlocks.map((block, index) => ({
        ...block,
        sequence: index
      }));
    });
  }, []);

  // 블록 위로 이동
  const moveBlockUp = useCallback((blockId: string) => {
    setContentBlocks(prev => {
      const blockIndex = prev.findIndex(block => block.id === blockId);
      if (blockIndex <= 0) return prev;

      const newBlocks = [...prev];
      [newBlocks[blockIndex - 1], newBlocks[blockIndex]] =
      [newBlocks[blockIndex], newBlocks[blockIndex - 1]];

      // sequence 재정렬 (0부터 시작)
      return newBlocks.map((block, index) => ({
        ...block,
        sequence: index
      }));
    });
  }, []);

  // 블록 아래로 이동
  const moveBlockDown = useCallback((blockId: string) => {
    setContentBlocks(prev => {
      const blockIndex = prev.findIndex(block => block.id === blockId);
      if (blockIndex >= prev.length - 1) return prev;

      const newBlocks = [...prev];
      [newBlocks[blockIndex], newBlocks[blockIndex + 1]] =
      [newBlocks[blockIndex + 1], newBlocks[blockIndex]];

      // sequence 재정렬 (0부터 시작)
      return newBlocks.map((block, index) => ({
        ...block,
        sequence: index
      }));
    });
  }, []);



  // 이미지 선택
  const handleImageSelection = async () => {
    try {
      // 권한 요청
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setAlertModal({
          visible: true,
          title: '권한 필요',
          message: '갤러리 접근 권한이 필요합니다. 설정에서 허용해주세요.',
          buttons: [{ text: '설정', onPress: () => openSettings() },{ text: '확인', onPress: () => setAlertModal(null) }]
        });
        return;
      }

      // 이미지 선택
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        allowsEditing: true, // 이미지 편집 기능 활성화
        quality: 0.8, // 품질 조정
      });

      if (!result.canceled && result.assets.length > 0) {
        const selectedImage = result.assets[0];

        // 이미지 블록 추가 (로컬 URI만 저장)
        const newImageBlock: ContentBlock = {
          id: `image_${Date.now()}`,
          type: 'image',
          value: selectedImage.uri, // 로컬 URI 저장
          sequence: contentBlocks.length,
        };

        setContentBlocks(prev => [...prev, newImageBlock]);
      }
    } catch (error) {
      setAlertModal({
        visible: true,
        title: '오류',
        message: '이미지 선택에 실패했습니다.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
      console.error('이미지 선택 실패:', error);
    }
  };

  // 비디오 선택 및 편집 화면 이동
  const handleVideoSelection = async () => {
    try {
      // 권한 요청
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setAlertModal({
          visible: true,
          title: '권한 필요',
          message: '갤러리 접근 권한이 필요합니다. 설정에서 허용해주세요.',
          buttons: [{ text: '설정', onPress: () => openSettings() }, { text: '확인', onPress: () => setAlertModal(null) }]
        });
        return;
      }

      // 비디오 선택
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsMultipleSelection: false,
        allowsEditing: false, // 비디오 편집 기능 활성화
        quality: 0.8, // 품질 조정
      });

      if (!result.canceled && result.assets.length > 0) {
        const selectedVideo = result.assets[0];

        // VideoTrimCrop 화면으로 이동 (편집 후 업로드)
        navigation.navigate('VideoTrimCrop', {
          videoUri: selectedVideo.uri,
          videoDuration: selectedVideo.duration ? selectedVideo.duration * 1000 : undefined, // ms로 변환
          aspectRatio: undefined, // trim only
          uploadService: 'post', // post 서비스로 업로드
          editMode: 'trim', // 트림만 사용
          maxDuration: 180000, // 최대 3분
        } as any);
      }
    } catch (error) {
      setAlertModal({
        visible: true,
        title: '오류',
        message: '카테고리를 불러오는데 실패했습니다.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
      console.error('카테고리 로드 실패:', error);
    }
  };

  // 카테고리 선택 처리
  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
    if (categoryId !== selectedCategoryId) {
      setSelectedSubcategoryId(0); // 다른 카테고리 선택시 서브카테고리 초기화
    }
  };

  // 게시물 작성 완료
  const handleCreatePost = async () => {
    // 유효성 검사
    if (!title.trim()) {
      setAlertModal({
        visible: true,
        title: '오류',
        message: '제목을 입력해주세요.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
      return;
    }

    if (!selectedSubcategoryId) {
      setAlertModal({
        visible: true,
        title: '오류',
        message: '카테고리를 선택해주세요.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
      return;
    }

    const hasContent = contentBlocks.some(block => block.value.trim());
    if (!hasContent) {
      setAlertModal({
        visible: true,
        title: '오류',
        message: '내용을 입력해주세요.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
      return;
    }

    try {
      setIsLoading(true);

      // content_blocks 준비 (서버 전송용)
      const processedBlocks = contentBlocks
        .filter(block => block.value.trim()) // 빈 블록 제외
        .map(({ id, ...block }, index) => ({
          type: block.type,
          value: block.type === 'text' ? block.value : null, // 미디어는 null
          sequence: index,
          ...(block.editInfo && { editInfo: block.editInfo }) // 비디오 편집 정보
        }));

      // FormData 구성
      const formData = new FormData();

      formData.append('title', title.trim());
      formData.append('sub_category_id', selectedSubcategoryId.toString());
      formData.append('content_blocks', JSON.stringify(processedBlocks));

      // 미디어 파일들 추가
      const imageBlocks = contentBlocks.filter(b => b.type === 'image');
      const videoBlocks = contentBlocks.filter(b => b.type === 'video');

      imageBlocks.forEach((block, index) => {
        const fileData = {
          uri: block.value,
          type: 'image/jpeg',
          name: `image_${index}.jpg`
        } as any;
        formData.append('images', fileData);
      });

      videoBlocks.forEach((block, index) => {
        const fileData = {
          uri: block.value,
          type: 'video/mp4',
          name: `video_${index}.mp4`
        } as any;
        formData.append('videos', fileData);
      });

      // 통합 API 호출
      const result = await PostService.createPostWithFiles(formData);

      // 목록 새로고침 플래그 설정
      setShouldRefreshPosts(true);
      setShouldRefreshProfilePosts(true);

      // 성공 alert 표시
      setAlertModal({
        visible: true,
        title: '성공',
        message: '게시물이 성공적으로 작성되었습니다.',
        buttons: [{
          text: '확인',
          onPress: () => {
            setAlertModal(null);
            // 작성된 게시물 상세 화면으로 이동
            navigation.replace('PostDetail', { postId: result.postId });
          }
        }]
      });
    } catch (error) {
      setAlertModal({
        visible: true,
        title: '오류',
        message: '게시물 작성에 실패했습니다. 다시 시도해주세요.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
      console.error('게시물 작성 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 헤더 */}
      <CommonHeader
        title="새 게시물"
        rightComponent={
          <TouchableOpacity
            style={styles.publishButton}
            onPress={handleCreatePost}
            activeOpacity={0.7}
          >
            <WriteIcon size={20} color={colors.PRIMARY} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 제목 입력 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>제목</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.titleInput}
              placeholder="제목을 입력해주세요"
              placeholderTextColor={colors.GRAY_400}
              value={title}
              onChangeText={setTitle}
              maxLength={150}
            />
          </View>
        </View>

        {/* 카테고리 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>카테고리</Text>
          <View style={styles.categoryContainer}>
            {isLoadingCategories ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>카테고리 로딩 중...</Text>
              </View>
            ) : (
              <CategoryPicker
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                selectedSubcategoryId={selectedSubcategoryId}
                onCategorySelect={handleCategorySelect}
                onSubcategorySelect={setSelectedSubcategoryId}
              />
            )}
          </View>
        </View>

        {/* 콘텐츠 블록들 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>내용</Text>
          <View style={styles.contentContainer}>
            {contentBlocks.map((block, index) => (
              <ContentBlockComponent
                key={block.id}
                block={block}
                onContentChange={updateBlockContent}
                onDeleteBlock={deleteBlock}
                onMoveUp={moveBlockUp}
                onMoveDown={moveBlockDown}
                canMoveUp={index > 0}
                canMoveDown={index < contentBlocks.length - 1}
              />
            ))}
          </View>
        </View>

        {/* 하단 여백 */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* 하단 추가 버튼들 */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => addBlock('text')}
          activeOpacity={0.7}
        >
          <AddTextIcon size={24} color={colors.GRAY_600} />
          <Text style={styles.addButtonText}>텍스트</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addButton}
          onPress={handleImageSelection}
          activeOpacity={0.7}
        >
          <AddImageIcon size={24} color={colors.GRAY_600} />
          <Text style={styles.addButtonText}>이미지</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addButton}
          onPress={handleVideoSelection}
          activeOpacity={0.7}
        >
          <AddVideoIcon size={24} color={colors.GRAY_600} />
          <Text style={styles.addButtonText}>비디오</Text>
        </TouchableOpacity>
      </View>

      {/* 로딩 오버레이 */}
      <LoadingOverlay
        visible={isLoading}
        message="게시물을 작성중입니다..."
      />

      {/* Custom Alert Modal */}
      {alertModal && (
        <CustomAlertModal
          visible={alertModal.visible}
          title={alertModal.title}
          message={alertModal.message}
          buttons={alertModal.buttons}
          onClose={() => setAlertModal(null)}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.GRAY_100, // BG_COLORS.SECONDARY
  },

  // 헤더 관련
  publishButton: {
    padding: SPACING.SM,
  },

  // 콘텐츠
  content: {
    flex: 1,
  },

  // 공통 섹션 스타일
  section: {
    marginHorizontal: SPACING.MD,
    marginTop: SPACING.MD,
  },

  // 섹션 라벨
  sectionLabel: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900, // TEXT_COLORS.PRIMARY
    marginBottom: SPACING.SM,
  },

  // 입력 컨테이너
  inputContainer: {
    backgroundColor: colors.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    borderWidth: 1,
    borderColor: colors.GRAY_200,
  },

  titleInput: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: colors.GRAY_900, // TEXT_COLORS.PRIMARY
    paddingVertical: SPACING.XS,
    textAlignVertical: 'center' as const,
  },

  // 카테고리 컨테이너
  categoryContainer: {
    backgroundColor: colors.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    borderWidth: 1,
    borderColor: colors.GRAY_200,
    overflow: 'hidden' as const,
  },

  // 콘텐츠 컨테이너
  contentContainer: {
    backgroundColor: colors.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    borderWidth: 1,
    borderColor: colors.GRAY_200,
    padding: SPACING.SM,
  },


  // 로딩
  loadingContainer: {
    padding: SPACING.LG,
    alignItems: 'center' as const,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_700, // TEXT_COLORS.SECONDARY
  },

  // 하단 여백
  bottomSpacing: {
    height: 100, // 하단 버튼들을 위한 여백
  },

  // 하단 액션 버튼들
  bottomActions: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.WHITE,
    paddingVertical: SPACING.LG,
    paddingHorizontal: SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: colors.GRAY_200,
    elevation: 8,
    shadowColor: colors.BLACK,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addButton: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.LG,
    borderRadius: BORDER_RADIUS.LG,
    backgroundColor: colors.GRAY_50,
    minWidth: 90,
    borderWidth: 1,
    borderColor: colors.GRAY_200,
  },
  addButtonText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_900, // TEXT_COLORS.PRIMARY
    marginTop: SPACING.XS,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { AuthStackParamList } from '../types/navigation';
import type { ContentBlock, ContentBlockType, Category } from '../types/post';

// Components
import CommonHeader from '../components/CommonHeader';
import CategoryPicker from '../components/CategoryPicker';
import { ContentBlockComponent } from '../components/ContentBlocks';
import { AddTextIcon, AddImageIcon, AddVideoIcon } from '../components/CommonIcons';
import { WriteIcon } from '../components/HomeHeaderIcons';
import LoadingOverlay from '../components/LoadingOverlay';

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
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Zustand 스토어
  const { setShouldRefreshPosts } = usePostStore();
  const { setShouldRefreshProfilePosts } = useProfileStore();

  // 컴포넌트 마운트 시 카테고리 로드 및 기본 텍스트 블록 추가
  useEffect(() => {
    loadCategories();
    addDefaultTextBlock();
  }, []);

  // 카테고리 로드
  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const categoriesData = await PostService.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      Alert.alert('오류', '카테고리를 불러오는데 실패했습니다.');
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
  const updateBlockContent = (blockId: string, content: string) => {
    setContentBlocks(prev => 
      prev.map(block => 
        block.id === blockId ? { ...block, value: content } : block
      )
    );
  };

  // 블록 삭제
  const deleteBlock = (blockId: string) => {
    setContentBlocks(prev => {
      const filteredBlocks = prev.filter(block => block.id !== blockId);
      // sequence 재정렬 (0부터 시작)
      return filteredBlocks.map((block, index) => ({
        ...block,
        sequence: index
      }));
    });
  };

  // 블록 위로 이동
  const moveBlockUp = (blockId: string) => {
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
  };

  // 블록 아래로 이동
  const moveBlockDown = (blockId: string) => {
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
  };

  // 이미지 선택 및 업로드
  const handleImageSelection = async () => {
    try {
      // 권한 요청
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
        return;
      }

      // 이미지 선택
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 1,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        
        // 이미지 블록 추가
        const newImageBlock: ContentBlock = {
          id: `image_${Date.now()}`,
          type: 'image',
          value: selectedImage.uri, // 임시로 URI 저장
          sequence: contentBlocks.length, // 현재 블록 개수를 sequence로 사용
        };
        
        setContentBlocks(prev => [...prev, newImageBlock]);

        // 이미지 업로드
        try {
          setIsUploadingImage(true);
          setIsLoading(true);
          const uploadedImage = await PostService.uploadImage(selectedImage.uri);
          
          // 업로드된 이미지로 블록 업데이트 (표시용 url, 제출용 path 저장)
          setContentBlocks(prev =>
            prev.map(block =>
              block.id === newImageBlock.id
                ? { ...block, value: uploadedImage.url, originalValue: uploadedImage.path }
                : block
            )
          );

        } catch (uploadError) {
          console.error('이미지 업로드 실패:', uploadError);
          Alert.alert('오류', '이미지 업로드에 실패했습니다.');

          // 업로드 실패 시 블록 제거
          setContentBlocks(prev => prev.filter(block => block.id !== newImageBlock.id));
        }
      }
    } catch (error) {
      console.error('이미지 선택 실패:', error);
      Alert.alert('오류', '이미지 선택에 실패했습니다.');
    } finally {
      setIsLoading(false);
      setIsUploadingImage(false);
    }
  };

  // 비디오 선택 및 업로드
  const handleVideoSelection = async () => {
    try {
      // 권한 요청
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
        return;
      }

      // 비디오 선택
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsMultipleSelection: false,
        allowsEditing: true, // 비디오 편집 기능 활성화
        quality: 0.8, // 품질 조정
        videoMaxDuration: 60, // 최대 60초로 제한
      });

      if (!result.canceled && result.assets.length > 0) {
        const selectedVideo = result.assets[0];
        
        // 비디오 블록 추가
        const newVideoBlock: ContentBlock = {
          id: `video_${Date.now()}`,
          type: 'video',
          value: selectedVideo.uri, // 임시로 URI 저장
          sequence: contentBlocks.length, // 현재 블록 개수를 sequence로 사용
        };
        
        setContentBlocks(prev => [...prev, newVideoBlock]);

        // 비디오 업로드
        try {
          setIsUploadingVideo(true); // 비디오 업로드 상태
          setIsLoading(true);
          const uploadedVideo = await PostService.uploadVideo(selectedVideo.uri);

          console.log('uploadedVideo', uploadedVideo);
          
          // 업로드된 비디오로 블록 업데이트
          // 화면 표시용: 썸네일 URL (있으면), 서버 전송용: 비디오 경로 + 썸네일 경로
          setContentBlocks(prev =>
            prev.map(block =>
              block.id === newVideoBlock.id
                ? { 
                    ...block, 
                    value: uploadedVideo.thumbnail?.url || uploadedVideo.video.url, // 화면 표시용 (썸네일 우선, 없으면 비디오)
                    originalValue: uploadedVideo.video.path, // 서버 전송용 (비디오)
                    thumbnailPath: uploadedVideo.thumbnail?.path // 서버 전송용 (썸네일, 있으면)
                  }
                : block
            )
          );

        } catch (uploadError) {
          console.error('비디오 업로드 실패:', uploadError);
          Alert.alert('오류', '비디오 업로드에 실패했습니다.');

          // 업로드 실패 시 블록 제거
          setContentBlocks(prev => prev.filter(block => block.id !== newVideoBlock.id));
        }
      }
    } catch (error) {
      console.error('비디오 선택 실패:', error);
      Alert.alert('오류', '비디오 선택에 실패했습니다.');
    } finally {
      setIsLoading(false);
      setIsUploadingVideo(false);
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
      Alert.alert('오류', '제목을 입력해주세요.');
      return;
    }

    if (!selectedSubcategoryId) {
      Alert.alert('오류', '카테고리를 선택해주세요.');
      return;
    }

    const hasContent = contentBlocks.some(block => block.value.trim());
    if (!hasContent) {
      Alert.alert('오류', '내용을 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      
      // 서버 전송용 데이터 변환
      const postData = {
        title: title.trim(),
        sub_category_id: selectedSubcategoryId,
        content_blocks: contentBlocks
          .filter(block => block.value.trim()) // 빈 블록 제외
          .map(({ id, originalValue, thumbnailPath, ...block }, index) => ({ 
            ...block, 
            value: originalValue || block.value, 
            sequence: index,
            ...(thumbnailPath && { thumbnail_path: thumbnailPath }) // 비디오 블록인 경우 썸네일 경로 추가
          })), // id, originalValue, thumbnailPath 제거, 원래 value 사용
        tags: [], // 추후 태그 기능 추가시 사용
      };

      const result = await PostService.createPost(postData);

      // 목록 새로고침 플래그 설정
      setShouldRefreshPosts(true);
      setShouldRefreshProfilePosts(true); // 자신의 게시물 목록 새로고침 플래그

      // 작성된 게시물 상세 화면으로 이동
      navigation.replace('PostDetail', { postId: result.postId });
    } catch (error) {
      Alert.alert('오류', '게시물 작성에 실패했습니다. 다시 시도해주세요.');
      console.error('게시물 작성 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
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

        {/* 여백 (하단 버튼들을 위한) */}
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
        message={isUploadingImage ? '이미지를 업로드중입니다...' : isUploadingVideo ? '비디오를 업로드중입니다...' : undefined}
      />
    </View>
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

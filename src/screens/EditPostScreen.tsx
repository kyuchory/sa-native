import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import { openSettings } from 'react-native-permissions';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import usePostStore from '../stores/postStore';
import useProfileStore from '../stores/profileStore';
import { AuthStackParamList } from '../types/navigation';
import type { ContentBlock, ContentBlockType, Category, PostDetail, UpdatePostContentBlock } from '../types/post';

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
import { SafeAreaView } from 'react-native-safe-area-context';

type EditPostRouteProp = RouteProp<AuthStackParamList, 'EditPost'>;
type EditPostNavigationProp = StackNavigationProp<AuthStackParamList, 'EditPost'>;

// 게시물 수정용 ContentBlock 확장 타입
interface EditContentBlock extends ContentBlock {
  path?: string; // 이미지 수정용 경로 저장
  originalValue?: string; // 서버 전송용 원본 값 (이미지/비디오 경로)
  thumbnailPath?: string; // 서버 전송용 썸네일 경로 (비디오용)
}

export default function EditPostScreen() {
  const route = useRoute<EditPostRouteProp>();
  const navigation = useNavigation<EditPostNavigationProp>();
  const { colors } = useThemeStore();
  const { setShouldRefreshPosts, videoEditResult, setVideoEditResult } = usePostStore(); // Zustand 스토어에서 액션 가져오기
  const { setShouldRefreshProfilePosts } = useProfileStore();
  const styles = createStyles(colors);

  const { postId } = route.params;

  // 상태 관리
  const [title, setTitle] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(0);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number>(0);
  const [contentBlocks, setContentBlocks] = useState<EditContentBlock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingPost, setIsLoadingPost] = useState(true);
  const [alertModal, setAlertModal] = useState<{visible: boolean, title: string, message: string, buttons: any[]} | null>(null);

  // 게시물 데이터 로드
  const loadPostData = async () => {
    try {
      setIsLoadingPost(true);

      // 게시물 상세 정보 로드
      const postData = await PostService.getPostDetail(postId);

      // 기본 정보 설정
      setTitle(postData.title);

      // 카테고리 정보 설정
      setSelectedCategoryId(postData.sub_category.category.id);
      setSelectedSubcategoryId(postData.sub_category.id);

      // 콘텐츠 블록 변환 - 각 블록마다 고유한 ID 생성 (서버에서 id 제공하지 않음)
      const baseTimestamp = Date.now(); // 모든 블록에 동일한 timestamp 사용
      const convertedBlocks: EditContentBlock[] = postData.content_blocks.map((block, index) => ({
        id: `edit_${block.type}_${block.sequence}_${index}_${baseTimestamp}_${Math.random().toString(36).substr(2, 9)}`, // 타입, 시퀀스, index 기반으로 고유성 보장
        type: block.type,
        value: block.value ? String(block.value) : '', // value가 있을 때는 string으로, 없으면 빈 문자열
        sequence: index, // 클라이언트에서 관리하는 sequence로 재설정
        ...(block.path ? { path: String(block.path) } : {}), // path가 있으면 저장
        ...(block.thumbnail_path ? { thumbnailPath: String(block.thumbnail_path) } : {}) // 썸네일 path가 있으면 저장
      }));

      setContentBlocks(convertedBlocks);

    } catch (error) {
      setAlertModal({
        visible: true,
        title: '오류',
        message: '게시물을 불러오는데 실패했습니다.',
        buttons: [{
          text: '확인',
          onPress: () => {
            setAlertModal(null);
            navigation.goBack();
          }
        }]
      });
      console.error('게시물 로드 실패:', error);
    } finally {
      setIsLoadingPost(false);
    }
  };

  // 컴포넌트 마운트 시 카테고리와 게시물 데이터 로드
  useEffect(() => {
    loadCategories();
    loadPostData();
  }, [postId]);

  // 비디오 편집 결과 처리 (로컬 데이터만 저장)
  useFocusEffect(
    React.useCallback(() => {
      if (videoEditResult) {
        // 비디오 블록 추가 (로컬 URI와 편집 정보 저장)
        const newVideoBlock: EditContentBlock = {
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

  // 블록 추가
  const addBlock = (type: ContentBlockType) => {
    const newBlock: EditContentBlock = {
      id: `${type}_${Date.now()}`,
      type,
      value: '',
      sequence: contentBlocks.length,
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
      // sequence 재정렬
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

      // sequence 재정렬
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

      // sequence 재정렬
      return newBlocks.map((block, index) => ({
        ...block,
        sequence: index
      }));
    });
  };

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
          buttons: [{ text: '설정', onPress: () => openSettings() }, { text: '확인', onPress: () => setAlertModal(null) }]
        });
        return;
      }

      // 이미지 선택
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        quality: 1,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets.length > 0) {
        const selectedImage = result.assets[0];

        // 이미지 블록 추가 (로컬 URI만 저장)
        const newImageBlock: EditContentBlock = {
          id: `image_${Date.now()}`,
          type: 'image',
          value: selectedImage.uri, // 로컬 URI 저장
          sequence: contentBlocks.length,
        };

        setContentBlocks(prev => [...prev, newImageBlock]);
      }
    } catch (error) {
      console.error('이미지 선택 실패:', error);
      setAlertModal({
        visible: true,
        title: '오류',
        message: '이미지 선택에 실패했습니다.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
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
      console.error('비디오 선택 실패:', error);
      setAlertModal({
        visible: true,
        title: '오류',
        message: '비디오 선택에 실패했습니다.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
    }
  };

  // 카테고리 선택 처리
  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
    if (categoryId !== selectedCategoryId) {
      setSelectedSubcategoryId(0);
    }
  };

  // 게시물 수정 완료
  const handleUpdatePost = async () => {
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
      const processedBlocks: UpdatePostContentBlock[] = contentBlocks
        .filter(block => block.value.trim()) // 빈 블록 제외
        .map(({ id, path, thumbnailPath, ...block }, index) => ({
          type: block.type,
          value: block.value.startsWith('file://') ? null : (path || block.value), // 새 파일은 null, 기존 파일은 path
          sequence: index,
          ...(block.editInfo && { editInfo: block.editInfo }), // 비디오 편집 정보
          ...(thumbnailPath && { thumbnail_url: thumbnailPath }) // 기존 비디오 썸네일 URL
        }));

      // FormData 구성
      const formData = new FormData();

      formData.append('title', title.trim());
      formData.append('sub_category_id', selectedSubcategoryId.toString());
      formData.append('content_blocks', JSON.stringify(processedBlocks));


      // 새로 추가된 파일들만 FormData에 포함 (기존 파일은 URL로 전송)
      const newImageBlocks = contentBlocks.filter(b =>
        b.type === 'image' && b.value.startsWith('file://')
      );
      const newVideoBlocks = contentBlocks.filter(b =>
        b.type === 'video' && b.value.startsWith('file://')
      );


      newImageBlocks.forEach((block, index) => {
        const fileData = {
          uri: block.value,
          type: 'image/jpeg',
          name: `image_${index}.jpg`
        } as any;
        formData.append('images', fileData);
      });

      newVideoBlocks.forEach((block, index) => {
        const fileData = {
          uri: block.value,
          type: 'video/mp4',
          name: `video_${index}.mp4`
        } as any;
        formData.append('videos', fileData);
      });

      // 통합 API 호출
      await PostService.updatePostWithFiles(postId, formData);

      // 목록 새로고침 플래그 설정
      setShouldRefreshPosts(true);
      setShouldRefreshProfilePosts(true);

      setAlertModal({
        visible: true,
        title: '성공',
        message: '게시물이 성공적으로 수정되었습니다!',
        buttons: [{
          text: '확인',
          onPress: () => {
            setAlertModal(null);
            navigation.goBack();
          }
        }]
      });
    } catch (error) {
      setAlertModal({
        visible: true,
        title: '오류',
        message: '게시물 수정에 실패했습니다. 다시 시도해주세요.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
      console.error('게시물 수정 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 로딩 중 표시
  if (isLoadingPost) {
    return (
      <View style={styles.container}>
        <CommonHeader title="게시물 수정" />
        <LoadingOverlay visible={true} message="게시물 로딩 중..." />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 헤더 */}
      <CommonHeader
        title="게시물 수정"
        rightComponent={
          <TouchableOpacity
            style={styles.publishButton}
            onPress={handleUpdatePost}
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

        {/* 여백 */}
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
        message="게시물을 수정중입니다..."
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
    backgroundColor: colors.GRAY_100,
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
    color: colors.GRAY_900,
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
    color: colors.GRAY_900,
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
    color: colors.GRAY_700,
  },

  // 하단 여백
  bottomSpacing: {
    height: 100,
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
    color: colors.GRAY_900,
    marginTop: SPACING.XS,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
});

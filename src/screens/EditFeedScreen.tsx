import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { AuthStackParamList } from '../types/navigation';
import type { ContentBlock, ContentBlockType } from '../types/post';

// Components
import CommonHeader from '../components/CommonHeader';
import { ContentBlockComponent } from '../components/ContentBlocks';
import { AddImageIcon, AddVideoIcon } from '../components/CommonIcons';
import { CreateFeedIcon } from '../components/CommonIcons';
import LoadingOverlay from '../components/LoadingOverlay';

// Services
import { PostService } from '../services/postService';
import { FeedService } from '../services/feedService';

// Stores
import useFeedStore from '../stores/feedStore';
import useProfileStore from '../stores/profileStore';

type EditFeedRouteProp = RouteProp<AuthStackParamList, 'EditFeed'>;
type EditFeedNavigationProp = StackNavigationProp<AuthStackParamList, 'EditFeed'>;

export default function EditFeedScreen() {
  const route = useRoute<EditFeedRouteProp>();
  const navigation = useNavigation<EditFeedNavigationProp>();
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const { feedId } = route.params;

  // 상태 관리
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);

  // Zustand 스토어
  const { setShouldRefreshFeeds } = useFeedStore();
  const { setShouldRefreshProfileFeeds } = useProfileStore();

  // 기존 피드 데이터 로드
  const loadFeedData = async () => {
    try {
      setIsLoadingFeed(true);
      const feedData = await FeedService.getFeed(feedId);

      // 콘텐츠 블록 변환
      const convertedBlocks: ContentBlock[] = feedData.content_blocks.map((block, index) => ({
        id: `edit_${block.type}_${block.sequence}_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: block.type as ContentBlockType,
        value: block.value ? String(block.value) : '',
        sequence: block.type === 'text' ? 0 : index, // 텍스트는 0, 나머지는 순서대로
        ...(block.path ? { originalValue: String(block.path) } : {})
      }));

      setContentBlocks(convertedBlocks);
    } catch (error) {
      Alert.alert('오류', '피드를 불러오는데 실패했습니다.');
      console.error('피드 로드 실패:', error);
      navigation.goBack();
    } finally {
      setIsLoadingFeed(false);
    }
  };

  useEffect(() => {
    loadFeedData();
  }, [feedId]);

  // 블록 추가 (이미지/영상만)
  const addBlock = (type: 'image' | 'video') => {
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

  // 블록 삭제 (텍스트 블록은 삭제 불가)
  const deleteBlock = (blockId: string) => {
    const block = contentBlocks.find(b => b.id === blockId);
    if (block?.type === 'text') {
      return; // 텍스트 블록은 삭제 불가
    }

    setContentBlocks(prev => {
      const filteredBlocks = prev.filter(block => block.id !== blockId);
      // sequence 재정렬 (텍스트는 0 고정, 나머지는 1부터)
      return filteredBlocks.map((block, index) => ({
        ...block,
        sequence: block.type === 'text' ? 0 : index
      }));
    });
  };

  // 블록 위로 이동
  const moveBlockUp = (blockId: string) => {
    setContentBlocks(prev => {
      const blockIndex = prev.findIndex(block => block.id === blockId);
      if (blockIndex <= 1) return prev; // 텍스트 블록(0번)은 이동 불가
      
      const newBlocks = [...prev];
      [newBlocks[blockIndex - 1], newBlocks[blockIndex]] = 
      [newBlocks[blockIndex], newBlocks[blockIndex - 1]];
      
      // sequence 재정렬 (텍스트는 0 고정, 나머지는 1부터)
      return newBlocks.map((block, index) => ({
        ...block,
        sequence: block.type === 'text' ? 0 : index
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
      
      // sequence 재정렬 (텍스트는 0 고정, 나머지는 1부터)
      return newBlocks.map((block, index) => ({
        ...block,
        sequence: block.type === 'text' ? 0 : index
      }));
    });
  };

  // 이미지 선택 및 업로드
  const handleImageSelection = async () => {
    try {
      // 권한 요청
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다. 설정에서 허용해주세요.');
        return;
      }

      // 이미지 선택 (단일 선택)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        allowsEditing: true, // 이미지 편집 기능 활성화
        aspect: [1, 1], // 정방형 비율로 편집
        quality: 0.8, // 품질 조정
      });

      if (!result.canceled && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        
        // 이미지 블록 추가
        const newImageBlock: ContentBlock = {
          id: `image_${Date.now()}`,
          type: 'image',
          value: selectedImage.uri, // 임시로 URI 저장
          sequence: contentBlocks.length,
        };
        
        setContentBlocks(prev => [...prev, newImageBlock]);

        // 이미지 업로드
        try {
          setIsUploadingImage(true);
          setIsLoading(true);
          const uploadResult = await FeedService.uploadImages([selectedImage.uri]);
          const uploadedImage = uploadResult.files[0];
          
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
        Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다. 설정에서 허용해주세요.');
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
          sequence: contentBlocks.length,
        };
        
        setContentBlocks(prev => [...prev, newVideoBlock]);

        // 비디오 업로드
        try {
          setIsUploadingVideo(true);
          setIsLoading(true);
          const uploadResult = await FeedService.uploadVideo(selectedVideo.uri);
          
          // 업로드된 비디오로 블록 업데이트
          // 화면 표시용: 썸네일 URL (있으면), 서버 전송용: 비디오 경로 + 썸네일 경로
          setContentBlocks(prev =>
            prev.map(block =>
              block.id === newVideoBlock.id
                ? { 
                    ...block, 
                    value: uploadResult.thumbnail?.url || uploadResult.video.url, // 화면 표시용 (썸네일 우선, 없으면 비디오)
                    originalValue: uploadResult.video.path, // 서버 전송용 (비디오)
                    thumbnailPath: uploadResult.thumbnail?.path // 서버 전송용 (썸네일, 있으면)
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

  // 피드 수정 완료
  const handleUpdateFeed = async () => {
    // 유효성 검사
    const textBlock = contentBlocks.find(block => block.type === 'text');
    if (!textBlock?.value.trim()) {
      Alert.alert('오류', '내용을 입력해주세요.');
      return;
    }

    const mediaBlocks = contentBlocks.filter(block => block.type !== 'text');
    if (mediaBlocks.length === 0) {
      Alert.alert('오류', '이미지 또는 영상을 최소 1개 이상 선택해주세요.');
      return;
    }

    // 업로드 완료 확인
    const unuploadedBlocks = mediaBlocks.filter(block => !block.originalValue);
    if (unuploadedBlocks.length > 0) {
      Alert.alert('업로드 중', '미디어 업로드가 완료될 때까지 기다려주세요.');
      return;
    }

    try {
      setIsLoading(true);

      // 서버 전송용 데이터 변환
      const contentBlocksForServer = contentBlocks
        .filter(block => block.value.trim()) // 빈 블록 제외
        .map(({ id, originalValue, thumbnailPath, ...block }, index) => ({ 
          ...block, 
          value: originalValue || block.value, 
          sequence: index,
          ...(thumbnailPath && { thumbnail_path: thumbnailPath }) // 비디오 블록인 경우 썸네일 경로 추가
        }));

      const feedData = {
        content_blocks: contentBlocksForServer,
      };

      await FeedService.updateFeed(feedId, feedData);

      // 목록 새로고침 플래그 설정
      setShouldRefreshFeeds(true);
      setShouldRefreshProfileFeeds(true);

      Alert.alert(
        '성공',
        '피드가 성공적으로 수정되었습니다!',
        [
          {
            text: '확인',
            onPress: () => navigation.goBack(),
          }
        ]
      );
    } catch (error) {
      Alert.alert('오류', '피드 수정에 실패했습니다. 다시 시도해주세요.');
      console.error('피드 수정 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingFeed) {
    return (
      <View style={styles.container}>
        <CommonHeader title="피드 수정" />
        <LoadingOverlay visible={true} message="피드 로딩 중..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <CommonHeader
        title="피드 수정"
        rightComponent={
          <TouchableOpacity
            style={styles.publishButton}
            onPress={handleUpdateFeed}
            activeOpacity={0.7}
          >
            <CreateFeedIcon size={20} color={colors.PRIMARY} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 콘텐츠 블록들 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>피드 내용</Text>
          <View style={styles.contentContainer}>
            {contentBlocks.map((block, index) => (
              <ContentBlockComponent
                key={block.id}
                block={block}
                onContentChange={updateBlockContent}
                onDeleteBlock={deleteBlock}
                onMoveUp={moveBlockUp}
                onMoveDown={moveBlockDown}
                canMoveUp={block.type !== 'text' && index > 1} // 텍스트 블록은 이동 불가
                canMoveDown={block.type !== 'text' && index < contentBlocks.length - 1}
                showDeleteButton={block.type !== 'text'} // 텍스트 블록은 삭제 버튼 숨김
                showMoveButtons={block.type !== 'text'} // 텍스트 블록은 이동 버튼 숨김
              />
            ))}
          </View>
        </View>

        {/* 하단 여백 */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* 하단 액션 버튼들 */}
      <View style={styles.bottomActions}>
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

  // 콘텐츠 컨테이너
  contentContainer: {
    backgroundColor: colors.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    borderWidth: 1,
    borderColor: colors.GRAY_200,
    padding: SPACING.SM,
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
    color: colors.GRAY_900,
    marginTop: SPACING.XS,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
});
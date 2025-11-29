import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
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
import CustomAlertModal from '../components/CustomAlertModal';

// Services
import { FeedService } from '../services/feedService';

// Stores
import useFeedStore from '../stores/feedStore';
import useProfileStore from '../stores/profileStore';

type CreateFeedNavigationProp = StackNavigationProp<AuthStackParamList, 'CreateFeed'>;

export default function CreateFeedScreen() {
  const navigation = useNavigation<CreateFeedNavigationProp>();
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  // 상태 관리
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [alertModal, setAlertModal] = useState<{visible: boolean, title: string, message: string, buttons: any[]} | null>(null);

  // Zustand 스토어
  const { setShouldRefreshFeeds, videoEditResult, setVideoEditResult } = useFeedStore();
  const { setShouldRefreshProfileFeeds } = useProfileStore();

  // 비디오 편집 결과 처리
  useFocusEffect(
    React.useCallback(() => {
      if (videoEditResult) {
        // 비디오 블록 추가
        const newVideoBlock: ContentBlock = {
          id: `video_${Date.now()}`,
          type: 'video',
          value: videoEditResult.videoUrl, // 실제 비디오 URL 사용 (썸네일이 아닌 영상 재생용)
          sequence: contentBlocks.length,
          originalValue: videoEditResult.videoPath, // 서버 전송용 비디오 경로
          thumbnailPath: videoEditResult.thumbnailPath, // 서버 전송용 썸네일 경로
        };
        console.log('videoResult:',videoEditResult)
        console.log('newVideoBlock:', newVideoBlock);

        setContentBlocks(prev => [...prev, newVideoBlock]);

        // 처리 완료 후 결과 클리어
        setVideoEditResult(null);
      }
    }, [videoEditResult, contentBlocks.length, setVideoEditResult, setContentBlocks])
  );

  // 컴포넌트 마운트 시 기본 텍스트 블록 추가
  useEffect(() => {
    addDefaultTextBlock();
  }, []);

  // 기본 텍스트 블록 추가 (sequence 0으로 고정)
  const addDefaultTextBlock = () => {
    const defaultBlock: ContentBlock = {
      id: `text_${Date.now()}`,
      type: 'text',
      value: '',
      sequence: 0,
    };
    setContentBlocks([defaultBlock]);
  };

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
  const updateBlockContent = useCallback((blockId: string, content: string) => {
    setContentBlocks(prev =>
      prev.map(block =>
        block.id === blockId ? { ...block, value: content } : block
      )
    );
  }, []);

  // 블록 삭제 (텍스트 블록은 삭제 불가)
  const deleteBlock = useCallback((blockId: string) => {
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
  }, [contentBlocks]);

  // 블록 위로 이동
  const moveBlockUp = useCallback((blockId: string) => {
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
  }, []);

  // 블록 아래로 이동
  const moveBlockDown = useCallback((blockId: string) => {
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
  }, []);

  // 이미지 선택 및 업로드
  const handleImageSelection = async () => {
    try {
      // 권한 요청
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setAlertModal({
          visible: true,
          title: '권한 필요',
          message: '갤러리 접근 권한이 필요합니다. 설정에서 허용해주세요.',
          buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
        });
        return;
      }

      // 이미지 선택 (단일 선택)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
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
          setAlertModal({
            visible: true,
            title: '오류',
            message: '이미지 업로드에 실패했습니다.',
            buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
          });

          // 업로드 실패 시 블록 제거
          setContentBlocks(prev => prev.filter(block => block.id !== newImageBlock.id));
        }
      }
    } catch (error) {
      console.error('이미지 선택 실패:', error);
      setAlertModal({
        visible: true,
        title: '오류',
        message: '이미지 선택에 실패했습니다.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
    } finally {
      setIsLoading(false);
      setIsUploadingImage(false);
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
          buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
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
          aspectRatio: '1:1', // 1:1 비율 고정
          uploadService: 'feed', // feed 서비스로 업로드
          editMode: 'both', // 크롭 + 트림 모두 사용
          maxDuration: 30000, // 최대 30초
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

  // 피드 작성 완료
  const handleCreateFeed = async () => {
    // 유효성 검사
    const textBlock = contentBlocks.find(block => block.type === 'text');
    if (!textBlock?.value.trim()) {
      setAlertModal({
        visible: true,
        title: '오류',
        message: '내용을 입력해주세요.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
      return;
    }

    const mediaBlocks = contentBlocks.filter(block => block.type !== 'text');
    if (mediaBlocks.length === 0) {
      setAlertModal({
        visible: true,
        title: '오류',
        message: '이미지 또는 영상을 최소 1개 이상 선택해주세요.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
      return;
    }

    // 업로드 완료 확인
    const unuploadedBlocks = mediaBlocks.filter(block => !block.originalValue);
    if (unuploadedBlocks.length > 0) {
      setAlertModal({
        visible: true,
        title: '업로드 중',
        message: '미디어 업로드가 완료될 때까지 기다려주세요.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
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

      const result = await FeedService.createFeed(feedData);

      // 목록 새로고침 플래그 설정
      setShouldRefreshFeeds(true);
      setShouldRefreshProfileFeeds(true);

      // 성공 alert 표시
      setAlertModal({
        visible: true,
        title: '성공',
        message: '피드가 성공적으로 작성되었습니다.',
        buttons: [{
          text: '확인',
          onPress: () => {
            setAlertModal(null);
            // 작성된 피드 상세 화면으로 이동
            navigation.replace('FeedDetail', { feedId: result.feedId });
          }
        }]
      });
    } catch (error) {
      setAlertModal({
        visible: true,
        title: '오류',
        message: '피드 작성에 실패했습니다. 다시 시도해주세요.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
      console.error('피드 작성 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 헤더 */}
      <CommonHeader
        title="새 피드"
        rightComponent={
          <TouchableOpacity
            style={styles.publishButton}
            onPress={handleCreateFeed}
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

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import { openSettings } from 'react-native-permissions';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { AuthStackParamList } from '../types/navigation';
import type { ContentBlock, ContentBlockType } from '../types/post';

// 피드 수정용 ContentBlock 확장 타입
interface EditContentBlock extends ContentBlock {
  path?: string; // 이미지 수정용 경로 저장
  thumbnailPath?: string; // 서버 전송용 썸네일 경로 (비디오용)
}

// Components
import CommonHeader from '../components/CommonHeader';
import { ContentBlockComponent } from '../components/ContentBlocks';
import { AddImageIcon, AddVideoIcon } from '../components/CommonIcons';
import { CreateFeedIcon } from '../components/CommonIcons';
import LoadingOverlay from '../components/LoadingOverlay';
import CustomAlertModal from '../components/CustomAlertModal';

// Services
import { PostService } from '../services/postService';
import { FeedService } from '../services/feedService';

// Stores
import useFeedStore from '../stores/feedStore';
import useProfileStore from '../stores/profileStore';
import { SafeAreaView } from 'react-native-safe-area-context';

type EditFeedRouteProp = RouteProp<AuthStackParamList, 'EditFeed'>;
type EditFeedNavigationProp = StackNavigationProp<AuthStackParamList, 'EditFeed'>;

export default function EditFeedScreen() {
  const route = useRoute<EditFeedRouteProp>();
  const navigation = useNavigation<EditFeedNavigationProp>();
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const { feedId } = route.params;

  // 상태 관리
  const [contentBlocks, setContentBlocks] = useState<EditContentBlock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [alertModal, setAlertModal] = useState<{visible: boolean, title: string, message: string, buttons: any[]} | null>(null);

  // Zustand 스토어
  const { setShouldRefreshFeeds, videoEditResult, setVideoEditResult } = useFeedStore();
  const { setShouldRefreshProfileFeeds } = useProfileStore();

  // 기존 피드 데이터 로드
  const loadFeedData = async () => {
    try {
      setIsLoadingFeed(true);
      const feedData = await FeedService.getFeed(feedId);

      // 콘텐츠 블록 변환 - 각 블록마다 고유한 ID 생성
      const baseTimestamp = Date.now();
      const convertedBlocks: EditContentBlock[] = feedData.content_blocks.map((block, index) => ({
        id: `edit_${block.type}_${block.sequence}_${index}_${baseTimestamp}_${Math.random().toString(36).substr(2, 9)}`,
        type: block.type as ContentBlockType,
        value: block.value ? String(block.value) : '',
        sequence: index,
        ...(block.path ? { path: String(block.path) } : {}), // 기존 파일 경로 저장
        ...(block.thumbnail_path ? { thumbnailPath: String(block.thumbnail_path) } : {}) // 썸네일 경로 저장
      }));

      setContentBlocks(convertedBlocks);
    } catch (error) {
      setAlertModal({
        visible: true,
        title: '오류',
        message: '피드를 불러오는데 실패했습니다.',
        buttons: [{
          text: '확인',
          onPress: () => {
            setAlertModal(null);
            navigation.goBack();
          }
        }]
      });
      console.error('피드 로드 실패:', error);
    } finally {
      setIsLoadingFeed(false);
    }
  };

  useEffect(() => {
    loadFeedData();
  }, [feedId]);

  // 비디오 편집 결과 처리 (로컬 URI와 편집 정보 저장)
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
    }, [videoEditResult, contentBlocks.length, setVideoEditResult, setContentBlocks])
  );

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

  // 이미지 선택 (로컬 URI만 저장 - 통합 업로드에서 처리)
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

        // 이미지 블록 추가 (로컬 URI만 저장)
        const newImageBlock: ContentBlock = {
          id: `image_${Date.now()}`,
          type: 'image',
          value: selectedImage.uri,
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

  // 피드 수정 완료 (통합 파일 업로드)
  const handleUpdateFeed = async () => {
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

    try {
      setIsLoading(true);

      // content_blocks 준비 (서버 전송용)
      const processedBlocks = contentBlocks
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
      await FeedService.updateFeedWithFiles(feedId, formData);

      // 목록 새로고침 플래그 설정
      setShouldRefreshFeeds(true);
      setShouldRefreshProfileFeeds(true);

      setAlertModal({
        visible: true,
        title: '성공',
        message: '피드가 성공적으로 수정되었습니다!',
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
        message: '피드 수정에 실패했습니다. 다시 시도해주세요.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
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
        message="피드를 수정중입니다..."
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

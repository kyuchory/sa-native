import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
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

// Components
import CommonHeader from '../components/CommonHeader';
import { CreateFeedIcon, DeleteIcon, AddImageIcon, AddVideoIcon } from '../components/CommonIcons';
import LoadingOverlay from '../components/LoadingOverlay';

// Services
import { PostService } from '../services/postService';
import { FeedService } from '../services/feedService';

const { width: screenWidth } = Dimensions.get('window');
const imageSize = (screenWidth - SPACING.MD * 3) / 3; // 3개씩 배치

type EditFeedRouteProp = RouteProp<AuthStackParamList, 'EditFeed'>;
type EditFeedNavigationProp = StackNavigationProp<AuthStackParamList, 'EditFeed'>;

interface MediaItem {
  id: string;
  uri: string;
  type: 'image' | 'video';
  uploadedUrl?: string;
  path?: string; // 서버 경로 저장용
  sequence: number;
}

export default function EditFeedScreen() {
  const route = useRoute<EditFeedRouteProp>();
  const navigation = useNavigation<EditFeedNavigationProp>();
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const { feedId } = route.params;

  // 상태 관리
  const [content, setContent] = useState('');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);

  // 기존 피드 데이터 로드
  const loadFeedData = async () => {
    try {
      setIsLoadingFeed(true);
      const feedData = await FeedService.getFeed(feedId);

      // 텍스트 블록 찾기
      const textBlock = feedData.content_blocks.find(block => block.type === 'text');
      if (textBlock && textBlock.value) {
        setContent(textBlock.value);
      }

      // 미디어 블록들 변환
      const mediaBlocks = feedData.content_blocks.filter(block => block.type === 'image' || block.type === 'video');
      const convertedMediaItems: MediaItem[] = mediaBlocks.map((block, index) => ({
        id: `media_${block.id}_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        uri: block.value, // 서버에서 받은 URL
        type: block.type as 'image' | 'video', // 타입 assertion
        uploadedUrl: block.value, // 기존 이미지는 이미 업로드된 상태
        path: block.path, // 서버 경로 저장
        sequence: index,
      }));

      setMediaItems(convertedMediaItems);
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

  // 이미지 선택
  const selectImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
        selectionLimit: 9 - mediaItems.length,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newItems: MediaItem[] = result.assets.map((asset, index) => ({
          id: `media_${Date.now()}_${index}`,
          uri: asset.uri,
          type: 'image' as 'image',
          sequence: mediaItems.length + index,
        }));

        setMediaItems(prev => [...prev, ...newItems]);
        uploadMediaItems(newItems);
      }
    } catch (error) {
      console.error('이미지 선택 실패:', error);
      Alert.alert('오류', '이미지 선택에 실패했습니다.');
    }
  };

  // 비디오 선택
  const selectVideos = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsMultipleSelection: true,
        quality: 1,
        selectionLimit: 9 - mediaItems.length,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newItems: MediaItem[] = result.assets.map((asset, index) => ({
          id: `media_${Date.now()}_${index}`,
          uri: asset.uri,
          type: 'video' as 'video',
          sequence: mediaItems.length + index,
        }));

        setMediaItems(prev => [...prev, ...newItems]);
        uploadMediaItems(newItems);
      }
    } catch (error) {
      console.error('비디오 선택 실패:', error);
      Alert.alert('오류', '비디오 선택에 실패했습니다.');
    }
  };

  // 미디어 업로드
  const uploadMediaItems = async (items: MediaItem[]) => {
    for (const item of items) {
      try {
        let uploadedResult;

        if (item.type === 'image') {
          uploadedResult = await PostService.uploadImage(item.uri);
        } else {
          console.log('영상 업로드는 아직 구현되지 않았습니다.');
          continue;
        }

        setMediaItems(prev =>
          prev.map(media =>
            media.id === item.id
              ? {
                  ...media,
                  uploadedUrl: uploadedResult.url,
                  path: uploadedResult.path
                }
              : media
          )
        );
      } catch (error) {
        console.error(`미디어 업로드 실패 (${item.id}):`, error);
        Alert.alert('업로드 실패', '일부 미디어 업로드에 실패했습니다.');
      }
    }
  };

  // 미디어 삭제
  const removeMedia = (id: string) => {
    setMediaItems(prev => {
      const filtered = prev.filter(item => item.id !== id);
      return filtered.map((item, index) => ({
        ...item,
        sequence: index,
      }));
    });
  };

  // 미디어 위로 이동
  const moveMediaUp = (index: number) => {
    if (index === 0) return;

    setMediaItems(prev => {
      const newItems = [...prev];
      [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];

      return newItems.map((item, idx) => ({
        ...item,
        sequence: idx,
      }));
    });
  };

  // 미디어 아래로 이동
  const moveMediaDown = (index: number) => {
    if (index === mediaItems.length - 1) return;

    setMediaItems(prev => {
      const newItems = [...prev];
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];

      return newItems.map((item, idx) => ({
        ...item,
        sequence: idx,
      }));
    });
  };

  // 피드 수정 완료
  const handleUpdateFeed = async () => {
    if (!content.trim()) {
      Alert.alert('오류', '내용을 입력해주세요.');
      return;
    }

    if (mediaItems.length === 0) {
      Alert.alert('오류', '이미지 또는 영상을 최소 1개 이상 선택해주세요.');
      return;
    }

    // 업로드 완료 확인 (새로 추가된 미디어만 확인)
    const unuploadedItems = mediaItems.filter(item => !item.uploadedUrl && !item.uri.includes('http'));
    if (unuploadedItems.length > 0) {
      Alert.alert('업로드 중', '미디어 업로드가 완료될 때까지 기다려주세요.');
      return;
    }

    try {
      setIsLoading(true);

      // 서버 전송용 데이터 변환
      const contentBlocks = [
        {
          type: 'text' as const,
          value: content.trim(),
          sequence: 0,
        },
        ...mediaItems.map(item => ({
          type: item.type,
          value: item.path || item.uploadedUrl || item.uri,
          sequence: item.sequence + 1,
        })),
      ];

      const feedData = {
        content_blocks: contentBlocks,
      };

      await FeedService.updateFeed(feedId, feedData);

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

  // 미디어 아이템 렌더링
  const renderMediaItem = (item: MediaItem, index: number) => {
    return (
      <View key={item.id} style={styles.mediaItem}>
        <Image source={{ uri: item.uri }} style={styles.mediaImage} />

        {/* 업로드 상태 표시 (새로 추가된 미디어만) */}
        {!item.uploadedUrl && !item.uri.includes('http') && (
          <View style={styles.uploadingOverlay}>
            <Text style={styles.uploadingText}>업로드 중...</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => removeMedia(item.id)}
          activeOpacity={0.7}
        >
          <DeleteIcon size={16} color={colors.WHITE} />
        </TouchableOpacity>

        <View style={styles.sequenceIndicator}>
          <Text style={styles.sequenceText}>{index + 1}</Text>
        </View>

        <View style={styles.reorderButtons}>
          {index > 0 && (
            <TouchableOpacity
              style={styles.reorderButton}
              onPress={() => moveMediaUp(index)}
              activeOpacity={0.7}
            >
              <Text style={styles.reorderButtonText}>↑</Text>
            </TouchableOpacity>
          )}

          {index < mediaItems.length - 1 && (
            <TouchableOpacity
              style={styles.reorderButton}
              onPress={() => moveMediaDown(index)}
              activeOpacity={0.7}
            >
              <Text style={styles.reorderButtonText}>↓</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (isLoadingFeed) {
    return (
      <SafeAreaView style={styles.container}>
        <CommonHeader title="피드 수정" />
        <LoadingOverlay visible={true} message="피드 로딩 중..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
        <View style={styles.textSection}>
          <TextInput
            style={styles.textInput}
            placeholder="무슨 일이 일어나고 있나요?"
            placeholderTextColor={colors.GRAY_400}
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={1000}
            textAlignVertical="top"
          />
          <Text style={styles.characterCount}>{content.length}/1000</Text>
        </View>

        {mediaItems.length > 0 && (
          <View style={styles.mediaSection}>
            <Text style={styles.sectionTitle}>선택된 미디어</Text>
            <View style={styles.mediaGrid}>
              {mediaItems.map((item, index) => renderMediaItem(item, index))}
            </View>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[
            styles.addButton,
            mediaItems.length >= 9 && styles.addButtonDisabled
          ]}
          onPress={selectImages}
          disabled={mediaItems.length >= 9}
          activeOpacity={0.7}
        >
          <AddImageIcon size={24} color={colors.GRAY_600} />
          <Text style={styles.addButtonText}>이미지</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.addButton,
            mediaItems.length >= 9 && styles.addButtonDisabled
          ]}
          onPress={selectVideos}
          disabled={mediaItems.length >= 9}
          activeOpacity={0.7}
        >
          <AddVideoIcon size={24} color={colors.GRAY_600} />
          <Text style={styles.addButtonText}>비디오</Text>
        </TouchableOpacity>
      </View>

      <LoadingOverlay visible={isLoading} />
    </SafeAreaView>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.GRAY_100,
  },

  publishButton: {
    padding: SPACING.SM,
  },

  content: {
    flex: 1,
  },

  textSection: {
    backgroundColor: colors.WHITE,
    margin: SPACING.MD,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.MD,
  },
  textInput: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_900,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_700,
    textAlign: 'right',
    marginTop: SPACING.SM,
  },

  mediaSection: {
    backgroundColor: colors.WHITE,
    margin: SPACING.MD,
    marginTop: 0,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.MD,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900,
    marginBottom: SPACING.MD,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
  },
  mediaItem: {
    position: 'relative',
    width: imageSize,
    height: imageSize,
    borderRadius: BORDER_RADIUS.MD,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.WHITE,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
  deleteButton: {
    position: 'absolute',
    top: SPACING.XS,
    right: SPACING.XS,
    backgroundColor: colors.ERROR,
    borderRadius: BORDER_RADIUS.ROUND,
    padding: SPACING.XS,
  },
  sequenceIndicator: {
    position: 'absolute',
    top: SPACING.XS,
    left: SPACING.XS,
    backgroundColor: colors.PRIMARY,
    borderRadius: BORDER_RADIUS.ROUND,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sequenceText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.WHITE,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
  },
  reorderButtons: {
    position: 'absolute',
    bottom: SPACING.XS,
    left: SPACING.XS,
    flexDirection: 'row',
    gap: SPACING.XS,
  },
  reorderButton: {
    backgroundColor: colors.PRIMARY,
    borderRadius: BORDER_RADIUS.SM,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reorderButtonText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.WHITE,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
  },

  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.LG,
    borderRadius: BORDER_RADIUS.LG,
    backgroundColor: colors.GRAY_50,
    minWidth: 90,
    borderWidth: 1,
    borderColor: colors.GRAY_200,
  },
  addButtonDisabled: {
    backgroundColor: colors.GRAY_100,
    borderColor: colors.GRAY_300,
  },
  addButtonText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_900,
    marginTop: SPACING.XS,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },

  bottomSpacing: {
    height: SPACING.XXL,
  },
});

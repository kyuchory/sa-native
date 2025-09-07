import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, TEXT_COLORS, BG_COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { AuthStackParamList } from '../types/navigation';

// Components
import CommonHeader from '../components/CommonHeader';
import { CreateFeedIcon, DeleteIcon, DragHandleIcon } from '../components/CommonIcons';
import LoadingOverlay from '../components/LoadingOverlay';

// Services
import { PostService } from '../services/postService';
import { FeedService } from '../services/feedService';

const { width: screenWidth } = Dimensions.get('window');
const imageSize = (screenWidth - SPACING.MD * 3) / 3; // 3개씩 배치

type CreateFeedNavigationProp = StackNavigationProp<AuthStackParamList, 'CreateFeed'>;

interface MediaItem {
  id: string;
  uri: string;
  type: 'image' | 'video';
  uploadedUrl?: string;
  sequence: number;
}

export default function CreateFeedScreen() {
  const navigation = useNavigation<CreateFeedNavigationProp>();
  
  // 상태 관리
  const [content, setContent] = useState('');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 미디어 선택
  const selectMedia = async () => {
    try {
      // 권한 요청
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
        return;
      }

      // 이미지/영상 선택 (다중 선택 가능)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 1,
        selectionLimit: 9 - mediaItems.length, // 최대 9개까지
      });

      if (!result.canceled && result.assets.length > 0) {
        const newItems: MediaItem[] = result.assets.map((asset, index) => ({
          id: `media_${Date.now()}_${index}`,
          uri: asset.uri,
          type: asset.type === 'video' ? 'video' : 'image',
          sequence: mediaItems.length + index,
        }));

        setMediaItems(prev => [...prev, ...newItems]);
        
        // 백그라운드에서 업로드 시작
        uploadMediaItems(newItems);
      }
    } catch (error) {
      console.error('미디어 선택 실패:', error);
      Alert.alert('오류', '미디어 선택에 실패했습니다.');
    }
  };

  // 미디어 업로드
  const uploadMediaItems = async (items: MediaItem[]) => {
    for (const item of items) {
      try {
        let uploadedUrl: string;
        
        if (item.type === 'image') {
          const uploadResult = await PostService.uploadImage(item.uri);
          uploadedUrl = uploadResult.path;
          console.log(uploadedUrl)
        } else {
          // 영상 업로드는 추후 구현
          console.log('영상 업로드는 아직 구현되지 않았습니다.');
          continue;
        }

        // 업로드된 URL로 업데이트
        setMediaItems(prev =>
          prev.map(media =>
            media.id === item.id
              ? { ...media, uploadedUrl }
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
      // sequence 재정렬
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
      
      // sequence 재정렬
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
      
      // sequence 재정렬
      return newItems.map((item, idx) => ({
        ...item,
        sequence: idx,
      }));
    });
  };

  // 피드 작성 완료
  const handleCreateFeed = async () => {
    // 유효성 검사
    if (!content.trim()) {
      Alert.alert('오류', '내용을 입력해주세요.');
      return;
    }

    if (mediaItems.length === 0) {
      Alert.alert('오류', '이미지 또는 영상을 최소 1개 이상 선택해주세요.');
      return;
    }

    // 업로드 완료 확인
    const unuploadedItems = mediaItems.filter(item => !item.uploadedUrl);
    if (unuploadedItems.length > 0) {
      Alert.alert('업로드 중', '미디어 업로드가 완료될 때까지 기다려주세요.');
      return;
    }

    try {
      setIsLoading(true);

      // 서버 전송용 데이터 변환
      const contentBlocks = [
        {
          type: 'text',
          value: content.trim(),
          sequence: 0,
        },
        ...mediaItems.map(item => ({
          type: item.type,
          value: item.uploadedUrl!,
          sequence: item.sequence + 1, // 텍스트가 0이므로 1부터 시작
        })),
      ];

      const feedData = {
        content_blocks: contentBlocks,
      };

      const result = await FeedService.createFeed(feedData);

      Alert.alert(
        '성공',
        '피드가 성공적으로 작성되었습니다!',
        [
          {
            text: '확인',
            onPress: () => {
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('오류', '피드 작성에 실패했습니다. 다시 시도해주세요.');
      console.error('피드 작성 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 미디어 아이템 렌더링
  const renderMediaItem = (item: MediaItem, index: number) => {
    return (
      <View key={item.id} style={styles.mediaItem}>
        <Image source={{ uri: item.uri }} style={styles.mediaImage} />
        
        {/* 업로드 상태 표시 */}
        {!item.uploadedUrl && (
          <View style={styles.uploadingOverlay}>
            <Text style={styles.uploadingText}>업로드 중...</Text>
          </View>
        )}

        {/* 삭제 버튼 */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => removeMedia(item.id)}
          activeOpacity={0.7}
        >
          <DeleteIcon size={16} color={COLORS.WHITE} />
        </TouchableOpacity>

        {/* 순서 표시 */}
        <View style={styles.sequenceIndicator}>
          <Text style={styles.sequenceText}>{index + 1}</Text>
        </View>

        {/* 순서 변경 버튼들 */}
        <View style={styles.reorderButtons}>
          {/* 위로 이동 */}
          {index > 0 && (
            <TouchableOpacity
              style={styles.reorderButton}
              onPress={() => moveMediaUp(index)}
              activeOpacity={0.7}
            >
              <Text style={styles.reorderButtonText}>↑</Text>
            </TouchableOpacity>
          )}
          
          {/* 아래로 이동 */}
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

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <CommonHeader
        title="새 피드"
        rightComponent={
          <TouchableOpacity
            style={styles.publishButton}
            onPress={handleCreateFeed}
            activeOpacity={0.7}
          >
            <CreateFeedIcon size={20} color={COLORS.PRIMARY} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 텍스트 입력 영역 */}
        <View style={styles.textSection}>
          <TextInput
            style={styles.textInput}
            placeholder="무슨 일이 일어나고 있나요?"
            placeholderTextColor={COLORS.GRAY_400}
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={1000}
            textAlignVertical="top"
          />
          <Text style={styles.characterCount}>{content.length}/1000</Text>
        </View>

        {/* 미디어 그리드 */}
        {mediaItems.length > 0 && (
          <View style={styles.mediaSection}>
            <Text style={styles.sectionTitle}>선택된 미디어</Text>
            <View style={styles.mediaGrid}>
              {mediaItems.map((item, index) => renderMediaItem(item, index))}
            </View>
          </View>
        )}

        {/* 미디어 추가 버튼 */}
        <View style={styles.addMediaSection}>
          <TouchableOpacity
            style={[
              styles.addMediaButton,
              mediaItems.length >= 9 && styles.addMediaButtonDisabled
            ]}
            onPress={selectMedia}
            disabled={mediaItems.length >= 9}
            activeOpacity={0.7}
          >
            <Text style={styles.addMediaText}>
              {mediaItems.length === 0 
                ? '📷 사진/영상 추가하기' 
                : `📷 사진/영상 추가 (${mediaItems.length}/9)`
              }
            </Text>
          </TouchableOpacity>
        </View>

        {/* 하단 여백 */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* 로딩 오버레이 */}
      <LoadingOverlay visible={isLoading} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLORS.SECONDARY,
  },

  // 헤더 관련
  publishButton: {
    padding: SPACING.SM,
  },

  // 콘텐츠
  content: {
    flex: 1,
  },

  // 텍스트 입력 섹션
  textSection: {
    backgroundColor: COLORS.WHITE,
    margin: SPACING.MD,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.MD,
    ...SHADOWS.SMALL,
  },
  textInput: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: TEXT_COLORS.PRIMARY,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: TEXT_COLORS.SECONDARY,
    textAlign: 'right',
    marginTop: SPACING.SM,
  },

  // 미디어 섹션
  mediaSection: {
    backgroundColor: COLORS.WHITE,
    margin: SPACING.MD,
    marginTop: 0,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.MD,
    ...SHADOWS.SMALL,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: TEXT_COLORS.PRIMARY,
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
    backgroundColor: COLORS.BLACK_50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: COLORS.WHITE,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
  deleteButton: {
    position: 'absolute',
    top: SPACING.XS,
    right: SPACING.XS,
    backgroundColor: COLORS.ERROR,
    borderRadius: BORDER_RADIUS.ROUND,
    padding: SPACING.XS,
  },
  sequenceIndicator: {
    position: 'absolute',
    top: SPACING.XS,
    left: SPACING.XS,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: BORDER_RADIUS.ROUND,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sequenceText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: COLORS.WHITE,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
  },
  dragHandle: {
    position: 'absolute',
    bottom: SPACING.XS,
    right: SPACING.XS,
    backgroundColor: COLORS.BLACK_50,
    borderRadius: BORDER_RADIUS.SM,
    padding: SPACING.XS,
  },
  reorderButtons: {
    position: 'absolute',
    bottom: SPACING.XS,
    left: SPACING.XS,
    flexDirection: 'row',
    gap: SPACING.XS,
  },
  reorderButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: BORDER_RADIUS.SM,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reorderButtonText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: COLORS.WHITE,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
  },

  // 미디어 추가 버튼
  addMediaSection: {
    margin: SPACING.MD,
    marginTop: 0,
  },
  addMediaButton: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.LG,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    borderStyle: 'dashed',
    ...SHADOWS.SMALL,
  },
  addMediaButtonDisabled: {
    backgroundColor: COLORS.GRAY_100,
    borderColor: COLORS.GRAY_300,
  },
  addMediaText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: COLORS.PRIMARY,
  },

  // 하단 여백
  bottomSpacing: {
    height: SPACING.XXL,
  },
});

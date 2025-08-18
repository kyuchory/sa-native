import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  Alert,
  Dimensions 
} from 'react-native';
import { COLORS, TEXT_COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import { DragHandleIcon } from './CommonIcons';
import type { ContentBlock, ContentBlockType } from '../types/post';

const { width: screenWidth } = Dimensions.get('window');

interface ContentBlockProps {
  block: ContentBlock;
  onContentChange: (blockId: string, content: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onMoveUp: (blockId: string) => void;
  onMoveDown: (blockId: string) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

// 텍스트 블록 컴포넌트
export function TextBlock({ 
  block, 
  onContentChange, 
  onDeleteBlock, 
  onMoveUp, 
  onMoveDown,
  canMoveUp,
  canMoveDown 
}: ContentBlockProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.blockContainer, isFocused && styles.focusedBlock]}>
      <View style={styles.blockHeader}>
        <View style={styles.blockInfo}>
          <Text style={styles.blockType}>텍스트</Text>
          <View style={styles.dragHandle}>
            <DragHandleIcon size={16} />
          </View>
        </View>
        <View style={styles.blockActions}>
          <TouchableOpacity 
            style={[styles.actionButton, !canMoveUp && styles.disabledButton]}
            onPress={() => canMoveUp && onMoveUp(block.id)}
            disabled={!canMoveUp}
          >
            <Text style={[styles.actionText, !canMoveUp && styles.disabledText]}>↑</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, !canMoveDown && styles.disabledButton]}
            onPress={() => canMoveDown && onMoveDown(block.id)}
            disabled={!canMoveDown}
          >
            <Text style={[styles.actionText, !canMoveDown && styles.disabledText]}>↓</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => onDeleteBlock(block.id)}
          >
            <Text style={styles.deleteText}>×</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <TextInput
        style={styles.textInput}
        placeholder="내용을 입력해주세요..."
        placeholderTextColor={COLORS.GRAY_400}
        value={block.value}
        onChangeText={(text) => onContentChange(block.id, text)}
        multiline
        textAlignVertical="top"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </View>
  );
}

// 이미지 블록 컴포넌트
export function ImageBlock({ 
  block, 
  onContentChange, 
  onDeleteBlock, 
  onMoveUp, 
  onMoveDown,
  canMoveUp,
  canMoveDown 
}: ContentBlockProps) {
  
  const handleImagePicker = () => {
    // TODO: 실제 이미지 피커 구현
    Alert.alert(
      '이미지 선택',
      '이미지를 선택하는 방법을 선택해주세요.',
      [
        { text: '카메라', onPress: () => console.log('카메라 선택') },
        { text: '갤러리', onPress: () => console.log('갤러리 선택') },
        { text: '취소', style: 'cancel' }
      ]
    );
  };

  return (
    <View style={styles.blockContainer}>
      <View style={styles.blockHeader}>
        <View style={styles.blockInfo}>
          <Text style={styles.blockType}>이미지</Text>
          <View style={styles.dragHandle}>
            <DragHandleIcon size={16} />
          </View>
        </View>
        <View style={styles.blockActions}>
          <TouchableOpacity 
            style={[styles.actionButton, !canMoveUp && styles.disabledButton]}
            onPress={() => canMoveUp && onMoveUp(block.id)}
            disabled={!canMoveUp}
          >
            <Text style={[styles.actionText, !canMoveUp && styles.disabledText]}>↑</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, !canMoveDown && styles.disabledButton]}
            onPress={() => canMoveDown && onMoveDown(block.id)}
            disabled={!canMoveDown}
          >
            <Text style={[styles.actionText, !canMoveDown && styles.disabledText]}>↓</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => onDeleteBlock(block.id)}
          >
            <Text style={styles.deleteText}>×</Text>
          </TouchableOpacity>
        </View>
      </View>

      {block.value ? (
        <TouchableOpacity onPress={handleImagePicker} activeOpacity={0.8}>
          <Image 
            source={{ uri: block.value }} 
            style={styles.imagePreview}
            resizeMode="cover"
          />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={styles.imagePlaceholder}
          onPress={handleImagePicker}
          activeOpacity={0.7}
        >
          <Text style={styles.placeholderText}>📷</Text>
          <Text style={styles.placeholderText}>이미지를 선택해주세요</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// 비디오 블록 컴포넌트
export function VideoBlock({ 
  block, 
  onContentChange, 
  onDeleteBlock, 
  onMoveUp, 
  onMoveDown,
  canMoveUp,
  canMoveDown 
}: ContentBlockProps) {
  
  const handleVideoPicker = () => {
    // TODO: 실제 비디오 피커 구현
    Alert.alert(
      '비디오 선택',
      '비디오를 선택하는 방법을 선택해주세요.',
      [
        { text: '카메라', onPress: () => console.log('비디오 촬영') },
        { text: '갤러리', onPress: () => console.log('갤러리 선택') },
        { text: '취소', style: 'cancel' }
      ]
    );
  };

  return (
    <View style={styles.blockContainer}>
      <View style={styles.blockHeader}>
        <View style={styles.blockInfo}>
          <Text style={styles.blockType}>비디오</Text>
          <View style={styles.dragHandle}>
            <DragHandleIcon size={16} />
          </View>
        </View>
        <View style={styles.blockActions}>
          <TouchableOpacity 
            style={[styles.actionButton, !canMoveUp && styles.disabledButton]}
            onPress={() => canMoveUp && onMoveUp(block.id)}
            disabled={!canMoveUp}
          >
            <Text style={[styles.actionText, !canMoveUp && styles.disabledText]}>↑</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, !canMoveDown && styles.disabledButton]}
            onPress={() => canMoveDown && onMoveDown(block.id)}
            disabled={!canMoveDown}
          >
            <Text style={[styles.actionText, !canMoveDown && styles.disabledText]}>↓</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => onDeleteBlock(block.id)}
          >
            <Text style={styles.deleteText}>×</Text>
          </TouchableOpacity>
        </View>
      </View>

      {block.value ? (
        <TouchableOpacity onPress={handleVideoPicker} activeOpacity={0.8}>
          <View style={styles.videoPreview}>
            <Text style={styles.videoIcon}>🎬</Text>
            <Text style={styles.videoText}>비디오가 선택됨</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={styles.videoPlaceholder}
          onPress={handleVideoPicker}
          activeOpacity={0.7}
        >
          <Text style={styles.placeholderText}>🎥</Text>
          <Text style={styles.placeholderText}>비디오를 선택해주세요</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// 메인 콘텐츠 블록 컴포넌트
export function ContentBlockComponent(props: ContentBlockProps) {
  switch (props.block.type) {
    case 'text':
      return <TextBlock {...props} />;
    case 'image':
      return <ImageBlock {...props} />;
    case 'video':
      return <VideoBlock {...props} />;
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  blockContainer: {
    backgroundColor: COLORS.GRAY_50,
    marginVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
    borderWidth: 1,
    borderColor: COLORS.GRAY_200,
    overflow: 'hidden',
  },
  focusedBlock: {
    borderColor: COLORS.PRIMARY,
    borderWidth: 2,
  },
  
  // 블록 헤더
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    backgroundColor: COLORS.GRAY_100,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  blockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  blockType: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: TEXT_COLORS.PRIMARY,
    marginRight: SPACING.SM,
  },
  dragHandle: {
    opacity: 0.6,
  },
  blockActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.GRAY_200,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.XS,
  },
  disabledButton: {
    backgroundColor: COLORS.GRAY_100,
  },
  actionText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: COLORS.GRAY_600,
  },
  disabledText: {
    color: COLORS.GRAY_300,
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.ERROR + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.XS,
  },
  deleteText: {
    fontSize: 18,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: COLORS.ERROR,
  },
  
  // 텍스트 입력
  textInput: {
    padding: SPACING.MD,
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: TEXT_COLORS.PRIMARY,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: COLORS.WHITE,
  },
  
  // 이미지 관련
  imagePreview: {
    height: 200,
    marginHorizontal: SPACING.MD,
    marginVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.SM,
  },
  imagePlaceholder: {
    marginHorizontal: SPACING.MD,
    marginVertical: SPACING.SM,
    height: 120,
    backgroundColor: COLORS.GRAY_50,
    borderRadius: BORDER_RADIUS.SM,
    borderWidth: 2,
    borderColor: COLORS.GRAY_200,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // 비디오 관련
  videoPreview: {
    marginHorizontal: SPACING.MD,
    marginVertical: SPACING.SM,
    height: 120,
    backgroundColor: COLORS.GRAY_100,
    borderRadius: BORDER_RADIUS.SM,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholder: {
    marginHorizontal: SPACING.MD,
    marginVertical: SPACING.SM,
    height: 120,
    backgroundColor: COLORS.GRAY_50,
    borderRadius: BORDER_RADIUS.SM,
    borderWidth: 2,
    borderColor: COLORS.GRAY_200,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoIcon: {
    fontSize: 24,
    marginBottom: SPACING.XS,
  },
  videoText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: TEXT_COLORS.SECONDARY,
  },
  
  // 공통 플레이스홀더
  placeholderText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: COLORS.GRAY_400,
    textAlign: 'center',
    marginVertical: 2,
  },
});

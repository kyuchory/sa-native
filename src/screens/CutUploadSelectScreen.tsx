import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import { useThemeStore } from '../stores/themeStore';
import CommonHeader from '../components/CommonHeader';
import { CameraIcon, GalleryIcon, AlertIcon } from '../components/CutIcons';
import { SPACING, TYPOGRAPHY, COLORS, BORDER_RADIUS } from '../constants/theme';
import { normalizeVideoUri } from '../utils/normalizeVideoUri';

type CutUploadSelectNavigationProp = StackNavigationProp<any, any>;

export default function CutUploadSelectScreen() {
  const { colors } = useThemeStore();
  const navigation = useNavigation<CutUploadSelectNavigationProp>();

  const [isPickingVideo, setIsPickingVideo] = useState(false);
  const styles = createStyles(colors);

  const handleCameraPress = async () => {
    setIsPickingVideo(true);

    try {
      // 카메라 권한 요청
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('권한 필요', '카메라 사용을 위해 권한이 필요합니다.');
        return;
      }

      // 카메라로 비디오 촬영 (기본 촬영 시간 제한 없음)
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['videos'],
        quality: 0.8,
        videoMaxDuration: 0, // 제한 없음 (VideoTrimCrop에서 30초 이하로 편집)
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        // ✅ iOS 썸네일 생성 문제 해결:URI 정규화
        const videoUri = await normalizeVideoUri(result.assets[0]);

        // VideoTrimCropScreen으로 이동
        navigation.replace('VideoTrimCrop', {
          videoUri,
          aspectRatio: '9:16', // 세로 비율
          uploadService: 'cuts', // 컷츠 전용
          editMode: 'both', // trim + crop
          maxDuration: 30000, // 컷츠는 30초 제한 (VideoTrimCrop에서 ms 단위로 전달)
        });
      }
    } catch (error) {
      console.error('카메라 촬영 실패:', error);
      Alert.alert('오류', '카메라를 실행할 수 없습니다.');
    } finally {
      setIsPickingVideo(false);
    }
  };

  const handleGalleryPress = async () => {
    setIsPickingVideo(true);

    try {
      // 갤러리 권한 요청
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('권한 필요', '갤러리 접근을 위해 권한이 필요합니다.');
        return;
      }

      // 갤러리에서 비디오 선택 (기본 제한 없음)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        quality: 0.8,
        videoMaxDuration: 0, // 제한 없음
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        // ✅ iOS 썸네일 생성 문제 해결:URI 정규화
        const videoUri = await normalizeVideoUri(result.assets[0]);

        // VideoTrimCropScreen으로 이동
        navigation.replace('VideoTrimCrop', {
          videoUri,
          aspectRatio: '9:16', // 세로 비율
          uploadService: 'cuts', // 컷츠 전용
          editMode: 'both', // trim + crop
          maxDuration: 30000, // 컷츠는 30초 제한 (VideoTrimCrop에서 ms 단위로 전달)
        });
      }
    } catch (error) {
      console.error('갤러리 선택 실패:', error);
      Alert.alert('오류', '갤러리에서 영상을 선택할 수 없습니다.');
    } finally {
      setIsPickingVideo(false);
    }
  };

  return (
    <>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <CommonHeader
          title="컷츠 업로드"
          onBackPress={() => navigation.goBack()}
        />

        <View style={styles.content}>
          <View style={styles.optionContainer}>
            <Text style={styles.title}>컷츠를 올릴 영상을 선택하세요</Text>
            <Text style={styles.subtitle}>
              내 영상을 많은 사람들과 공유해 보세요!
            </Text>
          </View>

          <View style={styles.optionsContainer}>
            {/* 카메라 옵션 */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={handleCameraPress}
              disabled={isPickingVideo}
            >
              <View style={styles.iconContainer}>
                <CameraIcon size={32} color={colors.WHITE} />
              </View>
              <Text style={styles.optionTitle}>촬영하기</Text>
              <Text style={styles.optionSubtitle}>
                새 영상을 촬영해서 컷츠를 만들어요
              </Text>
            </TouchableOpacity>

            {/* 갤러리 옵션 */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={handleGalleryPress}
              disabled={isPickingVideo}
            >
              <View style={styles.iconContainer}>
                <GalleryIcon size={32} color={colors.WHITE} />
              </View>
              <Text style={styles.optionTitle}>갤러리에서 선택</Text>
              <Text style={styles.optionSubtitle}>
                저장된 영상으로 컷츠를 만들어요
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.noteContainer}>
            <View style={styles.noteTitleContainer}>
              <AlertIcon size={30} color={colors.PRIMARY} />
              <Text style={styles.noteTitle}>업로드 팁</Text>
            </View>
            <Text style={styles.noteText}>
              • 30초 이내(필수)의 세로 영상이 가장 좋아요{'\n'}
              • 편집하며 길이를 조절할 수 있습니다{'\n'}
              • 카테고리를 선택하면 더 많은 사람이 볼 수 있어요
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.GRAY_50,
  },
  content: {
    flex: 1,
    padding: SPACING.LG,
  },

  // 옵션 설명
  optionContainer: {
    alignItems: 'center',
    marginBottom: SPACING.XL,
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE.XL,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: colors.GRAY_900, // TEXT_COLORS.PRIMARY (다크모드에서 흰색, 라이트모드에서 검정)
    marginBottom: SPACING.XS,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_600, // TEXT_COLORS.SECONDARY (다크모드에서 회색, 라이트모드에서 회색)
    textAlign: 'center',
    lineHeight: 20,
  },

  // 옵션 선택
  optionsContainer: {
    marginBottom: SPACING.XL,
  },
  optionCard: {
    backgroundColor: colors.GRAY_100, // BG_COLORS.SECONDARY (약간 밝은 카드 배경)
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.LG,
    alignItems: 'center',
    marginBottom: SPACING.MD,
    borderWidth: 1,
    borderColor: colors.GRAY_200,
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: colors.PRIMARY,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  icon: {
    width: 32,
    height: 32,
  },
  optionTitle: {
    fontSize: TYPOGRAPHY.SIZE.LG,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900, // TEXT_COLORS.PRIMARY
    marginBottom: SPACING.XS,
    textAlign: 'center',
  },
  optionSubtitle: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_600, // TEXT_COLORS.SECONDARY
    textAlign: 'center',
    lineHeight: 18,
  },

  // 노트
  noteContainer: {
    backgroundColor: colors.GRAY_100, // BG_COLORS.TERTIARY (약간 더 부드러운 배경)
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.LG,
    borderWidth: 1,
    borderColor: colors.GRAY_200,
  },
  noteTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SM,
    gap: SPACING.XS,
  },
  noteTitle: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900, // TEXT_COLORS.PRIMARY
  },
  noteText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_700, // 중간 텍스트 색상
    lineHeight: 20,
  },
});

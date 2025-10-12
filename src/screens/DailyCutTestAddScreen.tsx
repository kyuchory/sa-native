import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useThemeStore } from '../stores/themeStore';
import CommonHeader from '../components/CommonHeader';
import { StoryService } from '../services/storyService';
import { handleApiError } from '../services/apiClient';
import { useNavigation } from '@react-navigation/native';

export default function DailyCutTestAddScreen() {
  const { colors } = useThemeStore();
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  // 이미지 피커 실행 함수
  const pickImage = async () => {
    try {
      setLoading(true);

      // 권한 요청
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert('권한 필요', '사진 라이브러리에 접근하기 위해 권한이 필요합니다.');
        navigation.goBack();
        return;
      }

      // 이미지 피커 실행
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 1,
      });

      if (result.canceled) {
        // 취소된 경우 뒤로 가기
        navigation.goBack();
        return;
      }

      // 선택된 이미지 처리
      if (result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        await createStory(selectedImage.uri);
      }

    } catch (error) {
      console.error('이미지 선택 실패:', error);
      Alert.alert('오류', '이미지를 불러오는데 실패했습니다.', [
        { text: '확인', onPress: () => navigation.goBack() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 스토리 생성 함수
  const createStory = async (imageUri: string) => {
    try {
      setLoading(true);

      // 스토리 생성 API 호출
      await StoryService.createStory({
        fileUri: imageUri
      });

      // 성공 시 피드 화면으로 이동
      navigation.navigate('Feed' as never);

    } catch (error) {
      // 에러 처리
      const errorMessage = handleApiError(error);
      Alert.alert('스토리 생성 실패', errorMessage, [
        {
          text: '다시 시도',
          onPress: () => pickImage() // 확인 누르면 다시 이미지 피커 열기
        },
        {
          text: '취소',
          onPress: () => navigation.goBack(),
          style: 'cancel'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 이미지 피커 실행
  useEffect(() => {
    pickImage();
  }, []);

  if (loading) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: colors.WHITE,
      }}>
        <CommonHeader title="데일리 컷 추가" />

        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 20,
        }}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
          <Text style={{
            marginTop: 16,
            fontSize: 16,
            color: colors.GRAY_700,
            textAlign: 'center',
          }}>
            {loading ? '스토리를 생성하는 중...' : '이미지를 선택해주세요...'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{
      flex: 1,
      backgroundColor: colors.WHITE,
    }}>
      <CommonHeader title="데일리 컷 추가" />

      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
      }}>
        <Text style={{
          fontSize: 16,
          color: colors.GRAY_700,
          textAlign: 'center',
        }}>
          스토리를 생성하는 중...
        </Text>
      </View>
    </View>
  );
}

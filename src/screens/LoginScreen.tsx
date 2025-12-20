import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import CustomAlertModal from '../components/CustomAlertModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { NativeModules } from 'react-native';
import { login } from '@react-native-seoul/kakao-login';
import { AuthService } from '../services/authService';


export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Custom Alert Modal 상태
  const [alertModal, setAlertModal] = useState<{visible: boolean, title: string, message: string, buttons: any[]} | null>(null);

  const { loginWithCredentials, loginWithKakao, isLoading } = useAuthStore();
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const handleLogin = async () => {
    if (!email || !password) {
      setAlertModal({
        visible: true,
        title: '오류',
        message: '이메일과 비밀번호를 모두 입력해주세요.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
      return;
    }

    try {
      const result = await loginWithCredentials({ email, password });

      if (result.success) {
        setAlertModal({
          visible: true,
          title: '성공',
          message: '로그인이 완료되었습니다.',
          buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
        });
      } else {
        setAlertModal({
          visible: true,
          title: '오류',
          message: result.error || '로그인에 실패했습니다.',
          buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
        });
      }

    } catch (error) {
      setAlertModal({
        visible: true,
        title: '오류',
        message: '로그인 중 오류가 발생했습니다.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
    }
  };

  const handleKakaoLogin = async () => {
    try {
      // 카카오 로그인으로 토큰 받기
      let tokenResult;
      if (Platform.OS === 'ios') {
        // iOS: 직접 구현한 네이티브 모듈 사용
        const { KakaoLoginModule } = NativeModules;
        tokenResult = await KakaoLoginModule.login();
      } else {
        // Android: 라이브러리 사용
        tokenResult = await login();
      }

      // 토큰에서 accessToken 추출
      const { accessToken } = tokenResult;

      // authStore를 통해 카카오 로그인 처리
      const result = await loginWithKakao({ accessToken });

      if (result.success) {
        setAlertModal({
          visible: true,
          title: '성공',
          message: '카카오 로그인이 완료되었습니다.',
          buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
        });
      } else {
        setAlertModal({
          visible: true,
          title: '카카오 로그인 오류',
          message: '다시 시도해주세요. ' + result.error || '다시 시도해주세요. 카카오 로그인에 실패했습니다.',
          buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
        });
      }

    } catch (error: any) {
      console.error('카카오 로그인 오류:', error);

      let errorMessage = '카카오 로그인 중 오류가 발생했습니다.';

      if (error.response?.message) {
        errorMessage = error.response.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setAlertModal({
        visible: true,
        title: '카카오 로그인 오류',
        message: '다시 시도해주세요.' + errorMessage,
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
    }
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.header}>
          <Text style={styles.title}>Animal Talk</Text>
          <Text style={styles.subtitle}>귀여운 동물 친구들을 만나보세요</Text>
        </View>

        <View style={styles.formWrapper}>
          <Image
            source={require('../../assets/AnimalTalk_logo_icon.png')}
            style={styles.logo}
          />
          <View style={styles.formContainer}>
          <CustomInput
            label="이메일"
            placeholder="이메일을 입력하세요"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <CustomInput
            label="비밀번호"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <CustomButton
            title={isLoading ? '로그인 중...' : '로그인'}
            onPress={handleLogin}
            disabled={isLoading}
            style={styles.loginButton}
          />

          <CustomButton
            title="계정이 없으신가요? 회원가입"
            variant="outline"
            onPress={handleSignUp}
            style={styles.signUpButton}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>소셜로그인</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            onPress={handleKakaoLogin}
            style={styles.kakaoButton}
          >
            <Image
              source={require('../assets/social/kakao_login_large_wide.png')}
              style={styles.kakaoImage}
            />
          </TouchableOpacity>
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>

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

// 스타일 생성 함수
const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.GRAY_50,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.MD,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.LG,
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE.XXXL,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: colors.PRIMARY,
    marginBottom: SPACING.SM,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_600,
    textAlign: 'center',
  },
  formWrapper: {
    position: 'relative',
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    position: 'absolute',
    top: -180,
    alignSelf: 'center',
  },
  formContainer: {
    backgroundColor: colors.WHITE,
    padding: SPACING.XL - SPACING.SM,
    borderRadius: BORDER_RADIUS.XL + SPACING.XS,
    ...SHADOWS.MEDIUM,
  },
  loginButton: {
    marginTop: SPACING.SM,
    marginBottom: SPACING.XS,
  },
  signUpButton: {
    marginTop: SPACING.SM,
    marginBottom: SPACING.XS,
  },
  kakaoButton: {
    marginTop: SPACING.SM,
    marginBottom: SPACING.MD,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.MD,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.SM,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.GRAY_200,
  },
  dividerText: {
    paddingHorizontal: SPACING.SM,
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_600,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
  },
  kakaoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
});

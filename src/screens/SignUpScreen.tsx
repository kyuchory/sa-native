import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import DuplicateCheckButton from '../components/DuplicateCheckButton';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';

export default function SignUpScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  
  const [emailChecked, setEmailChecked] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(false);
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [nicknameAvailable, setNicknameAvailable] = useState(false);
  
  const [emailChecking, setEmailChecking] = useState(false);
  const [nicknameChecking, setNicknameChecking] = useState(false);
  
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    nickname?: string;
  }>({});
  
  const { signUp, checkEmail, checkNickname, isLoading } = useAuthStore();
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  // 이메일 중복 체크
  const handleEmailCheck = async () => {
    if (!email) {
      setErrors(prev => ({ ...prev, email: '이메일을 입력해주세요.' }));
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors(prev => ({ ...prev, email: '올바른 이메일 형식을 입력해주세요.' }));
      return;
    }

    setEmailChecking(true);
    setErrors(prev => ({ ...prev, email: undefined }));
    
    try {
             const result = await checkEmail(email);
       if (result.success) {
         setEmailChecked(true);
         setEmailAvailable(result.isAvailable || false);
         if (!result.isAvailable) {
           setErrors(prev => ({ ...prev, email: '이미 사용 중인 이메일입니다.' }));
         }
       } else {
         Alert.alert('오류', result.error || '이메일 중복 체크에 실패했습니다.');
       }
    } catch (error) {
      Alert.alert('오류', '이메일 중복 체크 중 오류가 발생했습니다.');
    } finally {
      setEmailChecking(false);
    }
  };

  // 닉네임 중복 체크
  const handleNicknameCheck = async () => {
    if (!nickname) {
      setErrors(prev => ({ ...prev, nickname: '닉네임을 입력해주세요.' }));
      return;
    }
    
    if (nickname.length < 2 || nickname.length > 20) {
      setErrors(prev => ({ ...prev, nickname: '닉네임은 2자 이상 20자 이하여야 합니다.' }));
      return;
    }

    setNicknameChecking(true);
    setErrors(prev => ({ ...prev, nickname: undefined }));
    
    try {
             const result = await checkNickname(nickname);
       if (result.success) {
         setNicknameChecked(true);
         setNicknameAvailable(result.isAvailable || false);
         if (!result.isAvailable) {
           setErrors(prev => ({ ...prev, nickname: '이미 사용 중인 닉네임입니다.' }));
         }
       } else {
         Alert.alert('오류', result.error || '닉네임 중복 체크에 실패했습니다.');
       }
    } catch (error) {
      Alert.alert('오류', '닉네임 중복 체크 중 오류가 발생했습니다.');
    } finally {
      setNicknameChecking(false);
    }
  };

  // 유효성 검사
  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!email) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!emailChecked || !emailAvailable) {
      newErrors.email = '사용 가능한 이메일인지 확인해주세요.';
    }

    if (!password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (password.length < 6) {
      newErrors.password = '비밀번호는 6자 이상이어야 합니다.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }

    if (!nickname) {
      newErrors.nickname = '닉네임을 입력해주세요.';
    } else if (!nicknameChecked || !nicknameAvailable) {
      newErrors.nickname = '사용 가능한 닉네임인지 확인해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 회원가입 처리
  const handleSignUp = async () => {
    if (!validateForm()) return;

    try {
      const result = await signUp({ email, password, nickname });
      
      if (result.success) {
        Alert.alert(
          '성공', 
          '회원가입이 완료되었습니다. 로그인해주세요.',
          [
            {
              text: '확인',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        Alert.alert('오류', result.error || '회원가입에 실패했습니다.');
      }
    } catch (error) {
      Alert.alert('오류', '회원가입 중 오류가 발생했습니다.');
    }
  };

  // 입력값 변경 시 중복 체크 상태 초기화
  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailChecked) {
      setEmailChecked(false);
      setEmailAvailable(false);
    }
  };

  const handleNicknameChange = (text: string) => {
    setNickname(text);
    if (nicknameChecked) {
      setNicknameChecked(false);
      setNicknameAvailable(false);
    }
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
          <Text style={styles.title}>회원가입</Text>
          <Text style={styles.subtitle}>Mom Talk SNS에 가입하세요</Text>
        </View>

        <View style={styles.formContainer}>
          {/* 이메일 입력 */}
          <CustomInput
            label="이메일"
            placeholder="이메일을 입력하세요"
            value={email}
            onChangeText={handleEmailChange}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.email}
            rightComponent={
              <DuplicateCheckButton
                onPress={handleEmailCheck}
                isLoading={emailChecking}
                isChecked={emailChecked}
                isAvailable={emailAvailable}
                size="medium"
              />
            }
          />

          {/* 비밀번호 입력 */}
          <CustomInput
            label="비밀번호"
            placeholder="비밀번호를 입력하세요 (6자 이상)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            error={errors.password}
          />

          {/* 비밀번호 확인 입력 */}
          <CustomInput
            label="비밀번호 확인"
            placeholder="비밀번호를 다시 입력하세요"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            error={errors.confirmPassword}
          />

          {/* 닉네임 입력 */}
          <CustomInput
            label="닉네임"
            placeholder="닉네임을 입력하세요 (2-20자)"
            value={nickname}
            onChangeText={handleNicknameChange}
            autoCapitalize="none"
            error={errors.nickname}
            rightComponent={
              <DuplicateCheckButton
                onPress={handleNicknameCheck}
                isLoading={nicknameChecking}
                isChecked={nicknameChecked}
                isAvailable={nicknameAvailable}
                size="medium"
              />
            }
          />

          {/* 회원가입 버튼 */}
          <CustomButton
            title={isLoading ? '가입 중...' : '회원가입'}
            onPress={handleSignUp}
            disabled={isLoading}
            style={styles.signUpButton}
          />

          {/* 로그인으로 돌아가기 */}
          <CustomButton
            title="이미 계정이 있으신가요? 로그인"
            variant="outline"
            size="medium"
            onPress={() => navigation.goBack()}
            style={styles.backToLoginButton}
          />
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    padding: SPACING.MD,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.XL + SPACING.SM,
    marginTop: SPACING.MD,
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
  formContainer: {
    backgroundColor: colors.WHITE,
    padding: SPACING.XL - SPACING.SM,
    borderRadius: BORDER_RADIUS.XL + SPACING.XS,
    ...SHADOWS.MEDIUM,
  },
  signUpButton: {
    marginTop: SPACING.SM,
    marginBottom: SPACING.MD,
  },
  backToLoginButton: {
    marginTop: SPACING.SM,
  },
});

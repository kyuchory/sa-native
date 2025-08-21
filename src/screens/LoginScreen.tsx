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
import { useAuthStore } from '../stores/authStore';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { COLORS, TEXT_COLORS, BG_COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { loginWithCredentials, isLoading } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('오류', '이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    try {
      const result = await loginWithCredentials({ email, password });
      
      if (result.success) {
        Alert.alert('성공', '로그인이 완료되었습니다.');
      } else {
        Alert.alert('오류', result.error || '로그인에 실패했습니다.');
      }
      
    } catch (error) {
      Alert.alert('오류', '로그인 중 오류가 발생했습니다.');
    }
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Mom Talk</Text>
          <Text style={styles.subtitle}>SNS에 오신 것을 환영합니다</Text>
        </View>

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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLORS.SECONDARY,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.MD,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.XXL + SPACING.SM,
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE.XXXL,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: COLORS.PRIMARY,
    marginBottom: SPACING.SM,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: TEXT_COLORS.SECONDARY,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: BG_COLORS.CARD,
    padding: SPACING.XL - SPACING.SM,
    borderRadius: BORDER_RADIUS.XL + SPACING.XS,
    ...SHADOWS.MEDIUM,
  },
  loginButton: {
    marginTop: SPACING.SM,
    marginBottom: SPACING.MD,
  },
  signUpButton: {
    marginTop: SPACING.SM,
  },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../types/navigation';

type SettingsScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNotifications, setIsNotifications] = useState(true);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>⚙️ 설정 화면</Text>
      <Text style={styles.description}>
        이 화면은 설정 옵션들을 보여주는 예시입니다.
      </Text>
      
      <View style={styles.settingItem}>
        <Text style={styles.settingText}>다크 모드</Text>
        <Switch
          value={isDarkMode}
          onValueChange={setIsDarkMode}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={isDarkMode ? '#f5dd4b' : '#f4f3f4'}
        />
      </View>
      
      <View style={styles.settingItem}>
        <Text style={styles.settingText}>알림 받기</Text>
        <Switch
          value={isNotifications}
          onValueChange={setIsNotifications}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={isNotifications ? '#f5dd4b' : '#f4f3f4'}
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>뒤로 가기</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.buttonText}>홈으로 이동</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  settingText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
    marginTop: 20,
  },
  button: {
    backgroundColor: '#e74c3c',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

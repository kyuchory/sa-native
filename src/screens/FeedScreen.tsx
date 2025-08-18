import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAuthStore } from '../stores/authStore';

export default function FeedScreen() {
  const { logout, user } = useAuthStore();

  const handleLogout = async () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '로그아웃',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('로그아웃 실패:', error);
              Alert.alert('오류', '로그아웃 중 오류가 발생했습니다.');
            }
          },
        },
      ]
    );
  };
  const feedItems = [
    { id: 1, title: '첫 번째 피드', content: '이것은 첫 번째 피드 내용입니다.' },
    { id: 2, title: '두 번째 피드', content: '이것은 두 번째 피드 내용입니다.' },
    { id: 3, title: '세 번째 피드', content: '이것은 세 번째 피드 내용입니다.' },
    { id: 4, title: '네 번째 피드', content: '이것은 네 번째 피드 내용입니다.' },
    { id: 5, title: '다섯 번째 피드', content: '이것은 다섯 번째 피드 내용입니다.' },
  ];

  return (
    <View style={styles.container}>
      {/* 로그아웃 버튼 */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Text style={styles.welcomeText}>
            {user?.nickname ? `${user.nickname}님 안녕하세요!` : '피드 화면'}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>로그아웃</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>📰 피드 화면</Text>
      <Text style={styles.description}>
        사용자들의 피드를 보여주는 화면입니다.
      </Text>
      
      <ScrollView style={styles.feedContainer} showsVerticalScrollIndicator={false}>
        {feedItems.map((item) => (
          <View key={item.id} style={styles.feedItem}>
            <Text style={styles.feedTitle}>{item.title}</Text>
            <Text style={styles.feedContent}>{item.content}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8f4fd',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 10,
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2980b9',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  feedContainer: {
    flex: 1,
  },
  feedItem: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
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
  feedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  feedContent: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
});

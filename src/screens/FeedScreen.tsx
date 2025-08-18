import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function FeedScreen() {
  const feedItems = [
    { id: 1, title: '첫 번째 피드', content: '이것은 첫 번째 피드 내용입니다.' },
    { id: 2, title: '두 번째 피드', content: '이것은 두 번째 피드 내용입니다.' },
    { id: 3, title: '세 번째 피드', content: '이것은 세 번째 피드 내용입니다.' },
    { id: 4, title: '네 번째 피드', content: '이것은 네 번째 피드 내용입니다.' },
    { id: 5, title: '다섯 번째 피드', content: '이것은 다섯 번째 피드 내용입니다.' },
  ];

  return (
    <View style={styles.container}>
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

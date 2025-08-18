import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export default function CutScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const categories = [
    { id: 'all', name: '전체', icon: '✂️' },
    { id: 'hair', name: '헤어', icon: '💇‍♀️' },
    { id: 'nail', name: '네일', icon: '💅' },
    { id: 'makeup', name: '메이크업', icon: '💄' },
    { id: 'fashion', name: '패션', icon: '👗' },
  ];

  const cutItems = [
    { id: 1, title: '트렌디한 단발 스타일', category: 'hair', price: '30,000원' },
    { id: 2, title: '클래식 레이어드 컷', category: 'hair', price: '35,000원' },
    { id: 3, title: '글램 네일 아트', category: 'nail', price: '25,000원' },
    { id: 4, title: '데일리 메이크업', category: 'makeup', price: '40,000원' },
    { id: 5, title: '스타일링 컨설팅', category: 'fashion', price: '50,000원' },
  ];

  const filteredItems = selectedCategory === 'all' 
    ? cutItems 
    : cutItems.filter(item => item.category === selectedCategory);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>✂️ 컷 화면</Text>
      <Text style={styles.description}>
        다양한 스타일링 서비스를 확인해보세요.
      </Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.selectedCategory
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={[
              styles.categoryText,
              selectedCategory === category.id && styles.selectedCategoryText
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <ScrollView style={styles.itemsContainer} showsVerticalScrollIndicator={false}>
        {filteredItems.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemPrice}>{item.price}</Text>
            <TouchableOpacity style={styles.bookButton}>
              <Text style={styles.bookButtonText}>예약하기</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3e5f5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8e24aa',
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
  categoryContainer: {
    marginBottom: 30,
  },
  categoryButton: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    marginRight: 15,
    alignItems: 'center',
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedCategory: {
    backgroundColor: '#8e24aa',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  categoryText: {
    fontSize: 12,
    color: '#8e24aa',
    fontWeight: '600',
  },
  selectedCategoryText: {
    color: 'white',
  },
  itemsContainer: {
    flex: 1,
  },
  itemCard: {
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
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  itemPrice: {
    fontSize: 16,
    color: '#8e24aa',
    fontWeight: '600',
    marginBottom: 15,
  },
  bookButton: {
    backgroundColor: '#8e24aa',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  bookButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

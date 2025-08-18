import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList } from 'react-native';

export default function SearchScreen() {
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([
    { id: 1, title: '검색 결과 1', description: '첫 번째 검색 결과입니다.' },
    { id: 2, title: '검색 결과 2', description: '두 번째 검색 결과입니다.' },
    { id: 3, title: '검색 결과 3', description: '세 번째 검색 결과입니다.' },
  ]);

  const handleSearch = () => {
    // 실제 검색 로직은 여기에 구현
    console.log('검색어:', searchText);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 검색 화면</Text>
      <Text style={styles.description}>
        원하는 내용을 검색해보세요.
      </Text>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="검색어를 입력하세요..."
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>검색</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.resultItem}>
            <Text style={styles.resultTitle}>{item.title}</Text>
            <Text style={styles.resultDescription}>{item.description}</Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8e1',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f57c00',
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
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 30,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchButton: {
    backgroundColor: '#f57c00',
    padding: 15,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultItem: {
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
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  resultDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
});

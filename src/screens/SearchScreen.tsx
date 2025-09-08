import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';
import { COLORS, BG_COLORS, TEXT_COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../constants/theme';
import { SearchIcon } from '../components/SearchIcons';
import PeopleTab, { PersonItem } from '../components/PeopleTab';
import FeedTab, { FeedItem } from '../components/FeedTab';
import PostTab, { PostItem } from '../components/PostTab';
import { SearchService } from '../services/searchService';
import { UserSearchResult } from '../types/search';

// 임시 Mock Data (API 적용 시 제거)
const mockPeople: PersonItem[] = [
  { id: 1, nickname: 'user1', profile_img: null },
  { id: 2, nickname: 'user2', profile_img: null },
  { id: 3, nickname: 'user3', profile_img: null },
  { id: 4, nickname: 'user4', profile_img: null },
  { id: 5, nickname: 'user5', profile_img: null },
  { id: 6, nickname: 'user6', profile_img: null },
  { id: 7, nickname: 'user7', profile_img: null },
  { id: 8, nickname: 'user8', profile_img: null },
  { id: 9, nickname: 'user9', profile_img: null },
  { id: 10, nickname: 'user10', profile_img: null },
  { id: 11, nickname: 'user11', profile_img: null },
  { id: 12, nickname: 'user12', profile_img: null },
  { id: 13, nickname: 'user13', profile_img: null },
  { id: 14, nickname: 'user14', profile_img: null },
  { id: 15, nickname: 'user15', profile_img: null },
];

const mockPosts: PostItem[] = [
  {
    id: 1,
    title: 'Sample Post 1',
    preview_image: 'https://picsum.photos/200/300?random=1',
    user: { nickname: 'user1', profile_img: null },
    created_at: new Date().toISOString(),
    like_count: 10,
    comment_count: 2,
    is_liked: false
  },
  {
    id: 2,
    title: 'Sample Post 2',
    preview_image: 'https://picsum.photos/200/300?random=2',
    user: { nickname: 'user2', profile_img: null },
    created_at: new Date().toISOString(),
    like_count: 5,
    comment_count: 1,
    is_liked: true
  },
  {
    id: 3,
    title: 'Sample Post 3',
    preview_image: 'https://picsum.photos/200/300?random=3',
    user: { nickname: 'user3', profile_img: null },
    created_at: new Date().toISOString(),
    like_count: 20,
    comment_count: 5,
    is_liked: false
  },
];

const mockFeeds: FeedItem[] = [
  { id: 1, preview_image: 'https://picsum.photos/300/300?random=1' },
  { id: 2, preview_image: 'https://picsum.photos/300/300?random=2' },
  { id: 3, preview_image: 'https://picsum.photos/300/300?random=3' },
  { id: 4, preview_image: 'https://picsum.photos/300/300?random=4' },
  { id: 5, preview_image: 'https://picsum.photos/300/300?random=5' },
  { id: 6, preview_image: 'https://picsum.photos/300/300?random=6' },
  { id: 7, preview_image: 'https://picsum.photos/300/300?random=7' },
  { id: 8, preview_image: 'https://picsum.photos/300/300?random=8' },
  { id: 9, preview_image: 'https://picsum.photos/300/300?random=9' },
];

type SearchTabType = 'people' | 'posts' | 'feeds';

// Debounce hook 구현 (lodash 없이)
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function SearchScreen() {
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTabType>('people');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Debounce 적용 (300ms)
  const debouncedSearchText = useDebounce(searchText, 300);

  // 실시간 검색 API 호출
  const performSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      setSearchError(null);
      const response = await SearchService.searchUsersFirstPage(query);
      setSearchResults(response.users);
    } catch (error) {
      console.error('검색 실패:', error);
      setSearchError('검색 중 오류가 발생했습니다.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced 검색 실행
  useEffect(() => {
    if (debouncedSearchText) {
      performSearch(debouncedSearchText);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchText, performSearch]);

  const handleSearch = () => {
    if (searchText.trim()) {
      console.log('검색어:', searchText);
    }
  };

  const handleClearSearch = () => {
    setSearchText('');
    setIsSearchActive(false);
    inputRef.current?.blur();
  };

  const handleTabPress = (tab: SearchTabType) => {
    setActiveTab(tab);
    // TODO: 선택된 탭에 대한 검색 API 호출
  };

  const handleInputFocus = () => {
    setIsSearchActive(true);
  };

  const handleInputBlur = () => {
    if (!searchText.trim()) {
      setIsSearchActive(false);
    }
  };

  const handleItemPress = (item: any) => {
    console.log('Item pressed:', item);
    // TODO: 상세 화면으로 이동
  };

  const tabs = [
    { key: 'people' as SearchTabType, label: '사람' },
    { key: 'posts' as SearchTabType, label: '게시물' },
    { key: 'feeds' as SearchTabType, label: '피드' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* 검색 Input */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, isSearchActive && styles.searchInputActive]}>
          <View style={styles.searchIcon}>
            <SearchIcon size={20} color={TEXT_COLORS.DISABLED} />
          </View>
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="검색"
            placeholderTextColor={TEXT_COLORS.DISABLED}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            maxLength={100}
          />
          {isSearchActive && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearSearch}
            >
              <Text style={styles.clearButtonText}>취소</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!isSearchActive ? (
        <View style={styles.noSearchContainer}>
          <Text style={styles.noSearchText}>원하는 내용을 검색해보세요</Text>
        </View>
      ) : (
        <>
          {/* 탭 네비게이션 */}
          <View style={styles.tabContainer}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
                onPress={() => handleTabPress(tab.key)}
              >
                <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 콘텐츠 영역 */}
          <View style={styles.contentContainer}>
            {activeTab === 'people' && (
              isSearching ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>검색 중...</Text>
                </View>
              ) : searchError ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{searchError}</Text>
                </View>
              ) : (
                <PeopleTab
                  data={searchResults.map(user => ({
                    id: user.id,
                    nickname: user.nickname,
                    profile_img: user.profile_img
                  }))}
                  onItemPress={handleItemPress}
                />
              )
            )}

            {activeTab === 'posts' && (
              <PostTab data={mockPosts} onItemPress={handleItemPress} />
            )}

            {activeTab === 'feeds' && (
              <FeedTab data={mockFeeds} onItemPress={handleItemPress} />
            )}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLORS.PRIMARY,
  },

  // 검색 Input 스타일
  searchContainer: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.GRAY_50,
    borderRadius: BORDER_RADIUS.ROUND,
    paddingHorizontal: SPACING.MD,
    height: 44,
  },
  searchInputActive: {
    backgroundColor: BG_COLORS.SECONDARY,
  },
  searchIcon: {
    marginRight: SPACING.SM,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: TEXT_COLORS.PRIMARY,
  },
  clearButton: {
    marginLeft: SPACING.SM,
    paddingHorizontal: SPACING.SM,
  },
  clearButtonText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },

  // non-active 상태
  noSearchContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noSearchText: {
    fontSize: TYPOGRAPHY.SIZE.LG,
    color: TEXT_COLORS.SECONDARY,
    fontWeight: TYPOGRAPHY.WEIGHT.REGULAR,
  },

  // 탭 스타일
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.MD,
    marginBottom: SPACING.SM,
  },
  tabItem: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    marginRight: SPACING.XS,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: COLORS.PRIMARY,
  },
  tabText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: TEXT_COLORS.SECONDARY,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
  tabTextActive: {
    color: COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
  },

  // 콘텐츠 영역
  contentContainer: {
    flex: 1,
  },

  // 로딩 및 에러 상태
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.XXL,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: TEXT_COLORS.SECONDARY,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.XXL,
    marginHorizontal: SPACING.MD,
  },
  errorText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: COLORS.ERROR,
    textAlign: 'center',
  },
});

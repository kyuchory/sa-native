import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { SearchIcon } from '../components/SearchIcons';
import PeopleTab from '../components/PeopleTab';
import FeedTab, { FeedItem } from '../components/FeedTab';
import PostTab from '../components/PostTab';
import { SearchService } from '../services/searchService';
import { UserSearchResult, PostSearchResult, FeedSearchResult } from '../types/search';
import { AuthStackParamList } from '../types/navigation';

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
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
  const { colors } = useThemeStore();
  const styles = createStyles(colors);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTabType>('people');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [postSearchResults, setPostSearchResults] = useState<PostSearchResult[]>([]);
  const [feedSearchResults, setFeedSearchResults] = useState<FeedSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Debounce 적용 (300ms)
  const debouncedSearchText = useDebounce(searchText, 300);

  // 실시간 검색 API 호출
  const performSearch = useCallback(async (query: string, tab?: SearchTabType) => {
    const targetTab = tab || activeTab;

    if (query.length < 2) {
      if (targetTab === 'people') {
        setSearchResults([]);
      } else if (targetTab === 'posts') {
        setPostSearchResults([]);
      } else if (targetTab === 'feeds') {
        setFeedSearchResults([]);
      }
      return;
    }

    try {
      setIsSearching(true);
      setSearchError(null);

      if (targetTab === 'people') {
        const response = await SearchService.searchUsersFirstPage(query);
        setSearchResults(response.users);
      } else if (targetTab === 'posts') {
        const response = await SearchService.searchPostsFirstPage(query);
        setPostSearchResults(response.posts);
      } else if (targetTab === 'feeds') {
        const response = await SearchService.searchFeedsFirstPage(query);
        setFeedSearchResults(response.feeds);
      }
    } catch (error) {
      console.error('검색 실패:', error);
      setSearchError('검색 중 오류가 발생했습니다.');
      if (targetTab === 'people') {
        setSearchResults([]);
      } else if (targetTab === 'posts') {
        setPostSearchResults([]);
      } else if (targetTab === 'feeds') {
        setFeedSearchResults([]);
      }
    } finally {
      setIsSearching(false);
    }
  }, [activeTab]);

  // Debounced 검색 실행
  useEffect(() => {
    if (debouncedSearchText) {
      performSearch(debouncedSearchText);
    } else {
      setSearchResults([]);
      setPostSearchResults([]);
      setFeedSearchResults([]);
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
    const prevTab = activeTab;
    setActiveTab(tab);

    // 게시물 또는 피드 탭으로 전환할 때 검색어에 따른 검색 실행
    if ((tab === 'posts' || tab === 'feeds') && searchText.trim()) {
      performSearch(searchText.trim(), tab);
    }
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
    if (activeTab === 'posts') {
      // PostDetailScreen으로 이동
      navigation.navigate('PostDetail', { postId: item.id });
    } else if (activeTab === 'feeds') {
      // FeedDetailScreen으로 이동
      navigation.navigate('FeedDetail', { feedId: item.id });
    } else if (activeTab === 'people') {
      // Профиль 화면으로 이동 (optional)
      console.log('People item pressed:', item);
    } else {
      console.log('Item pressed:', item);
    }
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
            <SearchIcon size={20} color={colors.GRAY_500} />
          </View>
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="검색"
            placeholderTextColor={colors.GRAY_500}
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
                    profile_img: user.profile_img,
                    is_following: user.is_following
                  }))}
                  onItemPress={handleItemPress}
                />
              )
            )}

            {activeTab === 'posts' && (
              isSearching ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>게시글 검색 중...</Text>
                </View>
              ) : searchError ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{searchError}</Text>
                </View>
              ) : (
                <PostTab data={postSearchResults} onItemPress={handleItemPress} />
              )
            )}

            {activeTab === 'feeds' && (
              isSearching ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>피드 검색 중...</Text>
                </View>
              ) : searchError ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{searchError}</Text>
                </View>
              ) : (
                <FeedTab
                  data={feedSearchResults
                    .filter(feed => feed.preview_image !== null)
                    .map(feed => ({
                      id: feed.id,
                      preview_image: feed.preview_image as string
                    }))}
                  onItemPress={handleItemPress}
                />
              )
            )}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

// 스타일 생성 함수
const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.GRAY_50, // BG_COLORS.PRIMARY
  },

  // 검색 Input 스타일
  searchContainer: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.GRAY_100, // COLORS.GRAY_50
    borderRadius: BORDER_RADIUS.ROUND,
    paddingHorizontal: SPACING.MD,
    height: 44,
  },
  searchInputActive: {
    backgroundColor: colors.WHITE, // BG_COLORS.SECONDARY
  },
  searchIcon: {
    marginRight: SPACING.SM,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_900, // TEXT_COLORS.PRIMARY
  },
  clearButton: {
    marginLeft: SPACING.SM,
    paddingHorizontal: SPACING.SM,
  },
  clearButtonText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.PRIMARY,
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
    color: colors.GRAY_700, // TEXT_COLORS.SECONDARY
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
    borderBottomColor: colors.PRIMARY,
  },
  tabText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_700, // TEXT_COLORS.SECONDARY
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
  tabTextActive: {
    color: colors.PRIMARY,
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
    color: colors.GRAY_700, // TEXT_COLORS.SECONDARY
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
    color: colors.ERROR,
    textAlign: 'center',
  },
});

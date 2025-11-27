import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SPACING } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import CommonHeader from '../components/CommonHeader';
import { SavedItemsTabNavigation, SavedItemsTabType } from '../components/ProfileTabNavigation';
import { SavedItemsFeedGrid, SavedItemsShortsGrid } from '../components/SavedItemsComponents';
import PostCard from '../components/PostCard';
import { FeedService } from '../services/feedService';
import { PostService } from '../services/postService';
import { CutService } from '../services/cutService';
import { BookmarkFeedListItem } from '../types/feed';
import { BookmarkPostListItem, PostListItem } from '../types/post';
import { BookmarkShortListItem } from '../types/cut';
import { AuthStackParamList } from '../types/navigation';

type SavedItemsNavigationProp = StackNavigationProp<AuthStackParamList, 'SavedItems'>;

export default function SavedItemsScreen() {
  const navigation = useNavigation<SavedItemsNavigationProp>();
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const initialLoadRef = useRef(false); // 초기 로드 방지 플래그
  const initialLoadingRef = useRef(false); // 초기 로딩 상태 추적
  const [activeTab, setActiveTab] = useState<SavedItemsTabType>('feeds');

  // Feeds data
  const [feedsData, setFeedsData] = useState<BookmarkFeedListItem[]>([]);
  const [feedsLoading, setFeedsLoading] = useState(false);
  const [feedsOffset, setFeedsOffset] = useState(0);
  const [hasMoreFeeds, setHasMoreFeeds] = useState(true);

  // Posts data
  const [postsData, setPostsData] = useState<BookmarkPostListItem[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsCursor, setPostsCursor] = useState<string | undefined>(undefined);
  const [hasMorePosts, setHasMorePosts] = useState(true);

  // Shorts data
  const [shortsData, setShortsData] = useState<BookmarkShortListItem[]>([]);
  const [shortsLoading, setShortsLoading] = useState(false);
  const [shortsCursor, setShortsCursor] = useState<string | undefined>(undefined);
  const [hasMoreShorts, setHasMoreShorts] = useState(true);

  // Load feeds bookmarks - Strict Mode 중복 호출 방지
  const loadFeedsBookmarks = useCallback(async (reset = false) => {
    if (feedsLoading) return; // 이미 로딩 중이면 중복 호출 방지

    try {
      setFeedsLoading(true);
      const offset = reset ? 0 : feedsOffset;

      const response = await FeedService.getBookmarkFeeds(offset, 20);

      if (reset) {
        setFeedsData(response.feeds);
        setFeedsOffset(20);
      } else {
        setFeedsData(prev => [...prev, ...response.feeds]);
        setFeedsOffset(prev => prev + response.feeds.length);
      }

      setHasMoreFeeds(response.pagination.has_next);
    } catch (error) {
      console.error('북마크 피드 로드 실패:', error);
    } finally {
      setFeedsLoading(false);
    }
  }, [feedsLoading, feedsOffset]);

  // Load posts bookmarks
  const loadPostsBookmarks = useCallback(async (reset = false) => {
    try {
      setPostsLoading(true);
      const response = await PostService.getBookmarkPosts(reset ? undefined : postsCursor, 20);

      if (reset) {
        setPostsData(response.items);
      } else {
        setPostsData(prev => [...prev, ...response.items]);
      }

      setPostsCursor(response.next_cursor || undefined);
      setHasMorePosts(!!response.next_cursor);
    } catch (error) {
      console.error('북마크 게시물 로드 실패:', error);
    } finally {
      setPostsLoading(false);
    }
  }, [postsCursor]);

  // Load shorts bookmarks
  const loadShortsBookmarks = useCallback(async (reset = false) => {
    try {
      setShortsLoading(true);
      const response = await CutService.getBookmarkShorts(reset ? undefined : shortsCursor, 20);

      if (reset) {
        setShortsData(response.items);
      } else {
        setShortsData(prev => [...prev, ...response.items]);
      }

      setShortsCursor(response.next_cursor || undefined);
      setHasMoreShorts(!!response.next_cursor);
    } catch (error) {
      console.error('북마크 쇼츠 로드 실패:', error);
    } finally {
      setShortsLoading(false);
    }
  }, [shortsCursor]);

  // Helper function to convert BookmarkPostListItem to PostListItem for PostCard
  const convertToPostListItem = useCallback((bookmarkPost: BookmarkPostListItem): PostListItem => {
    return {
      id: bookmarkPost.id,
      title: bookmarkPost.title,
      content: '북마크된 게시물입니다.', // 북마크 API에서 내용이 제공되지 않으므로 placeholder 사용
      created_at: bookmarkPost.created_at,
      user: bookmarkPost.user,
      sub_category: bookmarkPost.sub_category,
      like_count: bookmarkPost.like_count,
      comment_count: bookmarkPost.comment_count,
      bookmark_count: bookmarkPost.bookmark_count,
      preview_image: bookmarkPost.preview_image,
      is_liked: bookmarkPost.is_liked || false, // API에서 제공되는 실제 값 사용
      is_bookmarked: bookmarkPost.is_bookmarked || true, // API에서 제공되는 실제 값 사용
    };
  }, []);

  // Initial load - React Strict Mode에서 중복 호출 방지 + 타임아웃으로 안전하게 실행
  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;

    // 타임아웃으로 Strict Mode 더블 실행을 방지
    const timer = setTimeout(async () => {
      await Promise.all([
        loadFeedsBookmarks(true),
        loadPostsBookmarks(true),
        loadShortsBookmarks(true)
      ]);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const handleTabChange = (tab: SavedItemsTabType) => {
    setActiveTab(tab);
  };

  // Post handlers for PostCard
  const handlePostPress = useCallback((post: PostListItem) => {
    navigation.navigate('PostDetail', { postId: post.id });
  }, [navigation]);

  const handleCommentPress = useCallback((post: PostListItem) => {
    navigation.navigate('PostDetail', { postId: post.id });
  }, [navigation]);

  const handleAuthorPress = useCallback((post: PostListItem) => {
    navigation.navigate('UserProfile', { userId: String(post.user.id) });
  }, [navigation]);

  const renderPostItem = useCallback(({ item }: { item: BookmarkPostListItem }) => {
    const postListItem = convertToPostListItem(item);
    return (
      <PostCard
        post={postListItem}
        onPress={() => handlePostPress(postListItem)}
        onCommentPress={() => handleCommentPress(postListItem)}
        onAuthorPress={() => handleAuthorPress(postListItem)}
      />
    );
  }, [convertToPostListItem, handlePostPress, handleCommentPress, handleAuthorPress]);

  const renderContent = () => {
    switch (activeTab) {
      case 'feeds':
        return (
          <SavedItemsFeedGrid
            data={feedsData}
            loading={feedsLoading}
            onEndReached={() => loadFeedsBookmarks(false)}
            hasNext={hasMoreFeeds}
          />
        );
      case 'posts':
        return (
          <FlatList
            data={postsData}
            renderItem={renderPostItem}
            keyExtractor={(item) => item.id.toString()}
            onEndReached={hasMorePosts ? () => loadPostsBookmarks(false) : undefined}
            onEndReachedThreshold={0.5}
            style={styles.postList}
            contentContainerStyle={styles.postListContent}
            showsVerticalScrollIndicator={false}
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={5}
          />
        );
      case 'shorts':
        return (
          <SavedItemsShortsGrid
            data={shortsData}
            loading={shortsLoading}
            onEndReached={() => loadShortsBookmarks(false)}
            hasNext={hasMoreShorts}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <CommonHeader title="저장된 항목" showBackButton={true} />
      <SavedItemsTabNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>
    </View>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.GRAY_50,
  },
  contentContainer: {
    flex: 1,
  },
  postList: {
    flex: 1,
  },
  postListContent: {
    paddingVertical: SPACING.SM,
  },
});

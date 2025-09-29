import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Alert, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SPACING, TYPOGRAPHY } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import CommonHeader from '../components/CommonHeader';
import Pagination from '../components/Pagination';
import { Pagination as PaginationData } from '../types/post';
import { SupportService } from '../services/supportService';
import { InquiryListItem } from '../types/support';
import { handleApiError } from '../services/apiClient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreateFeedIcon } from '../components/CommonIcons';

// 유틸리티 함수들 (원래 supportMockData.ts에 있던 함수들)
const getCategoryText = (category?: string) => {
  switch (category) {
    case 'bug':
      return '버그 신고';
    case 'feature':
      return '기능 제안';
    case 'account':
      return '계정 관련';
    case 'payment':
      return '결제 관련';
    case 'etc':
      return '기타';
    default:
      return '미분류';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return '대기중';
    case 'in_progress':
      return '처리중';
    case 'resolved':
      return '해결됨';
    case 'closed':
      return '종료됨';
    default:
      return '알 수 없음';
  }
};

const getPriorityText = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return '긴급';
    case 'high':
      return '높음';
    case 'normal':
      return '보통';
    case 'low':
      return '낮음';
    default:
      return '알 수 없음';
  }
};

const getPriorityColor = (priority: string, colors: Record<string, string>) => {
  switch (priority) {
    case 'urgent':
      return colors.ERROR || '#ef4444';
    case 'high':
      return colors.WARNING || '#f59e0b';
    case 'normal':
      return colors.PRIMARY || '#3b82f6';
    case 'low':
      return colors.GRAY_500 || '#6b7280';
    default:
      return colors.GRAY_500 || '#6b7280';
  }
};

export default function SupportListScreen() {
  const navigation = useNavigation();
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  // 상태 관리
  const [inquiries, setInquiries] = useState<InquiryListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  // 필터 상태
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  // 초기 데이터 로드
  useEffect(() => {
    loadInquiries();
  }, [currentPage, statusFilter, priorityFilter, categoryFilter]);

  // 문의 목록 로드
  const loadInquiries = async () => {
    try {
      setLoading(true);

      const response = await SupportService.getInquiries({
        page: currentPage,
        limit: 10,
        status: statusFilter as any || undefined,
        priority: priorityFilter as any || undefined,
        category: categoryFilter || undefined,
      });

      setInquiries(response.inquiries);
      setTotalPages(response.pagination.total_pages);
      setTotalCount(response.pagination.total);
      setHasNext(response.pagination.has_next);
      setHasPrev(response.pagination.has_prev);
    } catch (error) {
      console.error('문의 목록 로드 실패:', error);
      const errorMessage = handleApiError(error);
      Alert.alert('오류', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 문의 아이템 클릭 핸들러
  const handleInquiryPress = (inquiry: InquiryListItem) => {
    (navigation as any).navigate('SupportDetail', { inquiryId: inquiry.id });
  };

  // 문의 작성 화면으로 이동
  const handleCreatePress = () => {
    navigation.navigate('SupportCreate' as never);
  };

  // 문의 카드 렌더링
  const renderInquiryItem = ({ item }: { item: InquiryListItem }) => (
    <TouchableOpacity
      style={styles.inquiryCard}
      onPress={() => handleInquiryPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <View style={styles.titleContainer}>
            <View style={styles.titleTextContainer}>
              <Text style={styles.titleText} numberOfLines={1}>
                {item.title}
              </Text>
              {item.category && (
                <Text style={styles.categoryText}>
                  {getCategoryText(item.category)}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.priorityBadge}>
            <Text style={[styles.priorityText, { color: getPriorityColor(item.priority, colors) }]}>
              {getPriorityText(item.priority)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.footerInfo}>
          <Text style={styles.statusText}>
            {getStatusText(item.status)}
          </Text>
          {item.attachment_count > 0 && (
            <Text style={styles.attachmentText}>
              📎 {item.attachment_count}
            </Text>
          )}
        </View>
        <Text style={styles.dateText}>
          {new Date(item.created_at).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // 빈 상태 렌더링
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>문의 내역이 없습니다</Text>
      <Text style={styles.emptySubtitle}>
        문제가 있거나 개선하고 싶은 점이 있으시면{'\n'}
        언제든 문의를 남겨주세요.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <CommonHeader
        title="문의내역"
        rightComponent={
          <TouchableOpacity
            onPress={handleCreatePress}
            activeOpacity={0.7}
            style={styles.headerIcon}
          >
            <CreateFeedIcon size={24} color={colors.GRAY_700} />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={inquiries}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderInquiryItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <View style={styles.paginationContainer}>
          <Pagination
            pagination={{
              page: currentPage,
              limit: 10,
              total: totalCount,
              total_pages: totalPages,
              has_next: hasNext,
              has_prev: hasPrev
            }}
            onPageChange={handlePageChange}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.GRAY_50,
  },
  listContainer: {
    padding: SPACING.MD,
    paddingBottom: SPACING.XL,
  },
  inquiryCard: {
    backgroundColor: colors.WHITE,
    borderRadius: SPACING.MD,
    padding: SPACING.MD,
    marginBottom: SPACING.MD,
    shadowColor: colors.GRAY_900,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    marginBottom: SPACING.SM,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginRight: SPACING.SM,
  },
  statusBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: SPACING.SM,
  },
  titleTextContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900,
    lineHeight: 20,
  },
  categoryText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_600,
    marginTop: 2,
  },
  priorityBadge: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: SPACING.XS,
    backgroundColor: colors.GRAY_100,
  },
  priorityText: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_700,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
  attachmentText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_600,
    marginLeft: SPACING.SM,
  },
  dateText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_500,
  },
  paginationContainer: {
    backgroundColor: colors.GRAY_50,
    borderTopWidth: 1,
    borderTopColor: colors.GRAY_100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.XL * 2,
    paddingHorizontal: SPACING.LG,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.SIZE.LG,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_700,
    textAlign: 'center',
    marginBottom: SPACING.SM,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_500,
    textAlign: 'center',
    lineHeight: 24,
  },
  headerIcon: {
    padding: SPACING.XS,
    marginRight: SPACING.XS,
  },
});

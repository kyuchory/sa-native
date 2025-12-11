// 인기 콘텐츠 서비스
import { apiClient } from './apiClient';
import type { PopularApiResponse, PopularData, PopularPostsData, PopularPostsResponse } from '../types/popular';

/**
 * 인기 게시물을 페이징하여 조회합니다.
 * 메인 화면의 인기 게시물 섹션에서 더 자세한 조회가 필요한 경우에 사용합니다.
 *
 * @param page - 페이지 번호 (기본값: 1)
 * @param limit - 한 페이지당 항목 수 (기본값: 10, 범위: 1-20)
 * @returns Promise<PopularPostsData>
 */
export async function getPopularPosts(page: number = 1, limit: number = 10): Promise<PopularPostsData> {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());

    const endpoint = `/popular/posts?${queryParams.toString()}`;
    const response = await apiClient.get<PopularPostsResponse>(endpoint);
    return response.data!;
  } catch (error) {
    console.error('인기 게시물 조회 실패:', error);
    throw error;
  }
}

/**
 * 인기 콘텐츠를 조회합니다.
 * 게시물, 쇼츠, 사용자, 피드의 인기 항목들을 종합적으로 반환합니다.
 *
 * @returns Promise<PopularData>
 */
export async function getPopular(): Promise<PopularData> {
  try {
    const response = await apiClient.get<PopularApiResponse>('/popular');
    return response.data;
  } catch (error) {
    console.error('인기 콘텐츠 조회 실패:', error);
    throw error;
  }
}

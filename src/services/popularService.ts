// 인기 콘텐츠 서비스
import { apiClient } from './apiClient';
import type { PopularApiResponse, PopularData } from '../types/popular';

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

import { apiClient } from './apiClient';
import {
  UserSearchParams,
  UserSearchApiResponse,
  UserSearchResponse,
  UserSearchResult,
  PostSearchParams,
  PostSearchResponse,
  PostSearchApiResponse,
  SearchPagination
} from '../types/search';

// 검색 관련 API 서비스
export class SearchService {
  // 사용자 검색
  static async searchUsers(params: UserSearchParams): Promise<UserSearchResponse> {
    try {
      // 쿼리 파라미터 구성
      const queryParams = new URLSearchParams();
      queryParams.append('nickname', params.nickname);

      if (params.offset !== undefined) {
        queryParams.append('offset', params.offset.toString());
      }
      if (params.limit !== undefined) {
        queryParams.append('limit', params.limit.toString());
      }

      const response = await apiClient.get<UserSearchApiResponse>(
        `/search/users?${queryParams.toString()}`
      );

      return response.data!;
    } catch (error) {
      console.error('사용자 검색 실패:', error);
      throw error;
    }
  }

  // 사용자 검색 - 편의 메소드 (기본 파라미터 사용)
  static async searchUsersByNickname(
    nickname: string,
    offset?: number,
    limit?: number
  ): Promise<UserSearchResponse> {
    return this.searchUsers({
      nickname,
      offset,
      limit
    });
  }

  // 사용자 검색 - 첫 페이지 조회
  static async searchUsersFirstPage(nickname: string): Promise<UserSearchResponse> {
    return this.searchUsers({
      nickname,
      offset: 0,
      limit: 20
    });
  }

  // 사용자 검색 결과 아이템만 반환
  static async getUserSearchResult(nickname: string): Promise<UserSearchResult[]> {
    const response = await this.searchUsers({ nickname });
    return response.users;
  }

  // 게시글 검색
  static async searchPosts(params: PostSearchParams): Promise<PostSearchResponse> {
    try {
      // 쿼리 파라미터 구성
      const queryParams = new URLSearchParams();
      queryParams.append('q', params.q);

      if (params.offset !== undefined) {
        queryParams.append('offset', params.offset.toString());
      }
      if (params.limit !== undefined) {
        queryParams.append('limit', params.limit.toString());
      }

      const response = await apiClient.get<PostSearchApiResponse>(
        `/search/posts?${queryParams.toString()}`
      );

      return response.data!;
    } catch (error) {
      console.error('게시글 검색 실패:', error);
      throw error;
    }
  }

  // 게시글 검색 - 편의 메소드 (기본 파라미터 사용)
  static async searchPostsByQuery(
    query: string,
    offset?: number,
    limit?: number
  ): Promise<PostSearchResponse> {
    return this.searchPosts({
      q: query,
      offset,
      limit
    });
  }

  // 게시글 검색 - 첫 페이지 조회
  static async searchPostsFirstPage(query: string): Promise<PostSearchResponse> {
    return this.searchPosts({
      q: query,
      offset: 0,
      limit: 20
    });
  }
}

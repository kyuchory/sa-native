import { apiClient } from './apiClient';
import {
  BlockUserRequest,
  BlockUserApiResponse,
  BlockUserResponse,
  BlockedUsersListResponse,
  BlockedUsersListApiResponse,
  UnblockUserResponse,
  UnblockUserApiResponse
} from '../types/block';

// 사용자 차단 관련 API 서비스
export class BlockService {
  // 사용자 차단
  static async blockUser(blockedId: number): Promise<BlockUserResponse> {
    try {
      const requestData: BlockUserRequest = {
        blocked_id: blockedId
      };

      const response = await apiClient.post<BlockUserApiResponse>(
        '/api/block',
        requestData
      );
      
      return response.data!;
    } catch (error) {
      console.error('사용자 차단 실패:', error);
      throw error;
    }
  }

  // 차단한 사용자 목록 조회
  static async getBlockedUsers(
    page: number = 1,
    limit: number = 20
  ): Promise<BlockedUsersListResponse> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());

      const response = await apiClient.get<BlockedUsersListApiResponse>(
        `/api/block?${queryParams.toString()}`
      );
      
      return response.data!;
    } catch (error) {
      console.error('차단한 사용자 목록 조회 실패:', error);
      throw error;
    }
  }

  // 사용자 차단 해제
  static async unblockUser(blockedId: number): Promise<UnblockUserResponse> {
    try {
      const response = await apiClient.delete<UnblockUserApiResponse>(
        `/api/block/${blockedId}`
      );
      
      return response.data!;
    } catch (error) {
      console.error('사용자 차단 해제 실패:', error);
      throw error;
    }
  }
}

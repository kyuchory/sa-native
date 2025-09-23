import { apiClient } from './apiClient';
import {
  BlockUserRequest,
  BlockUserApiResponse,
  BlockUserResponse
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
}

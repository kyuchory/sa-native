import { apiClient } from './apiClient';
import type {
  CreateReportRequest,
  CreateReportResponse,
  ApiResponse,
} from '../types/report';

// 신고 관련 API 서비스
export class ReportService {
  // 신고 생성
  static async createReport(reportData: CreateReportRequest): Promise<CreateReportResponse> {
    try {
      const response = await apiClient.post<ApiResponse<CreateReportResponse>>(
        '/reports',
        reportData
      );

      if (!response.data) {
        throw new Error('신고 생성 응답 데이터가 없습니다.');
      }

      return response.data;
    } catch (error) {
      console.error('신고 생성 실패:', error);
      throw error;
    }
  }
}

import { apiClient } from './apiClient';
import {
  CreateInquiryRequest,
  CreateInquiryApiResponse,
  CreateInquiryResponse,
  GetInquiriesRequest,
  GetInquiriesResponse,
  GetInquiriesApiResponse,
  GetInquiryDetailResponse,
  GetInquiryDetailApiResponse,
  UpdateInquiryRequest,
  UpdateInquiryResponse,
  UpdateInquiryApiResponse,
  DeleteInquiryResponse,
  DeleteInquiryApiResponse
} from '../types/support';

// 고객센터 문의 관련 API 서비스
export class SupportService {
  // 문의 작성
  static async createInquiry(
    inquiryData: CreateInquiryRequest,
    images?: File[]
  ): Promise<CreateInquiryResponse> {
    try {
      const formData = new FormData();

      // 기본 데이터 추가
      formData.append('title', inquiryData.title);
      formData.append('content', inquiryData.content);

      if (inquiryData.category) {
        formData.append('category', inquiryData.category);
      }

      if (inquiryData.priority) {
        formData.append('priority', inquiryData.priority);
      }

      // 이미지 파일들 추가
      if (images && images.length > 0) {
        images.forEach((image, index) => {
          formData.append('images', image);
        });
      }

      const response = await apiClient.postFormData<CreateInquiryApiResponse>(
        '/support/inquiries',
        formData
      );

      return response.data!;
    } catch (error) {
      console.error('문의 작성 실패:', error);
      throw error;
    }
  }

  // 문의 목록 조회
  static async getInquiries(
    params: GetInquiriesRequest = {}
  ): Promise<GetInquiriesResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (params.page !== undefined) {
        queryParams.append('page', params.page.toString());
      }
      if (params.limit !== undefined) {
        queryParams.append('limit', params.limit.toString());
      }
      if (params.status) {
        queryParams.append('status', params.status);
      }
      if (params.priority) {
        queryParams.append('priority', params.priority);
      }
      if (params.category) {
        queryParams.append('category', params.category);
      }

      const queryString = queryParams.toString();
      const url = `/support/inquiries${queryString ? `?${queryString}` : ''}`;

      const response = await apiClient.get<GetInquiriesApiResponse>(url);

      return response.data!;
    } catch (error) {
      console.error('문의 목록 조회 실패:', error);
      throw error;
    }
  }

  // 문의 상세 조회
  static async getInquiryDetail(inquiryId: number): Promise<GetInquiryDetailResponse> {
    try {
      const response = await apiClient.get<GetInquiryDetailApiResponse>(
        `/support/inquiries/${inquiryId}`
      );

      return response.data!;
    } catch (error) {
      console.error('문의 상세 조회 실패:', error);
      throw error;
    }
  }

  // 문의 수정
  static async updateInquiry(
    inquiryId: number,
    updateData: UpdateInquiryRequest
  ): Promise<UpdateInquiryResponse> {
    try {
      const response = await apiClient.put<UpdateInquiryApiResponse>(
        `/support/inquiries/${inquiryId}`,
        updateData
      );

      return response.data!;
    } catch (error) {
      console.error('문의 수정 실패:', error);
      throw error;
    }
  }

  // 문의 삭제
  static async deleteInquiry(inquiryId: number): Promise<DeleteInquiryResponse> {
    try {
      const response = await apiClient.delete<DeleteInquiryApiResponse>(
        `/support/inquiries/${inquiryId}`
      );

      return response.data!;
    } catch (error) {
      console.error('문의 삭제 실패:', error);
      throw error;
    }
  }
}

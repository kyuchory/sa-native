import { apiClient } from './apiClient';
import type { 
  CreatePostRequest, 
  CreatePostResponse, 
  CategoriesResponse, 
  Category 
} from '../types/post';
import type { ApiResponse } from '../types/api';

export class PostService {
  // 카테고리 목록 조회
  static async getCategories(): Promise<Category[]> {
    try {
      const response = await apiClient.get<ApiResponse<Category[]>>('/categories');
      return response.data || [];
    } catch (error) {
      console.error('카테고리 조회 실패:', error);
      throw error;
    }
  }

  // 게시물 작성
  static async createPost(postData: CreatePostRequest): Promise<CreatePostResponse> {
    try {
      const response = await apiClient.post<ApiResponse<CreatePostResponse>>('/posts', postData);
      return response.data!;
    } catch (error) {
      console.error('게시물 작성 실패:', error);
      throw error;
    }
  }

  // 이미지 업로드 (임시 - 추후 구현)
  static async uploadImage(imageUri: string): Promise<string> {
    try {
      // TODO: 실제 이미지 업로드 구현
      // FormData를 사용하여 이미지 업로드
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'image.jpg',
      } as any);

      const response = await apiClient.post<ApiResponse<{ imageUrl: string }>>('/upload/image', formData);

      return response.data?.imageUrl || '';
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      throw error;
    }
  }

  // 비디오 업로드 (임시 - 추후 구현)
  static async uploadVideo(videoUri: string): Promise<string> {
    try {
      // TODO: 실제 비디오 업로드 구현
      const formData = new FormData();
      formData.append('video', {
        uri: videoUri,
        type: 'video/mp4',
        name: 'video.mp4',
      } as any);

      const response = await apiClient.post<ApiResponse<{ videoUrl: string }>>('/upload/video', formData);

      return response.data?.videoUrl || '';
    } catch (error) {
      console.error('비디오 업로드 실패:', error);
      throw error;
    }
  }
}

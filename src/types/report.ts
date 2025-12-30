// 신고 API 관련 타입 정의

// 신고 카테고리 enum - API 스펙과 일치
export enum ReportCategory {
  SPAM = 'spam',
  ABUSE = 'abuse',
  NUDITY = 'nudity',
  FRAUD = 'fraud',
  COPYRIGHT = 'copyright',
  HARASSMENT = 'harassment',
  HATE_SPEECH = 'hate_speech',
  OTHER = 'other',
}

// 신고 카테고리 라벨 (한국어)
export const REPORT_CATEGORY_LABELS: Record<ReportCategory, string> = {
  [ReportCategory.SPAM]: '스팸/광고',
  [ReportCategory.ABUSE]: '욕설/비방',
  [ReportCategory.NUDITY]: '음란물/선정적 콘텐츠',
  [ReportCategory.FRAUD]: '사기/기만',
  [ReportCategory.COPYRIGHT]: '저작권 침해',
  [ReportCategory.HARASSMENT]: '괴롭힘/스토킹',
  [ReportCategory.HATE_SPEECH]: '혐오 발언',
  [ReportCategory.OTHER]: '기타',
};

// 신고 대상 타입 enum - API 스펙과 일치
export enum ReportTargetType {
  POST = 'post',
  FEED_POST = 'feed_post',
  COMMENT = 'comment',
  FEED_COMMENT = 'feed_comment',
  SHORT = 'short',
  SHORT_COMMENT = 'short_comment',
  USER = 'user',
  CHAT_ROOM = 'chat_room',
  MESSAGE = 'message',
  STORY = 'story',
}

// 신고 처리 상태 enum - API 스펙과 일치
export enum ReportStatus {
  PENDING = 'pending',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

// 신고 생성 요청 인터페이스
export interface CreateReportRequest {
  target_type: ReportTargetType;
  target_id: number;
  category: ReportCategory;
  reason?: string; // 선택적 필드
}

// 신고 생성 응답 인터페이스
export interface CreateReportResponse {
  id: number;
  reporter_id: number;
  reporter_nickname: string;
  target_type: ReportTargetType;
  target_id: number;
  category: ReportCategory;
  reason?: string;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
}

// 신고 목록 조회 응답 (관리자용 - 향후 확장 가능)
export interface ReportListResponse {
  reports: ReportItem[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_count: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// 신고 상세 정보 (관리자용 - 향후 확장 가능)
export interface ReportItem {
  id: number;
  reporter_id: number;
  reporter_nickname: string;
  target_type: ReportTargetType;
  target_id: number;
  category: ReportCategory;
  reason?: string;
  status: ReportStatus;
  admin_id?: number;
  admin_note?: string;
  resolved_at?: string;
  target_snapshot?: any; // JSON 타입
  created_at: string;
  updated_at: string;
}

// 신고 처리 요청 (관리자용 - 향후 확장 가능)
export interface UpdateReportRequest {
  status: ReportStatus;
  admin_note?: string;
}

// 신고 처리 응답 (관리자용 - 향후 확장 가능)
export interface UpdateReportResponse {
  id: number;
  status: ReportStatus;
  admin_id: number;
  admin_note?: string;
  resolved_at: string;
  updated_at: string;
}

// API 응답 래퍼 타입
export interface ApiResponse<T> {
  code: number;
  message: string;
  data?: T;
}

// 신고 생성 시 사용할 폼 데이터 타입
export interface ReportFormData {
  targetType: ReportTargetType;
  targetId: number;
  category: ReportCategory;
  reason: string;
}

// 신고 모달 Props 타입
export interface ReportModalProps {
  visible: boolean;
  targetType: ReportTargetType;
  targetId: number;
  onSubmit: (data: ReportFormData) => Promise<void>;
  onClose: () => void;
}

// 신고 API 에러 타입
export interface ReportApiError {
  code: number;
  message: string;
  details?: {
    field: string;
    message: string;
  }[];
}

// 유틸리티 타입들
export type ReportCategoryKey = keyof typeof ReportCategory;
export type ReportTargetTypeKey = keyof typeof ReportTargetType;
export type ReportStatusKey = keyof typeof ReportStatus;

// 신고 가능 여부 확인을 위한 타입
export interface ReportableItem {
  id: number;
  type: ReportTargetType;
  canReport: boolean;
  reason?: string; // 신고 불가능한 이유
}

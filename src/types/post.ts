// 게시물 작성 관련 타입 정의

// 콘텐츠 블록 타입
export type ContentBlockType = 'text' | 'image' | 'video';

// 콘텐츠 블록 인터페이스
export interface ContentBlock {
  id: string; // 클라이언트 사이드에서 관리용 ID
  type: ContentBlockType;
  value: string;
  sequence: number;
}

// 게시물 타입
export type PostType = 'normal' | 'item_showcase';

// 아이템 옵션 (게임 아이템 스탯)
export interface ItemOption {
  [key: string]: string; // 예: { "str": "+150", "luk": "+150", "boss_damage": "+30%" }
}

// 아이템 정보
export interface ItemInfo {
  item_slot: string;
  item_name: string;
  item_icon_url: string;
  option_json: ItemOption;
}

// 아이템 스냅샷 (프리셋)
export interface ItemSnapshot {
  preset_no: number;
  items: ItemInfo[];
}

// 카테고리 정보
export interface Category {
  id: number;
  name: string;
  subCategories: SubCategory[];
}

export interface SubCategory {
  id: number;
  name: string;
}

// 게시물 작성 요청 데이터
export interface CreatePostRequest {
  title: string;
  sub_category_id: number;
  post_type: PostType;
  content_blocks: Omit<ContentBlock, 'id'>[]; // 서버에는 id 제외하고 전송
  tags?: string[];
  item_snapshots?: ItemSnapshot[];
}

// 게시물 작성 응답 데이터
export interface CreatePostResponse {
  postId: number;
}

// 카테고리 조회 응답 데이터  
export interface CategoriesResponse {
  categories: Category[];
}

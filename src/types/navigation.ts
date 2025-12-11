// 인증 관련 네비게이션 타입
export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  MainApp: undefined;
  CreatePost: undefined;
  CreateFeed: undefined;
  PostDetail: { postId: number };
  EditPost: { postId: number };
  FeedDetail: { feedId: number };
  EditFeed: { feedId: number };
  UserProfile: { userId?: string };
  ProfileEdit: undefined;
  NicknameEdit: undefined;
  BioEdit: undefined;
  ProfileImageEdit: {
    currentImageUrl: string | null;
    nickname: string;
  };
  Settings: undefined;
  Notifications: undefined;
  Chat: undefined;
  SelectChatUser: {
    mode?: 'create' | 'invite';
    chatRoomId?: number;
    excludeUserIds?: number[];
  };
  ChatDetail: {
    chatRoomId: number;
    chatRoomName: string;
    chatPartnerId?: number;
    unreadCount?: number;  // 옵셔널로 변경
    isVideoEditResult?: boolean;
    videoUri?: string;
    trimStart?: number;
    trimEnd?: number;
  };
  ChatRoomMedia: {
    chatRoomId: number;
    chatRoomName: string;
  };
  BlockedUsers: undefined;
  ProfileVisibility: undefined;
  ThemeModeSettings: undefined;
  VideoAutoPlaySettings: undefined;
  SupportList: undefined;
  NotificationSettings: undefined;
  SupportCreate: undefined;
  SupportDetail: { inquiryId: number };
  FollowRequests: undefined;
  FollowList: { userId: number; initialTab: 'followers' | 'following' };
  DailyCutAdd: undefined;
  DailyCutDetail: { storyId: number; isMyStory?: boolean };
  CanvasEditor: {
    imageUri?: string;
  };
  MediaTest: undefined;
  VideoTrimCrop: {
    videoUri?: string;
    videoDuration?: number;
    aspectRatio?: string;
    uploadService?: string;
    editMode?: 'both' | 'crop' | 'trim';
    maxDuration?: number;
    chatRoomId?: number;
  };
  CutUploadSelect: undefined;
  CutUploadFinalize: {
    videoUri: string;
    trimStart: number;
    trimEnd: number;
    cropArea: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    thumbnailUri?: string;
  };
  CutDetail: { shortId: number };
  CutPreview: {
    videoUri: string;
    trimStart: number;
    trimEnd: number;
    cropArea: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    thumbnailUri?: string;
    description: string;
    selectedCategories: { id: number; name: string }[];
  };
  SavedItems: undefined;
  PopularPosts: undefined;
};

export type TabParamList = {
  HomeTab: undefined;
  FeedTab: undefined;
  SearchTab: undefined;
  CutTab: undefined;
  ProfileTab: undefined;
};

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
  SelectChatUser: undefined;
  ChatDetail: {
    chatRoomId: number;
    chatRoomName: string;
    chatPartnerId?: number;
  };
};

export type TabParamList = {
  HomeTab: undefined;
  FeedTab: undefined;
  SearchTab: undefined;
  CutTab: undefined;
  ProfileTab: { userId?: string };
};

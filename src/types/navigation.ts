// 인증 관련 네비게이션 타입
export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  MainApp: undefined;
  CreatePost: undefined;
  PostDetail: { postId: number };
  Profile: { userId: string };
  Settings: undefined;
  Chat: undefined;
  SelectChatUser: undefined;
};

export type TabParamList = {
  HomeTab: undefined;
  FeedTab: undefined;
  SearchTab: undefined;
  CutTab: undefined;
  ProfileTab: undefined;
};

import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp } from '@react-navigation/native';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { MediaIcon, NoticeIcon, MembersIcon, ChevronRightIcon, EditIcon, LeaveIcon } from './SidebarIcons';
import { ChatRoomMember, ChatRoomNotice, ChatRoomMedia, ChatRoomDetail } from '../types/chat';
import { AuthStackParamList } from '../types/navigation';
import { ChatService } from '../services/chatService';
import GroupChatNameInputModal from './GroupChatNameInputModal';
import ChatRoomImageEditModal from './ChatRoomImageEditModal';
import { ImageViewerModal } from './ImageViewerModal';
import CustomAlertModal from './CustomAlertModal';

// UI 컴포넌트용 내부 인터페이스들
interface ChatMember {
  id: number;
  nickname: string;
  avatar_url?: string;
  isOnline: boolean;
}

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  date: string;
}

interface NoticeItem {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
}

interface ChatDetailSidebarProps {
  isVisible: boolean;
  onClose: () => void;
  chatRoomName: string;
  chatRoomId: number;
  onAddMember: () => void;
  onViewAllMedia: () => void;
  onViewNotice: (notice: NoticeItem) => void;
  onEditChatName?: () => void;
  onChatNameUpdate?: (newName: string) => void;
  navigation: NavigationProp<AuthStackParamList>;
}

const { width: screenWidth } = Dimensions.get('window');

const ChatDetailSidebar: React.FC<ChatDetailSidebarProps> = ({
  isVisible,
  onClose,
  chatRoomName: initialChatRoomName,
  chatRoomId,
  onAddMember,
  onViewAllMedia,
  onViewNotice,
  onEditChatName,
  onChatNameUpdate,
  navigation,
}) => {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const slideAnim = useRef(new Animated.Value(screenWidth * 0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // 로컬 상태 - 사이드바에서 직접 관리
  const [chatRoomDetail, setChatRoomDetail] = React.useState<ChatRoomDetail | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [localChatRoomName, setLocalChatRoomName] = React.useState(initialChatRoomName);
  const [previousChatRoomName, setPreviousChatRoomName] = React.useState(initialChatRoomName);
  const [isEditChatNameModalVisible, setIsEditChatNameModalVisible] = React.useState(false);
  const [isImageEditModalVisible, setIsImageEditModalVisible] = React.useState(false);
  const [isImageViewerVisible, setIsImageViewerVisible] = React.useState(false);
  const [imageViewerInitialIndex, setImageViewerInitialIndex] = React.useState(0);
  const [alertModal, setAlertModal] = React.useState<null | {visible: boolean, title: string, message: string, buttons: any[]}>(null);

  // API 데이터를 UI 데이터로 변환
  const {
    members,
    sharedMedia,
    notices,
  } = useMemo(() => {
    if (!chatRoomDetail) {
      // 빈 데이터 (실제 사용 시 mock 데이터로 교체 가능)
      return {
        members: [],
        sharedMedia: [],
        notices: [],
      };
    }

    const members: ChatMember[] = chatRoomDetail.members.map(member => ({
      id: member.user.id,
      nickname: member.user.nickname,
      avatar_url: member.user.profile_img || undefined,
      isOnline: true, // 실제 온라인 상태 확인 로직 추가 필요
    }));

    const sharedMedia: MediaItem[] = chatRoomDetail.chat_room_images_videos
      .slice()
      .reverse() // 최신 순으로 정렬
      .map(media => {
        let thumbnailUrl = '';
        if (media.type === 'video') {
          try {
            const videoData = JSON.parse(media.content);
            thumbnailUrl = videoData.thumbnail_url || '';
          } catch (error) {
            console.error('비디오 content 파싱 실패:', error);
            thumbnailUrl = '';
          }
        }

        return {
          id: media.message_id.toString(),
          type: media.type,
          url: media.content,
          thumbnail: thumbnailUrl,
          date: media.created_at.split('T')[0], // 날짜만 표시
        };
      });

    const notices: NoticeItem[] = chatRoomDetail.latest_notices
      .slice()
      .reverse() // 최신 순으로 정렬
      .map(notice => ({
        id: notice.notice_id.toString(),
        title: '공지사항',
        content: notice.content,
        date: notice.created_at.split('T')[0], // 날짜만 표시
        author: notice.user_nickname,
      }));

    return { members, sharedMedia, notices };
  }, [chatRoomDetail]);

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();

      // 사이드바가 열릴 때 API 호출
      const loadChatRoomDetail = async () => {
        try {
          setLoading(true);
          const detail = await ChatService.getChatRoomDetail(chatRoomId);
          console.log('📝 사이드바 채팅방 상세 정보 로드 중:', detail);
          setChatRoomDetail(detail);

          // API 응답의 name을 우선적으로 사용
          if (detail.name) {
            setLocalChatRoomName(detail.name);
          }

          console.log('📝 사이드바에서 채팅방 상세 정보 로드 완료:', {
            members: detail.members.length,
            notices: detail.latest_notices.length,
            media: detail.chat_room_images_videos.length,
          });
        } catch (error) {
          console.error('사이드바 채팅방 상세 정보 로드 실패:', error);
        } finally {
          setLoading(false);
        }
      };

      loadChatRoomDetail();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: screenWidth * 0.8, duration: 250, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [isVisible, chatRoomId, slideAnim, opacityAnim, screenWidth]);

  const renderMemberItem = (member: ChatMember) => (
    <TouchableOpacity
      key={member.id}
      style={styles.memberItem}
      onPress={() => navigation.navigate('UserProfile', { userId: member.id.toString() })}
    >
      <View style={styles.memberAvatarContainer}>
        {member.avatar_url ? (
          <Image source={{ uri: member.avatar_url }} style={styles.memberAvatar} contentFit="cover" cachePolicy={'memory-disk'} transition={200}/>
        ) : (
          <View style={styles.memberAvatarPlaceholder}>
            <Text style={styles.memberAvatarText}>
              {member.nickname.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        {member.isOnline && <View style={styles.onlineIndicator} />}
      </View>
      <Text style={styles.memberName} numberOfLines={1}>
        {member.nickname}
      </Text>
    </TouchableOpacity>
  );

  const renderMediaItem = (item: MediaItem, index: number) => (
    <TouchableOpacity
      key={item.id}
      style={styles.mediaItem}
      onPress={() => {
        setImageViewerInitialIndex(index);
        setIsImageViewerVisible(true);
      }}
    >
      <Image source={{ uri: item.thumbnail || item.url }} style={styles.mediaThumbnail} contentFit="cover" cachePolicy={'memory-disk'} transition={200}/>
      {item.type === 'video' && (
        <View style={styles.videoOverlay}>
          <Text style={styles.videoIcon}>▶</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderNoticeItem = (notice: NoticeItem) => (
    <TouchableOpacity
      key={notice.id}
      style={styles.noticeItem}
      onPress={() => onViewNotice(notice)}
    >
      <View style={styles.noticeContent}>
        <Text style={styles.noticeTitle} numberOfLines={1}>
          {notice.title}
        </Text>
        <Text style={styles.noticePreview} numberOfLines={2}>
          {notice.content}
        </Text>
        <View style={styles.noticeFooter}>
          <Text style={styles.noticeAuthor}>{notice.author}</Text>
          <Text style={styles.noticeDate}>{notice.date}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // 채팅방 이름 수정 핸들러 (낙관적 업데이트)
  const handleChatNameUpdate = async (newName: string) => {
    // 이전 이름 저장 (롤백용)
    setPreviousChatRoomName(localChatRoomName);

    // 낙관적 업데이트 - 즉시 UI 반영
    setLocalChatRoomName(newName);

    try {
      // API 호출
      await ChatService.updateChatRoom(chatRoomId, { name: newName });

      // 성공 시 부모 컴포넌트에도 알림
      onChatNameUpdate?.(newName);

      // 모달 닫기
      setIsEditChatNameModalVisible(false);

      console.log('✅ 채팅방 이름 수정 성공:', newName);
    } catch (error) {
      // 실패 시 롤백
      setLocalChatRoomName(previousChatRoomName);

      console.error('❌ 채팅방 이름 수정 실패:', error);
      // 여기서는 에러 처리를 하지 않고, 모달에서 처리하도록 함
    }
  };

  // 채팅방 아바타 터치 핸들러
  const handleChatRoomAvatarPress = () => {
    setIsImageEditModalVisible(true);
  };

  // 채팅방 이미지 업데이트 핸들러
  const handleImageUpdate = (newImageUrl: string) => {
    // chatRoomDetail 상태 업데이트
    if (chatRoomDetail) {
      setChatRoomDetail({
        ...chatRoomDetail,
        avatar_url: newImageUrl,
      });
    }
  };

  // 채팅방 나가기 핸들러
  const handleLeaveChatRoom = () => {
    setAlertModal({
      visible: true,
      title: '채팅방 나가기',
      message: '정말로 이 채팅방을 나가시겠습니까?',
      buttons: [
        { text: '취소', onPress: () => setAlertModal(null), style: 'cancel' },
        { text: '나가기', onPress: () => handleConfirmLeave(), style: 'destructive' },
      ],
    });
  };

  // 채팅방 나가기 확인
  const handleConfirmLeave = async () => {
    setAlertModal(null);
    try {
      await ChatService.leaveChatRoom(chatRoomId);
      // 사이드바 닫기
      onClose();
      // 채팅방 목록으로 돌아가기
      navigation.goBack();
    } catch (error) {
      console.error('❌ 채팅방 나가기 실패:', error);
      setAlertModal({
        visible: true,
        title: '오류',
        message: '채팅방을 나가는 중 오류가 발생했습니다.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }],
      });
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="none"
      presentationStyle="overFullScreen"
      transparent={true}
      onRequestClose={onClose}
      style={{ zIndex: 1000 }}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.backdrop,
            { opacity: opacityAnim },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.sidebarContainer,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>

              {/* 헤더 */}
              <View style={styles.header}>
                {/* 채팅방 아바타 */}
                <TouchableOpacity style={styles.chatRoomAvatarContainer} onPress={handleChatRoomAvatarPress}>
                  {chatRoomDetail?.avatar_url ? (
                    <Image
                      source={{ uri: chatRoomDetail.avatar_url }}
                      style={styles.chatRoomAvatar}
                      contentFit="cover"
                      cachePolicy={'memory-disk'}
                      transition={200}
                    />
                  ) : (
                    <View style={styles.chatRoomAvatarPlaceholder}>
                      <MediaIcon size={24} color={colors.WHITE} />
                    </View>
                  )}
                  {/* 수정 가능 힌트 아이콘 */}
                  <View style={styles.avatarEditHint}>
                    <EditIcon size={12} color={colors.WHITE} />
                  </View>
                </TouchableOpacity>

                {/* 채팅방 정보 */}
                <View style={styles.chatRoomInfo}>
                  <Text style={styles.chatRoomTitle} numberOfLines={1}>
                    {localChatRoomName}
                  </Text>
                  {chatRoomDetail && (
                    <Text style={styles.chatRoomSubtitle}>
                      {chatRoomDetail.type === 'group'
                        ? `${chatRoomDetail.members.length}명의 멤버`
                        : '개인 채팅'
                      }
                    </Text>
                  )}
                </View>

                {/* 헤더 버튼들 */}
                <View style={styles.headerButtons}>
                  {chatRoomDetail?.type === 'group' && (
                    <TouchableOpacity style={styles.editButton} onPress={() => setIsEditChatNameModalVisible(true)}>
                      <EditIcon size={20} color={colors.WHITE} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 공유된 미디어 섹션 */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleContainer}>
                    <MediaIcon size={20} color={colors.PRIMARY} />
                    <Text style={styles.sectionTitle}>사진/동영상</Text>
                  </View>
                  {sharedMedia.length > 0 && (
                    <TouchableOpacity onPress={onViewAllMedia} style={styles.viewAllContainer}>
                      <Text style={styles.viewAllButton}>더보기</Text>
                      <ChevronRightIcon size={14} color={colors.PRIMARY} />
                    </TouchableOpacity>
                  )}
                </View>
                {sharedMedia.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.mediaScroll}
                    contentContainerStyle={styles.mediaScrollContent}
                  >
                    {sharedMedia.slice(0, 6).map((item, index) => renderMediaItem(item, index))}
                  </ScrollView>
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>공유된 미디어파일이 없습니다</Text>
                  </View>
                )}
              </View>

              {/* 공지사항 섹션 */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleContainer}>
                    <NoticeIcon size={20} color={colors.PRIMARY} />
                    <Text style={styles.sectionTitle}>공지사항</Text>
                  </View>
                </View>
                <View style={styles.noticeContainer}>
                  {notices.length > 0 ? (
                    notices.slice(0, 3).map(renderNoticeItem)
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>등록된 공지사항이 없습니다</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* 대화상대 섹션 */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleContainer}>
                    <MembersIcon size={20} color={colors.PRIMARY} />
                    <Text style={styles.sectionTitle}>대화상대 ({members.length})</Text>
                  </View>
                  <TouchableOpacity style={styles.addButton} onPress={onAddMember}>
                    <Text style={styles.addButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
                {members.length > 0 ? (
                  <View style={styles.membersContainer}>
                    {members.map(renderMemberItem)}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>멤버 정보가 없습니다</Text>
                  </View>
                )}
              </View>

              {/* 채팅방 나가기 섹션 */}
              <View style={styles.section}>
                <TouchableOpacity
                  style={styles.leaveButton}
                  onPress={handleLeaveChatRoom}
                  activeOpacity={0.7}
                >
                  <LeaveIcon size={20} color={colors.PRIMARY} />
                  <Text style={styles.leaveButtonText}>채팅방 나가기</Text>
                </TouchableOpacity>
              </View>

            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>

      {/* 채팅방 이름 수정 모달 - 사이드바 위에 표시 */}
      <GroupChatNameInputModal
        visible={isEditChatNameModalVisible}
        onClose={() => setIsEditChatNameModalVisible(false)}
        onSubmit={handleChatNameUpdate}
        selectedUsersCount={1} // 그룹 채팅방 이름 수정이므로 1로 설정
        firstUserName={localChatRoomName} // 현재 채팅방 이름을 기본값으로
      />

      {/* 채팅방 이미지 수정 모달 - 사이드바 위에 표시 */}
      <ChatRoomImageEditModal
        visible={isImageEditModalVisible}
        onClose={() => setIsImageEditModalVisible(false)}
        onImageUpdate={handleImageUpdate}
        chatRoomId={chatRoomId}
        currentImageUrl={chatRoomDetail?.avatar_url || undefined}
      />

      {/* 미디어 뷰어 모달 */}
      <ImageViewerModal
        visible={isImageViewerVisible}
        mediaItems={sharedMedia.map(item => ({
          type: item.type as 'image' | 'video',
          url: item.type === 'video' ? (() => {
            try {
              const videoData = JSON.parse(item.url);
              return videoData.video_url || '';
            } catch (error) {
              return '';
            }
          })() : item.url,
          thumbnailUrl: item.thumbnail,
        }))}
        initialIndex={imageViewerInitialIndex}
        title={localChatRoomName}
        onClose={() => setIsImageViewerVisible(false)}
      />

      {/* 알림 모달 */}
      <CustomAlertModal
        visible={alertModal?.visible || false}
        title={alertModal?.title || ''}
        message={alertModal?.message || ''}
        buttons={alertModal?.buttons || []}
        onClose={() => setAlertModal(null)}
      />
    </Modal>
  );
};

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  overlay: {
    flex: 1,
    position: 'relative',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebarContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '80%',
    backgroundColor: colors.GRAY_50,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },

  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    backgroundColor: colors.PRIMARY,
  },
  chatRoomAvatarContainer: {
    marginRight: SPACING.SM,
    position: 'relative',
  },
  chatRoomAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.GRAY_100,
  },
  chatRoomAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditHint: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatRoomInfo: {
    flex: 1,
  },
  chatRoomTitle: {
    fontSize: TYPOGRAPHY.SIZE.LG,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: colors.WHITE,
  },
  chatRoomSubtitle: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: colors.WHITE,
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
  },

  // 섹션 공통
  section: {
    marginTop: SPACING.LG,
    paddingHorizontal: SPACING.LG,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.MD,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900,
  },
  viewAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllButton: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },

  // 미디어 섹션
  mediaScroll: {
    marginHorizontal: -SPACING.LG,
  },
  mediaScrollContent: {
    paddingHorizontal: SPACING.LG,
    paddingRight: SPACING.LG + SPACING.MD,
  },
  mediaItem: {
    marginRight: SPACING.MD,
    position: 'relative',
  },
  mediaThumbnail: {
    width: 75,
    height: 75,
    borderRadius: BORDER_RADIUS.SM,
    backgroundColor: colors.GRAY_100,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: BORDER_RADIUS.SM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoIcon: {
    color: colors.WHITE,
    fontSize: TYPOGRAPHY.SIZE.MD,
  },

  // 공지사항 섹션
  noticeContainer: {
    gap: SPACING.SM,
  },
  noticeItem: {
    backgroundColor: colors.GRAY_100,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
  },
  noticeContent: {
    gap: SPACING.XS,
  },
  noticeTitle: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900,
  },
  noticePreview: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.GRAY_700,
    lineHeight: 18,
  },
  noticeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.XS,
  },
  noticeAuthor: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
  noticeDate: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.GRAY_500,
  },

  // 대화상대 섹션
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: colors.WHITE,
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
  },
  membersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.MD,
  },
  memberItem: {
    alignItems: 'center',
    width: 70,
  },
  memberAvatarContainer: {
    position: 'relative',
    marginBottom: SPACING.XS,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.GRAY_100,
  },
  memberAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    color: colors.WHITE,
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: colors.GRAY_50,
  },
  memberName: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.GRAY_900,
    textAlign: 'center',
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },

  // 빈 상태
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.XL,
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_500,
  },

  // 나가기 버튼
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.LG,
    backgroundColor: colors.GRAY_100,
    borderRadius: BORDER_RADIUS.MD,
    gap: SPACING.SM,
  },
  leaveButtonText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.REGULAR,
    color: colors.GRAY_900,
  },
});

export default ChatDetailSidebar;

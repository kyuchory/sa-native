import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import {
  COLORS,
  TEXT_COLORS,
  BG_COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
} from '../constants/theme';
import { MediaIcon, NoticeIcon, MembersIcon, ChevronRightIcon } from './SidebarIcons';

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

interface ChatMember {
  id: number;
  nickname: string;
  avatar_url?: string;
  isOnline: boolean;
}

interface ChatDetailSidebarProps {
  isVisible: boolean;
  onClose: () => void;
  chatRoomName: string;
  members: ChatMember[];
  sharedMedia: MediaItem[];
  notices: NoticeItem[];
  onAddMember: () => void;
  onViewAllMedia: () => void;
  onViewNotice: (notice: NoticeItem) => void;
}

const { width: screenWidth } = Dimensions.get('window');

const ChatDetailSidebar: React.FC<ChatDetailSidebarProps> = ({
  isVisible,
  onClose,
  chatRoomName,
  members,
  sharedMedia,
  notices,
  onAddMember,
  onViewAllMedia,
  onViewNotice,
}) => {
  const slideAnim = useRef(new Animated.Value(screenWidth * 0.8)).current; // 시작: 사이드바 너비만큼 오른쪽 밖
  const opacityAnim = useRef(new Animated.Value(0)).current; // 시작: 투명

  useEffect(() => {
    if (isVisible) {
      // 사이드바 열기: 오른쪽에서 슬라이드 인
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0, // 완전히 보이는 위치 (0)
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // 사이드바 닫기: 오른쪽으로 슬라이드 아웃
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: screenWidth * 0.8, // 사이드바 너비만큼 오른쪽으로 이동
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, slideAnim, opacityAnim, screenWidth]);
  const renderMemberItem = (member: ChatMember) => (
    <View key={member.id} style={styles.memberItem}>
      <View style={styles.memberAvatarContainer}>
        {member.avatar_url ? (
          <Image source={{ uri: member.avatar_url }} style={styles.memberAvatar} />
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
    </View>
  );

  const renderMediaItem = (item: MediaItem, index: number) => (
    <TouchableOpacity key={item.id} style={styles.mediaItem}>
      <Image 
        source={{ uri: item.thumbnail || item.url }} 
        style={styles.mediaThumbnail} 
      />
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

  return (
    <Modal
      visible={isVisible}
      animationType="none"
      presentationStyle="overFullScreen"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.backdrop,
            {
              opacity: opacityAnim,
            }
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
            {
              transform: [{ translateX: slideAnim }],
            }
          ]}
        >
          <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
              
              {/* 헤더 */}
              <View style={styles.header}>
                <Text style={styles.chatRoomTitle} numberOfLines={1}>
                  {chatRoomName}
                </Text>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* 공유된 미디어 섹션 */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleContainer}>
                    <MediaIcon size={20} color={COLORS.PRIMARY} />
                    <Text style={styles.sectionTitle}>사진/동영상</Text>
                  </View>
                  <TouchableOpacity onPress={onViewAllMedia} style={styles.viewAllContainer}>
                    <Text style={styles.viewAllButton}>더보기</Text>
                    <ChevronRightIcon size={14} color={COLORS.PRIMARY} />
                  </TouchableOpacity>
                </View>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.mediaScroll}
                  contentContainerStyle={styles.mediaScrollContent}
                >
                  {sharedMedia.map((item, index) => renderMediaItem(item, index))}
                </ScrollView>
              </View>

              {/* 공지사항 섹션 */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleContainer}>
                    <NoticeIcon size={20} color={COLORS.PRIMARY} />
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
                    <MembersIcon size={20} color={COLORS.PRIMARY} />
                    <Text style={styles.sectionTitle}>대화상대 ({members.length})</Text>
                  </View>
                  <TouchableOpacity style={styles.addButton} onPress={onAddMember}>
                    <Text style={styles.addButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.membersContainer}>
                  {members.map(renderMemberItem)}
                </View>
              </View>

            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    backgroundColor: BG_COLORS.PRIMARY,
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
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    backgroundColor: COLORS.PRIMARY,
  },
  chatRoomTitle: {
    fontSize: TYPOGRAPHY.SIZE.LG,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: COLORS.WHITE,
    flex: 1,
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
    color: COLORS.WHITE,
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
    color: TEXT_COLORS.PRIMARY,
  },
  viewAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllButton: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },

  // 미디어 섹션
  mediaScroll: {
    marginHorizontal: -SPACING.LG,
  },
  mediaScrollContent: {
    paddingHorizontal: SPACING.LG,
    paddingRight: SPACING.LG + SPACING.MD, // 마지막 아이템 여백
  },
  mediaItem: {
    marginRight: SPACING.MD,
    position: 'relative',
  },
  mediaThumbnail: {
    width: 75,
    height: 75,
    borderRadius: BORDER_RADIUS.SM,
    backgroundColor: BG_COLORS.SECONDARY,
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
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.SIZE.MD,
  },

  // 공지사항 섹션
  noticeContainer: {
    gap: SPACING.SM,
  },
  noticeItem: {
    backgroundColor: BG_COLORS.SECONDARY,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
  },
  noticeContent: {
    gap: SPACING.XS,
  },
  noticeTitle: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: TEXT_COLORS.PRIMARY,
  },
  noticePreview: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: TEXT_COLORS.SECONDARY,
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
    color: COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
  noticeDate: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: TEXT_COLORS.DISABLED,
  },

  // 대화상대 섹션
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: COLORS.WHITE,
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
    backgroundColor: BG_COLORS.SECONDARY,
  },
  memberAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    color: COLORS.WHITE,
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
    borderColor: BG_COLORS.PRIMARY,
  },
  memberName: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: TEXT_COLORS.PRIMARY,
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
    color: TEXT_COLORS.DISABLED,
  },
});

export default ChatDetailSidebar;

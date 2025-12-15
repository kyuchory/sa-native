import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import CommonHeader from '../components/CommonHeader';
import { TYPOGRAPHY, SPACING } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';

export default function TermsAndPoliciesScreen() {
  const navigation = useNavigation();
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <CommonHeader
        title="약관 및 정책"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.textContainer}>
          <Text style={styles.introduction}>
            MomTalk은 여성 사용자 간의 소통과 정보 공유를 위한 커뮤니티 플랫폼입니다.
            {'\n'}안전하고 건전한 서비스 이용을 위해 다음 약관을 준수해 주시기 바랍니다.
          </Text>

          {/* 1. 서비스 소개 */}
          <Text style={styles.sectionTitle}>1. 서비스 소개</Text>
          <Text style={styles.sectionContent}>
            MomTalk은 일상생활, 여가생활, 여행, 맛집, 요리, 패션, 뷰티 등 다양한 여성들의 관심사를 공유하고 소통할 수 있는 플랫폼입니다.
            {'\n'}사용자는 사진, 게시글, 채팅 등을 통해 서로 소통하고 지원할 수 있습니다.
          </Text>

          {/* 2. 계정 생성 및 관리 */}
          <Text style={styles.sectionTitle}>2. 계정 생성 및 관리</Text>
          <Text style={styles.sectionContent}>
            • 회원가입 시 정확한 정보를 제공하여야 합니다.{'\n'}
            • 닉네임은 다른 사용자를 불쾌하게 하지 않는 범위에서 선택 가능합니다.{'\n'}
            • 계정의 소유권은 회원 본인에게 있으며, 양도나 대여가 불가능합니다.{'\n'}
            • 로그인 정보의 보안을 유지할 책임은 사용자에게 있습니다.
          </Text>

          {/* 3. 콘텐츠 이용 규칙 */}
          <Text style={styles.sectionTitle}>3. 콘텐츠 이용 규칙</Text>
          <Text style={styles.sectionContent}>
            사진, 동영상 및 텍스트 콘텐츠는 다음 원칙에 따라 공유됩니다:{'\n\n'}
            • 자신의 창작물, 사진, 일상 콘텐츠를 자유롭게 공유할 수 있습니다.{'\n'}
            • 다른 사람의 사생활을 침해하지 않아야 합니다.{'\n'}
            • 긍정적이고 유익한 정보 공유를 목적으로 합니다.{'\n'}
            • 콘텐츠는 게시 후 다른 사용자의 피드에 표시될 수 있습니다.
          </Text>

          {/* 4. 게시물 규칙 */}
          <Text style={styles.sectionTitle}>4. 게시물 규칙</Text>
          <Text style={styles.sectionContent}>
            모든 게시물은 다음과 같은 기준을 준수해야 합니다:{'\n\n'}
            • 벗다, 신체적 매혹, 성적인 표현이 포함된 게시물은 제한됩니다.{'\n'}
            • 폭력적, 혐오적인 콘텐츠는 금지됩니다.{'\n'}
            • 타인의 권리를 침해하는 내용은 즉시 삭제될 수 있습니다.{'\n'}
            • 과도한 상업적 광고는 제한됩니다.{'\n'}
            • 서로를 격려하고 지지하는 긍정적인 커뮤니티 문화에 기여합니다.
          </Text>

          {/* 5. 저작권 정책 */}
          <Text style={styles.sectionTitle}>5. 저작권 정책</Text>
          <Text style={styles.sectionContent}>
            • 사용자가 업로드한 콘텐츠의 저작권은 본인에게 있습니다.{'\n'}
            • 사진, 영상, 텍스트 등의 원본 출처를 신뢰할 수 있는 경우에만 공유합니다.{'\n'}
            • 유명 연예인, 브랜드 사진 등 저작권이 침해될 수 있는 콘텐츠는 자제합니다.{'\n'}
            • 타인의 지적재산권을 침해하는 콘텐츠는 즉시 삭제됩니다.{'\n'}
            • 저작권 침해 신고는 운영팀으로 연락주시면 조치하겠습니다.{'\n'}
            • 스크린샷, 포스트 사진 등 개인 비상업적 용도로만 공유하는 것을 권장합니다.
          </Text>

          {/* 6. 커뮤니티 가이드라인 */}
          <Text style={styles.sectionTitle}>6. 커뮤니티 가이드라인</Text>
          <Text style={styles.sectionContent}>
            MomTalk은 모든 사용자가 안전하고 쾌적하게 소통할 수 있는 공간입니다:{'\n\n'}
            • 서로를 존중하고 배려하는 태도를 유지합니다.{'\n'}
            • 임신/육아 경험과 노하우를 안전하게 공유하고 응원합니다.{'\n'}
            • 다양한 관심사(요리, 여행, 패션, 뷰티 등)를 자유롭게 공유합니다.{'\n'}
            • 개인정보 공유는 최소화하여 사생활 보호에 주의합니다.{'\n'}
            • 건강, 안전, 영양 정보는 전문가의 검증된 내용을 공유합니다.{'\n'}
            • 여성들의 일상 경험과 지혜를 나누는 소통의 장입니다.
          </Text>

          {/* 7. 카테고리별 주제 */}
          <Text style={styles.sectionTitle}>7. 카테고리별 주제</Text>
          <Text style={styles.sectionContent}>
            MomTalk은 다음과 같은 주제의 콘텐츠 공유를 장려합니다:{'\n\n'}
            • 일상생활: 사진 촬영 팁, 정리수납, 홈 인테리어{'\n'}
            • 여가생활: 독서, 취미 활동, 문화생활{'\n'}
            • 여행: 국내/해외 여행 후기, 숙소 추천, 꿀팁 공유{'\n'}
            • 맛집/요리: 레시피 공유, 맛집 리뷰, 다이어트 식단{'\n'}
            • 패션/뷰티: 옷차림, 메이크업, 패션 트렌드{'\n'}
            • 기타: 각자의 전문 분야, 취미, 관심사 공유
          </Text>

          {/* 8. 금지 행위 */}
          <Text style={styles.sectionTitle}>8. 금지 행위</Text>
          <Text style={styles.sectionContent}>
            다음 행위는 엄격히 금지되며, 적발 시 계정 정지 또는 이용 제한 조치를 취할 수 있습니다:{'\n\n'}
            • 악성 댓글, 혐오 성 발언, 허위 사실 유포{'\n'}
            • 개인정보 유출 및 사생활 침해{'\n'}
            • 명예훼손, 욕설 및 폭언, 온라인 괴롭힘{'\n'}
            • 불법 정보 공유, 해킹, 바이러스 유포{'\n'}
            • 과도한 상업적 광고, 다단계 판매 유도{'\n'}
            • 계정 도용 및 타인 행세{'\n'}
            • 음란하거나 부적절한 콘텐츠{'\n'}
            • 타인의 콘텐츠 무단 도용 및 저작권 침해
          </Text>

          {/* 9. 개인정보 보호 */}
          <Text style={styles.sectionTitle}>9. 개인정보 보호</Text>
          <Text style={styles.sectionContent}>
            MomTalk은 사용자 개인정보 보호를 최우선으로 합니다:{'\n\n'}
            • 수집된 개인정보는 서비스 제공 및 개선을 위해서만 사용됩니다.{'\n'}
            • 개인정보는 본인의 동의 없이 제3자에게 제공되지 않습니다.{'\n'}
            • 개인정보 수집 및 이용에 대한 자세한 내용은 개인정보처리방침을 참고해주세요.
          </Text>

          {/* 10. 서비스 이용 제한 */}
          <Text style={styles.sectionTitle}>10. 서비스 이용 제한</Text>
          <Text style={styles.sectionContent}>
            MomTalk은 건전한 서비스 환경을 유지하기 위해 다음과 같은 조치를 취할 수 있습니다:{'\n\n'}
            • 가이드라인 위반 시 사전 경고 후 계정 일시 정지{'\n'}
            • 반복 위반 시 영구 계정 삭제{'\n'}
            • 긴급한 경우 사전 통지 없이 조치 가능
          </Text>

          {/* 11. 약관 변경 */}
          <Text style={styles.sectionTitle}>11. 약관 변경</Text>
          <Text style={styles.sectionContent}>
            MomTalk은 서비스 개선을 위해 약관을 변경할 수 있습니다.{'\n\n'}
            • 중요한 변경 사항은 앱 내 공지 및 푸시 알림으로 사전 안내됩니다.{'\n'}
            • 약관 변경 후 지속 이용 시 동의한 것으로 간주합니다.{'\n'}
            • 변경된 약관은 이전 약관과 함께 적용될 수 있습니다.
          </Text>

          {/* 문의 사항 */}
          <Text style={styles.sectionTitle}>문의 사항</Text>
          <Text style={styles.sectionContent}>
            약관 및 서비스 이용에 대한 문의 사항은:{'\n\n'}
            앱 내 1:1 문의 또는 고객센터로 연락주시기 바랍니다.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.GRAY_50,
  },
  content: {
    flex: 1,
    backgroundColor: colors.GRAY_50,
  },
  textContainer: {
    padding: SPACING.MD,
    backgroundColor: colors.WHITE,
    borderRadius: 12,
    margin: SPACING.MD,
    paddingBottom: SPACING.LG,
  },
  introduction: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_600,
    textAlign: 'center',
    marginBottom: SPACING.LG,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: colors.GRAY_900,
    marginTop: SPACING.LG,
    marginBottom: SPACING.SM,
  },
  sectionContent: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_700,
    lineHeight: 20,
    marginBottom: SPACING.MD,
  },
});

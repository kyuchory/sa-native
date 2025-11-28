import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useThemeStore } from '../stores/themeStore';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import { WriteIcon } from './HomeHeaderIcons';

interface FeedEmptyStateProps {
  onCreatePress?: () => void;
}

export default function FeedEmptyState({ onCreatePress }: FeedEmptyStateProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* 아이콘 컨테이너 */}
        <View style={styles.iconContainer}>
          <WriteIcon size={48} color={colors.GRAY_300} />
        </View>

        {/* 메인 메시지 */}
        <Text style={styles.title}>피드가 없습니다</Text>

        {/* 서브 메시지 */}
        <Text style={styles.subtitle}>
          새로운 피드를 올려보세요!
        </Text>

        {/* 행동 유도 버튼 */}
        {onCreatePress && (
          <TouchableOpacity
            style={styles.button}
            onPress={onCreatePress}
            activeOpacity={0.7}
          >
            <WriteIcon size={20} color={colors.WHITE} />
            <Text style={styles.buttonText}>첫 피드 작성하기</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.XL * 2,
    paddingHorizontal: SPACING.LG,
    minHeight: 300,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.XL,
    width: '100%',
    maxWidth: 280,
  },
  iconContainer: {
    marginBottom: SPACING.LG,
    padding: SPACING.MD,
    backgroundColor: colors.GRAY_50,
    borderRadius: 50,
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE.XL,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900,
    textAlign: 'center',
    marginBottom: SPACING.SM,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_600,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.XL,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.PRIMARY,
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    gap: SPACING.SM,
    minHeight: 44,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.WHITE,
  },
});

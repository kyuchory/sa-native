import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { DeleteIcon } from './ChatActionIcons';
import { useThemeStore } from '../stores/themeStore';

interface EditActionBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDelete: () => void;
}

export default function ChatEditActionBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDelete
}: EditActionBarProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const allSelected = selectedCount === totalCount;
  const hasSelection = selectedCount > 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.selectAllButton}
        onPress={onSelectAll}
        activeOpacity={0.7}
      >
        <Text style={styles.selectAllText}>
          {allSelected ? '전체 해제' : '전체 선택'}
        </Text>
      </TouchableOpacity>

      <View style={styles.rightContainer}>
        <Text style={styles.countText}>
          {selectedCount}개 선택됨
        </Text>
        <TouchableOpacity
          style={[
            styles.deleteButton,
            !hasSelection && styles.deleteButtonDisabled
          ]}
          onPress={onDelete}
          disabled={!hasSelection}
          activeOpacity={0.7}
        >
          <DeleteIcon
            size={16}
            color={hasSelection ? colors.WHITE : colors.GRAY_400}
          />
          <Text style={[
            styles.deleteButtonText,
            !hasSelection && styles.deleteButtonTextDisabled
          ]}>
            나가기
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.WHITE,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: colors.GRAY_200,
    ...SHADOWS.SMALL,
  },
  selectAllButton: {
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
  },
  selectAllText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: colors.PRIMARY,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.MD,
  },
  countText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_700,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.PRIMARY,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.SM,
    gap: SPACING.XS,
  },
  deleteButtonDisabled: {
    backgroundColor: colors.GRAY_300,
  },
  deleteButtonText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.WHITE,
  },
  deleteButtonTextDisabled: {
    color: colors.GRAY_400,
  },
});

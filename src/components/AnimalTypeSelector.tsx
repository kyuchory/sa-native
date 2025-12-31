import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { AnimalTypeOption } from '../types/post';

interface AnimalTypeSelectorProps {
  selectedType: string;
  onTypeSelect: (type: string) => void;
  animalTypes: AnimalTypeOption[];
}

export default function AnimalTypeSelector({
  selectedType,
  onTypeSelect,
  animalTypes,
}: AnimalTypeSelectorProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>동물 타입</Text>
      </View>
      <View style={styles.animalTypeContainer}>
        <View style={styles.animalTypeDescription}>
          <Text style={styles.animalTypeDescriptionText}>
            어떤 반려동물 이야기인지 알려주면{'\n'}
            비슷한 경험을 가진 분들이 더 잘 도와줄 수 있어요 🐾{'\n'}
            자유로운 글이라면 선택하지 않아도 괜찮아요.
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.animalTypeContent}
        >
          {animalTypes.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.animalTypeItem,
                selectedType === type.value && styles.animalTypeItemActive
              ]}
              onPress={() => onTypeSelect(type.value)}
            >
              <Text style={[
                styles.animalTypeText,
                selectedType === type.value && styles.animalTypeTextActive
              ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  section: {
    marginHorizontal: SPACING.MD,
    marginTop: SPACING.MD,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.SM,
  },
  sectionLabel: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900,
  },
  animalTypeContainer: {
    backgroundColor: colors.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    borderWidth: 1,
    borderColor: colors.GRAY_200,
    padding: SPACING.MD,
  },
  animalTypeDescription: {
    marginBottom: SPACING.MD,
  },
  animalTypeDescriptionText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.REGULAR,
    color: colors.GRAY_600,
    lineHeight: TYPOGRAPHY.SIZE.MD + 4,
  },
  animalTypeContent: {
    gap: SPACING.SM,
  },
  animalTypeItem: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.ROUND,
    backgroundColor: colors.GRAY_100,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animalTypeItemActive: {
    backgroundColor: colors.PRIMARY,
  },
  animalTypeText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: colors.GRAY_600,
  },
  animalTypeTextActive: {
    color: colors.WHITE,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
  },
});

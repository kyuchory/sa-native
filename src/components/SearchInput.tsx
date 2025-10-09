import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { SearchIcon } from './SearchIcons';

export interface SearchInputRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
}

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmitEditing?: () => void;
  onDebounce?: (debouncedText: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onClear?: () => void;
  debounceDelay?: number;
  maxLength?: number;
}

// Debounce hook 구현 (lodash 없이)
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const SearchInput = forwardRef<SearchInputRef, SearchInputProps>(({
  value,
  onChangeText,
  placeholder = "검색",
  onSubmitEditing,
  onDebounce,
  onFocus,
  onBlur,
  onClear,
  debounceDelay = 300,
  maxLength = 100,
}, ref) => {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);
  const inputRef = useRef<TextInput>(null);
  const [isActive, setIsActive] = useState(false);

  // Debounce 적용
  const debouncedValue = useDebounce(value, debounceDelay);

  // Debounce 콜백 실행
  useEffect(() => {
    if (onDebounce) {
      onDebounce(debouncedValue);
    }
  }, [debouncedValue, onDebounce]);

  // ref 포워딩
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
    clear: () => {
      onChangeText('');
      if (onClear) onClear();
      setIsActive(false);
      inputRef.current?.blur();
    }
  }));

  const handleFocus = () => {
    setIsActive(true);
    if (onFocus) onFocus();
  };

  const handleBlur = () => {
    if (!value.trim()) {
      setIsActive(false);
    }
    if (onBlur) onBlur();
  };

  const handleClear = () => {
    onChangeText('');
    if (onClear) onClear();
    setIsActive(false);
    inputRef.current?.blur();
  };

  return (
    <View style={styles.searchContainer}>
      <View style={[styles.searchInputContainer, isActive && styles.searchInputActive]}>
        <View style={styles.searchIcon}>
          <SearchIcon size={20} color={colors.GRAY_500} />
        </View>
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor={colors.GRAY_500}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxLength={maxLength}
          returnKeyType="search"
        />
        {isActive && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
          >
            <Text style={styles.clearButtonText}>취소</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

SearchInput.displayName = 'SearchInput';

// 스타일 생성 함수
const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  searchContainer: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.GRAY_100,
    borderRadius: BORDER_RADIUS.ROUND,
    paddingHorizontal: SPACING.MD,
    height: 44,
  },
  searchInputActive: {
    backgroundColor: colors.WHITE,
  },
  searchIcon: {
    marginRight: SPACING.SM,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_900,
  },
  clearButton: {
    marginLeft: SPACING.SM,
    paddingHorizontal: SPACING.SM,
  },
  clearButtonText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
});

export default SearchInput;

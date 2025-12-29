import 'react-native-reanimated';
import 'react-native-gesture-handler';
import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, useAnimatedProps, runOnJS } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, Dimensions, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { captureRef } from 'react-native-view-shot';
import Svg, { Path, Circle } from 'react-native-svg';
import { CheckIcon } from '../components/CommonIcons';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import { useThemeStore } from '../stores/themeStore';
import { StoryService } from '../services/storyService';
import { SPACING, BORDER_RADIUS } from '../constants/theme';
import CommonHeader from '../components/CommonHeader';
import CommonHeaderButton from '../components/CommonHeaderButton';
import LoadingOverlay from '../components/LoadingOverlay';
import CustomAlertModal from '../components/CustomAlertModal';

// Sub-components for performance optimization
type CanvasSurfaceProps = {
  elements: (StickerElement | TextElement)[];
  strokes: Stroke[];
  drawColor: string;
  drawWidth: number;
  isDrawing: boolean;
  canvasRef: React.RefObject<View | null>;
  colors: Record<string, string>;
  backgroundColor: string;
  onStrokeAdd: (stroke: Stroke) => void;
  canvasSize: { width: number; height: number };
  onCanvasSizeChange: (size: { width: number; height: number }) => void;
  onUpdatePos: (id: string, pos: PercentPos) => void;
  onUpdateScale: (id: string, scale: number) => void;
  onUpdateRotation: (id: string, rotation: number) => void;
  onSelectElement: (id: string) => void;
  onEditText: (id: string, text: string) => void;
  selectedId: string | null;
};

type BottomToolbarProps = {
  strokesCount: number;
  hasSelectedElement: boolean;
  hasSelectedText: boolean;
  onPressBackgroundColor: () => void;
  onPressTextColor: () => void;
  onPressSave: () => void;
  onPressDraw: () => void;
  onPressText: () => void;
  onPressSticker: () => void;
  onPressClear: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onDeleteSelected: () => void;
};

type ColorModalProps = {
  visible: boolean;
  selectedColor: string;
  onSelectColor: (color: string) => void;
  onClose: () => void;
};

type DrawingToolbarProps = {
  drawColor: string;
  drawWidth: number;
  strokesCount: number;
  onChangeColor: (color: string) => void;
  onChangeWidth: (width: number) => void;
  onUndo: () => void;
  onDone: () => void;
};

type TextModalProps = {
  visible: boolean;
  value: string;
  placeholder: string;
  onChangeText: (text: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

const CanvasSurface = React.memo<CanvasSurfaceProps>(function CanvasSurface(props) {
  const {
    elements,
    strokes,
    drawColor,
    drawWidth,
    isDrawing,
    canvasRef,
    colors,
    backgroundColor,
    onStrokeAdd,
    canvasSize,
    onCanvasSizeChange,
    onUpdatePos,
    onUpdateScale,
    onUpdateRotation,
    onSelectElement,
    onEditText,
    selectedId,
  } = props;

  const styles = useMemo(() => createStyles(colors, backgroundColor), [colors, backgroundColor]);

  const currentStroke = useSharedValue<Stroke | null>(null);
  const drawingPoints = useSharedValue<{ x: number; y: number }[]>([]);
  const currentDrawingColor = useSharedValue('#000000');
  const currentDrawingWidth = useSharedValue(4);

  // Undo/Clear 감지하여 drawingPoints 동기화
  const prevStrokeCountRef = useRef(strokes.length);
  useEffect(() => {
    // strokes 개수가 줄어들었다 = undo 또는 clear
    if (strokes.length < prevStrokeCountRef.current) {
      drawingPoints.value = [];
      currentStroke.value = null;
    }
    prevStrokeCountRef.current = strokes.length;
  }, [strokes.length]);

  const panForDrawing = Gesture.Pan()
    .enabled(isDrawing)
    .onBegin(e => {
      // Flush any incomplete previous stroke
      if (currentStroke.value && currentStroke.value.points.length > 1) {
        runOnJS(onStrokeAdd)(currentStroke.value);
      }

      // Clear previous drawing points before starting new stroke
      drawingPoints.value = [];

      // Start new stroke
      const stroke: Stroke = {
        id: `s-${Date.now()}`,
        points: [{ x: e.x, y: e.y }],
        color: drawColor,
        width: drawWidth,
      };
      currentStroke.value = stroke;
      drawingPoints.value = stroke.points;

      // Set current drawing color for this stroke
      currentDrawingColor.value = drawColor;
      currentDrawingWidth.value = drawWidth;
    })
    .onUpdate(e => {
      if (!currentStroke.value) return;

      const newPoints = [
        ...currentStroke.value.points,
        { x: e.x, y: e.y },
      ];
      currentStroke.value = {
        ...currentStroke.value,
        points: newPoints,
      };
      drawingPoints.value = newPoints;
    })
    .onEnd(() => {
      // Finish current stroke
      if (currentStroke.value && currentStroke.value.points.length > 1) {
        runOnJS(onStrokeAdd)(currentStroke.value);  // Send final stroke to JS thread
      }

      // Keep drawingPoints intact until next stroke begins
      currentStroke.value = null;
      // drawingPoints.value = []; // Removed
    })
    .onFinalize(() => {
      // Keep drawingPoints intact until next stroke begins
      currentStroke.value = null;
      // drawingPoints.value = []; // Removed
    });

  const pointsToPath = (pts: { x: number; y: number }[]) => {
    'worklet';
    if (!pts.length) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  };

  useEffect(() => {
    if (!isDrawing) {
      drawingPoints.value = [];
      currentStroke.value = null;
    }
  }, [isDrawing]);

  const AnimatedPath = Animated.createAnimatedComponent(Path);
  const animatedPathProps = useAnimatedProps(() => ({
    d: pointsToPath(drawingPoints.value),
    stroke: currentDrawingColor.value,
    strokeWidth: currentDrawingWidth.value,
  }));

  const updateElementPosition = useCallback((id: string, newPos: PercentPos) => {
    onUpdatePos(id, newPos);
  }, [onUpdatePos]);

  const updateElementScale = useCallback((id: string, newScale: number) => {
    onUpdateScale(id, newScale);
  }, [onUpdateScale]);

  const updateElementRotation = useCallback((id: string, newRotation: number) => {
    onUpdateRotation(id, newRotation);
  }, [onUpdateRotation]);

  const setSelectedIdJS = useCallback((id: string) => {
    onSelectElement(id);
  }, [onSelectElement]);
  const openEditModalJS = useCallback((id: string, currentText: string) => {
    onEditText(id, currentText);
  }, [onEditText]);

  // 🔹 공통 콘텐츠
  const content = (
    <View ref={canvasRef} style={styles.canvas}>
      <View
        style={styles.canvasInner}
        onLayout={e => {
          const { width, height } = e.nativeEvent.layout;
          onCanvasSizeChange({ width, height });
        }}
      >
        {/* ✅ 1. 먼저 스티커/텍스트 - 터치 받을 놈들 */}
        {elements.map(el => (
          <ElementWrapper
            key={el.id}
            el={el}
            colors={colors}
            isDrawing={isDrawing}
            canvasSize={canvasSize}
            onUpdatePos={updateElementPosition}
            onUpdateScale={updateElementScale}
            onUpdateRotation={updateElementRotation}
            onSelect={setSelectedIdJS}
            onEditText={openEditModalJS}
            isSelected={selectedId === el.id}
          />
        ))}

        {/* ✅ 2. 그 위에 드로잉 레이어 - 완전 터치 비활성, 항상 위에 보임 */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg style={StyleSheet.absoluteFill}>
            {strokes.map(s => (
              <Path
                key={s.id}
                d={pointsToPath(s.points)}
                strokeWidth={s.width}
                stroke={s.color}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            <AnimatedPath
              animatedProps={animatedPathProps}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      </View>
    </View>
  );

  // 🔥 isDrawing일 때만 부모 제스처 활성
  if (isDrawing) {
    return (
      <GestureDetector gesture={panForDrawing}>
        {content}
      </GestureDetector>
    );
  }

  // 일반 모드에서는 ElementWrapper 제스처만 사용
  return content;
});

const TextColorModal = React.memo<ColorModalProps>(function TextColorModal({
  visible,
  selectedColor,
  onSelectColor,
  onClose,
}) {
  const { colors } = useThemeStore();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const textColorPresets = [colors.GRAY_900, colors.WHITE, colors.GRAY_200, colors.GRAY_600, colors.GRAY_900];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.colorModalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.colorModalContent}>
          <Text style={styles.colorModalTitle}>텍스트 색상 선택</Text>
          <View style={styles.colorPaletteModalRow}>
            {textColorPresets.map((c, i) => (
              <TouchableOpacity
                key={i.toString()}
                onPress={() => onSelectColor(c)}
                style={[
                  styles.colorCircleModal,
                  { backgroundColor: c },
                  selectedColor === c && styles.colorCircleModalActive,
                  c === colors.WHITE && { borderWidth: 1, borderColor: colors.GRAY_600 }
                ]}
              />
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
});

const ColorModal = React.memo<ColorModalProps>(function ColorModal({
  visible,
  selectedColor,
  onSelectColor,
  onClose,
}) {
  const { colors } = useThemeStore();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const backgroundColorPresets = [colors.GRAY_100, colors.WHITE, colors.GRAY_200, colors.GRAY_600, colors.GRAY_900];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.colorModalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.colorModalContent}>
          <Text style={styles.colorModalTitle}>배경색 선택</Text>
          <View style={styles.colorPaletteModalRow}>
            {backgroundColorPresets.map(c => (
              <TouchableOpacity
                key={c}
                onPress={() => onSelectColor(c)}
                style={[
                  styles.colorCircleModal,
                  { backgroundColor: c },
                  selectedColor === c && styles.colorCircleModalActive,
                  c === colors.WHITE && { borderWidth: 1, borderColor: colors.GRAY_600 }
                ]}
              />
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
});

const BottomToolbar = React.memo<BottomToolbarProps>(function BottomToolbar({
  strokesCount,
  hasSelectedElement,
  hasSelectedText,
  onPressBackgroundColor,
  onPressTextColor,
  onPressSave,
  onPressDraw,
  onPressText,
  onPressSticker,
  onPressClear,
  onBringForward,
  onSendBackward,
  onDeleteSelected,
}) {
  const { colors } = useThemeStore();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.bottomToolbarContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.bottomToolbar}
        bounces={false}
      >
        <TouchableOpacity style={styles.toolItem} onPress={onPressSave}>
          <View style={styles.saveIconWrapper}>
            <ExportIcon size={24} color={colors.WHITE} />
          </View>
          <Text style={styles.saveLabel}>저장</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolItem} onPress={onPressDraw}>
          <View style={styles.toolIconWrapper}>
            <PencilIcon size={26} color={colors.GRAY_900} />
          </View>
          <Text style={styles.toolLabel}>그리기</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolItem} onPress={onPressBackgroundColor}>
          <View style={styles.toolIconWrapper}>
            <BackgroundColorIcon size={26} color={colors.GRAY_900} />
          </View>
          <Text style={styles.toolLabel}>배경색</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolItem} onPress={onPressText}>
          <View style={styles.toolIconWrapper}>
            <TextIcon size={26} color={colors.GRAY_900} />
          </View>
          <Text style={styles.toolLabel}>텍스트</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolItem} onPress={onPressSticker}>
          <View style={styles.toolIconWrapper}>
            <ImageIcon size={26} color={colors.GRAY_900} />
          </View>
          <Text style={styles.toolLabel}>스티커</Text>
        </TouchableOpacity>

        {strokesCount > 0 && (
          <TouchableOpacity style={styles.toolItem} onPress={onPressClear}>
            <View style={styles.toolIconWrapper}>
              <TrashIcon size={22} color={colors.ERROR} />
            </View>
            <Text style={[styles.toolLabel, { color: colors.ERROR }]}>초기화</Text>
          </TouchableOpacity>
        )}

        {hasSelectedElement && (
          <>
            <TouchableOpacity style={styles.toolItem} onPress={onBringForward}>
              <View style={styles.toolIconWrapper}>
                <LayerUpIcon size={22} color={colors.GRAY_900} />
              </View>
              <Text style={styles.toolLabel}>앞으로</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolItem} onPress={onSendBackward}>
              <View style={styles.toolIconWrapper}>
                <LayerDownIcon size={22} color={colors.GRAY_900} />
              </View>
              <Text style={styles.toolLabel}>뒤로</Text>
            </TouchableOpacity>

            {hasSelectedText && (
              <TouchableOpacity style={styles.toolItem} onPress={onPressTextColor}>
                <View style={styles.toolIconWrapper}>
                  <BackgroundColorIcon size={22} color={colors.GRAY_900} />
                </View>
                <Text style={styles.toolLabel}>색상</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.toolItem} onPress={onDeleteSelected}>
              <View style={styles.toolIconWrapper}>
                <TrashIcon size={22} color={colors.ERROR} />
              </View>
              <Text style={[styles.toolLabel, { color: colors.ERROR }]}>삭제</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
});

const DrawingToolbar = React.memo<DrawingToolbarProps>(function DrawingToolbar({
  drawColor,
  drawWidth,
  strokesCount,
  onChangeColor,
  onChangeWidth,
  onUndo,
  onDone,
}) {
  const { colors } = useThemeStore();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const colorPresets = ['#000000', '#FFFFFF', '#FF0000', '#00AA00', '#0000FF', '#FFFF00', '#FF1493'];

  return (
    <View style={styles.drawingToolbar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.drawingTopScroll}>
        <View style={styles.colorPaletteRow}>
          {colorPresets.map(c => (
            <TouchableOpacity
              key={c}
              onPress={() => onChangeColor(c)}
              style={[
                styles.colorCircle,
                { backgroundColor: c },
                drawColor === c && styles.colorCircleActive,
                c === '#FFFFFF' && { borderWidth: 1, borderColor: colors.GRAY_600 }
              ]}
            />
          ))}
        </View>

        <View style={styles.widthPaletteRow}>
          <Text style={styles.widthLabel}>굵기:</Text>
          {[2, 4, 6, 8, 10].map(size => (
            <TouchableOpacity
              key={size}
              onPress={() => onChangeWidth(size)}
              style={[
                styles.widthCircle,
                { width: size * 4, height: size * 4, backgroundColor: colors.GRAY_200 },
                drawWidth === size && styles.widthCircleActive
              ]}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.drawingActions}>
        <TouchableOpacity
          style={[styles.drawingButton, strokesCount === 0 && styles.drawingButtonDisabled]}
          onPress={onUndo}
          disabled={strokesCount === 0}
        >
          <UndoIcon size={22} color={strokesCount > 0 ? colors.GRAY_900 : colors.GRAY_600} />
          <Text style={[styles.drawingButtonText, strokesCount === 0 && styles.drawingButtonTextDisabled]}>
            취소
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.drawingButton}
          onPress={onDone}
        >
          <CloseIcon size={22} color={colors.GRAY_900} />
          <Text style={styles.drawingButtonText}>완료</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const TextModal = React.memo<TextModalProps>(function TextModal({
  visible,
  value,
  placeholder,
  onChangeText,
  onConfirm,
  onCancel,
}) {
  const { colors } = useThemeStore();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableOpacity
        style={styles.simpleModalOverlay}
        activeOpacity={1}
        onPress={onConfirm}
      >
        <View style={styles.simpleModalInputWrapper}>
          <TextInput
            autoFocus
            multiline
            placeholder={placeholder}
            placeholderTextColor={colors.GRAY_400}
            value={value}
            onChangeText={onChangeText}
            style={styles.simpleModalInput}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
});

// Types
type PercentPos = { left: number; top: number };

type StickerElement = {
  id: string;
  type: 'sticker';
  uri: string;
  pos: PercentPos;
  rotation: number;
  scale: number;
  aspect?: number;
  baseW?: number;
};

type TextElement = {
  id: string;
  type: 'text';
  text: string;
  pos: PercentPos;
  rotation: number;
  scale: number;
  color?: string;
};

type Stroke = { id: string; points: { x: number; y: number }[]; color: string; width: number };

type ElementWrapperProps = {
  el: StickerElement | TextElement;
  colors: Record<string, string>;
  isDrawing: boolean;
  canvasSize: { width: number; height: number };
  onUpdatePos: (id: string, pos: PercentPos) => void;
  onUpdateScale: (id: string, scale: number) => void;
  onUpdateRotation: (id: string, rotation: number) => void;
  onSelect: (id: string) => void;
  onEditText: (id: string, text: string) => void;
  isSelected: boolean;
};

// Modern SVG Icons
const TextIcon = ({ size = 24, color = '#000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 7h16M4 12h10M4 17h6" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const ImageIcon = ({ size = 24, color = '#000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2z" stroke={color} strokeWidth={2} />
    <Path d="M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ExportIcon = ({ size = 24, color = '#000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5-5 5 5M12 5v12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PencilIcon = ({ size = 24, color = '#000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const UndoIcon = ({ size = 24, color = '#000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 7v6h6M3 13a9 9 0 019-9 9 9 0 019 9 9 9 0 01-9 9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CloseIcon = ({ size = 24, color = '#000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const LayerUpIcon = ({ size = 20, color = '#000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2l10 6-10 6L2 8l10-6z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M2 12l10 6 10-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const LayerDownIcon = ({ size = 20, color = '#000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M2 8l10 6 10-6-10-6L2 8z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M2 12l10 6 10-6M2 16l10 6 10-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

  const BackgroundColorIcon = ({ size = 24, color = '#000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.9 0 1.65-.73 1.65-1.65 0-.44-.17-.86-.44-1.18-.27-.31-.44-.73-.44-1.18 0-.9.73-1.65 1.65-1.65h1.95C18.48 18.34 22 14.82 22 10.32 22 5.61 17.52 2 12 2z" stroke={color} strokeWidth={2}/>
    <Circle cx="7" cy="10" r="1.5" fill={color}/>
    <Circle cx="10" cy="7" r="1.5" fill={color}/>
    <Circle cx="14" cy="7" r="1.5" fill={color}/>
    <Circle cx="17" cy="10" r="1.5" fill={color}/>
  </Svg>
  );

  const TrashIcon = ({ size = 20, color = '#000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

type Props = {
  route?: { params?: { imageUri?: string } };
  navigation?: any;
};

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const STICKER_BASE_W = 200;
const CANVAS_MARGIN = 0;

export default function CanvasEditorScreen({ route, navigation }: Props) {
  const { colors } = useThemeStore();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const initialImage = route?.params?.imageUri ?? null;
  const canvasRef = useRef<View>(null);

  const [elements, setElements] = useState<Array<StickerElement | TextElement>>([]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const [drawColor, setDrawColor] = useState('#000000');
  const [drawWidth, setDrawWidth] = useState(4);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState(colors.GRAY_100);

  // 🔥 선택 상태를 기억하는 ref
  const selectedIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  // 🔥 선택 테두리를 숨기고 캔버스를 캡처하는 헬퍼
  const captureCanvasWithoutSelection = useCallback(async () => {
    if (!canvasRef.current) return null;

    const prevSelected = selectedIdRef.current;

    // 1) 선택 해제해서 테두리 숨기기
    if (prevSelected) {
      setSelectedId(null);
      // 한 프레임 정도 기다렸다가 캡처 (UI 업데이트 반영용)
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    try {
      // 2) 실제 캡처
      const uri = await captureRef(canvasRef, { format: 'png', quality: 0.9 });
      return uri;
    } finally {
      // 3) 선택 상태 복구
      if (prevSelected) {
        setSelectedId(prevSelected);
      }
    }
  }, []);

  const [showTextModal, setShowTextModal] = useState(false);
  const [modalTextInput, setModalTextInput] = useState('');
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  const [showTextColorModal, setShowTextColorModal] = useState(false);
  const [alertModal, setAlertModal] = useState<{visible: boolean, title: string, message: string, buttons: any[]} | null>(null);

  const hasSelectedText = !!selectedId && elements.some(el => el.id === selectedId && el.type === 'text');
  const currentTextColor = (() => {
    const element = elements.find(el => el.id === selectedId);
    return element?.type === 'text' ? element.color || colors.GRAY_900 : colors.GRAY_900;
  })();

  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const addSticker = (uri: string, aspect?: number) => {
    setElements(prev => [
      ...prev,
      {
        id: `sticker-${Date.now()}`,
        type: 'sticker',
        uri,
        pos: { left: 0.5, top: 0.5 },
        rotation: 0,
        scale: 1,
        baseW: STICKER_BASE_W,
        aspect, // 🔹 비율 정보 저장
      } as StickerElement,
    ]);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      const uri = asset.uri;

      // 🔹 이미지 비율 계산 (없으면 1 fallback)
      const aspect =
        asset.width && asset.height
          ? asset.height / asset.width
          : 1;

      addSticker(uri, aspect);
    }
  };

  const addTextBox = () => {
    setEditingElementId(null);
    setModalTextInput('');
    setShowTextModal(true);
  };

  const confirmAddText = () => {
    if (editingElementId) {
      if (modalTextInput.trim()) {
        setElements(prev => prev.map(el =>
          el.id === editingElementId && el.type === 'text'
            ? { ...el, text: modalTextInput }
            : el
        ));
      }
    } else {
      if (modalTextInput.trim()) {
        const newId = `text-${Date.now()}`;
        setElements(prev => [
          ...prev,
          {
            id: newId,
            type: 'text',
            text: modalTextInput,
            pos: { left: 0.5, top: 0.5 },
            rotation: 0,
            scale: 1.3,
            color: colors.GRAY_900,
          } as TextElement,
        ]);
      }
    }
    setShowTextModal(false);
    setModalTextInput('');
    setEditingElementId(null);
  };

  const bringForward = (id: string) => {
    setElements(prev => {
      const idx = prev.findIndex(p => p.id === id);
      if (idx === -1 || idx === prev.length - 1) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(idx + 1, 0, item);
      return copy;
    });
  };

  const sendBackward = (id: string) => {
    setElements(prev => {
      const idx = prev.findIndex(p => p.id === id);
      if (idx <= 0) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(idx - 1, 0, item);
      return copy;
    });
  };

  const updateTextColor = useCallback((color: string) => {
    if (!selectedId) return;
    setElements(prev => prev.map(el =>
      el.id === selectedId && el.type === 'text'
        ? { ...el, color }
        : el
    ));
  }, [selectedId]);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setElements(prev => prev.filter(el => el.id !== selectedId));
    setSelectedId(null);
  }, [selectedId]);

  const exportAsImage = async () => {
    try {
      const uri = await captureCanvasWithoutSelection();
      if (!uri) return;

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        setAlertModal({
          visible: true,
          title: '권한 필요',
          message: '이미지를 저장하려면 미디어 라이브러리에 대한 접근 권한이 필요합니다.',
          buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
        });
        return;
      }

      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('CanvasExports', asset, false).catch(() => {});

      setAlertModal({
        visible: true,
        title: '저장됨',
        message: '이미지가 갤러리에 저장되었습니다.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
      navigation?.navigate?.('Somewhere', { exportedUri: uri });
    } catch (e) {
      console.error(e);
      setAlertModal({
        visible: true,
        title: '오류',
        message: '내보내기 실패',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
    }
  };

  const submitAsStory = async () => {
    if (isUploading) return;
    try {
      setIsUploading(true);

      const uri = await captureCanvasWithoutSelection();
      if (!uri) return;

      // 스토리 이미지 업로드 API 호출
      const response = await StoryService.uploadStoryImage(uri);

      // 생성된 스토리의 ID로 DailyCutDetailScreen으로 이동 (자신의 스토리로 표시)
      navigation.replace('DailyCutDetail', {
        storyId: response.id,
        isMyStory: true
      });
    } catch (error) {
      console.error('스토리 생성 실패:', error);
      setAlertModal({
        visible: true,
        title: '업로드 실패',
        message: '스토리 업로드에 실패했습니다. 다시 시도해주세요.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
    } finally {
      setIsUploading(false);
    }
  };

  const undoLastStroke = useCallback(() => {
    setStrokes(prev => prev.slice(0, -1));
  }, []);

  const addStrokeJS = useCallback((stroke: Stroke) => {
    setStrokes(prev => [...prev, stroke]);
  }, []);

  const updateElementPosition = useCallback((id: string, newPos: PercentPos) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, pos: newPos } : el));
  }, []);

  const updateElementScale = useCallback((id: string, newScale: number) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, scale: newScale } : el));
  }, []);

  const updateElementRotation = useCallback((id: string, newRotation: number) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, rotation: newRotation } : el));
  }, []);

  const setSelectedIdJS = useCallback((id: string) => { setSelectedId(id); }, []);

  const openEditModalJS = useCallback((id: string, currentText: string) => {
    setEditingElementId(id);
    setModalTextInput(currentText);
    setShowTextModal(true);
  }, []);

  const didInitRef = useRef(false);

  useEffect(() => { didInitRef.current = false; }, [initialImage]);

  useEffect(() => {
    if (!initialImage || didInitRef.current || canvasSize.width <= 0) return;

    Image.getSize(
      initialImage,
      (w, h) => {
        const imgAspect = h / w;
        const canvasAspect = canvasSize.height / canvasSize.width;

        let baseW: number;
        let baseH: number;
        let leftPx: number;
        let topPx: number;

        if (imgAspect > canvasAspect) {
          // 🔥 세로가 더 긴 이미지
          // 약간 더 크게 스케일해서 위/아래를 캔버스 밖으로 밀어버림
          const SAFE = 1.02; // 필요하면 1.01 ~ 1.03 사이에서 조절

          const scale = (canvasSize.height / h) * SAFE;

          baseW = w * scale;
          baseH = h * scale;

          // 중앙 정렬 (baseH가 캔버스보다 크기 때문에 topPx는 음수가 됨)
          topPx  = (canvasSize.height - baseH) / 2;
          leftPx = (canvasSize.width  - baseW) / 2;
        } else {
          // 🔹 가로가 더 넓거나 비슷한 이미지
          // 가로를 캔버스에 맞추고, 세로는 가운데 정렬
          const scale = canvasSize.width / w;

          baseW = canvasSize.width;
          baseH = h * scale;

          leftPx = 0;
          topPx = (canvasSize.height - baseH) / 2;
        }

        const leftPercent = leftPx / canvasSize.width;
        const topPercent  = topPx / canvasSize.height;

        setElements([{
          id: 'sticker-0',
          type: 'sticker',
          uri: initialImage,
          aspect: imgAspect,
          baseW,
          pos: { left: leftPercent, top: topPercent },
          rotation: 0,
          scale: 1,
        }]);

        didInitRef.current = true;
      },
      () => {
        setElements([{
          id: 'sticker-0',
          type: 'sticker',
          uri: initialImage,
          pos: { left: 0.5, top: 0.5 },
          rotation: 0,
          scale: 1,
          baseW: STICKER_BASE_W,
        }]);
        didInitRef.current = true;
      }
    );
  }, [initialImage, canvasSize]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.GRAY_50 }} edges={['bottom']}>
      <CommonHeader
        title="Edit"
        onBackPress={() => navigation?.goBack?.()}
        rightComponent={
          <CommonHeaderButton
            title="완료"
            onPress={submitAsStory}
            loading={isUploading}
          />
        }
      />
      <View style={styles.container}>

        <CanvasSurface
          elements={elements}
          strokes={strokes}
          drawColor={drawColor}
          drawWidth={drawWidth}
          isDrawing={isDrawing}
          canvasRef={canvasRef}
          colors={colors}
          backgroundColor={canvasBackgroundColor}
          onStrokeAdd={addStrokeJS}
          canvasSize={canvasSize}
          onCanvasSizeChange={setCanvasSize}
          onUpdatePos={updateElementPosition}
          onUpdateScale={updateElementScale}
          onUpdateRotation={updateElementRotation}
          onSelectElement={setSelectedIdJS}
          onEditText={openEditModalJS}
          selectedId={selectedId}
        />

        {!isDrawing ? (
          <BottomToolbar
            strokesCount={strokes.length}
            hasSelectedElement={!!selectedId}
            hasSelectedText={hasSelectedText}
            onPressBackgroundColor={() => setShowColorModal(true)}
            onPressTextColor={() => setShowTextColorModal(true)}
            onPressSave={exportAsImage}
            onPressDraw={() => setIsDrawing(true)}
            onPressText={addTextBox}
            onPressSticker={pickImage}
            onPressClear={() => setStrokes([])}
            onBringForward={() => selectedId && bringForward(selectedId)}
            onSendBackward={() => selectedId && sendBackward(selectedId)}
            onDeleteSelected={deleteSelected}
          />
        ) : (
          <DrawingToolbar
            drawColor={drawColor}
            drawWidth={drawWidth}
            strokesCount={strokes.length}
            onChangeColor={setDrawColor}
            onChangeWidth={setDrawWidth}
            onUndo={undoLastStroke}
            onDone={() => setIsDrawing(false)}
          />
        )}

        <TextModal
          visible={showTextModal}
          value={modalTextInput}
          placeholder="Type something..."
          onChangeText={setModalTextInput}
          onConfirm={confirmAddText}
          onCancel={() => {
            setShowTextModal(false);
            setEditingElementId(null);
            setModalTextInput('');
          }}
        />

        <ColorModal
          visible={showColorModal}
          selectedColor={canvasBackgroundColor}
          onSelectColor={c => { setCanvasBackgroundColor(c); setShowColorModal(false); }}
          onClose={() => setShowColorModal(false)}
        />

        <TextColorModal
          visible={showTextColorModal}
          selectedColor={currentTextColor}
          onSelectColor={c => { updateTextColor(c); setShowTextColorModal(false); }}
          onClose={() => setShowTextColorModal(false)}
        />

        {/* Custom Alert Modal */}
        {alertModal && (
          <CustomAlertModal
            visible={alertModal.visible}
            title={alertModal.title}
            message={alertModal.message}
            buttons={alertModal.buttons}
            onClose={() => setAlertModal(null)}
          />
        )}
      </View>

      {/* <LoadingOverlay
        visible={isUploading}
        message="스토리를 생성하고 있습니다..."
      /> */}
    </SafeAreaView>
  </GestureHandlerRootView>
  );
}

const ElementWrapper = React.memo<ElementWrapperProps>(function ElementWrapper(props) {
  const {
    el,
    colors,
    canvasSize,
    onSelect,
    onEditText,
    isDrawing,
    isSelected,
    onUpdatePos,
    onUpdateScale,
    onUpdateRotation,
  } = props;

  if (canvasSize.width <= 0 || canvasSize.height <= 0) {
    return null;
  }

  const styles = useMemo(() => createStyles(colors), [colors]);

  const elementId = el.id;
  const elementType = el.type;
  const initialPos = el.pos;
  const initialScale = el.scale ?? 1;
  const initialRotation = el.rotation ?? 0;

  // 처음 렌더 시 props 기반 px 위치
  const percentToPx = (p: PercentPos) => ({
    x: p.left * canvasSize.width,
    y: p.top * canvasSize.height,
  });
  const initialPosPx = percentToPx(initialPos);

  // ✅ shared values
  const baseX = useSharedValue(initialPosPx.x); // 항상 "기준 위치"를 들고 있음
  const baseY = useSharedValue(initialPosPx.y);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const baseScale = useSharedValue(initialScale);
  const pinchScale = useSharedValue(1);

  const baseRotation = useSharedValue(initialRotation);
  const rotateZ = useSharedValue(0);

  // props가 바뀌었을 때도 shared value 동기화 (예: 초기 이미지 배치 변경)
  useEffect(() => {
    const px = percentToPx(initialPos);
    baseX.value = px.x;
    baseY.value = px.y;
  }, [initialPos.left, initialPos.top, baseX, baseY, canvasSize.width, canvasSize.height]);

  useEffect(() => {
    baseScale.value = initialScale;
  }, [initialScale, baseScale]);

  useEffect(() => {
    baseRotation.value = initialRotation;
  }, [initialRotation, baseRotation]);

  // 🟡 Pan: 이동
  const pan = Gesture.Pan()
    .enabled(!isDrawing)
    .onUpdate(e => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd(() => {
      // 최종 px 위치 = base + translation
      const finalX = baseX.value + translateX.value;
      const finalY = baseY.value + translateY.value;

      // 먼저 shared value 기준 위치를 바꿔주고
      baseX.value = finalX;
      baseY.value = finalY;

      // 제스처 offset은 0으로
      translateX.value = 0;
      translateY.value = 0;

      // JS용 PercentPos 저장
      const newPos: PercentPos = {
        left: finalX / canvasSize.width,
        top: finalY / canvasSize.height,
      };
      runOnJS(onUpdatePos)(elementId, newPos);
    });

  // 🟡 Pinch: 확대/축소
  const pinch = Gesture.Pinch()
    .enabled(!isDrawing)
    .onUpdate(e => {
      pinchScale.value = e.scale;
    })
    .onEnd(() => {
      const newScale = baseScale.value * pinchScale.value;
      baseScale.value = newScale;
      pinchScale.value = 1;
      runOnJS(onUpdateScale)(elementId, newScale);
    });

  // 🟡 Rotation: 회전
  const rotation = Gesture.Rotation()
    .enabled(!isDrawing)
    .onUpdate(e => {
      const deg = (e.rotation * 180) / Math.PI;
      rotateZ.value = deg;
    })
    .onEnd(() => {
      const newRotation = baseRotation.value + rotateZ.value;
      baseRotation.value = newRotation;
      rotateZ.value = 0;
      runOnJS(onUpdateRotation)(elementId, newRotation);
    });

  const composedGesture = Gesture.Simultaneous(pan, pinch, rotation);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      // ✅ baseX/baseY + translation 으로 최종 위치
      { translateX: baseX.value + translateX.value },
      { translateY: baseY.value + translateY.value },
      { scale: baseScale.value * pinchScale.value },
      { rotateZ: `${baseRotation.value + rotateZ.value}deg` },
    ],
  }));

  const handlePress = () => {
    if (isDrawing) return;
    onSelect(elementId);

    if (elementType === 'text') {
      const textEl = el as TextElement;
      onEditText(elementId, textEl.text);
    }
  };

  if (elementType === 'sticker') {
    const sticker = el as StickerElement;
    const aspect = sticker.aspect ?? 1;
    const baseW = sticker.baseW ?? STICKER_BASE_W;

    const content = (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <Image
          source={{ uri: sticker.uri }}
          style={{ width: baseW, height: baseW * aspect }}
          resizeMode="contain"
        />
      </TouchableOpacity>
    );

    if (isDrawing) {
      // 그리는 중에는 제스처 없이, baseX/baseY만 사용
      return (
        <Animated.View
          style={[
            styles.elementWrapper,
            {
              borderWidth: 2,
              borderColor: isSelected ? colors.PRIMARY : 'transparent',
              borderRadius: 8,
            },
            // 그리는 중에도 위치와 회전/크기는 기존 상태 유지
            {
              transform: [
                { translateX: baseX.value },
                { translateY: baseY.value },
                { scale: baseScale.value },
                { rotateZ: `${baseRotation.value}deg` },
              ],
            },
          ]}
        >
          {content}
        </Animated.View>
      );
    }

    return (
      <GestureDetector gesture={composedGesture}>
        <Animated.View
          style={[
            styles.elementWrapper,
            {
              borderWidth: 2,
              borderColor: isSelected ? colors.PRIMARY : 'transparent',
              borderRadius: 8,
            },
            animatedStyle,
          ]}
        >
          {content}
        </Animated.View>
      </GestureDetector>
    );
  }

  const textEl = el as TextElement;

  const textContent = (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <View style={styles.textBox}>
        <Text style={[styles.textDisplay, {color: textEl.color || colors.GRAY_900}]}>{textEl.text}</Text>
      </View>
    </TouchableOpacity>
  );

  if (isDrawing) {
    return (
      <Animated.View
        style={[
          styles.elementWrapper,
          {
            borderWidth: 2,
            borderColor: isSelected ? colors.PRIMARY : 'transparent',
            borderRadius: 12,
          },
          {
            transform: [
              { translateX: baseX.value },
              { translateY: baseY.value },
              { scale: baseScale.value },
              { rotateZ: `${baseRotation.value}deg` },
            ],
          },
        ]}
      >
        {textContent}
      </Animated.View>
    );
  }

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        style={[
          styles.elementWrapper,
          {
            borderWidth: 2,
            borderColor: isSelected ? colors.PRIMARY : 'transparent',
            borderRadius: 12,
          },
          animatedStyle,
        ]}
      >
        {textContent}
      </Animated.View>
    </GestureDetector>
  );
});

const createStyles = (colors: Record<string, string>, backgroundColor?: string) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.GRAY_50
  },

  submitButton: {
    padding: SPACING.XS,
  },

  // Canvas
  canvas: {
    flex: 1,
    backgroundColor: colors.WHITE,
    margin: SPACING.MD,
    borderRadius: BORDER_RADIUS.LG,
    overflow: 'hidden',
  },
  canvasInner: {
    flex: 1,
    backgroundColor: backgroundColor || colors.GRAY_100,
  },

  // Elements
  elementWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickerBorder: {
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: BORDER_RADIUS.SM,
  },
  textBox: {
    padding: SPACING.SM,
    minWidth: 100,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: BORDER_RADIUS.MD,
  },
  textDisplay: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.GRAY_900,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Instagram Style Bottom Toolbar
  bottomToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.SM,
    backgroundColor: colors.WHITE,
    borderTopWidth: 0.5,
    borderTopColor: colors.GRAY_200,
    minHeight: 90,
  },
  toolItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  toolIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.XS,
  },
  toolLabel: {
    fontSize: 11,
    color: colors.GRAY_900,
    marginTop: 2,
  },

  // Instagram Style Bottom Toolbar Container
  bottomToolbarContainer: {
    backgroundColor: colors.WHITE,
    borderTopWidth: 0.5,
    borderTopColor: colors.GRAY_200,
    minHeight: 90,
  },

  // Drawing Toolbar - Compact Instagram Style
  drawingToolbar: {
    backgroundColor: colors.WHITE,
    borderTopWidth: 0.5,
    borderTopColor: colors.GRAY_200,
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
  },
  drawingTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.MD,
  },
  colorPaletteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCircleActive: {
    borderColor: colors.GRAY_900,
    borderWidth: 3,
  },
  widthPaletteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.XS,
  },
  widthLabel: {
    fontSize: 12,
    color: colors.GRAY_400,
    marginRight: SPACING.XS,
  },
  widthCircle: {
    borderRadius: 999,
    opacity: 0.4,
  },
  widthCircleActive: {
    opacity: 1,
    borderWidth: 2,
    borderColor: colors.GRAY_900,
  },
  drawingTopScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: SPACING.MD,
  },
  drawingActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.SM,
    gap: SPACING.MD,
  },
  drawingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.XS,
    paddingHorizontal: SPACING.MD,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: BORDER_RADIUS.ROUND,
    gap: SPACING.XS,
    minWidth: 80,
  },
  drawingButtonDisabled: {
    opacity: 0.3,
  },
  drawingButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.GRAY_900,
  },
  drawingButtonTextDisabled: {
    color: colors.GRAY_600,
  },

  // Save Button (하단 툴바용)
  saveIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.XS,
  },
  saveLabel: {
    fontSize: 11,
    color: colors.PRIMARY,
    fontWeight: '600',
    marginTop: 2,
  },

  // Color Modal
  colorModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorModalContent: {
    backgroundColor: colors.WHITE,
    padding: SPACING.XL,
    borderRadius: BORDER_RADIUS.LG,
    alignItems: 'center',
  },
  colorModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.GRAY_900,
    marginBottom: SPACING.MD,
  },
  colorPaletteModalRow: {
    flexDirection: 'row',
    gap: SPACING.SM,
  },
  colorCircleModal: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCircleModalActive: {
    borderColor: colors.GRAY_900,
    borderWidth: 3,
  },

  // Simplified Text Modal
  simpleModalOverlay: {
    flex: 1,
    // backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.XL,
  },
  simpleModalInputWrapper: {
    width: '100%',
    maxWidth: 400,
  },
  simpleModalInput: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.WHITE,
    textAlign: 'center',
    minHeight: 80,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: BORDER_RADIUS.LG,
    // borderWidth: 2,
    // borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});

import 'react-native-reanimated';
import 'react-native-gesture-handler';
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, Dimensions, Alert, Modal } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import { captureRef } from 'react-native-view-shot';
import Svg, { Path } from 'react-native-svg';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import { useThemeStore } from '../stores/themeStore';
import { SPACING, BORDER_RADIUS, BG_COLORS, COLORS } from '../constants/theme';
import CommonHeader from '../components/CommonHeader';

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

const TrashIcon = ({ size = 20, color = '#000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

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
};

type Stroke = { id: string; points: { x: number; y: number }[]; color: string; width: number };

type Props = {
  route?: { params?: { imageUri?: string } };
  navigation?: any;
};

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const STICKER_BASE_W = 200;
const CANVAS_MARGIN = 0;

export default function CanvasEditorScreen({ route, navigation }: Props) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const initialImage = route?.params?.imageUri ?? null;
  const canvasRef = useRef<View>(null);

  const [elements, setElements] = useState<Array<StickerElement | TextElement>>([]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [drawColor, setDrawColor] = useState('#000000');
  const [drawWidth, setDrawWidth] = useState(4);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [showTextModal, setShowTextModal] = useState(false);
  const [modalTextInput, setModalTextInput] = useState('');
  const [editingElementId, setEditingElementId] = useState<string | null>(null);

  const drawingPoints = useSharedValue<{ x: number; y: number }[]>([]);
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const percentToPx = (p: PercentPos) => ({ left: p.left * SCREEN_W, top: p.top * SCREEN_H });

  const addSticker = (uri: string) => {
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
      } as StickerElement,
    ]);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      addSticker(uri);
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

  const exportAsImage = async () => {
    try {
      if (!canvasRef.current) return;

      const uri = await captureRef(canvasRef, { format: 'png', quality: 0.9 });

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Permission to access media library is required to save the image.');
        return;
      }

      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('CanvasExports', asset, false).catch(() => {});

      Alert.alert('Saved', 'Image saved to your gallery.');
      navigation?.navigate?.('Somewhere', { exportedUri: uri });
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to export');
    }
  };

  const startDrawing = useCallback((x: number, y: number, color: string, width: number) => {
    const stroke: Stroke = {
      id: `s-${Date.now()}`,
      points: [{ x, y }],
      color,
      width,
    };
    setCurrentStroke(stroke);
  }, []);

  const updateDrawing = useCallback((points: { x: number; y: number }[]) => {
    setCurrentStroke(prev => prev ? { ...prev, points } : null);
  }, []);

  const finishDrawing = useCallback(() => {
    setCurrentStroke(prev => {
      if (prev && prev.points.length > 1) setStrokes(s => [...s, prev]);
      return null;
    });
  }, []);

  const undoLastStroke = useCallback(() => {
    setStrokes(prev => prev.slice(0, -1));
  }, []);

  const panForDrawing = Gesture.Pan()
    .enabled(isDrawing)
    .onBegin(e => {
      'worklet';
      drawingPoints.value = [{ x: e.x, y: e.y }];
      runOnJS(startDrawing)(e.x, e.y, drawColor, drawWidth);
    })
    .onUpdate(e => {
      'worklet';
      const newPoints = [...drawingPoints.value, { x: e.x, y: e.y }];
      drawingPoints.value = newPoints;
      runOnJS(updateDrawing)(newPoints);
    })
    .onEnd(() => {
      'worklet';
      runOnJS(finishDrawing)();
      drawingPoints.value = [];
    })
    .onFinalize(() => { 'worklet'; drawingPoints.value = []; });

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
        const aspect = h / w;
        const baseW = canvasSize.width;
        const baseH = baseW * aspect;

        const leftPx = CANVAS_MARGIN;
        const topPx = Math.max(0, (canvasSize.height - baseH) / 2);

        const leftPercent = leftPx / SCREEN_W;
        const topPercent  = topPx / SCREEN_H;

        setElements([{
          id: 'sticker-0',
          type: 'sticker',
          uri: initialImage,
          aspect,
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

  const ElementWrapper: React.FC<{ el: StickerElement | TextElement; colors: Record<string, string> }> = ({ el, colors }) => {
    const elementId = el.id;
    const elementType = el.type;
    const initialPos = el.pos;
    const initialScale = el.scale ?? 1;
    const initialRotation = (el.rotation ?? 0) * (Math.PI / 180);

    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const scale = useSharedValue(1);
    const rotation = useSharedValue(0);

    const baseScale = useSharedValue(initialScale);
    const baseRotation = useSharedValue(initialRotation);
    const startPosX = useSharedValue(0);
    const startPosY = useSharedValue(0);
    const isActive = useSharedValue(false);

    const tap = Gesture.Tap()
      .enabled(!isDrawing && elementType === 'text')
      .maxDuration(200)
      .onEnd(() => {
        'worklet';
        if (elementType === 'text') {
          const textEl = el as TextElement;
          runOnJS(openEditModalJS)(elementId, textEl.text);
        }
      });

    const pan = Gesture.Pan()
      .enabled(!isDrawing)
      .minDistance(1)
      .onBegin(() => {
        'worklet';
        isActive.value = true;
        runOnJS(setSelectedIdJS)(elementId);
        startPosX.value = initialPos.left * SCREEN_W;
        startPosY.value = initialPos.top * SCREEN_H;
      })
      .onUpdate(e => { 'worklet'; translateX.value = e.translationX; translateY.value = e.translationY; })
      .onEnd(() => {
        'worklet';
        const newLeftPx = startPosX.value + translateX.value;
        const newTopPx = startPosY.value + translateY.value;
        runOnJS(updateElementPosition)(elementId, { left: newLeftPx / SCREEN_W, top: newTopPx / SCREEN_H });
        translateX.value = 0;
        translateY.value = 0;
      })
      .onFinalize(() => { 'worklet'; isActive.value = false; });

    const pinch = Gesture.Pinch()
      .enabled(!isDrawing)
      .onBegin(() => { 'worklet'; isActive.value = true; runOnJS(setSelectedIdJS)(elementId); })
      .onUpdate(e => { 'worklet'; scale.value = e.scale; })
      .onEnd(() => {
        'worklet';
        const newScale = baseScale.value * scale.value;
        runOnJS(updateElementScale)(elementId, newScale);
        baseScale.value = newScale;
        scale.value = 1;
      })
      .onFinalize(() => { 'worklet'; isActive.value = false; });

    const rotationGesture = Gesture.Rotation()
      .enabled(!isDrawing)
      .onBegin(() => { 'worklet'; isActive.value = true; runOnJS(setSelectedIdJS)(elementId); })
      .onUpdate(e => { 'worklet'; rotation.value = e.rotation; })
      .onEnd(() => {
        'worklet';
        const newRotation = baseRotation.value + rotation.value;
        runOnJS(updateElementRotation)(elementId, (newRotation * 180) / Math.PI);
        baseRotation.value = newRotation;
        rotation.value = 0;
      })
      .onFinalize(() => { 'worklet'; isActive.value = false; });

    const panPinchRotate = Gesture.Simultaneous(pan, pinch, rotationGesture);
    const composed = Gesture.Exclusive(tap, panPinchRotate);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${baseRotation.value + rotation.value}rad` },
        { scale: baseScale.value * scale.value },
      ],
    }));

    const borderStyle = useAnimatedStyle(() => ({
      borderColor: isActive.value ? colors.PRIMARY : 'transparent',
    }));

    const posPx = percentToPx(initialPos);

    if (elementType === 'sticker') {
      const sticker = el as StickerElement;
      const aspect = sticker.aspect ?? 1;
      const baseW = sticker.baseW ?? STICKER_BASE_W;

      return (
        <GestureDetector gesture={composed} key={elementId}>
          <Animated.View style={[styles.elementWrapper, { left: posPx.left, top: posPx.top }, animatedStyle]}>
            <Animated.View style={[styles.stickerBorder, borderStyle]}>
              <Image
                source={{ uri: sticker.uri }}
                style={{ width: baseW, height: baseW * aspect }}
                resizeMode="contain"
              />
            </Animated.View>
          </Animated.View>
        </GestureDetector>
      );
    }

    const textEl = el as TextElement;
    return (
      <GestureDetector gesture={composed} key={elementId}>
        <Animated.View style={[styles.elementWrapper, { left: posPx.left, top: posPx.top }, animatedStyle]}>
          <Animated.View style={[styles.textBox, borderStyle]}>
            <Text style={styles.textDisplay}>{textEl.text}</Text>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    );
  };

  const pointsToPath = (pts: { x: number; y: number }[]) => {
    if (!pts.length) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  };

  const colorPresets = ['#000000', '#FFFFFF', '#FF0000', '#00AA00', '#0000FF', '#FFFF00', '#FF1493'];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.GRAY_50 }} edges={['bottom']}>
      <CommonHeader
        title="Edit"
        onBackPress={() => navigation?.goBack?.()}
        rightComponent={
          <TouchableOpacity onPress={exportAsImage} style={styles.doneButton}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        }
      />
      <View style={styles.container}>

        <GestureDetector gesture={panForDrawing}>
          <View ref={canvasRef} collapsable={false} style={styles.canvas}>
            <View
              style={styles.canvasInner}
              onLayout={e => {
                const { width, height } = e.nativeEvent.layout;
                setCanvasSize({ width, height });
              }}
            >
              {elements.map(el => <ElementWrapper el={el} colors={colors} key={el.id} />)}

              <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
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
                {currentStroke && currentStroke.points.length > 0 && (
                  <Path
                    d={pointsToPath(currentStroke.points)}
                    strokeWidth={currentStroke.width}
                    stroke={currentStroke.color}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </Svg>
            </View>
          </View>
        </GestureDetector>

        {/* Instagram Style Bottom Toolbar */}
        {!isDrawing ? (
          <View style={styles.bottomToolbar}>
            <TouchableOpacity style={styles.toolItem} onPress={() => setIsDrawing(true)}>
              <View style={styles.toolIconWrapper}>
                <PencilIcon size={26} color={colors.GRAY_900} />
              </View>
              <Text style={styles.toolLabel}>Draw</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolItem} onPress={addTextBox}>
              <View style={styles.toolIconWrapper}>
                <TextIcon size={26} color={colors.GRAY_900} />
              </View>
              <Text style={styles.toolLabel}>Text</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolItem} onPress={pickImage}>
              <View style={styles.toolIconWrapper}>
                <ImageIcon size={26} color={colors.GRAY_900} />
              </View>
              <Text style={styles.toolLabel}>Sticker</Text>
            </TouchableOpacity>

            {selectedId && (
              <>
                <TouchableOpacity style={styles.toolItem} onPress={() => bringForward(selectedId)}>
                  <View style={styles.toolIconWrapper}>
                    <LayerUpIcon size={22} color={colors.GRAY_900} />
                  </View>
                  <Text style={styles.toolLabel}>Forward</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.toolItem} onPress={() => sendBackward(selectedId)}>
                  <View style={styles.toolIconWrapper}>
                    <LayerDownIcon size={22} color={colors.GRAY_900} />
                  </View>
                  <Text style={styles.toolLabel}>Backward</Text>
                </TouchableOpacity>
              </>
            )}

            {strokes.length > 0 && (
              <TouchableOpacity style={styles.toolItem} onPress={() => setStrokes([])}>
                <View style={styles.toolIconWrapper}>
                  <TrashIcon size={22} color={colors.ERROR} />
                </View>
                <Text style={[styles.toolLabel, { color: colors.ERROR }]}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.drawingToolbar}>
            <View style={styles.drawingTop}>
              <View style={styles.colorPaletteRow}>
                {colorPresets.map(c => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setDrawColor(c)}
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
                <Text style={styles.widthLabel}>Size:</Text>
                {[2, 4, 6, 8, 10].map(size => (
                  <TouchableOpacity
                    key={size}
                    onPress={() => setDrawWidth(size)}
                    style={[
                      styles.widthCircle,
                      { width: size * 4, height: size * 4, backgroundColor: colors.WHITE },
                      drawWidth === size && styles.widthCircleActive
                    ]}
                  />
                ))}
              </View>
            </View>

            <View style={styles.drawingActions}>
              <TouchableOpacity
                style={[styles.drawingButton, strokes.length === 0 && styles.drawingButtonDisabled]}
                onPress={undoLastStroke}
                disabled={strokes.length === 0}
              >
                <UndoIcon size={22} color={strokes.length > 0 ? colors.GRAY_900 : colors.GRAY_600} />
                <Text style={[styles.drawingButtonText, strokes.length === 0 && styles.drawingButtonTextDisabled]}>
                  Undo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawingButton}
                onPress={() => setIsDrawing(false)}
              >
                <CloseIcon size={22} color={colors.GRAY_900} />
                <Text style={styles.drawingButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Simplified Text Modal */}
        <Modal
          visible={showTextModal}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowTextModal(false);
            setEditingElementId(null);
            setModalTextInput('');
          }}
        >
          <TouchableOpacity
            style={styles.simpleModalOverlay}
            activeOpacity={1}
            onPress={() => {
              if (modalTextInput.trim()) {
                confirmAddText();
              } else {
                setShowTextModal(false);
                setEditingElementId(null);
                setModalTextInput('');
              }
            }}
          >
            <View style={styles.simpleModalInputWrapper}>
              <TextInput
                autoFocus
                multiline
                placeholder="Type something..."
                placeholderTextColor={colors.GRAY_400}
                value={modalTextInput}
                onChangeText={setModalTextInput}
                style={styles.simpleModalInput}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.GRAY_50
  },


  doneButton: {
    padding: SPACING.XS,
  },
  doneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3897F0',
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
    backgroundColor: colors.GRAY_100,
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

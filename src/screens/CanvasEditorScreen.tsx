import 'react-native-reanimated';
import 'react-native-gesture-handler';
import React, { useRef, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Button, Image, TextInput, TouchableOpacity, Dimensions, Alert, Modal } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS, withSpring } from 'react-native-reanimated';
import { captureRef } from 'react-native-view-shot';
import Svg, { Path } from 'react-native-svg';
import * as MediaLibrary from 'expo-media-library';

// Types
type PercentPos = { left: number; top: number };

type StickerElement = {
  id: string;
  type: 'sticker';
  uri: string;
  pos: PercentPos;
  rotation: number;
  scale: number;
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

export default function CanvasEditorScreen({ route, navigation }: Props) {
  const initialImage = route?.params?.imageUri ?? null;
  const canvasRef = useRef<View>(null);

  const [elements, setElements] = useState<Array<StickerElement | TextElement>>(() => {
    if (initialImage) {
      return [
        {
          id: `sticker-0`,
          type: 'sticker',
          uri: initialImage,
          pos: { left: 0.1, top: 0.1 },
          rotation: 0,
          scale: 0.6,
        } as StickerElement,
      ];
    }
    return [];
  });

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [drawColor, setDrawColor] = useState('#000000');
  const [drawWidth, setDrawWidth] = useState(3);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // 텍스트 입력 모달
  const [showTextModal, setShowTextModal] = useState(false);
  const [modalTextInput, setModalTextInput] = useState('');
  const [editingElementId, setEditingElementId] = useState<string | null>(null);

  const drawingPoints = useSharedValue<{ x: number; y: number }[]>([]);

  const percentToPx = (p: PercentPos) => ({ left: p.left * SCREEN_W, top: p.top * SCREEN_H });

  const addSticker = (uri: string) => {
    setElements(prev => [
      ...prev,
      {
        id: `sticker-${Date.now()}`,
        type: 'sticker',
        uri,
        pos: { left: 0.2, top: 0.2 },
        rotation: 0,
        scale: 0.5,
      } as StickerElement,
    ]);
  };

  const addTextBox = () => {
    setEditingElementId(null);
    setModalTextInput('');
    setShowTextModal(true);
  };

  const confirmAddText = () => {
    if (editingElementId) {
      // 기존 텍스트 수정
      if (modalTextInput.trim()) {
        setElements(prev => prev.map(el => 
          el.id === editingElementId && el.type === 'text'
            ? { ...el, text: modalTextInput }
            : el
        ));
      }
    } else {
      // 새 텍스트 추가
      if (modalTextInput.trim()) {
        const newId = `text-${Date.now()}`;
        setElements(prev => [
          ...prev,
          {
            id: newId,
            type: 'text',
            text: modalTextInput,
            pos: { left: 0.2, top: 0.4 },
            rotation: 0,
            scale: 1,
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

  // Drawing callbacks
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
    setCurrentStroke(prev => {
      if (!prev) return null;
      return { ...prev, points };
    });
  }, []);

  const finishDrawing = useCallback(() => {
    setCurrentStroke(prev => {
      if (prev && prev.points.length > 1) {
        setStrokes(s => [...s, prev]);
      }
      return null;
    });
  }, []);

  // ---------- Drawing gesture ----------
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
    .onFinalize(() => {
      'worklet';
      drawingPoints.value = [];
    });

  // Element update callbacks
  const updateElementPosition = useCallback((id: string, newPos: PercentPos) => {
    setElements(prev => prev.map(el => 
      el.id === id ? { ...el, pos: newPos } : el
    ));
  }, []);

  const updateElementScale = useCallback((id: string, newScale: number) => {
    setElements(prev => prev.map(el => 
      el.id === id ? { ...el, scale: newScale } : el
    ));
  }, []);

  const updateElementRotation = useCallback((id: string, newRotation: number) => {
    setElements(prev => prev.map(el => 
      el.id === id ? { ...el, rotation: newRotation } : el
    ));
  }, []);

  const setSelectedIdJS = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const openEditModalJS = useCallback((id: string, currentText: string) => {
    setEditingElementId(id);
    setModalTextInput(currentText);
    setShowTextModal(true);
  }, []);

  // ---------- Element wrapper with Instagram-style gestures ----------
  const ElementWrapper: React.FC<{ el: StickerElement | TextElement }> = ({ el }) => {
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
    
    // 제스처 시작 시점의 위치 저장
    const startPosX = useSharedValue(0);
    const startPosY = useSharedValue(0);
    
    // 터치 활성화 상태 (손가락이 화면에 닿아있는 동안)
    const isActive = useSharedValue(false);

    // Tap gesture - 텍스트 수정 (텍스트 요소에만)
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

    // Pan gesture - 이동
    const pan = Gesture.Pan()
      .enabled(!isDrawing)
      .minDistance(1) // 1px 이상 이동해야 Pan으로 인식 (Tap과 구분)
      .onBegin(() => {
        'worklet';
        isActive.value = true;
        runOnJS(setSelectedIdJS)(elementId);
        startPosX.value = initialPos.left * SCREEN_W;
        startPosY.value = initialPos.top * SCREEN_H;
      })
      .onUpdate(e => {
        'worklet';
        translateX.value = e.translationX;
        translateY.value = e.translationY;
      })
      .onEnd(() => {
        'worklet';
        const newLeftPx = startPosX.value + translateX.value;
        const newTopPx = startPosY.value + translateY.value;
        const newPosLeft = newLeftPx / SCREEN_W;
        const newPosTop = newTopPx / SCREEN_H;
        
        runOnJS(updateElementPosition)(elementId, { left: newPosLeft, top: newPosTop });
        
        translateX.value = 0;
        translateY.value = 0;
      })
      .onFinalize(() => {
        'worklet';
        isActive.value = false;
      });

    // Pinch gesture - 확대/축소
    const pinch = Gesture.Pinch()
      .enabled(!isDrawing)
      .onBegin(() => {
        'worklet';
        isActive.value = true;
        runOnJS(setSelectedIdJS)(elementId);
      })
      .onUpdate(e => {
        'worklet';
        scale.value = e.scale;
        // Pinch의 focal point를 이용한 위치 조정
        const focalX = e.focalX;
        const focalY = e.focalY;
        const centerX = startPosX.value + translateX.value;
        const centerY = startPosY.value + translateY.value;
        
        // focal point 기준으로 이동 보정
        translateX.value += (focalX - centerX) * (1 - e.scale) * 0.1;
        translateY.value += (focalY - centerY) * (1 - e.scale) * 0.1;
      })
      .onEnd(() => {
        'worklet';
        const newScale = baseScale.value * scale.value;
        runOnJS(updateElementScale)(elementId, newScale);
        baseScale.value = newScale;
        scale.value = 1;
      })
      .onFinalize(() => {
        'worklet';
        isActive.value = false;
      });

    // Rotation gesture - 회전
    const rotationGesture = Gesture.Rotation()
      .enabled(!isDrawing)
      .onBegin(() => {
        'worklet';
        isActive.value = true;
        runOnJS(setSelectedIdJS)(elementId);
      })
      .onUpdate(e => {
        'worklet';
        rotation.value = e.rotation;
      })
      .onEnd(() => {
        'worklet';
        const newRotation = baseRotation.value + rotation.value;
        const rotationDegrees = (newRotation * 180) / Math.PI;
        runOnJS(updateElementRotation)(elementId, rotationDegrees);
        baseRotation.value = newRotation;
        rotation.value = 0;
      })
      .onFinalize(() => {
        'worklet';
        isActive.value = false;
      });

    // Tap과 다른 제스처들을 분리: Tap이 먼저 확인되고, 실패하면 나머지 실행
    const panPinchRotate = Gesture.Simultaneous(pan, pinch, rotationGesture);
    const composed = Gesture.Exclusive(tap, panPinchRotate);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [
          { translateX: translateX.value },
          { translateY: translateY.value },
          { rotate: `${baseRotation.value + rotation.value}rad` },
          { scale: baseScale.value * scale.value },
        ],
      };
    });
    
    const borderStyle = useAnimatedStyle(() => {
      return {
        borderColor: isActive.value ? '#007AFF' : 'transparent',
      };
    });

    const posPx = percentToPx(initialPos);

    if (elementType === 'sticker') {
      return (
        <GestureDetector gesture={composed} key={elementId}>
          <Animated.View style={[styles.elementWrapper, { left: posPx.left, top: posPx.top }, animatedStyle]}>
            <Animated.View style={[styles.stickerBorder, borderStyle]}>
              <Image 
                source={{ uri: (el as StickerElement).uri }} 
                style={styles.stickerImage} 
                resizeMode="contain" 
              />
            </Animated.View>
          </Animated.View>
        </GestureDetector>
      );
    }

    // Text element - 이제 편집 불가, 순수 제스처만
    const textEl = el as TextElement;
    
    return (
      <GestureDetector gesture={composed} key={elementId}>
        <Animated.View 
          style={[
            styles.elementWrapper, 
            { left: posPx.left, top: posPx.top },
            animatedStyle
          ]}
        >
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

  const colorPresets = ['#000000', '#FF0000', '#00AA00', '#0000FF', '#FFFF00'];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.container}>
        <View style={styles.toolbar}>
          <Button title="Add text" onPress={addTextBox} />
          <Button title="Export & Save" onPress={exportAsImage} />
          <Button title={isDrawing ? 'Stop drawing' : 'Draw'} onPress={() => setIsDrawing(v => !v)} />
        </View>

        {isDrawing && (
          <View style={styles.drawControls}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {colorPresets.map(c => (
                <TouchableOpacity 
                  key={c} 
                  onPress={() => setDrawColor(c)} 
                  style={[
                    styles.colorSwatch, 
                    { backgroundColor: c, borderWidth: drawColor === c ? 3 : 0, borderColor: '#007AFF' }
                  ]} 
                />
              ))}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ marginRight: 8 }}>Width</Text>
              <Button title="-" onPress={() => setDrawWidth(w => Math.max(1, w - 1))} />
              <Text style={{ marginHorizontal: 8 }}>{drawWidth}px</Text>
              <Button title="+" onPress={() => setDrawWidth(w => Math.min(50, w + 1))} />
            </View>
          </View>
        )}

        <GestureDetector gesture={panForDrawing}>
          <View ref={canvasRef} collapsable={false} style={styles.canvas}>
            <View style={styles.canvasInner}>
              {elements.map(el => (
                <ElementWrapper el={el} key={el.id} />
              ))}

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

        <View style={styles.footer}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Button
              title="Bring forward"
              disabled={!selectedId}
              onPress={() => selectedId && bringForward(selectedId)}
            />
            <Button
              title="Send backward"
              disabled={!selectedId}
              onPress={() => selectedId && sendBackward(selectedId)}
            />
            <Button title="Clear strokes" onPress={() => setStrokes([])} />
          </View>
        </View>

        {/* 텍스트 입력 모달 */}
        <Modal
          visible={showTextModal}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowTextModal(false);
            setEditingElementId(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingElementId ? '텍스트 수정' : '텍스트 입력'}
              </Text>
              <TextInput
                autoFocus
                multiline
                placeholder="텍스트를 입력하세요"
                value={modalTextInput}
                onChangeText={setModalTextInput}
                style={styles.modalInput}
              />
              <View style={styles.modalButtons}>
                <Button 
                  title="취소" 
                  onPress={() => {
                    setShowTextModal(false);
                    setEditingElementId(null);
                    setModalTextInput('');
                  }} 
                />
                <Button title={editingElementId ? '수정' : '추가'} onPress={confirmAddText} />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eee' },
  toolbar: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', padding: 8 },
  drawControls: { padding: 8, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  canvas: { flex: 1, margin: 12, backgroundColor: 'white', borderRadius: 8, overflow: 'hidden' },
  canvasInner: { flex: 1 },
  elementWrapper: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  stickerImage: { width: 200, height: 200 },
  textBox: { 
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  stickerBorder: {
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 4,
  },
  textInput: { 
    minHeight: 40, 
    fontSize: 16,
    color: '#000',
  },
  textDisplay: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  footer: { height: 64, alignItems: 'center', justifyContent: 'center' },
  selectedBorder: { borderColor: '#007AFF' },
  editingBorder: { borderWidth: 2, borderColor: '#FF3B30' },
  colorSwatch: { width: 28, height: 28, marginHorizontal: 6, borderRadius: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});
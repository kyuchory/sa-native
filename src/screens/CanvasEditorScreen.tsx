import 'react-native-reanimated';
import 'react-native-gesture-handler';
import React, { useRef, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Button, Image, TextInput, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
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
  widthPercent: number;
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

  // Drawing state를 shared value로 관리
  const drawingPoints = useSharedValue<{ x: number; y: number }[]>([]);

  const percentToPx = (p: PercentPos) => ({ left: p.left * SCREEN_W, top: p.top * SCREEN_H });
  const pxToPercent = (x: number, y: number): PercentPos => ({ left: x / SCREEN_W, top: y / SCREEN_H });

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
    setElements(prev => [
      ...prev,
      {
        id: `text-${Date.now()}`,
        type: 'text',
        text: 'Edit me',
        pos: { left: 0.2, top: 0.4 },
        rotation: 0,
        scale: 1,
        widthPercent: 0.5,
      } as TextElement,
    ]);
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

  // ---------- Drawing handlers ----------
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

  const updateElementsJS = useCallback((updater: (prev: Array<StickerElement | TextElement>) => Array<StickerElement | TextElement>) => {
    setElements(updater);
  }, []);

  const setSelectedIdJS = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  // ---------- Element gesturing helpers ----------
  const ElementWrapper: React.FC<{ el: StickerElement | TextElement; index: number }> = ({ el, index }) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const scale = useSharedValue(el.scale ?? 1);
    const rotation = useSharedValue((el.rotation ?? 0) * (Math.PI / 180));
    const initialScale = useSharedValue(el.scale ?? 1);
    const initialRotation = useSharedValue((el.rotation ?? 0) * (Math.PI / 180));

    const pan = Gesture.Pan()
      .enabled(!isDrawing)
      .onBegin(() => {
        'worklet';
        runOnJS(setSelectedIdJS)(el.id);
      })
      .onUpdate(e => {
        'worklet';
        translateX.value = e.translationX;
        translateY.value = e.translationY;
      })
      .onEnd(() => {
        'worklet';
        const posPx = percentToPx(el.pos);
        const newLeftPx = posPx.left + translateX.value;
        const newTopPx = posPx.top + translateY.value;
        const newPos = pxToPercent(newLeftPx, newTopPx);
        
        runOnJS(updateElementsJS)((prev) => {
          const copy = [...prev];
          const item = { ...copy[index] } as any;
          item.pos = newPos;
          copy[index] = item;
          return copy;
        });
        
        translateX.value = 0;
        translateY.value = 0;
      });

    const pinch = Gesture.Pinch()
      .enabled(!isDrawing)
      .onStart(() => {
        'worklet';
        initialScale.value = el.scale ?? 1;
      })
      .onUpdate(e => {
        'worklet';
        scale.value = initialScale.value * e.scale;
      })
      .onEnd(() => {
        'worklet';
        runOnJS(updateElementsJS)((prev) => {
          const copy = [...prev];
          const item = { ...copy[index] } as any;
          item.scale = scale.value;
          copy[index] = item;
          return copy;
        });
        initialScale.value = scale.value;
      });

    const rotationGesture = Gesture.Rotation()
      .enabled(!isDrawing)
      .onStart(() => {
        'worklet';
        initialRotation.value = (el.rotation ?? 0) * (Math.PI / 180);
      })
      .onUpdate(e => {
        'worklet';
        rotation.value = initialRotation.value + e.rotation;
      })
      .onEnd(() => {
        'worklet';
        const rotationDegrees = (rotation.value * 180) / Math.PI;
        runOnJS(updateElementsJS)((prev) => {
          const copy = [...prev];
          const item = { ...copy[index] } as any;
          item.rotation = rotationDegrees;
          copy[index] = item;
          return copy;
        });
        initialRotation.value = rotation.value;
      });

    const resizeHandleX = useSharedValue(0);

    const resizePan = Gesture.Pan()
      .onUpdate(e => {
        'worklet';
        resizeHandleX.value = e.translationX;
      })
      .onEnd(() => {
        'worklet';
        if (el.type === 'text') {
          const deltaPx = resizeHandleX.value;
          const deltaPercent = deltaPx / SCREEN_W;
          
          runOnJS(updateElementsJS)((prev) => {
            const copy = [...prev];
            const item = { ...copy[index] } as TextElement;
            let newWidth = item.widthPercent + deltaPercent;
            newWidth = Math.max(0.15, Math.min(0.95, newWidth));
            item.widthPercent = newWidth;
            copy[index] = item;
            return copy;
          });
        }
        resizeHandleX.value = 0;
      });

    const composed = Gesture.Simultaneous(pan, pinch, rotationGesture);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [
          { translateX: translateX.value },
          { translateY: translateY.value },
          { rotate: `${rotation.value}rad` },
          { scale: scale.value },
        ],
      };
    });

    const posPx = percentToPx(el.pos);
    const isSelected = selectedId === el.id;

    if (el.type === 'sticker') {
      return (
        <GestureDetector gesture={composed} key={el.id}>
          <Animated.View style={[styles.elementWrapper, { left: posPx.left, top: posPx.top }, animatedStyle]}>
            <TouchableOpacity activeOpacity={1} onPress={() => setSelectedId(el.id)}>
              <Image 
                source={{ uri: el.uri }} 
                style={[styles.stickerImage, isSelected && styles.selectedBorder]} 
                resizeMode="contain" 
              />
            </TouchableOpacity>
          </Animated.View>
        </GestureDetector>
      );
    }

    return (
      <GestureDetector gesture={composed} key={el.id}>
        <Animated.View 
          style={[
            styles.elementWrapper, 
            { left: posPx.left, top: posPx.top, width: el.widthPercent * SCREEN_W }, 
            animatedStyle
          ]}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => setSelectedId(el.id)}>
            <View style={[styles.textBox, isSelected && styles.selectedBorder, { width: el.widthPercent * SCREEN_W }]}> 
              <TextInput
                multiline
                value={el.text}
                onChangeText={text => {
                  setElements(prev => {
                    const copy = [...prev];
                    (copy[index] as TextElement).text = text;
                    return copy;
                  });
                }}
                style={styles.textInput}
              />
            </View>
          </TouchableOpacity>

          {isSelected && (
            <GestureDetector gesture={resizePan}>
              <View style={styles.resizeHandle} />
            </GestureDetector>
          )}
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
              {elements.map((el, i) => (
                <ElementWrapper el={el} index={i} key={el.id} />
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
  textBox: { minHeight: 40, padding: 4, backgroundColor: 'rgba(255,255,255,0.9)' },
  textInput: { minHeight: 40, padding: 8 },
  resizeHandle: { width: 20, height: 20, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.3)', position: 'absolute', right: -10, bottom: -10 },
  footer: { height: 64, alignItems: 'center', justifyContent: 'center' },
  selectedBorder: { borderWidth: 2, borderColor: '#007AFF' },
  colorSwatch: { width: 28, height: 28, marginHorizontal: 6, borderRadius: 4 },
});
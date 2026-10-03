import React from 'react';
import { Modal, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import RemoteImage from './RemoteImage';
import { useTheme } from '../contexts/ThemeContext';

function clamp(value, min, max) {
  'worklet';
  return Math.max(min, Math.min(max, value));
}

function boundOffset(value, imageSize, viewportSize, scale) {
  'worklet';
  const limit = Math.max(0, (imageSize * scale - viewportSize) / 2);
  return clamp(value, -limit, limit);
}

export default function ProductImageViewer({ images, initialIndex = 0, onClose }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = React.useState(clamp(initialIndex, 0, Math.max(0, images.length - 1)));
  const [size, setSize] = React.useState({ width: 0, height: 0 });
  const changeImage = (direction) => setIndex((current) => clamp(current + direction, 0, images.length - 1));

  React.useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    return () => StatusBar.setBarStyle(theme.dark ? 'light-content' : 'dark-content');
  }, [theme.dark]);

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.root}>
        <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right }]} accessibilityViewIsModal onAccessibilityEscape={onClose}>
          <View style={styles.header}>
            <Control icon="chevron-left" label="Previous image" disabled={index === 0} onPress={() => changeImage(-1)} />
            <Text style={styles.counter}>{index + 1} / {images.length}</Text>
            <Control icon="chevron-right" label="Next image" disabled={index >= images.length - 1} onPress={() => changeImage(1)} />
            <Control icon="close" label="Close image viewer" onPress={onClose} />
          </View>
          <View style={styles.stage} onLayout={({ nativeEvent: { layout } }) => {
            setSize((previous) => previous.width === layout.width && previous.height === layout.height
              ? previous : { width: layout.width, height: layout.height });
          }}>
            {size.width > 0 && size.height > 0 && images[index] ? (
              <ZoomableImage
                key={`${index}-${size.width}-${size.height}`}
                source={images[index]?.url || images[index]}
                width={size.width}
                height={size.height}
                onSwipe={changeImage}
              />
            ) : null}
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

function ZoomableImage({ source, width, height, onSwipe }) {
  const [zoom, setZoom] = React.useState(1);
  const [imageSize, setImageSize] = React.useState({ width, height });
  const scale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const startScale = useSharedValue(1);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  // Reserve room for controls; the measured image viewport excludes them.
  const imageHeight = Math.max(1, height - 80);
  const fit = Math.min(width / imageSize.width, imageHeight / imageSize.height);
  const fittedWidth = imageSize.width * fit;
  const fittedHeight = imageSize.height * fit;

  const pinch = Gesture.Pinch()
    .onStart((event) => {
      cancelAnimation(scale);
      cancelAnimation(x);
      cancelAnimation(y);
      startScale.value = scale.value;
      startX.value = x.value;
      startY.value = y.value;
      focalX.value = event.focalX - width / 2;
      focalY.value = event.focalY - imageHeight / 2;
    })
    .onUpdate((event) => {
      const next = clamp(startScale.value * event.scale, 1, 4);
      const ratio = next / startScale.value;
      x.value = boundOffset(event.focalX - width / 2 - (focalX.value - startX.value) * ratio, fittedWidth, width, next);
      y.value = boundOffset(event.focalY - imageHeight / 2 - (focalY.value - startY.value) * ratio, fittedHeight, imageHeight, next);
      scale.value = next;
    })
    .onFinalize(() => { runOnJS(setZoom)(scale.value); });

  const pan = Gesture.Pan().maxPointers(1).minDistance(8)
    .onStart(() => {
      cancelAnimation(x);
      cancelAnimation(y);
      startX.value = x.value;
      startY.value = y.value;
    })
    .onUpdate((event) => {
      if (scale.value <= 1) return;
      x.value = boundOffset(startX.value + event.translationX, fittedWidth, width, scale.value);
      y.value = boundOffset(startY.value + event.translationY, fittedHeight, imageHeight, scale.value);
    })
    .onEnd((event) => {
      if (scale.value <= 1 && Math.abs(event.translationX) > 50 && Math.abs(event.translationX) > Math.abs(event.translationY)) {
        runOnJS(onSwipe)(event.translationX < 0 ? 1 : -1);
      }
    });

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value }],
  }));

  const setMagnification = (value) => {
    const next = clamp(value, 1, 4);
    scale.value = withTiming(next, { duration: 180 });
    x.value = withTiming(boundOffset(x.value, fittedWidth, width, next), { duration: 180 });
    y.value = withTiming(boundOffset(y.value, fittedHeight, imageHeight, next), { duration: 180 });
    setZoom(next);
  };

  return (
    <View style={styles.root}>
      <GestureDetector gesture={Gesture.Simultaneous(pinch, pan)}>
        <View collapsable={false} style={[styles.viewport, { width, height: imageHeight }]}>
          <Animated.View style={[{ width, height: imageHeight }, imageStyle]}>
            <RemoteImage
              source={source}
              style={{ width, height: imageHeight }}
              resizeMode="contain"
              accessibilityLabel="Product image. Pinch with two fingers to zoom, or use the zoom controls."
              onLoad={({ nativeEvent }) => {
                const loaded = nativeEvent.source;
                if (loaded?.width > 0 && loaded?.height > 0) setImageSize({ width: loaded.width, height: loaded.height });
              }}
              fallback={<View style={styles.unavailable}><Text style={styles.counter}>Image unavailable</Text></View>}
            />
          </Animated.View>
        </View>
      </GestureDetector>
      <View style={styles.controls}>
        <Control icon="minus" label="Zoom out" disabled={zoom <= 1} onPress={() => setMagnification(zoom - 0.5)} />
        <Text style={styles.zoom} accessibilityLiveRegion="polite">{Math.round(zoom * 100)}%</Text>
        <Control icon="plus" label="Zoom in" disabled={zoom >= 4} onPress={() => setMagnification(zoom + 0.5)} />
        <Control icon="restore" label="Reset image zoom" disabled={zoom <= 1} onPress={() => setMagnification(1)} />
      </View>
    </View>
  );
}

function Control({ icon, label, onPress, disabled = false }) {
  return (
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[styles.button, disabled && styles.disabled]}>
      <MaterialCommunityIcons name={icon} size={24} color="#111317" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8, paddingVertical: 8 },
  counter: { flex: 1, textAlign: 'center', color: '#111317', fontSize: 16 },
  stage: { flex: 1 },
  viewport: { overflow: 'hidden', backgroundColor: '#FFFFFF' },
  controls: { height: 80, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF' },
  zoom: { minWidth: 52, textAlign: 'center', color: '#111317', fontSize: 16, fontWeight: '600' },
  button: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F1F4F8', justifyContent: 'center', alignItems: 'center' },
  disabled: { opacity: 0.35 },
  unavailable: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

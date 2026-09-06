import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, I18nManager, View, Text, Pressable, Image, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import Gradient from './Gradient';
import Button from './Button';
import RemoteImage from './RemoteImage';
import { optimizedImageUri } from '../config';
import { shadows } from '../theme';

const AUTO_PLAY_MS = 6500;
const GAP = 12;
const COPY = {
  en: { label: 'Featured collections', previous: 'Previous slide', next: 'Next slide', pause: 'Pause slideshow', play: 'Play slideshow' },
  ps: { label: 'ځانګړي محصولات', previous: 'مخکینی سلایډ', next: 'راتلونکی سلایډ', pause: 'سلایډونه ودروئ', play: 'سلایډونه پیل کړئ' },
  dr: { label: 'محصولات ویژه', previous: 'اسلاید قبلی', next: 'اسلاید بعدی', pause: 'توقف اسلایدها', play: 'پخش اسلایدها' },
};

export default function HomeHeroCarousel({ slides = [], primaryLabel, secondaryLabel, onPrimaryPress, onSecondaryPress, height }) {
  const { theme } = useTheme();
  const { isRTL, lang } = useLanguage();
  const focused = useIsFocused();
  const { width } = useWindowDimensions();
  const c = theme.colors;
  const copy = COPY[lang] || COPY.en;
  const items = Array.isArray(slides) ? slides.filter(Boolean) : [];
  const count = items.length;
  const cardWidth = Math.min(740, Math.max(0, width - 40));
  const inset = (width - cardWidth) / 2;
  const interval = cardWidth + GAP;
  const nativeRTL = I18nManager.isRTL;
  const list = useRef(null);
  const current = useRef(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [touching, setTouching] = useState(false);
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const [reduceMotion, setReduceMotion] = useState(true);
  const [screenReader, setScreenReader] = useState(true);
  const activeImage = items[active]?.image;
  const nextImage = items[(active + 1) % Math.max(1, count)]?.image;

  // Warm only the visible/next slide, not the entire promoted catalog.
  useEffect(() => {
    if (!focused || !foreground) return;
    [...new Set([activeImage, nextImage].filter(Boolean))].forEach(source => {
      Image.prefetch(optimizedImageUri(source, { width: 560, quality: 75 })).catch(() => {});
    });
  }, [activeImage, nextImage, focused, foreground]);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted) setReduceMotion(value); }).catch(() => {});
    AccessibilityInfo.isScreenReaderEnabled().then(value => { if (mounted) setScreenReader(value); }).catch(() => {});
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    const reader = AccessibilityInfo.addEventListener('screenReaderChanged', setScreenReader);
    const state = AppState.addEventListener('change', value => setForeground(value === 'active'));
    return () => { mounted = false; motion.remove(); reader.remove(); state.remove(); };
  }, []);

  const goTo = useCallback(index => {
    if (!count) return;
    const nextIndex = (index + count) % count;
    current.current = nextIndex;
    setActive(nextIndex);
    list.current?.scrollToOffset({ offset: nextIndex * interval, animated: !reduceMotion });
  }, [count, interval, reduceMotion]);

  // Keep the selected slide aligned after rotation or a CMS slide-count change.
  useEffect(() => {
    const nextIndex = Math.min(current.current, Math.max(0, count - 1));
    current.current = nextIndex;
    setActive(nextIndex);
    const frame = requestAnimationFrame(() => {
      scrollX.setValue(nativeRTL ? (count - 1 - nextIndex) * interval : nextIndex * interval);
      list.current?.scrollToOffset({ offset: nextIndex * interval, animated: false });
    });
    return () => cancelAnimationFrame(frame);
  }, [count, interval, isRTL, nativeRTL, scrollX]);

  useEffect(() => {
    if (count < 2 || paused || touching || !foreground || !focused || reduceMotion || screenReader) return undefined;
    const timer = setTimeout(() => goTo(current.current + 1), AUTO_PLAY_MS);
    return () => clearTimeout(timer);
  }, [active, count, paused, touching, foreground, focused, reduceMotion, screenReader, goTo]);

  const settle = event => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const offset = nativeRTL ? contentSize.width - layoutMeasurement.width - contentOffset.x : contentOffset.x;
    const index = Math.min(count - 1, Math.max(0, Math.round(offset / interval)));
    current.current = index;
    setActive(index);
  };
  const dotStart = Math.max(0, Math.min(active - 2, count - 5));
  const controlStyle = pressed => [styles.control, { backgroundColor: pressed ? c.brandSurface : c.card, borderColor: c.borderLight }];
  if (!count) return null;

  return (
    <View style={styles.carousel}>
      <Animated.FlatList
        key={isRTL ? 'rtl' : 'ltr'} ref={list} data={items} horizontal inverted={isRTL !== nativeRTL}
        style={styles.list} snapToInterval={interval} decelerationRate="fast"
        disableIntervalMomentum bounces={false} showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: inset, paddingVertical: 10 }}
        ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
        keyExtractor={(item, index) => String(item.id || item.title || 'collection') + '-' + index}
        getItemLayout={(_, index) => ({ length: interval, offset: interval * index, index })}
        onTouchStart={() => setTouching(true)} onTouchEnd={() => setTouching(false)} onTouchCancel={() => setTouching(false)}
        onScrollBeginDrag={() => setPaused(true)} onScrollEndDrag={settle} onMomentumScrollEnd={settle}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
        initialNumToRender={2} windowSize={3}
        renderItem={({ item, index }) => (
          <HeroSlide slide={item} width={cardWidth} minHeight={height} colors={c} dark={theme.dark}
            isRTL={isRTL} primaryLabel={primaryLabel} secondaryLabel={secondaryLabel}
            onPrimaryPress={onPrimaryPress} onSecondaryPress={onSecondaryPress} active={index === active} copy={copy}
            scale={reduceMotion ? 1 : scrollX.interpolate({ inputRange: [-1, 0, 1].map(delta => ((nativeRTL ? count - 1 - index : index) + delta) * interval), outputRange: [0.97, 1, 0.97], extrapolate: 'clamp' })}
          />
        )}
      />
      {count > 1 && (
        <View style={[styles.controls, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable accessibilityRole="button" accessibilityLabel={copy.previous} onPress={() => { setPaused(true); goTo(current.current - 1); }} style={({ pressed }) => controlStyle(pressed)}>
            <MaterialCommunityIcons name={isRTL ? 'arrow-right' : 'arrow-left'} size={19} color={c.text} />
          </Pressable>
          <View style={styles.pagination} accessible accessibilityLabel={copy.label + ': ' + (active + 1) + ' / ' + count}>
            <View style={[styles.dots, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {items.slice(dotStart, dotStart + 5).map((_, i) => (
                <View key={dotStart + i} style={[styles.dot, { width: dotStart + i === active ? 24 : 6, backgroundColor: dotStart + i === active ? c.primary : c.border }]} />
              ))}
            </View>
            <Text style={[styles.counter, { color: c.textMuted }]}>{String(active + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}</Text>
          </View>
          {!reduceMotion && !screenReader && (
            <Pressable accessibilityRole="button" accessibilityLabel={paused ? copy.play : copy.pause} onPress={() => setPaused(value => !value)} style={({ pressed }) => controlStyle(pressed)}>
              <MaterialCommunityIcons name={paused ? 'play' : 'pause'} size={19} color={c.text} />
            </Pressable>
          )}
          <Pressable accessibilityRole="button" accessibilityLabel={copy.next} onPress={() => { setPaused(true); goTo(current.current + 1); }} style={({ pressed }) => controlStyle(pressed)}>
            <MaterialCommunityIcons name={isRTL ? 'arrow-left' : 'arrow-right'} size={19} color={c.text} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

function HeroSlide({ slide, width, minHeight, colors: c, dark, isRTL, primaryLabel, secondaryLabel, onPrimaryPress, onSecondaryPress, scale, active, copy }) {
  const wide = width >= 600;
  return (
    <Animated.View accessibilityElementsHidden={!active} importantForAccessibility={active ? 'auto' : 'no-hide-descendants'} style={[styles.card, shadows.md, { width, minHeight, backgroundColor: c.card, borderColor: c.borderLight, transform: [{ scale }], flexDirection: wide ? (isRTL ? 'row-reverse' : 'row') : 'column' }]}>
      <Gradient colors={dark ? [c.secondary, '#182F60'] : ['#EAF0FF', '#DCE8FA']} style={[styles.media, { height: wide ? undefined : Math.min(240, Math.max(180, width * 0.53)), minHeight: wide ? 260 : undefined, width: wide ? '46%' : '100%' }]}>
        <View pointerEvents="none" style={styles.orbit} />
        <View pointerEvents="none" style={styles.orbitInner} />
        <View style={styles.imageFrame}>
          <RemoteImage source={slide.image} width={400} quality={72} resizeMode="contain" style={StyleSheet.absoluteFill} fallback={<MaterialCommunityIcons name="shopping-outline" size={64} color={dark ? c.heroTextMuted : c.primaryDark} />} />
          <RemoteImage source={slide.image} width={560} quality={75} resizeMode="contain" style={StyleSheet.absoluteFill} />
        </View>
      </Gradient>
      <View style={[styles.copy, wide && { flex: 1 }, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
        <View style={[styles.productMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {!!slide.subtitle && <Text numberOfLines={1} style={[styles.category, { color: c.textSecondary }]}>{slide.subtitle}</Text>}
          {!!slide.priceValue && <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.inlinePrice, { color: c.primary }]}>{slide.priceValue}</Text>}
        </View>
        <Text numberOfLines={2} style={[styles.title, { color: c.text, textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}>{slide.title}</Text>
        {!!slide.description && <Text numberOfLines={2} style={[styles.description, { color: c.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{slide.description}</Text>}
        <View style={[styles.actions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {!!primaryLabel && <Button title={primaryLabel} onPress={() => onPrimaryPress?.(slide)} style={{ flex: 1 }} icon={<MaterialCommunityIcons name="shopping-outline" size={18} color="#FFFFFF" />} />}
          {!!secondaryLabel && <Pressable accessibilityRole="button" accessibilityLabel={secondaryLabel} onPress={onSecondaryPress} style={({ pressed }) => [styles.secondary, { backgroundColor: pressed ? c.brandSurfaceStrong : c.brandSurface }]}><MaterialCommunityIcons name={isRTL ? 'arrow-left' : 'arrow-right'} size={22} color={c.primary} /></Pressable>}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  carousel: { paddingBottom: 4 },
  list: {},
  card: { borderRadius: 28, borderWidth: 1, overflow: 'hidden' },
  media: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  orbit: { position: 'absolute', width: 260, height: 260, borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)', borderRadius: 130, transform: [{ translateX: 65 }, { translateY: 12 }] },
  orbitInner: { position: 'absolute', width: 205, height: 205, backgroundColor: 'rgba(255,255,255,0.23)', borderRadius: 104 },
  imageFrame: { position: 'absolute', top: 12, bottom: 12, left: 16, right: 16, alignItems: 'center', justifyContent: 'center' },
  productMeta: { alignSelf: 'stretch', alignItems: 'center', gap: 12 },
  category: { flex: 1, fontSize: 12, fontWeight: '600' },
  inlinePrice: { maxWidth: '60%', fontSize: 19, fontWeight: '800' },
  badge: { position: 'absolute', top: 14, maxWidth: '82%', backgroundColor: '#FFFFFF', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 },
  badgeText: { color: '#17339B', fontSize: 11, fontWeight: '700' },
  price: { position: 'absolute', bottom: 12, maxWidth: '60%', backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 16 },
  priceLabel: { color: '#44515D', fontSize: 10, fontWeight: '600' },
  priceValue: { color: '#17339B', fontSize: 19, fontWeight: '800', marginTop: 2 },
  copy: { padding: 16, gap: 6 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 0.7 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.3 },
  description: { fontSize: 13, lineHeight: 20 },
  actions: { alignSelf: 'stretch', alignItems: 'center', gap: 10, marginTop: 8 },
  secondary: { width: 52, height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  controls: { marginHorizontal: 24, marginTop: 2, alignItems: 'center', gap: 8 },
  control: { width: 44, height: 44, borderWidth: 1, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  pagination: { flex: 1, gap: 5, alignItems: 'center' },
  dots: { alignItems: 'center', gap: 5 },
  dot: { height: 5, borderRadius: 4 },
  counter: { fontSize: 10, fontWeight: '600', fontVariant: ['tabular-nums'] },
});

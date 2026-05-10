import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import BrandLogo from './BrandLogo';
import { optimizedImageUri } from '../config';
import { spacing, fontSize, fontWeight, borderRadius, shadows } from '../theme';

const AUTO_PLAY_MS = 5200;
const GAP = spacing.base;

export default function HomeHeroCarousel({
  slides,
  primaryLabel,
  secondaryLabel,
  onPrimaryPress,
  onSecondaryPress,
  height: propHeight,
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { width } = useWindowDimensions();
  const listRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const currentIndexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const cardWidth = useMemo(() => Math.max(width - (spacing.base * 2) - 8, 280), [width]);
  const snapInterval = cardWidth + GAP;

  const defaultHeight = useMemo(() => {
    // Keep enough vertical room so headline, description, and CTA row never clip.
    const h = Math.round(cardWidth * 0.86);
    return Math.min(440, Math.max(320, h));
  }, [cardWidth]);

  const slideHeight = propHeight || defaultHeight;

  useEffect(() => {
    const heroUris = (slides || [])
      .map((slide) => optimizedImageUri(slide?.image, { width: 1200 }))
      .filter(Boolean);

    heroUris.forEach((uri) => {
      Image.prefetch(uri).catch(() => {});
    });
  }, [slides]);

  useEffect(() => {
    if (!slides?.length || slides.length < 2) return undefined;

    const timer = setInterval(() => {
      const nextIndex = (currentIndexRef.current + 1) % slides.length;
      listRef.current?.scrollToOffset({ offset: nextIndex * snapInterval, animated: true });
      currentIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
    }, AUTO_PLAY_MS);

    return () => clearInterval(timer);
  }, [slides, snapInterval]);

  const handleMomentumEnd = (event) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / snapInterval);
    currentIndexRef.current = nextIndex;
    setActiveIndex(nextIndex);
  };

  return (
    <View>
      <Animated.FlatList
        ref={listRef}
        data={slides}
        horizontal
        bounces={false}
        removeClippedSubviews={false}
        windowSize={3}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        snapToInterval={snapInterval}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
        keyExtractor={(item, index) => `${item.title || 'slide'}-${index}`}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumEnd}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true },
        )}
        renderItem={({ item, index }) => (
          <HeroSlide
            index={index}
            scrollX={scrollX}
            snapInterval={snapInterval}
            width={cardWidth}
            height={slideHeight}
            slide={item}
            primaryLabel={primaryLabel}
            secondaryLabel={secondaryLabel}
            onPrimaryPress={onPrimaryPress}
            onSecondaryPress={onSecondaryPress}
            colors={c}
            isDarkTheme={theme.dark}
          />
        )}
      />

      <View style={styles.pagination}>
        {slides.map((slide, index) => (
          <View
            key={`${slide.title || 'dot'}-${index}`}
            style={[
              styles.dot,
              {
                backgroundColor: index === activeIndex ? c.primary : c.border,
                width: index === activeIndex ? 26 : 8,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function HeroSlide({
  index,
  scrollX,
  snapInterval,
  width,
  height,
  slide,
  primaryLabel,
  secondaryLabel,
  onPrimaryPress,
  onSecondaryPress,
  colors,
  isDarkTheme,
}) {
  const inputRange = [
    (index - 1) * snapInterval,
    index * snapInterval,
    (index + 1) * snapInterval,
  ];

  const cardTranslateX = scrollX.interpolate({
    inputRange,
    outputRange: [34, 0, -34],
    extrapolate: 'clamp',
  });
  const cardTranslateY = scrollX.interpolate({
    inputRange,
    outputRange: [10, 0, 10],
    extrapolate: 'clamp',
  });
  const cardScale = scrollX.interpolate({
    inputRange,
    outputRange: [0.93, 1, 0.93],
    extrapolate: 'clamp',
  });
  const cardOpacity = scrollX.interpolate({
    inputRange,
    outputRange: [0.74, 1, 0.74],
    extrapolate: 'clamp',
  });
  const cardRotateY = scrollX.interpolate({
    inputRange,
    outputRange: ['8deg', '0deg', '-8deg'],
    extrapolate: 'clamp',
  });

  const contentOpacity = scrollX.interpolate({
    inputRange,
    outputRange: [0.6, 1, 0.6],
    extrapolate: 'clamp',
  });
  const contentTranslateY = scrollX.interpolate({
    inputRange,
    outputRange: [26, 0, -10],
    extrapolate: 'clamp',
  });
  const contentTranslateX = scrollX.interpolate({
    inputRange,
    outputRange: [-18, 0, 18],
    extrapolate: 'clamp',
  });

  const imageTranslateX = scrollX.interpolate({
    inputRange,
    outputRange: [74, 0, -74],
    extrapolate: 'clamp',
  });
  const imageTranslateY = scrollX.interpolate({
    inputRange,
    outputRange: [12, 0, 12],
    extrapolate: 'clamp',
  });
  const imageScale = scrollX.interpolate({
    inputRange,
    outputRange: [0.88, 1.02, 0.88],
    extrapolate: 'clamp',
  });
  const imageRotate = scrollX.interpolate({
    inputRange,
    outputRange: ['6deg', '0deg', '-6deg'],
    extrapolate: 'clamp',
  });

  const priceTranslateY = scrollX.interpolate({
    inputRange,
    outputRange: [24, 0, -24],
    extrapolate: 'clamp',
  });
  const priceScale = scrollX.interpolate({
    inputRange,
    outputRange: [0.9, 1, 0.9],
    extrapolate: 'clamp',
  });

  const imageUri = slide.image ? optimizedImageUri(slide.image, { width: 1200 }) : null;
  const compactLayout = height < 360;
  const cardBackground = isDarkTheme ? colors.secondary : colors.brandSurfaceStrong;
  const titleColor = isDarkTheme ? '#FFFFFF' : colors.text;
  const descriptionColor = isDarkTheme ? '#D6E5FF' : colors.textSecondary;
  const badgeBackground = isDarkTheme ? 'rgba(255,255,255,0.12)' : 'rgba(33,68,200,0.14)';
  const badgeTextColor = isDarkTheme ? '#D6E5FF' : colors.primaryDark;
  const secondaryBorder = isDarkTheme ? 'rgba(255,255,255,0.34)' : 'rgba(33,68,200,0.22)';
  const secondaryBackground = isDarkTheme ? 'transparent' : 'rgba(255,255,255,0.72)';
  const secondaryTextColor = isDarkTheme ? '#FFFFFF' : colors.primaryDark;
  const primaryBackground = isDarkTheme ? '#FFFFFF' : colors.primary;
  const primaryTextColor = isDarkTheme ? colors.primary : '#FFFFFF';
  const glowSecondaryBackground = isDarkTheme ? 'rgba(255,255,255,0.06)' : 'rgba(33,68,200,0.08)';
  const priceCardBackground = isDarkTheme ? '#FFFFFF' : 'rgba(255,255,255,0.95)';

  return (
    <Animated.View
      style={[
        styles.slide,
        {
          width,
          height,
          backgroundColor: cardBackground,
          opacity: cardOpacity,
          transform: [
            { perspective: 1200 },
            { translateX: cardTranslateX },
            { translateY: cardTranslateY },
            { scale: cardScale },
            { rotateY: cardRotateY },
          ],
        },
        shadows.lg,
      ]}
    >
      <View style={[styles.glowPrimary, { backgroundColor: colors.primary + '24' }]} />
      <View style={[styles.glowSecondary, { backgroundColor: glowSecondaryBackground }]} />
      <BrandLogo variant="symbol" size={86} style={styles.mark} />

      {imageUri ? (
        <Animated.Image
          source={{ uri: imageUri }}
          resizeMode="contain"
          style={[
            styles.productImage,
            {
              transform: [
                { translateX: imageTranslateX },
                { translateY: imageTranslateY },
                { scale: imageScale },
                { rotate: imageRotate },
              ],
            },
          ]}
          onError={(e) => {
            if (__DEV__) {
              console.warn('Hero image failed to load', imageUri, e.nativeEvent?.error);
            }
          }}
        />
      ) : null}

      <Animated.View
        style={[
          styles.copyWrap,
          compactLayout ? styles.copyWrapCompact : null,
          {
            opacity: contentOpacity,
            transform: [{ translateX: contentTranslateX }, { translateY: contentTranslateY }],
          },
        ]}
      >
        <View style={[styles.badge, { backgroundColor: badgeBackground }]}>
          <Text style={[styles.badgeText, { color: badgeTextColor }]}>{slide.subtitle}</Text>
        </View>
        <Text style={[styles.title, compactLayout ? styles.titleCompact : null, { color: titleColor }]} numberOfLines={3}>{slide.title}</Text>
        <Text style={[styles.description, { color: descriptionColor }]} numberOfLines={compactLayout ? 1 : 2}>{slide.description}</Text>

        <View style={[styles.buttonRow, compactLayout ? styles.buttonRowCompact : null]}>
          <TouchableOpacity activeOpacity={0.9} onPress={onPrimaryPress} style={[styles.primaryButton, { backgroundColor: primaryBackground }]}> 
            <Text style={[styles.primaryButtonText, { color: primaryTextColor }]}>{primaryLabel}</Text>
            <MaterialCommunityIcons name="arrow-right" size={16} color={primaryTextColor} />
          </TouchableOpacity>
          {!compactLayout ? (
            <TouchableOpacity activeOpacity={0.9} onPress={onSecondaryPress} style={[styles.secondaryButton, { borderColor: secondaryBorder, backgroundColor: secondaryBackground }]}> 
              <Text style={[styles.secondaryButtonText, { color: secondaryTextColor }]}>{secondaryLabel}</Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color={secondaryTextColor} />
            </TouchableOpacity>
          ) : null}
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.priceCard,
          {
            backgroundColor: priceCardBackground,
            transform: [{ translateY: priceTranslateY }, { scale: priceScale }],
          },
          shadows.md,
        ]}
      >
        <Text style={[styles.priceLabel, { color: colors.textMuted }]}>{slide.priceLabel}</Text>
        <Text style={[styles.priceValue, { color: colors.primary }]}>{slide.priceValue}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  contentContainer: { paddingHorizontal: spacing.base },
  slide: {
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
    padding: spacing.xl,
  },
  glowPrimary: {
    position: 'absolute',
    top: -54,
    right: -18,
    width: 210,
    height: 210,
    borderRadius: 105,
  },
  glowSecondary: {
    position: 'absolute',
    bottom: -74,
    left: -54,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  mark: {
    position: 'absolute',
    right: spacing.lg,
    top: spacing.lg,
    opacity: 0.1,
  },
  copyWrap: {
    width: '62%',
    zIndex: 2,
  },
  copyWrapCompact: {
    width: '64%',
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: fontSize.hero,
    fontWeight: fontWeight.heavy,
    lineHeight: 46,
    marginTop: spacing.base,
  },
  titleCompact: {
    fontSize: fontSize.xxxl,
    lineHeight: 40,
  },
  description: {
    fontSize: fontSize.base,
    lineHeight: 24,
    marginTop: spacing.base,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: spacing.lg,
  },
  buttonRowCompact: {
    marginTop: spacing.md,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.full,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  primaryButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: borderRadius.full,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  secondaryButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  productImage: {
    position: 'absolute',
    right: -8,
    bottom: 8,
    width: '54%',
    height: '70%',
    zIndex: 1,
  },
  priceCard: {
    position: 'absolute',
    right: spacing.lg,
    top: spacing.xl,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    zIndex: 3,
  },
  priceLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  priceValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.heavy,
    marginTop: 2,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.base,
    marginBottom: spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 999,
  },
});
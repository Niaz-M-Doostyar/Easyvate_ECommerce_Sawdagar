import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { formatPrice } from '../config';
import RemoteImage from './RemoteImage';
import PressableScale from './PressableScale';
import { spacing, fontSize, fontWeight, borderRadius, shadows } from '../theme';

export default function ProductCard({ product, onPress, style }) {
  const { width: viewportWidth } = useWindowDimensions();
  const { theme } = useTheme();
  const { t, getName, isRTL } = useLanguage();
  const { addItem } = useCart();
  const toast = useToast();
  const c = theme.colors;
  const productImages = Array.isArray(product.images) ? product.images : [];
  const primaryImage = productImages[0]?.url || product.image || product.thumbnail || null;
  const secondaryImage = productImages.find((entry, index) => index > 0 && entry?.url)?.url || null;
  const hasDiscount = product.wholesaleCost && product.retailPrice && product.wholesaleCost > product.retailPrice;
  const discount = hasDiscount ? Math.round((1 - product.retailPrice / product.wholesaleCost) * 100) : 0;
  const categoryName = product.category ? getName(product.category) : '';
  const available = product.stock == null || product.stock > 0;
  const [adding, setAdding] = useState(false);
  const [measuredWidth, setMeasuredWidth] = useState(0);

  const flattenedStyle = StyleSheet.flatten(style) || {};
  const styleWidth = typeof flattenedStyle.width === 'number' ? flattenedStyle.width : 0;
  // Match the two-column phone grid before the first layout measurement.
  const inferredGridWidth = viewportWidth < 768
    ? Math.max(0, (viewportWidth - spacing.base * 2 - spacing.md) / 2)
    : 0;
  const cardWidth = styleWidth || measuredWidth || inferredGridWidth;
  const compact = cardWidth > 0 && cardWidth < 150;
  const dynamicNameFontSize = compact ? fontSize.sm : fontSize.base;
  const dynamicInfoPadding = (() => {
    if (!cardWidth) return spacing.md;
    if (cardWidth < 160) return spacing.sm;
    if (cardWidth < 220) return spacing.sm + 2;
    return spacing.md;
  })();
  const textAlignment = { textAlign: isRTL ? 'right' : 'left' };
  const stockColor = available
    ? (theme.dark ? c.success : '#087443')
    : (theme.dark ? c.error : '#B42318');

  const handleAddToCart = async () => {
    if (adding) return;
    if (!available) {
      toast.info(t.outOfStock);
      return;
    }

    setAdding(true);
    try {
      await addItem(product, 1);
      toast.success('Added to cart');
    } catch (error) {
      toast.error(error.message || 'Could not add item');
    } finally {
      setAdding(false);
    }
  };

  return (
    <View
      style={[styles.card, shadows.sm, { backgroundColor: c.card, borderColor: c.borderLight }, style]}
      onLayout={(e) => {
        if (!styleWidth) setMeasuredWidth(Math.round(e.nativeEvent.layout.width));
      }}
    >
      <PressableScale scaleTo={0.985} onPress={onPress} accessibilityLabel={`${getName(product)}, ${formatPrice(product.retailPrice)}`} style={styles.productLink}>
        <View style={[styles.imgWrap, { backgroundColor: c.surfaceElevated }]}>
          {primaryImage ? (
            <RemoteImage
              source={primaryImage}
              fallbackSource={secondaryImage}
              width={400}
              quality={72}
              resizeMode="contain"
              style={styles.img}
              fallback={(
                <View style={[styles.img, styles.imageFallback, { backgroundColor: c.surfaceElevated }]}>
                  <MaterialCommunityIcons name="image-outline" size={34} color={c.textMuted} />
                </View>
              )}
            />
          ) : (
            <View style={[styles.img, styles.imageFallback, { backgroundColor: c.surfaceElevated }]}>
              <MaterialCommunityIcons name="image-outline" size={34} color={c.textMuted} />
            </View>
          )}
          {product.supplier?.supplierVerified ? (
            <View style={[styles.verifiedBadge, { backgroundColor: c.card, borderColor: c.borderLight }]}>
              <MaterialCommunityIcons name="check-decagram" size={16} color={theme.dark ? c.success : '#087443'} />
            </View>
          ) : null}
          {product.isSponsored && !compact && <View style={[styles.badge, { backgroundColor: c.primaryDark }]}><Text style={styles.badgeText}>{t.featured}</Text></View>}
          {discount > 0 && <View style={[styles.discBadge, { backgroundColor: c.primaryDark }]}><Text style={styles.badgeText}>-{discount}%</Text></View>}
        </View>
        <View style={[styles.info, { paddingHorizontal: dynamicInfoPadding }]}>
          {categoryName && !compact ? <Text numberOfLines={1} style={[styles.category, textAlignment, { color: c.textSecondary }]}>{categoryName}</Text> : null}
          <Text
            numberOfLines={2}
            allowFontScaling
            style={[styles.name, textAlignment, { color: c.text, fontSize: dynamicNameFontSize, minHeight: Math.round(dynamicNameFontSize * 1.4) * 2, lineHeight: Math.round(dynamicNameFontSize * 1.4) }]}
          >
            {getName(product)}
          </Text>
          <View style={styles.priceRow}>
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} style={[styles.price, compact && styles.priceCompact, { color: c.text }]}>{formatPrice(product.retailPrice)}</Text>
            {hasDiscount && !compact && <Text numberOfLines={1} style={[styles.oldPrice, { color: c.textSecondary }]}>{formatPrice(product.wholesaleCost)}</Text>}
          </View>
          {!compact ? <View style={styles.metaRow}>
            <View style={styles.stockPill}>
              <View style={[styles.stockDot, { backgroundColor: stockColor }]} />
              <Text numberOfLines={1} style={[styles.stock, { color: stockColor }]}>{available ? t.inStock : t.outOfStock}</Text>
            </View>
          </View> : null}
        </View>
      </PressableScale>

      <View style={[styles.actionWrap, compact && styles.actionWrapCompact]}>
        <PressableScale
          scaleTo={0.97}
          onPress={handleAddToCart}
          disabled={adding || !available}
          accessibilityRole="button"
          accessibilityLabel={available ? `${t.addToCart}: ${getName(product)}` : `${getName(product)}: ${t.outOfStock}`}
          accessibilityState={{ disabled: adding || !available, busy: adding }}
          style={[styles.addBtn, { backgroundColor: available ? c.primaryDark : c.surfaceElevated, borderBottomColor: available ? c.primaryDark : c.borderLight }, compact && styles.addBtnCompact]}
        >
          {available ? (
            <LinearGradient
              colors={[c.gradientStart, c.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.addBtnFill, compact && styles.addBtnFillCompact]}
            >
              {adding ? (
                <ActivityIndicator size="small" color={c.white} />
              ) : (
                <>
                  {!compact ? <MaterialCommunityIcons name="cart-plus" size={17} color={c.white} /> : null}
                  <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={compact ? 0.85 : 0.9} maxFontSizeMultiplier={1.15} style={[styles.addText, compact && styles.addTextCompact, { color: c.white }]}>{compact ? t.add : t.addToCart}</Text>
                </>
              )}
            </LinearGradient>
          ) : (
            <View style={[styles.addBtnFill, compact && styles.addBtnFillCompact]}>
              {!compact ? <MaterialCommunityIcons name="cart-off" size={17} color={c.textSecondary} /> : null}
              <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={compact ? 0.85 : 0.9} maxFontSizeMultiplier={1.15} style={[styles.addText, compact && styles.addTextCompact, { color: c.textSecondary }]}>{compact ? t.soldOut : t.outOfStock}</Text>
            </View>
          )}
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: borderRadius.xl, borderWidth: 1, marginBottom: spacing.md },
  productLink: { minWidth: 0 },
  imgWrap: { aspectRatio: 1, margin: 6, borderRadius: borderRadius.lg, padding: spacing.sm, overflow: 'hidden' },
  img: { width: '100%', height: '100%' },
  imageFallback: { justifyContent: 'center', alignItems: 'center' },
  badge: { position: 'absolute', top: 8, start: 8, maxWidth: '80%', paddingHorizontal: 8, paddingVertical: 4, borderRadius: borderRadius.sm },
  discBadge: { position: 'absolute', bottom: 8, start: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: borderRadius.sm },
  badgeText: { color: '#FFF', fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  verifiedBadge: { position: 'absolute', bottom: 8, end: 8, width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: borderRadius.full },
  info: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.md },
  category: { fontSize: fontSize.xs, fontWeight: fontWeight.medium, marginBottom: 5 },
  name: { fontWeight: fontWeight.semibold, marginBottom: spacing.sm },
  priceRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 6, rowGap: 3 },
  price: { maxWidth: '100%', fontSize: fontSize.md, fontWeight: fontWeight.heavy },
  priceCompact: { flexShrink: 1, fontSize: fontSize.sm },
  oldPrice: { maxWidth: '100%', fontSize: fontSize.xs, textDecorationLine: 'line-through' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  stockPill: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  stockDot: { width: 5, height: 5, borderRadius: borderRadius.full },
  stock: { flexShrink: 1, fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  actionWrap: { paddingHorizontal: spacing.sm, paddingBottom: spacing.sm },
  actionWrapCompact: { alignItems: 'stretch', paddingHorizontal: 6, paddingBottom: 10 },
  addBtn: { height: 46, borderRadius: borderRadius.md, borderBottomWidth: 3, overflow: 'hidden' },
  addBtnCompact: { width: '100%' },
  addBtnFill: { width: '100%', flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingHorizontal: spacing.sm },
  addBtnFillCompact: { paddingHorizontal: 6, gap: 4 },
  addText: { flexShrink: 1, fontSize: fontSize.sm, lineHeight: 18, fontWeight: fontWeight.bold, includeFontPadding: false, textAlignVertical: 'center' },
  addTextCompact: { flexShrink: 1, fontSize: 12, lineHeight: 16, textAlign: 'center' },
});

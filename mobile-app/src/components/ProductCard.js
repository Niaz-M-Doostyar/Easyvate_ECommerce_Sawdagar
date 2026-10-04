import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { formatPrice } from '../config';
import RemoteImage from './RemoteImage';
import PressableScale from './PressableScale';
import ProductQuickView, { previewCopy } from './ProductQuickView';
import { spacing, fontSize, fontWeight, borderRadius } from '../theme';

export default function ProductCard({ product, onPress, style }) {
  const { width: viewportWidth } = useWindowDimensions();
  const { theme } = useTheme();
  const { t, getName, isRTL, lang } = useLanguage();
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
  const [previewOpen, setPreviewOpen] = useState(false);
  const copy = previewCopy[lang] || previewCopy.en;
  const [measuredWidth, setMeasuredWidth] = useState(0);

  const flattenedStyle = StyleSheet.flatten(style) || {};
  const styleWidth = typeof flattenedStyle.width === 'number' ? flattenedStyle.width : 0;
  // Match the three-column phone grid before the first layout measurement.
  const inferredGridWidth = viewportWidth < 768
    ? Math.max(0, (viewportWidth - spacing.base * 2 - spacing.md * 2) / 3)
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
      toast.success(copy.added);
    } catch (error) {
      toast.error(error.message || copy.failed);
    } finally {
      setAdding(false);
    }
  };

  return (
    <View
      style={[styles.card, { backgroundColor: c.card, borderColor: c.borderLight }, style]}
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
        </View>
        <View style={[styles.info, { paddingHorizontal: dynamicInfoPadding }]}>
          {!compact ? <Text numberOfLines={1} style={[styles.category, textAlignment, { color: c.textSecondary }]}>{categoryName}</Text> : null}
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
          <View style={styles.badgeRow}>
            {product.supplier?.supplierVerified ? (
              <View accessibilityLabel="Verified supplier" style={[styles.verifiedBadge, { backgroundColor: theme.dark ? '#123C2B' : '#EAF7EF' }]}>
                <MaterialCommunityIcons name="check-decagram" size={14} color={theme.dark ? c.success : '#087443'} />
              </View>
            ) : null}
            {product.isSponsored && !compact && <View style={[styles.badge, { backgroundColor: c.brandSurface }]}><Text numberOfLines={1} style={[styles.badgeText, { color: theme.dark ? c.primary : c.primaryDark }]}>{t.featured}</Text></View>}
            {discount > 0 && <View style={[styles.discBadge, { backgroundColor: theme.dark ? '#123C2B' : '#EAF7EF' }]}><Text style={[styles.badgeText, { color: theme.dark ? c.success : '#087443' }]}>-{discount}%</Text></View>}
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
          hitSlop={{ top: 4, bottom: 4 }}
          onPress={() => setPreviewOpen(true)}
          accessibilityLabel={`${copy.quick}: ${getName(product)}`}
          style={({ pressed }) => [styles.quickView, { backgroundColor: pressed ? c.brandSurface : c.surfaceElevated }]}
        >
          <MaterialCommunityIcons name="eye-outline" size={16} color={c.primary} />
        </PressableScale>
        <PressableScale
          hitSlop={{ top: 4, bottom: 4 }}
          scaleTo={0.97}
          onPress={handleAddToCart}
          disabled={adding || !available}
          accessibilityRole="button"
          accessibilityLabel={available ? `${t.addToCart}: ${getName(product)}` : `${getName(product)}: ${t.outOfStock}`}
          accessibilityState={{ disabled: adding || !available, busy: adding }}
          style={[styles.addBtn, { backgroundColor: available ? c.primaryDark : c.surfaceElevated }, compact && styles.addBtnCompact]}
        >
          {available ? (
            <View
              style={[styles.addBtnFill, compact && styles.addBtnFillCompact]}
            >
              {adding ? (
                <ActivityIndicator size="small" color={c.white} />
              ) : (
                <>
                  <MaterialCommunityIcons name="plus" size={16} color={c.white} />
                  <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={compact ? 0.85 : 0.9} maxFontSizeMultiplier={1.15} style={[styles.addText, compact && styles.addTextCompact, { color: c.white }]}>{t.add}</Text>
                </>
              )}
            </View>
          ) : (
            <View style={[styles.addBtnFill, compact && styles.addBtnFillCompact]}>
              {!compact ? <MaterialCommunityIcons name="cart-off" size={17} color={c.textSecondary} /> : null}
              <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={compact ? 0.85 : 0.9} maxFontSizeMultiplier={1.15} style={[styles.addText, compact && styles.addTextCompact, { color: c.textSecondary }]}>{compact ? t.soldOut : t.outOfStock}</Text>
            </View>
          )}
        </PressableScale>
      </View>
      {previewOpen && <ProductQuickView product={product} onClose={() => setPreviewOpen(false)} onDetails={onPress} />}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1, marginBottom: spacing.md },
  productLink: { minWidth: 0, flex: 1 },
  imgWrap: { aspectRatio: 1, margin: 8, borderRadius: 12, padding: 8, overflow: 'hidden' },
  img: { width: '100%', height: '100%' },
  imageFallback: { justifyContent: 'center', alignItems: 'center' },
  badgeRow: { height: 24, flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  badge: { flexShrink: 1, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  discBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  verifiedBadge: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  info: { paddingHorizontal: spacing.md, paddingTop: 0, paddingBottom: 10 },
  category: { minHeight: 18, fontSize: fontSize.xs, fontWeight: fontWeight.medium, marginBottom: 5 },
  name: { fontWeight: fontWeight.semibold, marginBottom: spacing.sm },
  priceRow: { minHeight: 24, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 6, rowGap: 3 },
  price: { maxWidth: '100%', fontSize: fontSize.md, fontWeight: fontWeight.heavy },
  priceCompact: { flexShrink: 1, fontSize: fontSize.sm },
  oldPrice: { maxWidth: '100%', fontSize: fontSize.xs, textDecorationLine: 'line-through' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  stockPill: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  stockDot: { width: 5, height: 5, borderRadius: borderRadius.full },
  stock: { flexShrink: 1, fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  actionWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 12, paddingTop: 4, gap: 6 },
  quickView: { width: 32, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  quickText: { flexShrink: 1, fontSize: 13, fontWeight: '600' },
  actionWrapCompact: { paddingHorizontal: 8 },
  addBtn: { flex: 1, height: 36, borderRadius: 10, overflow: 'hidden' },
  addBtnCompact: { minWidth: 0 },
  addBtnFill: { width: '100%', flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingHorizontal: spacing.sm },
  addBtnFillCompact: { paddingHorizontal: 6, gap: 4 },
  addText: { flexShrink: 1, fontSize: fontSize.sm, lineHeight: 18, fontWeight: fontWeight.bold, includeFontPadding: false, textAlignVertical: 'center' },
  addTextCompact: { flexShrink: 1, fontSize: 14, lineHeight: 20, textAlign: 'center' },
});

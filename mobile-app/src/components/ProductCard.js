import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
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
  // Product grids are three columns on phones. Infer that width on the first
  // render so cards do not flash from the roomy layout into the compact one
  // after onLayout fires.
  const inferredGridWidth = viewportWidth < 768
    ? Math.max(0, (viewportWidth - spacing.lg * 2) / 3)
    : 0;
  const cardWidth = styleWidth || measuredWidth || inferredGridWidth;
  const compact = cardWidth > 0 && cardWidth < 150;
  const dynamicNameFontSize = (() => {
    if (!cardWidth) return fontSize.base;
    if (cardWidth < 200) return fontSize.sm;
    if (cardWidth < 260) return fontSize.sm; // slight reduction
    return fontSize.base;
  })();
  const dynamicInfoPadding = (() => {
    if (!cardWidth) return spacing.md;
    if (cardWidth < 160) return spacing.sm;
    if (cardWidth < 220) return spacing.sm + 2;
    return spacing.md;
  })();
  const dynamicTitleLines = compact ? 2 : 2;

  const handleAddToCart = async () => {
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
    }
    setAdding(false);
  };

  return (
    <View
      style={[styles.card, { backgroundColor: c.card, borderColor: c.borderLight }, shadows.sm, style]}
      onLayout={(e) => {
        if (!styleWidth) setMeasuredWidth(Math.round(e.nativeEvent.layout.width));
      }}
    >
      <PressableScale scaleTo={0.97} onPress={onPress}>
        <View style={[styles.imgWrap, cardWidth > 0 && cardWidth < 150 && styles.imgWrapCompact, { backgroundColor: c.brandSurface || c.skeleton }]}>
          {primaryImage ? (
            <RemoteImage
              source={primaryImage}
              fallbackSource={secondaryImage}
              width={400}
              quality={72}
              style={styles.img}
              fallback={(
                <View style={[styles.img, styles.imageFallback, { backgroundColor: c.skeleton }]}>
                  <MaterialCommunityIcons name="image-outline" size={34} color={c.textMuted} />
                </View>
              )}
            />
          ) : (
            <View style={[styles.img, styles.imageFallback, { backgroundColor: c.skeleton }]}>
              <MaterialCommunityIcons name="image-outline" size={34} color={c.textMuted} />
            </View>
          )}
          <View style={styles.viewChip}>
            <MaterialCommunityIcons name={isRTL ? 'arrow-top-left' : 'arrow-top-right'} size={16} color="#FFFFFF" />
          </View>
          {product.supplier?.supplierVerified ? (
            <View style={[styles.verifiedBadge, { backgroundColor: c.success || '#2ecc71' }]}>
              <MaterialCommunityIcons name="shield-check-outline" size={14} color="#FFFFFF" />
            </View>
          ) : null}
          {product.isSponsored && !compact && <View style={[styles.badge, { backgroundColor: c.accent }]}><Text style={styles.badgeText}>{t.featured}</Text></View>}
          {discount > 0 && <View style={[styles.discBadge, { backgroundColor: c.error }]}><Text style={styles.badgeText}>-{discount}%</Text></View>}
        </View>
        <View style={[styles.info, { paddingHorizontal: dynamicInfoPadding }]}>
          {categoryName && !compact ? <Text numberOfLines={1} style={[styles.category, { color: c.textSecondary }]}>{categoryName}</Text> : null}
          <Text
            numberOfLines={dynamicTitleLines}
            adjustsFontSizeToFit
            minimumFontScale={0.88}
            allowFontScaling
            style={[styles.name, compact && styles.nameCompact, { color: c.text, fontSize: dynamicNameFontSize, lineHeight: Math.round(dynamicNameFontSize * 1.25) }]}
          >
            {getName(product)}
          </Text>
          <View style={styles.priceRow}>
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} style={[styles.price, compact && styles.priceCompact, { color: c.primary }]}>{formatPrice(product.retailPrice)}</Text>
            {hasDiscount && !compact && <Text style={[styles.oldPrice, { color: c.textMuted }]}>{formatPrice(product.wholesaleCost)}</Text>}
          </View>
          {!compact ? <View style={styles.metaRow}>
            <View style={[styles.stockPill, { backgroundColor: available ? c.success + '16' : c.error + '16' }]}>
              <MaterialCommunityIcons name={available ? 'check-circle-outline' : 'close-circle-outline'} size={14} color={available ? c.success : c.error} />
              <Text style={[styles.stock, { color: available ? c.success : c.error }]}>{available ? t.inStock : t.outOfStock}</Text>
            </View>
            {product.isSponsored ? <Text style={[styles.metaTag, { color: c.primary }]}>{t.featured}</Text> : null}
          </View> : null}
        </View>
      </PressableScale>

      <View style={[styles.actionWrap, compact && styles.actionWrapCompact]}>
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleAddToCart}
          disabled={adding || !available}
          accessibilityRole="button"
          accessibilityLabel={available ? `${t.addToCart}: ${getName(product)}` : `${getName(product)}: ${t.outOfStock}`}
          accessibilityState={{ disabled: adding || !available, busy: adding }}
          style={[styles.addBtn, compact && styles.addBtnCompact, !available && { backgroundColor: c.surfaceElevated }]}
        >
          {available ? (
            <LinearGradient
              colors={[c.gradientStart, c.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
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
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: borderRadius.lg, borderWidth: 1, overflow: 'hidden', marginBottom: spacing.md },
  imgWrap: { height: 172, overflow: 'hidden' },
  imgWrapCompact: { height: 116 },
  img: { width: '100%', height: '100%' },
  imageFallback: { justifyContent: 'center', alignItems: 'center' },
  viewChip: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: borderRadius.full, backgroundColor: 'rgba(17, 19, 23, 0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 3 },
  badge: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.full },
  discBadge: { position: 'absolute', bottom: 8, right: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.full },
  badgeText: { color: '#FFF', fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  verifiedBadge: { position: 'absolute', bottom: 8, left: 8, paddingHorizontal: 7, paddingVertical: 3, borderRadius: borderRadius.full, zIndex: 4 },
  info: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.md },
  category: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  name: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, marginBottom: 6, lineHeight: 20 },
  nameCompact: { minHeight: 32 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  price: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  priceCompact: { flexShrink: 1, fontSize: fontSize.sm },
  oldPrice: { fontSize: fontSize.sm, textDecorationLine: 'line-through' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
  stockPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 4, borderRadius: borderRadius.full },
  stock: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  metaTag: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  actionWrap: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  actionWrapCompact: { alignItems: 'stretch', paddingHorizontal: 6, paddingBottom: 10 },
  addBtn: { height: 44, borderRadius: borderRadius.full, overflow: 'hidden' },
  addBtnCompact: { width: '100%', height: 44, borderRadius: borderRadius.full },
  addBtnFill: { width: '100%', height: 44, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingHorizontal: spacing.sm },
  addBtnFillCompact: { height: 44, paddingHorizontal: 6, gap: 4, borderRadius: borderRadius.full },
  addText: { fontSize: fontSize.sm, lineHeight: 18, fontWeight: fontWeight.bold, includeFontPadding: false, textAlignVertical: 'center' },
  addTextCompact: { flexShrink: 1, fontSize: 12, lineHeight: 16, textAlign: 'center' },
});

import React, { useEffect, useRef, useState } from 'react';
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
import { spacing } from '../theme';

const metadataCopy = {
  en: { verified: 'Verified supplier', discount: 'discount' },
  ps: { verified: 'تایید شوی پلورونکی', discount: 'تخفیف' },
  dr: { verified: 'فروشنده تأییدشده', discount: 'تخفیف' },
};

export default function ProductCard({ product, onPress, style }) {
  const { width: viewportWidth, fontScale } = useWindowDimensions();
  const { theme } = useTheme();
  const { t, getName, isRTL, lang } = useLanguage();
  const { addItem } = useCart();
  const toast = useToast();
  const c = theme.colors;
  const productImages = Array.isArray(product.images) ? product.images : [];
  const primaryImage = productImages[0]?.url || product.image || product.thumbnail || null;
  const secondaryImage = productImages.find((entry, index) => index > 0 && entry?.url)?.url || null;
  const originalPrice = Number(product.wholesaleCost);
  const price = Number(product.retailPrice);
  const hasDiscount = originalPrice > price && price > 0;
  const discount = hasDiscount ? Math.round((1 - price / originalPrice) * 100) : 0;
  const categoryName = product.category ? getName(product.category) : '';
  const available = product.stock == null || product.stock > 0;
  const [adding, setAdding] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const busy = useRef(false);
  const mounted = useRef(true);
  const copy = previewCopy[lang] || previewCopy.en;
  const metadata = metadataCopy[lang] || metadataCopy.en;
  const [measuredWidth, setMeasuredWidth] = useState(0);

  const flattenedStyle = StyleSheet.flatten(style) || {};
  const styleWidth = typeof flattenedStyle.width === 'number' ? flattenedStyle.width : 0;
  // Estimate the phone grid until the card has been measured.
  const inferredGridWidth = viewportWidth < 768
    ? Math.max(0, (viewportWidth - spacing.base * 2) / 2 - 12)
    : 0;
  const cardWidth = styleWidth || measuredWidth || inferredGridWidth;
  const compact = cardWidth > 0 && cardWidth < 180;
  const dynamicNameFontSize = compact ? 14 : 15;
  const actionHeight = Math.max(44, Math.ceil(20 * fontScale + 16));
  const textAlignment = { textAlign: isRTL ? 'right' : 'left' };
  const rowDirection = { flexDirection: isRTL ? 'row-reverse' : 'row' };
  const stockColor = available
    ? (theme.dark ? c.success : '#087443')
    : (theme.dark ? c.error : '#B42318');

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const handleAddToCart = async () => {
    if (busy.current) return;
    if (!available) {
      toast.info(t.outOfStock);
      return;
    }

    busy.current = true;
    setAdding(true);
    try {
      await addItem(product, 1);
      toast.success(copy.added);
    } catch (error) {
      toast.error(error.message || copy.failed);
    } finally {
      busy.current = false;
      if (mounted.current) setAdding(false);
    }
  };

  return (
    <View
      style={[styles.card, { backgroundColor: c.card, borderColor: c.borderLight }, style]}
      onLayout={(e) => {
        if (!styleWidth) setMeasuredWidth(Math.round(e.nativeEvent.layout.width));
      }}
    >
      <PressableScale
        scaleTo={0.985}
        onPress={onPress}
        onLongPress={() => setPreviewOpen(true)}
        accessibilityLabel={`${getName(product)}, ${formatPrice(product.retailPrice)}`}
        accessibilityActions={[{ name: 'preview', label: copy.quick }]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'preview') setPreviewOpen(true);
        }}
        style={styles.productLink}
      >
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
        <View style={styles.info}>
          {categoryName ? <Text numberOfLines={1} style={[styles.category, textAlignment, { color: c.textSecondary }]}>{categoryName}</Text> : null}
          <Text
            numberOfLines={2}
            allowFontScaling
            style={[styles.name, textAlignment, { color: c.text, fontSize: dynamicNameFontSize, minHeight: Math.ceil(dynamicNameFontSize * 1.4 * fontScale) * 2, lineHeight: Math.round(dynamicNameFontSize * 1.4) }]}
          >
            {getName(product)}
          </Text>
          <View style={[styles.priceRow, rowDirection]}>
            <Text numberOfLines={2} style={[styles.price, compact && styles.priceCompact, textAlignment, { color: c.text }]}>{formatPrice(product.retailPrice)}</Text>
            {hasDiscount && <Text style={[styles.oldPrice, textAlignment, { color: c.textSecondary }]}>{formatPrice(product.wholesaleCost)}</Text>}
          </View>
          <View style={[styles.stockPill, rowDirection]}>
              <View style={[styles.stockDot, { backgroundColor: stockColor }]} />
              <Text style={[styles.stock, textAlignment, { color: stockColor }]}>{available ? t.inStock : t.outOfStock}</Text>
          </View>
          {(product.supplier?.supplierVerified || product.isSponsored || discount > 0) ? <View style={[styles.badgeRow, rowDirection]}>
            {discount > 0 && <Text accessibilityLabel={`${discount}% ${metadata.discount}`} style={[styles.badgeText, { color: theme.dark ? c.success : '#087443' }]}>−{discount}%</Text>}
            {product.supplier?.supplierVerified ? (
              <View accessible accessibilityLabel={metadata.verified} style={styles.verifiedBadge}>
                <MaterialCommunityIcons name="check-decagram" size={15} color={theme.dark ? c.success : '#087443'} />
              </View>
            ) : null}
            {product.isSponsored ? <Text style={[styles.badgeText, { color: c.textSecondary }]}>{t.sponsored}</Text> : null}
          </View> : null}
        </View>
      </PressableScale>

      <View style={[styles.actionWrap, rowDirection]}>
        <PressableScale
          scaleTo={0.97}
          onPress={handleAddToCart}
          disabled={adding || !available}
          accessibilityRole="button"
          accessibilityLabel={available ? `${t.addToCart}: ${getName(product)}` : `${getName(product)}: ${t.outOfStock}`}
          accessibilityState={{ disabled: adding || !available, busy: adding }}
          style={[styles.addBtn, { minHeight: actionHeight, backgroundColor: available ? c.brandSurface : c.surfaceElevated }]}
        >
          {adding ? <ActivityIndicator size="small" color={c.primary} /> : (
            <Text numberOfLines={2} style={[styles.addText, { color: available ? (theme.dark ? c.primary : c.primaryDark) : c.textSecondary }]}>{available ? t.add : t.soldOut}</Text>
          )}
        </PressableScale>
        <PressableScale
          onPress={() => setPreviewOpen(true)}
          accessibilityLabel={`${copy.quick}: ${getName(product)}`}
          style={[styles.quickView, { minHeight: actionHeight, backgroundColor: c.surfaceElevated, borderColor: c.border }]}
        >
          <MaterialCommunityIcons name="eye-outline" size={20} color={c.textSecondary} />
        </PressableScale>
      </View>
      {previewOpen && <ProductQuickView product={product} onClose={() => setPreviewOpen(false)} onDetails={onPress} />}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: 16, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  productLink: { minWidth: 0, flex: 1 },
  imgWrap: { aspectRatio: 1, margin: 5, borderRadius: 11, padding: 7, overflow: 'hidden' },
  img: { width: '100%', height: '100%' },
  imageFallback: { justifyContent: 'center', alignItems: 'center' },
  badgeRow: { alignItems: 'center', flexWrap: 'wrap', gap: 5, marginTop: 5 },
  badgeText: { fontSize: 12, lineHeight: 18, fontWeight: '600' },
  verifiedBadge: { minWidth: 18, minHeight: 18, alignItems: 'center', justifyContent: 'center' },
  info: { paddingHorizontal: 10, paddingTop: 4, paddingBottom: 8 },
  category: { fontSize: 12, lineHeight: 18, fontWeight: '500', marginBottom: 4 },
  name: { letterSpacing: -0.1, fontWeight: '600' },
  priceRow: { flexWrap: 'wrap', alignItems: 'baseline', columnGap: 6, rowGap: 2, marginTop: 5 },
  price: { maxWidth: '100%', fontSize: 16, lineHeight: 22, fontWeight: '700' },
  priceCompact: { fontSize: 15, lineHeight: 21 },
  oldPrice: { maxWidth: '100%', fontSize: 12, lineHeight: 18, textDecorationLine: 'line-through' },
  stockPill: { alignItems: 'center', gap: 5, marginTop: 5 },
  stockDot: { width: 5, height: 5, borderRadius: 3 },
  stock: { flexShrink: 1, fontSize: 12, lineHeight: 18, fontWeight: '500' },
  actionWrap: { marginHorizontal: 6, marginBottom: 6, alignItems: 'stretch', gap: 4 },
  quickView: { width: 44, flexShrink: 0, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  addBtn: { flex: 1, minWidth: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, paddingVertical: 7 },
  addText: { flexShrink: 1, fontSize: 13, lineHeight: 19, fontWeight: '600', textAlign: 'center' },
});

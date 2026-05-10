import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { formatPrice } from '../config';
import RemoteImage from './RemoteImage';
import { spacing, fontSize, fontWeight, borderRadius, shadows } from '../theme';

export default function ProductCard({ product, onPress, style }) {
  const { theme } = useTheme();
  const { t, getName } = useLanguage();
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
  const styleWidth = flattenedStyle.width || 0;
  const cardWidth = styleWidth || measuredWidth;
  const dynamicNameFontSize = (() => {
    if (!cardWidth) return fontSize.base;
    if (cardWidth < 160) return fontSize.xs; // very small
    if (cardWidth < 200) return 12; // compact
    if (cardWidth < 260) return fontSize.sm; // slight reduction
    return fontSize.base;
  })();
  const dynamicInfoPadding = (() => {
    if (!cardWidth) return spacing.md;
    if (cardWidth < 160) return spacing.sm;
    if (cardWidth < 220) return spacing.sm + 2;
    return spacing.md;
  })();
  const dynamicTitleLines = cardWidth && cardWidth < 180 ? 1 : 2;

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
      style={[styles.card, { backgroundColor: c.card, borderColor: c.border }, shadows.md, style]}
      onLayout={(e) => {
        if (!styleWidth) setMeasuredWidth(Math.round(e.nativeEvent.layout.width));
      }}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        <View style={[styles.imgWrap, { backgroundColor: c.brandSurface || c.skeleton }]}>
          {primaryImage ? (
            <RemoteImage
              source={primaryImage}
              fallbackSource={secondaryImage}
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
            <MaterialCommunityIcons name="arrow-top-right" size={16} color="#FFFFFF" />
          </View>
          {product.isSponsored && <View style={[styles.badge, { backgroundColor: c.accent }]}><Text style={styles.badgeText}>Featured</Text></View>}
          {discount > 0 && <View style={[styles.discBadge, { backgroundColor: c.error }]}><Text style={styles.badgeText}>-{discount}%</Text></View>}
        </View>
        <View style={[styles.info, { paddingHorizontal: dynamicInfoPadding }]}> 
          {categoryName ? <Text numberOfLines={1} style={[styles.category, { color: c.textMuted }]}>{categoryName}</Text> : null}
          <Text
            numberOfLines={dynamicTitleLines}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            allowFontScaling
            style={[styles.name, { color: c.text, fontSize: dynamicNameFontSize, lineHeight: Math.round(dynamicNameFontSize * 1.25) }]}
          >
            {getName(product)}
          </Text>
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: c.primary }]}>{formatPrice(product.retailPrice)}</Text>
            {hasDiscount && <Text style={[styles.oldPrice, { color: c.textMuted }]}>{formatPrice(product.wholesaleCost)}</Text>}
          </View>
          <View style={styles.metaRow}>
            <View style={[styles.stockPill, { backgroundColor: available ? c.success + '16' : c.error + '16' }]}>
              <MaterialCommunityIcons name={available ? 'check-circle-outline' : 'close-circle-outline'} size={14} color={available ? c.success : c.error} />
              <Text style={[styles.stock, { color: available ? c.success : c.error }]}>{available ? t.inStock : t.outOfStock}</Text>
            </View>
            {product.isSponsored ? <Text style={[styles.metaTag, { color: c.primary }]}>Top pick</Text> : null}
          </View>
        </View>
      </TouchableOpacity>

      <View style={[styles.actionWrap, { borderTopColor: c.borderLight }]}>
        <TouchableOpacity activeOpacity={0.9} onPress={handleAddToCart} disabled={adding || !available} style={[styles.addBtn, { backgroundColor: available ? c.primary : c.surfaceElevated }]}>
          {adding ? (
            <ActivityIndicator size="small" color={available ? c.white : c.textMuted} />
          ) : (
            <>
              <MaterialCommunityIcons name={available ? 'cart-plus' : 'cart-off'} size={18} color={available ? c.white : c.textMuted} />
              <Text numberOfLines={1} style={[styles.addText, { color: available ? c.white : c.textMuted }]}>{available ? t.addToCart : t.outOfStock}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: borderRadius.xl, borderWidth: 1, overflow: 'hidden', marginBottom: spacing.base },
  imgWrap: { height: 190, overflow: 'hidden' },
  img: { width: '100%', height: '100%' },
  imageFallback: { justifyContent: 'center', alignItems: 'center' },
  viewChip: { position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(17, 19, 23, 0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 3 },
  badge: { position: 'absolute', top: 10, left: 10, paddingHorizontal: 10, paddingVertical: 4, borderRadius: borderRadius.full },
  discBadge: { position: 'absolute', bottom: 10, right: 10, paddingHorizontal: 10, paddingVertical: 4, borderRadius: borderRadius.full },
  badgeText: { color: '#FFF', fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  info: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.base },
  category: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  name: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, marginBottom: 8, lineHeight: 21 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  price: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  oldPrice: { fontSize: fontSize.sm, textDecorationLine: 'line-through' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  stockPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: borderRadius.full },
  stock: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  metaTag: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  actionWrap: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, borderTopWidth: 1 },
  addBtn: { minHeight: 42, borderRadius: borderRadius.lg, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingHorizontal: spacing.sm, paddingVertical: 10 },
  addText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },
});

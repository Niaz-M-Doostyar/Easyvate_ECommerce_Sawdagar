import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { formatPrice } from '../config';
import RemoteImage from './RemoteImage';
import PressableScale from './PressableScale';
import ProductQuickView, { previewCopy } from './ProductQuickView';

const metadataCopy = {
  en: { verified: 'Verified supplier', discount: 'discount' },
  ps: { verified: 'تایید شوی پلورونکی', discount: 'تخفیف' },
  dr: { verified: 'فروشنده تأییدشده', discount: 'تخفیف' },
};

// The home collection uses a quieter card than the full catalogue: photo,
// name, price, cart and preview actions. Its parent adapts columns for larger text.
export default function FeaturedProductCard({ product, onPress, style }) {
  const { theme } = useTheme();
  const { t, getName, isRTL, lang } = useLanguage();
  const { addItem } = useCart();
  const toast = useToast();
  const { fontScale } = useWindowDimensions();
  const [adding, setAdding] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const busy = useRef(false);
  const mounted = useRef(true);
  const c = theme.colors;
  const name = getName(product);
  const copy = previewCopy[lang] || previewCopy.en;
  const metadata = metadataCopy[lang] || metadataCopy.en;
  const images = Array.isArray(product.images) ? product.images : [];
  const primaryImage = images[0]?.url || product.image || product.thumbnail || null;
  const secondaryImage = images.find((entry, index) => index > 0 && entry?.url)?.url || null;
  const available = product.stock == null || product.stock > 0;
  const verified = !!product.supplier?.supplierVerified;
  const originalPrice = Number(product.wholesaleCost);
  const price = Number(product.retailPrice);
  const discount = originalPrice > price && price > 0
    ? Math.round((1 - price / originalPrice) * 100)
    : 0;
  const alignment = { textAlign: isRTL ? 'right' : 'left' };
  const rowDirection = { flexDirection: isRTL ? 'row-reverse' : 'row' };
  const actionHeight = Math.max(44, Math.ceil(20 * fontScale + 16));

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const addToCart = async () => {
    if (busy.current || !available) return;
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

  const fallback = (
    <View style={[styles.image, styles.placeholder]}>
      <MaterialCommunityIcons name="image-outline" size={26} color={c.textMuted} />
    </View>
  );

  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.borderLight }, style]}>
      <PressableScale
        scaleTo={0.985}
        onPress={onPress}
        onLongPress={() => setPreviewOpen(true)}
        accessibilityLabel={`${name}, ${formatPrice(product.retailPrice)}`}
        accessibilityActions={[{ name: 'preview', label: copy.quick }]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'preview') setPreviewOpen(true);
        }}
        style={styles.productLink}
      >
        <View style={[styles.imageFrame, { backgroundColor: c.surfaceElevated }]}>
          {primaryImage ? (
            <RemoteImage
              source={primaryImage}
              fallbackSource={secondaryImage}
              width={360}
              quality={76}
              resizeMode="contain"
              style={styles.image}
              fallback={fallback}
            />
          ) : fallback}
        </View>
        <View style={styles.content}>
          <Text
            numberOfLines={2}
            style={[styles.name, alignment, { color: c.text, minHeight: Math.ceil(19 * fontScale) * 2 }]}
          >
            {name}
          </Text>
          <Text numberOfLines={2} style={[styles.price, alignment, { color: c.text }]}>
            {formatPrice(product.retailPrice)}
          </Text>
          {(verified || discount > 0) ? (
            <View style={[styles.metadata, rowDirection]}>
              {discount > 0 ? (
                <Text
                  accessibilityLabel={`${discount}% ${metadata.discount}`}
                  style={[styles.discount, { color: c.success }]}
                >
                  −{discount}%
                </Text>
              ) : null}
              {verified ? (
                <View accessible accessibilityLabel={metadata.verified} style={styles.verified}>
                  <MaterialCommunityIcons name="check-decagram" size={15} color={c.success} />
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </PressableScale>

      <View style={[styles.actions, rowDirection]}>
        <PressableScale
          onPress={addToCart}
          disabled={adding || !available}
          accessibilityLabel={available ? `${t.addToCart}: ${name}` : `${name}: ${t.outOfStock}`}
          accessibilityState={{ disabled: adding || !available, busy: adding }}
          style={[styles.addButton, { minHeight: actionHeight, backgroundColor: available ? c.brandSurface : c.surfaceElevated }]}
        >
          {adding ? <ActivityIndicator size="small" color={c.primary} /> : (
            <Text
              numberOfLines={2}
              style={[styles.addText, { color: available ? (theme.dark ? c.primary : c.primaryDark) : c.textSecondary }]}
            >
              {available ? t.add : t.soldOut}
            </Text>
          )}
        </PressableScale>
        <PressableScale
          onPress={() => setPreviewOpen(true)}
          accessibilityLabel={`${copy.quick}: ${name}`}
          style={[styles.previewButton, { minHeight: actionHeight, backgroundColor: c.surfaceElevated, borderColor: c.border }]}
        >
          <MaterialCommunityIcons name="eye-outline" size={20} color={c.textSecondary} />
        </PressableScale>
      </View>
      {previewOpen ? <ProductQuickView product={product} onClose={() => setPreviewOpen(false)} onDetails={onPress} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  productLink: { flex: 1, minWidth: 0 },
  imageFrame: { aspectRatio: 1, margin: 5, padding: 7, borderRadius: 11, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 8, paddingTop: 4, paddingBottom: 8 },
  name: { fontSize: 13, lineHeight: 19, fontWeight: '600', letterSpacing: -0.1 },
  price: { fontSize: 14, lineHeight: 20, fontWeight: '700', marginTop: 5 },
  metadata: { alignItems: 'center', flexWrap: 'wrap', gap: 5, marginTop: 5 },
  discount: { fontSize: 12, lineHeight: 18, fontWeight: '600' },
  verified: { minWidth: 18, minHeight: 18, justifyContent: 'center', alignItems: 'center' },
  actions: { marginHorizontal: 6, marginBottom: 6, alignItems: 'stretch', gap: 2 },
  addButton: { flex: 1, minWidth: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3, paddingVertical: 7 },
  previewButton: { width: 44, flexShrink: 0, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  addText: { flexShrink: 1, fontSize: 13, lineHeight: 19, fontWeight: '600', textAlign: 'center' },
});

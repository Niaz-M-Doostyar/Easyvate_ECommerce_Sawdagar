import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { formatPrice } from '../config';
import RemoteImage from './RemoteImage';
import Button from './Button';
import PressableScale from './PressableScale';

export const previewCopy = {
  en: { quick: 'Quick view', close: 'Close preview', details: 'Full details', added: 'Added to cart', failed: 'Could not add item', next: 'Next image', previous: 'Previous image' },
  ps: { quick: 'چټک لید', close: 'لید بند کړئ', details: 'بشپړ معلومات', added: 'کارټ ته اضافه شو', failed: 'توکی اضافه نه شو', next: 'بل انځور', previous: 'مخکینی انځور' },
  dr: { quick: 'نمای سریع', close: 'بستن پیش‌نمایش', details: 'جزئیات کامل', added: 'به سبد اضافه شد', failed: 'افزودن ممکن نشد', next: 'تصویر بعدی', previous: 'تصویر قبلی' },
};

// Mounted only while requested: off-screen cards do not allocate native modals.
export default function ProductQuickView({ product, onClose, onDetails }) {
  const { theme } = useTheme();
  const { t, lang, getName, isRTL } = useLanguage();
  const { addItem } = useCart();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const c = theme.colors;
  const copy = previewCopy[lang] || previewCopy.en;
  const progress = useRef(new Animated.Value(0)).current;
  const reduced = useRef(true);
  const closing = useRef(false);
  const busy = useRef(false);
  const mounted = useRef(true);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [index, setIndex] = useState(0);
  const images = [...new Set([...(Array.isArray(product.images) ? product.images : []).map(item => item?.url), product.image, product.thumbnail].filter(Boolean))];
  const available = product.stock == null || product.stock > 0;
  const description = String(getName(product, 'description') || '').replace(/<[^>]*>/g, '').trim();
  const align = { textAlign: isRTL ? 'right' : 'left' };

  useEffect(() => {
    mounted.current = true;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', value => {
      reduced.current = value;
      if (value && !closing.current) { progress.stopAnimation(); progress.setValue(1); }
    });
    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (!mounted.current || closing.current) return;
      reduced.current = value;
      Animated.timing(progress, { toValue: 1, duration: value ? 0 : 300, useNativeDriver: true }).start();
    }).catch(() => progress.setValue(1));
    return () => { mounted.current = false; subscription.remove(); progress.stopAnimation(); };
  }, [progress]);

  const dismiss = (after) => {
    if (closing.current) return;
    closing.current = true;
    Animated.timing(progress, { toValue: 0, duration: reduced.current ? 0 : 200, useNativeDriver: true }).start(({ finished }) => {
      if (finished) { onClose(); after?.(); }
    });
  };
  const add = async () => {
    if (busy.current || !available) return;
    busy.current = true;
    setAdding(true);
    try {
      await addItem(product, 1);
      if (mounted.current) setAdded(true);
      toast.success(copy.added);
    } catch (error) { toast.error(error.message || copy.failed); }
    finally { busy.current = false; if (mounted.current) setAdding(false); }
  };

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={() => dismiss()}>
      <View style={styles.overlay} accessibilityViewIsModal onAccessibilityEscape={() => dismiss()}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#081225', opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 0.58] }) }]} />
        <Pressable style={StyleSheet.absoluteFill} onPress={() => dismiss()} accessibilityLabel={copy.close} accessibilityRole="button" />
        <Animated.View style={[styles.sheet, { backgroundColor: c.card, maxHeight: height - insets.top - 24, paddingBottom: Math.max(insets.bottom, 16), opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [80, 0] }) }] }]}>
          <View style={[styles.handle, { backgroundColor: c.border }]} />
          <View style={styles.heading}>
            <View style={styles.headingLabel}><MaterialCommunityIcons name="eye-outline" size={18} color={c.primary} /><Text accessibilityRole="header" style={[styles.eyebrow, { color: c.primary }]}>{copy.quick}</Text></View>
            <PressableScale onPress={() => dismiss()} accessibilityLabel={copy.close} style={[styles.icon, { backgroundColor: c.surfaceElevated }]}><MaterialCommunityIcons name="close" size={22} color={c.text} /></PressableScale>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            <View style={[styles.media, { height: Math.min(280, height * 0.29), backgroundColor: c.surfaceElevated }]}>
              <View style={styles.imageFrame}>
                <RemoteImage key={`thumbnail-${images[index] || 'empty'}`} source={images[index]} width={400} quality={72} resizeMode="contain" style={StyleSheet.absoluteFill} fallback={<MaterialCommunityIcons name="image-outline" size={48} color={c.textMuted} />} />
                <RemoteImage key={images[index] || 'empty'} source={images[index]} width={800} resizeMode="contain" style={StyleSheet.absoluteFill} />
              </View>
              {images.length > 1 && <View style={styles.galleryControls}>
                <PressableScale accessibilityLabel={copy.previous} onPress={() => setIndex((index + images.length - 1) % images.length)} style={[styles.icon, { backgroundColor: c.card }]}><MaterialCommunityIcons name="chevron-left" size={24} color={c.text} /></PressableScale>
                <Text style={[styles.counter, { color: c.text, backgroundColor: c.card }]}>{index + 1} / {images.length}</Text>
                <PressableScale accessibilityLabel={copy.next} onPress={() => setIndex((index + 1) % images.length)} style={[styles.icon, { backgroundColor: c.card }]}><MaterialCommunityIcons name="chevron-right" size={24} color={c.text} /></PressableScale>
              </View>}
            </View>
            {!!product.category && <Text style={[styles.category, align, { color: c.textSecondary }]}>{getName(product.category)}</Text>}
            <Text style={[styles.title, align, { color: c.text }]}>{getName(product)}</Text>
            <View style={styles.priceRow}><Text style={[styles.price, { color: c.text }]}>{formatPrice(product.retailPrice)}</Text><Text style={[styles.stock, { color: available ? c.success : c.error }]}>{available ? t.inStock : t.outOfStock}</Text></View>
            {!!description && <Text numberOfLines={4} style={[styles.description, align, { color: c.textSecondary }]}>{description}</Text>}
          </ScrollView>
          <View style={[styles.actions, { borderTopColor: c.borderLight }]}>
            <Button title={added ? copy.added : t.addToCart} loading={adding} disabled={!available} onPress={add} icon={<MaterialCommunityIcons name={added ? 'check' : 'cart-plus'} size={20} color={c.white} />} />
            <Button title={copy.details} variant="ghost" size="sm" onPress={() => dismiss(onDetails)} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  sheet: { width: '100%', maxWidth: 600, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 8 },
  headingLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrow: { fontSize: 14, fontWeight: '700' },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 20, paddingBottom: 16 },
  media: { borderRadius: 24, padding: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  imageFrame: { alignSelf: 'stretch', flex: 1, alignItems: 'center', justifyContent: 'center' },
  galleryControls: { position: 'absolute', bottom: 10, left: 10, right: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  counter: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, fontSize: 12, fontWeight: '600' },
  category: { marginTop: 16, fontSize: 12, fontWeight: '600' },
  title: { marginTop: 6, fontSize: 23, lineHeight: 30, fontWeight: '700' },
  priceRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14, marginTop: 12 },
  price: { fontSize: 24, fontWeight: '800' },
  stock: { fontSize: 12, fontWeight: '600' },
  description: { marginTop: 12, fontSize: 14, lineHeight: 22 },
  actions: { borderTopWidth: 1, paddingHorizontal: 20, paddingTop: 12, gap: 4 },
});

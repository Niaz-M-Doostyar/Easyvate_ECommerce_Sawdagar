import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import EmptyState from '../../components/EmptyState';
import RemoteImage from '../../components/RemoteImage';
import ScreenHeader from '../../components/ScreenHeader';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import { ordersApi } from '../../services/api';
import { formatPrice } from '../../config';
import { formatAppDateTime } from '../../utils/dateFormat';
import { spacing, fontSize, fontWeight } from '../../theme';

const STEPS = ['pending', 'confirmed', 'shipped', 'delivered'];
const orderCopy = {
  en: { missing: 'Order not found', missingHint: 'We could not load this order.', review: 'Review your order', reviewHint: 'You can cancel before this timer ends. Your order will then confirm automatically.', confirm: 'Confirm order now', cancel: 'Cancel order', progress: 'Delivery progress', product: 'Product', free: 'Free' },
  ps: { missing: 'سفارښت ونه موندل شو', missingHint: 'دا سفارښت نه شو ښکاره کولای.', review: 'خپل سفارښت وګورئ', reviewHint: 'د دې وخت تر پای پورې سفارښت لغوه کولای شئ. وروسته به په اتومات ډول تایید شي.', confirm: 'سفارښت اوس تایید کړئ', cancel: 'سفارښت لغوه کړئ', progress: 'د تحویلي پرمختګ', product: 'محصول', free: 'وړیا' },
  dr: { missing: 'سفارش یافت نشد', missingHint: 'این سفارش بارگذاری نشد.', review: 'سفارش خود را بررسی کنید', reviewHint: 'تا پایان این زمان می‌توانید سفارش را لغو کنید. پس از آن سفارش خودکار تایید می‌شود.', confirm: 'همین حالا تایید کنید', cancel: 'لغو سفارش', progress: 'روند تحویل', product: 'محصول', free: 'رایگان' },
};

export default function OrderDetailScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { t, lang, getName, isRTL } = useLanguage();
  const { width, fontScale } = useWindowDimensions();
  const c = theme.colors;
  const copy = orderCopy[lang] || orderCopy.en;
  const direction = { flexDirection: isRTL ? 'row-reverse' : 'row' };
  const alignment = { textAlign: isRTL ? 'right' : 'left' };
  const verticalProgress = fontScale > 1.25 || width < 350;
  const initialOrder = route.params?.order || null;
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(!initialOrder);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const act = async (kind) => {
    setBusy(true);
    try { const data = await ordersApi[kind](order.id); setOrder(data.order); }
    catch (error) { alert(error.message); }
    finally { setBusy(false); }
  };

  useEffect(() => {
    if (!route.params?.id || initialOrder) return;
    ordersApi.get(route.params?.id).then(d => { setOrder(d.order || d); setLoading(false); }).catch(() => setLoading(false));
  }, [initialOrder, route.params?.id]);
  useEffect(() => {
    const id = order?.id || route.params?.id;
    if (!id || order?.status !== 'pending') return undefined;
    const timer = setInterval(() => ordersApi.get(id).then(data => setOrder(data.order || data)).catch(() => {}), 15000);
    return () => clearInterval(timer);
  }, [order?.id, order?.status, route.params?.id]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top', 'left', 'right']}>
        <ScreenHeader title={t.orderDetails} onBack={() => navigation.goBack()} />
        <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }
  if (!order) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top', 'left', 'right']}>
        <ScreenHeader title={t.orderDetails} onBack={() => navigation.goBack()} />
        <EmptyState icon="receipt-outline" title={copy.missing} subtitle={copy.missingHint} />
      </SafeAreaView>
    );
  }

  const remaining = order.confirmAfter ? Math.max(0, new Date(order.confirmAfter).getTime() - now) : 0;
  const reviewOpen = order.status === 'pending' && remaining > 0;
  const stepIdx = Math.max(STEPS.indexOf(order.status), 0);
  const orderTotal = order.totalAmount ?? order.total ?? 0;
  const deliveryAddress = [order.village, order.district, order.province].filter(Boolean).join(', ');
  const createdAt = formatAppDateTime(order.createdAt, lang);
  const countdown = `${Math.floor(remaining / 3600000)}:${String(Math.floor(remaining / 60000) % 60).padStart(2, '0')}:${String(Math.floor(remaining / 1000) % 60).padStart(2, '0')}`;
  const stepIcons = { pending: 'clock-outline', confirmed: 'check-decagram-outline', shipped: 'truck-fast-outline', delivered: 'package-variant-closed' };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top', 'left', 'right']}>
      <ScreenHeader title={t.orderDetails} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.overview, { backgroundColor: c.card, borderColor: c.borderLight }]}>
          <View style={[styles.overviewTop, direction]}>
            <View style={styles.overviewInfo}>
              <Text style={[styles.orderNumber, alignment, { color: c.text }]}>{t.orderNumber} {order.orderNumber || order.id}</Text>
              <Text style={[styles.date, alignment, { color: c.textSecondary }]}>{createdAt}</Text>
            </View>
            <StatusBadge status={order.status} />
          </View>
          <View style={[styles.overviewBottom, direction, { borderColor: c.borderLight }]}>
            <Text style={[styles.itemCount, { color: c.textSecondary }]}>{order.items?.length || 0} {t.items}</Text>
            <Text style={[styles.orderTotal, { color: c.text }]}>{formatPrice(orderTotal)}</Text>
          </View>
        </View>

        {reviewOpen && (
          <View style={[styles.card, { backgroundColor: c.brandSurface, borderColor: c.borderLight }]}>
            <View style={[styles.reviewTop, direction]}>
              <MaterialCommunityIcons name="timer-outline" size={22} color={theme.dark ? c.primary : c.primaryDark} />
              <Text style={[styles.reviewTitle, alignment, { color: c.text }]}>{copy.review}</Text>
            </View>
            <Text accessibilityLabel={countdown} style={[styles.countdown, alignment, { color: theme.dark ? c.primary : c.primaryDark }]}>{countdown}</Text>
            <Text style={[styles.reviewHint, alignment, { color: c.textSecondary }]}>{copy.reviewHint}</Text>
            <View style={[styles.reviewActions, width >= 500 && fontScale <= 1.25 ? direction : styles.stackedActions]}>
              <Button title={copy.confirm} disabled={busy} onPress={() => act('confirm')} style={width >= 500 && fontScale <= 1.25 ? styles.reviewButton : undefined} />
              <Button title={copy.cancel} disabled={busy} onPress={() => act('cancel')} variant="outline" textStyle={{ color: c.error }} style={width >= 500 && fontScale <= 1.25 ? styles.reviewButton : undefined} />
            </View>
          </View>
        )}

        <Text style={[styles.sectionTitle, alignment, { color: c.text }]}>{t.items}</Text>
        {(order.items || []).map((item, i) => {
          const image = item.product?.images?.[0]?.url || item.product?.image || item.product?.thumbnail;
          return (
            <View key={item.id || i} style={[styles.itemRow, direction, { backgroundColor: c.card, borderColor: c.borderLight }]}>
              <View style={[styles.imageFrame, { backgroundColor: c.surfaceElevated }]}>
                <RemoteImage source={image} fallbackSource={item.product?.images?.[1]?.url} resizeMode="contain" width={180} quality={76}
                  style={styles.itemImg} fallback={<MaterialCommunityIcons name="image-outline" size={25} color={c.textMuted} />} />
              </View>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, alignment, { color: c.text }]}>{getName(item.product) || copy.product}</Text>
                <Text style={[styles.itemQuantity, alignment, { color: c.textSecondary }]}>{t.qty}: {item.quantity} × {formatPrice(item.retailPrice ?? item.price)}</Text>
                <Text style={[styles.itemTotal, alignment, { color: c.text }]}>{formatPrice(item.quantity * (item.retailPrice ?? item.price ?? 0))}</Text>
              </View>
            </View>
          );
        })}

        {order.status !== 'cancelled' && (
          <View style={[styles.card, styles.sectionSpacing, { backgroundColor: c.card, borderColor: c.borderLight }]}>
            <Text style={[styles.cardTitle, alignment, { color: c.text }]}>{copy.progress}</Text>
            <View style={[styles.progress, verticalProgress ? styles.verticalProgress : direction]}>
              {STEPS.map((s, i) => (
                <View key={s} style={[styles.step, verticalProgress ? [styles.verticalStep, direction] : styles.horizontalStep]}>
                  {!verticalProgress && i < STEPS.length - 1 ? <View style={[styles.stepConnector, isRTL ? { right: '50%' } : { left: '50%' }, { backgroundColor: i < stepIdx ? c.primary : c.border }]} /> : null}
                  <View style={[styles.stepDot, { backgroundColor: i <= stepIdx ? c.primary : c.surfaceElevated, borderColor: i <= stepIdx ? c.primary : c.border }]}>
                    <MaterialCommunityIcons name={stepIcons[s]} size={17} color={i <= stepIdx ? c.white : c.textMuted} />
                  </View>
                  <Text style={[styles.stepLabel, verticalProgress ? alignment : styles.centeredLabel, { color: i <= stepIdx ? (theme.dark ? c.primary : c.primaryDark) : c.textSecondary }]}>{t[s] || s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {(deliveryAddress || order.landmark || order.phone) && (
          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.borderLight }]}>
            <Text style={[styles.cardTitle, alignment, { color: c.text }]}>{t.deliveryAddress}</Text>
            {!!deliveryAddress && <InfoRow icon="map-marker-outline" value={deliveryAddress} c={c} isRTL={isRTL} />}
            {!!order.landmark && <InfoRow icon="map-marker-radius-outline" value={order.landmark} c={c} isRTL={isRTL} />}
            {!!order.phone && <InfoRow icon="phone-outline" value={order.phone} c={c} isRTL={isRTL} />}
          </View>
        )}
        {!!order.notes && (
          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.borderLight }]}>
            <Text style={[styles.cardTitle, alignment, { color: c.text }]}>{t.notes}</Text>
            <InfoRow icon="note-text-outline" value={order.notes} c={c} isRTL={isRTL} />
          </View>
        )}
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.borderLight }]}>
          <Text style={[styles.cardTitle, alignment, { color: c.text }]}>{t.orderSummary}</Text>
          <View style={[styles.cardRow, direction]}><Text style={[styles.label, { color: c.textSecondary }]}>{t.subtotal}</Text><Text style={[styles.val, { color: c.text }]}>{formatPrice(orderTotal - (order.deliveryFee || 0))}</Text></View>
          <View style={[styles.cardRow, direction]}><Text style={[styles.label, { color: c.textSecondary }]}>{t.deliveryFee}</Text><Text style={[styles.val, { color: c.text }]}>{order.deliveryFee ? formatPrice(order.deliveryFee) : copy.free}</Text></View>
          <View style={[styles.divider, { borderColor: c.borderLight }]} />
          <View style={[styles.cardRow, direction]}><Text style={[styles.label, { color: c.text, fontWeight: fontWeight.bold }]}>{t.total}</Text><Text style={[styles.val, { color: c.text, fontWeight: fontWeight.bold, fontSize: fontSize.md }]}>{formatPrice(orderTotal)}</Text></View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, value, c, isRTL }) {
  return (
    <View style={[styles.infoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <MaterialCommunityIcons name={icon} size={18} color={c.textSecondary} />
      <Text style={[styles.infoValue, { color: c.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, width: '100%', maxWidth: 1200, alignSelf: 'center' },
  scroll: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: spacing.base, paddingBottom: 120 },
  overview: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 14 },
  overviewTop: { alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' },
  overviewInfo: { flexGrow: 1, flexShrink: 1, minWidth: 130 },
  orderNumber: { fontSize: 17, lineHeight: 25, fontWeight: fontWeight.bold },
  date: { fontSize: 13, lineHeight: 20, marginTop: 4 },
  overviewBottom: { alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', borderTopWidth: 1, marginTop: 14, paddingTop: 12 },
  itemCount: { fontSize: 14, lineHeight: 21, flexShrink: 1 },
  orderTotal: { fontSize: 20, lineHeight: 28, fontWeight: fontWeight.bold, flexShrink: 1 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 14 },
  cardTitle: { fontSize: 16, lineHeight: 23, fontWeight: fontWeight.semibold, marginBottom: 10 },
  reviewTop: { alignItems: 'center', gap: 8 },
  reviewTitle: { flex: 1, fontSize: 16, lineHeight: 23, fontWeight: fontWeight.semibold },
  countdown: { fontSize: 28, lineHeight: 38, fontWeight: fontWeight.bold, fontVariant: ['tabular-nums'], marginTop: 8 },
  reviewHint: { fontSize: 14, lineHeight: 22, marginTop: 4 },
  reviewActions: { gap: 8, marginTop: 14 },
  stackedActions: { flexDirection: 'column' },
  reviewButton: { flex: 1 },
  sectionTitle: { fontSize: 17, lineHeight: 25, fontWeight: fontWeight.bold, marginTop: 4, marginBottom: 12 },
  itemRow: { alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
  imageFrame: { width: 80, height: 80, borderRadius: 12, padding: 8, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  itemImg: { width: '100%', height: '100%' },
  itemInfo: { flex: 1, minWidth: 0 },
  itemName: { fontSize: 15, lineHeight: 22, fontWeight: fontWeight.semibold },
  itemQuantity: { fontSize: 13, lineHeight: 20, marginTop: 5 },
  itemTotal: { fontSize: 16, lineHeight: 23, fontWeight: fontWeight.bold, marginTop: 6 },
  sectionSpacing: { marginTop: 10 },
  progress: { paddingVertical: 4 },
  horizontalStep: { flex: 1, alignItems: 'center', gap: 7 },
  verticalProgress: { gap: 12 },
  verticalStep: { alignItems: 'center', gap: 10 },
  stepDot: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  stepLabel: { fontSize: 12, lineHeight: 18, fontWeight: fontWeight.semibold, flexShrink: 1, textTransform: 'capitalize' },
  centeredLabel: { textAlign: 'center', paddingHorizontal: 2 },
  stepConnector: { position: 'absolute', height: 2, width: '100%', top: 16 },
  infoRow: { alignItems: 'flex-start', gap: 10, paddingVertical: 6 },
  infoValue: { flex: 1, fontSize: 14, lineHeight: 22 },
  cardRow: { justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, paddingVertical: 5 },
  label: { fontSize: 14, lineHeight: 22, flexGrow: 1, flexShrink: 1 },
  val: { fontSize: 14, lineHeight: 22, fontWeight: fontWeight.medium, flexShrink: 1 },
  divider: { borderTopWidth: 1, marginVertical: 8 },
});

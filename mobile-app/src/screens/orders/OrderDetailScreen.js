import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import EmptyState from '../../components/EmptyState';
import HeroCard from '../../components/HeroCard';
import RemoteImage from '../../components/RemoteImage';
import ScreenHeader from '../../components/ScreenHeader';
import { ordersApi } from '../../services/api';
import { formatPrice } from '../../config';
import { formatAppDateTime } from '../../utils/dateFormat';
import { spacing, fontSize, fontWeight, borderRadius, shadows, hairline } from '../../theme';

const STEPS = ['pending', 'confirmed', 'shipped', 'delivered'];

export default function OrderDetailScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { t, lang } = useLanguage();
  const c = theme.colors;
  const initialOrder = route.params?.order || null;
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(!initialOrder);

  useEffect(() => {
    if (!route.params?.id || initialOrder) return;
    ordersApi.get(route.params?.id).then(d => { setOrder(d.order || d); setLoading(false); }).catch(() => setLoading(false));
  }, [initialOrder, route.params?.id]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
        <ScreenHeader title={t.orderDetails} onBack={() => navigation.goBack()} />
        <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }
  if (!order) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
        <ScreenHeader title={t.orderDetails} onBack={() => navigation.goBack()} />
        <EmptyState icon="receipt-outline" title="Order not found" subtitle="We could not load this order. It may have been removed." />
      </SafeAreaView>
    );
  }

  const stepIdx = Math.max(STEPS.indexOf(order.status), 0);
  const orderTotal = order.totalAmount ?? order.total ?? 0;
  const deliveryAddress = [order.village, order.district, order.province].filter(Boolean).join(', ');
  const statusLabel = t[order.status] || order.status;
  const createdAt = formatAppDateTime(order.createdAt, lang);
  const stepIcons = {
    pending: 'receipt-text-clock-outline',
    confirmed: 'check-decagram-outline',
    shipped: 'truck-fast-outline',
    delivered: 'package-variant-closed-check',
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScreenHeader title={t.orderDetails} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <HeroCard
          eyebrow={`Order #${order.orderNumber || order.id}`}
          title={statusLabel}
          style={[styles.heroSpacing, shadows.lg]}
        >
          <Text style={[styles.heroTotal, { color: c.heroText }]}>{formatPrice(orderTotal)}</Text>
          <View style={styles.heroMeta}>
            <MetaPill icon="calendar-month-outline" label={createdAt} />
            <MetaPill icon="package-variant-closed" label={`${order.items?.length || 0} ${t.items}`} />
          </View>
        </HeroCard>

        {order.status !== 'cancelled' && (
          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[styles.cardTitle, { color: c.text }]}>Delivery progress</Text>
            <View style={styles.progress}>
              {STEPS.map((s, i) => (
                <React.Fragment key={s}>
                  {i > 0 ? <View style={[styles.stepConnector, { backgroundColor: i <= stepIdx ? c.primary : c.border }]} /> : null}
                  <View style={styles.step}>
                    <View style={[styles.stepDot, { backgroundColor: i <= stepIdx ? c.primary : c.border }]}>
                      <MaterialCommunityIcons name={i <= stepIdx ? stepIcons[s] : 'circle-outline'} size={14} color={c.white} />
                    </View>
                    <Text style={[styles.stepLabel, { color: i <= stepIdx ? c.primary : c.textMuted }]}>{t[s] || s}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: c.text }]}>{t.items}</Text>
        {(order.items || []).map((item, i) => (
          <React.Fragment key={i}>
            {i > 0 ? <View style={[styles.itemSeparator, { backgroundColor: c.borderLight }]} /> : null}
            <View style={[styles.itemRow, { backgroundColor: c.card, borderColor: c.border }]}>
              {item.product?.images?.[0]?.url ? <RemoteImage source={item.product.images[0].url} fallbackSource={item.product.images?.[1]?.url} style={styles.itemImg} fallback={<View style={[styles.itemImg, { backgroundColor: c.skeleton }]} />} /> : <View style={[styles.itemImg, { backgroundColor: c.skeleton }]} />}
              <View style={styles.itemInfo}>
                <Text numberOfLines={1} style={[styles.itemName, { color: c.text }]}>{item.product?.nameEn || item.product?.name || 'Product'}</Text>
                <Text style={{ color: c.textSecondary, fontSize: fontSize.sm }}>Qty: {item.quantity} × {formatPrice(item.retailPrice ?? item.price)}</Text>
              </View>
              <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={[styles.itemTotal, { color: c.primary }]}>{formatPrice(item.quantity * (item.retailPrice ?? item.price ?? 0))}</Text>
            </View>
          </React.Fragment>
        ))}

        {(deliveryAddress || order.landmark || order.phone) && (
          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border, marginTop: spacing.lg }]}>
            <Text style={[styles.cardTitle, { color: c.text }]}>{t.deliveryAddress}</Text>
            {!!deliveryAddress && <InfoRow icon="map-marker-outline" value={deliveryAddress} c={c} />}
            {!!order.landmark && <InfoRow icon="map-marker-radius-outline" value={order.landmark} c={c} />}
            {!!order.phone && <InfoRow icon="phone-outline" value={order.phone} c={c} />}
          </View>
        )}

        {!!order.notes && (
          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border, marginTop: spacing.md }]}>
            <Text style={[styles.cardTitle, { color: c.text }]}>Order notice</Text>
            <InfoRow icon="note-text-outline" value={order.notes} c={c} />
          </View>
        )}

        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border, marginTop: spacing.md }]}>
          <View style={styles.cardRow}><Text style={[styles.label, { color: c.textSecondary }]}>{t.subtotal}</Text><Text style={[styles.val, { color: c.text }]}>{formatPrice(orderTotal)}</Text></View>
          <View style={styles.cardRow}><Text style={[styles.label, { color: c.textSecondary }]}>{t.deliveryFee}</Text><Text style={[styles.val, { color: c.success }]}>Free</Text></View>
          <View style={[styles.divider, { borderColor: c.border }]} />
          <View style={styles.cardRow}><Text style={[styles.label, { color: c.text, fontWeight: fontWeight.bold, fontSize: fontSize.md }]}>{t.total}</Text><Text style={[styles.val, { color: c.primary, fontWeight: fontWeight.heavy, fontSize: fontSize.lg }]}>{formatPrice(orderTotal)}</Text></View>
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MetaPill({ icon, label }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View style={[styles.metaPill, { backgroundColor: c.heroSurface }]}>
      <MaterialCommunityIcons name={icon} size={16} color={c.heroTextMuted} />
      <Text style={[styles.metaPillText, { color: c.heroTextMuted }]}>{label}</Text>
    </View>
  );
}

function InfoRow({ icon, value, c }) {
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon} size={18} color={c.primary} />
      <Text style={[styles.infoValue, { color: c.textSecondary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.base, paddingBottom: 120 },
  heroSpacing: { marginBottom: spacing.md },
  heroTotal: { fontSize: fontSize.xxl, fontWeight: fontWeight.heavy },
  heroMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: spacing.md },
  metaPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: borderRadius.full },
  metaPillText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  card: { borderRadius: borderRadius.xl, borderWidth: 1, padding: spacing.base, marginBottom: spacing.md },
  cardTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, marginBottom: 8 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  label: { fontSize: fontSize.sm },
  val: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  divider: { borderTopWidth: 1, marginVertical: 8 },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, marginTop: spacing.lg, marginBottom: spacing.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, marginBottom: 8 },
  itemSeparator: { height: hairline, marginBottom: 8 },
  itemImg: { width: 56, height: 56, borderRadius: borderRadius.md },
  itemInfo: { flex: 1, minWidth: 0, marginLeft: spacing.md },
  itemName: { fontSize: fontSize.base, fontWeight: fontWeight.medium, marginBottom: 2 },
  itemTotal: { maxWidth: '30%', marginLeft: spacing.sm, fontSize: fontSize.base, fontWeight: fontWeight.bold },
  progress: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8 },
  step: { alignItems: 'center' },
  stepDot: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  stepLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, textTransform: 'capitalize' },
  stepConnector: { flex: 1, height: 2, marginTop: 13, marginHorizontal: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  infoValue: { flex: 1, lineHeight: 20 },
});

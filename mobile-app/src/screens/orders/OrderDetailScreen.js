import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import RemoteImage from '../../components/RemoteImage';
import StatusBadge from '../../components/StatusBadge';
import ScreenHeader from '../../components/ScreenHeader';
import { ordersApi } from '../../services/api';
import { formatPrice } from '../../config';
import { spacing, fontSize, fontWeight, borderRadius, shadows } from '../../theme';

const STEPS = ['pending', 'confirmed', 'shipped', 'delivered'];

export default function OrderDetailScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const c = theme.colors;
  const initialOrder = route.params?.order || null;
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(!initialOrder);

  useEffect(() => {
    if (!route.params?.id || initialOrder) return;
    ordersApi.get(route.params?.id).then(d => { setOrder(d.order || d); setLoading(false); }).catch(() => setLoading(false));
  }, [initialOrder, route.params?.id]);

  if (loading) return <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}><ActivityIndicator size="large" color={c.primary} style={{ marginTop: 100 }} /></SafeAreaView>;
  if (!order) return <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}><Text style={{ color: c.text, textAlign: 'center', marginTop: 100 }}>Order not found</Text></SafeAreaView>;

  const stepIdx = Math.max(STEPS.indexOf(order.status), 0);
  const orderTotal = order.totalAmount ?? order.total ?? 0;
  const deliveryAddress = [order.village, order.district, order.province].filter(Boolean).join(', ');
  const statusLabel = t[order.status] || order.status;
  const createdAt = order.createdAt ? new Date(order.createdAt).toLocaleString() : '';
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
        <View style={[styles.heroCard, { backgroundColor: c.secondary }, shadows.lg]}> 
          <Text style={styles.heroEyebrow}>Order #{order.orderNumber || order.id}</Text>
          <Text style={styles.heroTitle}>{statusLabel}</Text>
          <Text style={styles.heroTotal}>{formatPrice(orderTotal)}</Text>
          <View style={styles.heroMeta}>
            <MetaPill icon="calendar-month-outline" label={createdAt} />
            <MetaPill icon="package-variant-closed" label={`${order.items?.length || 0} ${t.items}`} />
          </View>
        </View>

        {order.status !== 'cancelled' && (
          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[styles.cardTitle, { color: c.text }]}>Delivery progress</Text>
            <View style={styles.progress}>
              {STEPS.map((s, i) => (
                <View key={s} style={styles.step}>
                  <View style={[styles.stepDot, { backgroundColor: i <= stepIdx ? c.primary : c.border }]}>
                    <MaterialCommunityIcons name={i <= stepIdx ? stepIcons[s] : 'circle-outline'} size={14} color="#FFF" />
                  </View>
                  <Text style={[styles.stepLabel, { color: i <= stepIdx ? c.primary : c.textMuted }]}>{t[s] || s}</Text>
                  {i < STEPS.length - 1 && <View style={[styles.stepLine, { backgroundColor: i < stepIdx ? c.primary : c.border }]} />}
                </View>
              ))}
            </View>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: c.text }]}>{t.items}</Text>
        {(order.items || []).map((item, i) => (
          <View key={i} style={[styles.itemRow, { backgroundColor: c.card, borderColor: c.border }]}>
            {item.product?.images?.[0]?.url ? <RemoteImage source={item.product.images[0].url} fallbackSource={item.product.images?.[1]?.url} style={styles.itemImg} fallback={<View style={[styles.itemImg, { backgroundColor: c.skeleton }]} />} /> : <View style={[styles.itemImg, { backgroundColor: c.skeleton }]} />}
            <View style={styles.itemInfo}>
              <Text numberOfLines={1} style={[styles.itemName, { color: c.text }]}>{item.product?.nameEn || item.product?.name || 'Product'}</Text>
              <Text style={{ color: c.textSecondary, fontSize: fontSize.sm }}>Qty: {item.quantity} × {formatPrice(item.retailPrice ?? item.price)}</Text>
            </View>
            <Text style={[styles.itemTotal, { color: c.primary }]}>{formatPrice(item.quantity * (item.retailPrice ?? item.price ?? 0))}</Text>
          </View>
        ))}

        {(deliveryAddress || order.landmark || order.phone) && (
          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border, marginTop: spacing.lg }]}>
            <Text style={[styles.cardTitle, { color: c.text }]}>{t.deliveryAddress}</Text>
            {!!deliveryAddress && <InfoRow icon="map-marker-outline" value={deliveryAddress} c={c} />}
            {!!order.landmark && <InfoRow icon="map-marker-radius-outline" value={order.landmark} c={c} />}
            {!!order.phone && <InfoRow icon="phone-outline" value={order.phone} c={c} />}
          </View>
        )}

        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border, marginTop: spacing.md }]}>
          <View style={styles.cardRow}><Text style={[styles.label, { color: c.textSecondary }]}>{t.subtotal}</Text><Text style={[styles.val, { color: c.text }]}>{formatPrice(orderTotal)}</Text></View>
          <View style={styles.cardRow}><Text style={[styles.label, { color: c.textSecondary }]}>{t.deliveryFee}</Text><Text style={[styles.val, { color: c.success }]}>Free</Text></View>
          <View style={[styles.divider, { borderColor: c.border }]} />
          <View style={styles.cardRow}><Text style={[styles.label, { color: c.text, fontWeight: '700', fontSize: fontSize.md }]}>{t.total}</Text><Text style={[styles.val, { color: c.primary, fontWeight: '800', fontSize: fontSize.lg }]}>{formatPrice(orderTotal)}</Text></View>
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MetaPill({ icon, label }) {
  return (
    <View style={styles.metaPill}>
      <MaterialCommunityIcons name={icon} size={16} color="#D6E5FF" />
      <Text style={styles.metaPillText}>{label}</Text>
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
  scroll: { padding: spacing.base },
  heroCard: { borderRadius: borderRadius.xxl, padding: spacing.xl, marginBottom: spacing.md },
  heroEyebrow: { color: '#C6D4FF', fontSize: fontSize.xs, fontWeight: fontWeight.bold, textTransform: 'uppercase', letterSpacing: 1.1 },
  heroTitle: { color: '#FFFFFF', fontSize: fontSize.xl, fontWeight: fontWeight.heavy, marginTop: spacing.sm },
  heroTotal: { color: '#FFFFFF', fontSize: fontSize.xxl, fontWeight: fontWeight.heavy, marginTop: spacing.sm },
  heroMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: spacing.lg },
  metaPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: borderRadius.full, backgroundColor: 'rgba(255,255,255,0.08)' },
  metaPillText: { color: '#D6E5FF', fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  card: { borderRadius: borderRadius.xl, borderWidth: 1, padding: spacing.base, marginBottom: spacing.md },
  cardTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, marginBottom: 8 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  label: { fontSize: fontSize.sm },
  val: { fontSize: fontSize.sm, fontWeight: '500' },
  divider: { borderTopWidth: 1, marginVertical: 8 },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, marginTop: spacing.lg, marginBottom: spacing.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, marginBottom: 8 },
  itemImg: { width: 56, height: 56, borderRadius: borderRadius.sm },
  itemInfo: { flex: 1, marginLeft: spacing.md },
  itemName: { fontSize: fontSize.base, fontWeight: '500', marginBottom: 2 },
  itemTotal: { fontSize: fontSize.base, fontWeight: fontWeight.bold },
  progress: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 8 },
  step: { alignItems: 'center', flex: 1 },
  stepDot: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  stepLabel: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  stepLine: { position: 'absolute', top: 14, left: '60%', right: '-60%', height: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  infoValue: { flex: 1, lineHeight: 20 },
});

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { orders as ordersApi } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { formatPrice, API_URL } from '../config';
import { colors, spacing, fontSize, borderRadius } from '../theme';

const statusColors = { pending: colors.warning, confirmed: colors.info, shipped: '#6f42c1', delivered: colors.success, cancelled: colors.danger };
const steps = ['pending', 'confirmed', 'shipped', 'delivered'];

export default function OrderDetailScreen({ route }) {
  const { id } = route.params;
  const { t, isRTL, getLocalizedName } = useLanguage();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const rowDir = isRTL ? 'row-reverse' : 'row';
  const align = isRTL ? 'right' : 'left';

  useEffect(() => {
    ordersApi.get(id).then(d => setOrder(d.order)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  if (!order) return <View style={styles.center}><Text>{t('order_not_found') || 'Order not found'}</Text></View>;

  const currentStep = steps.indexOf(order.status);
  const statusColor = statusColors[order.status] || colors.gray;

  return (
    <ScrollView style={styles.container}>
      {/* Order Header */}
      <View style={styles.header}>
        <Text style={styles.orderNum}>#{order.orderNumber}</Text>
        <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.badgeText, { color: statusColor }]}>{t(order.status) || order.status}</Text>
        </View>
        <Text style={styles.date}>{new Date(order.createdAt).toLocaleString()}</Text>
      </View>

      {/* Progress Steps */}
      <View style={styles.progressCard}>
        <View style={[styles.stepsRow, { flexDirection: rowDir }]}>
          {steps.map((step, i) => {
            const done = i <= currentStep;
            const isCurrent = i === currentStep;
            return (
              <View key={step} style={styles.stepItem}>
                <View style={[styles.stepCircle, done && styles.stepDone, isCurrent && styles.stepCurrent]}>
                  {done ? <Ionicons name="checkmark" size={14} color={colors.white} /> :
                    <Text style={styles.stepNum}>{i + 1}</Text>}
                </View>
                <Text style={[styles.stepLabel, done && { color: colors.primary }]}>{t(step)}</Text>
                {i < steps.length - 1 && <View style={[styles.stepLine, done && styles.stepLineDone]} />}
              </View>
            );
          })}
        </View>
      </View>

      {/* Shipping Info */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { textAlign: align }]}>{t('delivery_address')}</Text>
        <View style={[styles.infoRow, { flexDirection: rowDir }]}>
          <Ionicons name="location-outline" size={16} color={colors.primary} />
          <Text style={styles.infoText}>
            {[order.shippingVillage, order.shippingDistrict, order.shippingProvince].filter(Boolean).join(', ')}
          </Text>
        </View>
        {order.shippingLandmark && (
          <View style={[styles.infoRow, { flexDirection: rowDir }]}>
            <Ionicons name="navigate-outline" size={16} color={colors.primary} />
            <Text style={styles.infoText}>{order.shippingLandmark}</Text>
          </View>
        )}
        <View style={[styles.infoRow, { flexDirection: rowDir }]}>
          <Ionicons name="call-outline" size={16} color={colors.primary} />
          <Text style={styles.infoText}>{order.shippingPhone}</Text>
        </View>
      </View>

      {/* Order Items */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { textAlign: align }]}>{t('order_items')}</Text>
        {(order.items || []).map(item => {
          const p = item.product;
          const img = p?.images?.[0]?.url;
          const uri = img ? (img.startsWith('http') ? img : `${API_URL}${img}`) : null;
          return (
            <View key={item.id} style={[styles.orderItem, { flexDirection: rowDir }]}>
              <View style={styles.itemImg}>
                {uri ? <Image source={{ uri }} style={styles.img} resizeMode="contain" /> :
                  <Ionicons name="image-outline" size={24} color={colors.border} />}
              </View>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { textAlign: align }]} numberOfLines={2}>
                  {getLocalizedName(p) || item.nameSnapshot || 'Product'}
                </Text>
                <Text style={[styles.itemQty, { textAlign: align }]}>{t('qty')}: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</Text>
            </View>
          );
        })}
      </View>

      {/* Order Total */}
      <View style={styles.totalCard}>
        <View style={[styles.totalRow, { flexDirection: rowDir }]}>
          <Text style={styles.totalLabel}>{t('subtotal')}</Text>
          <Text style={styles.totalVal}>{formatPrice(order.totalAmount)}</Text>
        </View>
        <View style={[styles.totalRow, { flexDirection: rowDir }]}>
          <Text style={styles.totalLabel}>{t('shipping')}</Text>
          <Text style={[styles.totalVal, { color: colors.success }]}>{t('free')}</Text>
        </View>
        <View style={styles.divider} />
        <View style={[styles.totalRow, { flexDirection: rowDir }]}>
          <Text style={styles.grandLabel}>{t('total')}</Text>
          <Text style={styles.grandVal}>{formatPrice(order.totalAmount)}</Text>
        </View>
        <View style={[styles.totalRow, { flexDirection: rowDir }]}>
          <Text style={styles.totalLabel}>{t('payment_status')}</Text>
          <View style={[styles.payBadge, { backgroundColor: order.paymentStatus === 'paid' ? colors.success + '20' : colors.warning + '20' }]}>
            <Text style={{ color: order.paymentStatus === 'paid' ? colors.success : colors.warning, fontWeight: '600', fontSize: fontSize.sm }}>
              {order.paymentStatus === 'paid' ? t('paid') : t('unpaid')}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', paddingVertical: spacing.lg, backgroundColor: colors.white },
  orderNum: { fontSize: fontSize.title, fontWeight: 'bold', color: colors.dark },
  badge: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, borderRadius: borderRadius.round, marginTop: spacing.sm },
  badgeText: { fontSize: fontSize.md, fontWeight: '600' },
  date: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
  progressCard: { backgroundColor: colors.white, marginTop: spacing.sm, padding: spacing.lg },
  stepsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stepItem: { alignItems: 'center', flex: 1 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.grayLight, justifyContent: 'center', alignItems: 'center' },
  stepDone: { backgroundColor: colors.primary },
  stepCurrent: { backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.primaryDark },
  stepNum: { fontSize: fontSize.xs, color: colors.textMuted },
  stepLabel: { fontSize: 9, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  stepLine: { position: 'absolute', top: 14, right: -20, width: 40, height: 2, backgroundColor: colors.grayLight },
  stepLineDone: { backgroundColor: colors.primary },
  section: { backgroundColor: colors.white, marginTop: spacing.sm, padding: spacing.lg },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.dark, marginBottom: spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  infoText: { fontSize: fontSize.md, color: colors.text },
  orderItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.grayLight },
  itemImg: { width: 56, height: 56, borderRadius: borderRadius.sm, backgroundColor: colors.grayLighter, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  img: { width: '100%', height: '100%' },
  itemInfo: { flex: 1, marginHorizontal: spacing.md },
  itemName: { fontSize: fontSize.md, color: colors.text, fontWeight: '500' },
  itemQty: { fontSize: fontSize.sm, color: colors.textMuted },
  itemPrice: { fontSize: fontSize.md, fontWeight: 'bold', color: colors.text },
  totalCard: { backgroundColor: colors.white, marginTop: spacing.sm, padding: spacing.lg },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  totalLabel: { fontSize: fontSize.md, color: colors.textLight },
  totalVal: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  divider: { height: 1, backgroundColor: colors.grayLight, marginVertical: spacing.sm },
  grandLabel: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.dark },
  grandVal: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.primary },
  payBadge: { paddingHorizontal: spacing.md, paddingVertical: 2, borderRadius: borderRadius.round },
});

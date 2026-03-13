import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { orders as ordersApi } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatPrice } from '../config';
import { colors, spacing, fontSize, borderRadius } from '../theme';

export default function CheckoutScreen({ navigation }) {
  const { t, isRTL, getLocalizedName } = useLanguage();
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const [form, setForm] = useState({
    province: user?.province || '',
    district: user?.district || '',
    village: user?.village || '',
    landmark: user?.landmark || '',
    phone: user?.phone || '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const align = isRTL ? 'right' : 'left';
  const rowDir = isRTL ? 'row-reverse' : 'row';

  async function handlePlaceOrder() {
    if (!form.province || !form.district || !form.phone) {
      Alert.alert(t('error'), 'Please fill province, district, and phone');
      return;
    }
    setLoading(true);
    try {
      const data = await ordersApi.create({
        shippingProvince: form.province,
        shippingDistrict: form.district,
        shippingVillage: form.village,
        shippingLandmark: form.landmark,
        shippingPhone: form.phone,
        notes: form.notes,
      });
      await clearCart();
      Alert.alert(t('success'), t('order_placed'), [
        { text: t('view_details'), onPress: () => navigation.replace('OrderDetail', { id: data.order.id }) },
        { text: 'OK', onPress: () => navigation.navigate('OrdersTab') },
      ]);
    } catch (err) {
      Alert.alert(t('error'), err.message);
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="cart-outline" size={64} color={colors.border} />
        <Text style={styles.emptyText}>{t('cart_empty')}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Delivery Address */}
        <Text style={[styles.sectionTitle, { textAlign: align }]}>{t('delivery_address')}</Text>
        <View style={styles.card}>
          <Text style={[styles.label, { textAlign: align }]}>{t('province')} *</Text>
          <TextInput style={[styles.input, { textAlign: align }]} value={form.province} onChangeText={v => set('province', v)} placeholder={t('province')} />

          <Text style={[styles.label, { textAlign: align }]}>{t('district')} *</Text>
          <TextInput style={[styles.input, { textAlign: align }]} value={form.district} onChangeText={v => set('district', v)} placeholder={t('district')} />

          <Text style={[styles.label, { textAlign: align }]}>{t('village')}</Text>
          <TextInput style={[styles.input, { textAlign: align }]} value={form.village} onChangeText={v => set('village', v)} placeholder={t('village')} />

          <Text style={[styles.label, { textAlign: align }]}>{t('landmark')}</Text>
          <TextInput style={[styles.input, { textAlign: align }]} value={form.landmark} onChangeText={v => set('landmark', v)} placeholder={t('landmark')} />

          <Text style={[styles.label, { textAlign: align }]}>{t('phone')} *</Text>
          <TextInput style={[styles.input, { textAlign: align }]} value={form.phone} onChangeText={v => set('phone', v)} placeholder={t('phone')} keyboardType="phone-pad" />

          <Text style={[styles.label, { textAlign: align }]}>{t('order_notes')}</Text>
          <TextInput style={[styles.input, styles.textarea, { textAlign: align }]} value={form.notes} onChangeText={v => set('notes', v)} placeholder={t('optional')} multiline numberOfLines={3} />
        </View>

        {/* Payment Method */}
        <Text style={[styles.sectionTitle, { textAlign: align }]}>{t('payment_method')}</Text>
        <View style={[styles.paymentCard, { flexDirection: rowDir }]}>
          <Ionicons name="cash-outline" size={24} color={colors.success} />
          <View style={{ flex: 1, marginHorizontal: spacing.md }}>
            <Text style={[styles.payTitle, { textAlign: align }]}>{t('cod')}</Text>
            <Text style={[styles.payDesc, { textAlign: align }]}>{t('cod_desc')}</Text>
          </View>
          <Ionicons name="checkmark-circle" size={24} color={colors.success} />
        </View>

        {/* Order Summary */}
        <Text style={[styles.sectionTitle, { textAlign: align }]}>{t('order_summary')}</Text>
        <View style={styles.card}>
          {items.map(item => {
            const p = item.product;
            const price = p?.retailPrice || p?.suggestedPrice || 0;
            return (
              <View key={item.id} style={[styles.summaryItem, { flexDirection: rowDir }]}>
                <Text style={styles.summaryName} numberOfLines={1}>{getLocalizedName(p)} x{item.quantity}</Text>
                <Text style={styles.summaryPrice}>{formatPrice(price * item.quantity)}</Text>
              </View>
            );
          })}
          <View style={[styles.divider]} />
          <View style={[styles.summaryItem, { flexDirection: rowDir }]}>
            <Text style={styles.summaryLabel}>{t('subtotal')}</Text>
            <Text style={styles.summaryPrice}>{formatPrice(total)}</Text>
          </View>
          <View style={[styles.summaryItem, { flexDirection: rowDir }]}>
            <Text style={styles.summaryLabel}>{t('shipping')}</Text>
            <Text style={[styles.summaryPrice, { color: colors.success }]}>{t('free')}</Text>
          </View>
          <View style={[styles.divider]} />
          <View style={[styles.summaryItem, { flexDirection: rowDir }]}>
            <Text style={styles.totalLabel}>{t('total')}</Text>
            <Text style={styles.totalAmount}>{formatPrice(total)}</Text>
          </View>
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.orderBtn, loading && { opacity: 0.6 }]} onPress={handlePlaceOrder} disabled={loading}>
          <Ionicons name="checkmark-circle-outline" size={20} color={colors.white} />
          <Text style={styles.orderBtnText}>{loading ? t('placing_order') : t('place_order')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: fontSize.xl, color: colors.textLight, marginTop: spacing.md },
  sectionTitle: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.dark, marginBottom: spacing.sm, marginTop: spacing.md },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.sm },
  label: { fontSize: fontSize.md, color: colors.text, fontWeight: '500', marginBottom: spacing.xs },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, fontSize: fontSize.md, marginBottom: spacing.md, backgroundColor: colors.grayLighter },
  textarea: { height: 80, textAlignVertical: 'top' },
  paymentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.success },
  payTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.dark },
  payDesc: { fontSize: fontSize.sm, color: colors.textLight },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  summaryName: { flex: 1, fontSize: fontSize.md, color: colors.text },
  summaryPrice: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  summaryLabel: { fontSize: fontSize.md, color: colors.textLight },
  divider: { height: 1, backgroundColor: colors.grayLight, marginVertical: spacing.sm },
  totalLabel: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.dark },
  totalAmount: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.primary },
  bottomBar: { padding: spacing.lg, paddingBottom: spacing.xl, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.grayLight },
  orderBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.success, padding: spacing.md, borderRadius: borderRadius.md },
  orderBtnText: { color: colors.white, fontSize: fontSize.lg, fontWeight: 'bold' },
});

import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import { ordersApi, subscribeApi } from '../../services/api';
import Input from '../../components/Input';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import ScreenHeader from '../../components/ScreenHeader';
import { formatPrice } from '../../config';
import { spacing, fontSize, fontWeight, borderRadius, shadows } from '../../theme';

export default function CheckoutScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { items, total, clearCart } = useCart();
  const toast = useToast();
  const c = theme.colors;

  const [form, setForm] = useState({ province: '', district: '', village: '', landmark: '', phone: '', notes: '' });
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const openTab = (tabName) => {
    const parent = navigation.getParent();
    if (parent?.navigate) {
      parent.navigate(tabName);
      return;
    }

    navigation.navigate(tabName);
  };

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    try {
      const data = await subscribeApi.validateCoupon({ code: coupon.trim(), orderTotal: total });
      setDiscount(data.discount || 0);
      toast.success(`Coupon applied! ${data.discount}% off`);
    } catch (err) {
      toast.error(err.message || 'Invalid coupon');
      setDiscount(0);
    }
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.province.trim()) nextErrors.province = 'Required';
    if (!form.district.trim()) nextErrors.district = 'Required';
    if (!form.village.trim()) nextErrors.village = 'Required';
    if (!form.phone.trim()) nextErrors.phone = 'Required';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleOrder = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const body = {
        items: items.map((item) => ({
          productId: item.productId || item.product?.id,
          quantity: item.quantity,
        })),
        province: form.province.trim(),
        district: form.district.trim(),
        village: form.village.trim(),
        landmark: form.landmark.trim(),
        phone: form.phone.trim(),
        notes: form.notes,
      };

      if (coupon.trim() && discount > 0) body.couponCode = coupon.trim();

      const data = await ordersApi.create(body);
      await clearCart();
      navigation.replace('OrderSuccess', { order: data.order || data });
    } catch (err) {
      toast.error(err.message || 'Failed to place order');
    }
    setLoading(false);
  };

  const deliveryFee = 0;
  const discountAmount = total * (discount / 100);
  const grandTotal = total - discountAmount + deliveryFee;

  if (items.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
        <EmptyState
          icon="cart-outline"
          title={t.emptyCart}
          subtitle="Add products before opening checkout."
          actionLabel={t.startShopping}
          onAction={() => openTab('ShopTab')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScreenHeader title={t.checkout} onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={[styles.heroCard, { backgroundColor: c.secondary }, shadows.lg]}>
            <Text style={styles.heroEyebrow}>Secure checkout</Text>
            <Text style={styles.heroTitle}>Confirm delivery details and place your order with cash on delivery.</Text>
            <Text style={styles.heroBody}>Review the address carefully so the driver reaches you without extra calls.</Text>
            <View style={styles.heroStats}>
              <CheckoutPill icon="shopping-outline" label={`${items.length} ${items.length === 1 ? 'product' : 'products'}`} />
              <CheckoutPill icon="cash-fast" label={t.cashOnDelivery} />
              <CheckoutPill icon="truck-fast-outline" label="Fast dispatch" />
            </View>
          </View>

          <SectionHeading c={c} icon="map-marker-radius-outline" title={t.deliveryAddress} subtitle="Use the clearest location details you can provide." />
          <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}> 
            <Input label={t.province} value={form.province} onChangeText={(value) => set('province', value)} error={errors.province} placeholder="e.g. Kabul" />
            <Input label={t.district} value={form.district} onChangeText={(value) => set('district', value)} error={errors.district} placeholder="e.g. District 10" />
            <Input label={t.village} value={form.village} onChangeText={(value) => set('village', value)} error={errors.village} placeholder="e.g. Qala-e-Fatullah" />
            <Input label={`${t.landmark} (${t.optional})`} value={form.landmark} onChangeText={(value) => set('landmark', value)} placeholder="Near mosque..." />
            <Input label={t.phone} value={form.phone} onChangeText={(value) => set('phone', value)} error={errors.phone} keyboardType="phone-pad" placeholder="+93 7XX XXX XXX" />
            <Input label={`${t.notes} (${t.optional})`} value={form.notes} onChangeText={(value) => set('notes', value)} placeholder="Any special instructions" multiline numberOfLines={2} />
          </View>

          <SectionHeading c={c} icon="wallet-outline" title={t.paymentMethod} subtitle="One payment method is active right now." />
          <View style={[styles.payMethod, { backgroundColor: c.card, borderColor: c.primary }]}> 
            <View style={[styles.payIcon, { backgroundColor: c.brandSurface }]}> 
              <MaterialCommunityIcons name="cash-fast" size={24} color={c.primary} />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={[styles.payLabel, { color: c.text }]}>{t.cashOnDelivery}</Text>
              <Text style={{ color: c.textSecondary, fontSize: fontSize.sm }}>Pay when you receive the order</Text>
            </View>
            <MaterialCommunityIcons name="check-circle" size={22} color={c.primary} style={{ marginLeft: 'auto' }} />
          </View>

          <SectionHeading c={c} icon="ticket-percent-outline" title={t.couponCode} subtitle="Apply a valid discount before placing the order." />
          <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}> 
            <View style={styles.couponRow}>
              <Input value={coupon} onChangeText={setCoupon} placeholder="Enter code" style={styles.couponInput} />
              <Button title={t.apply} onPress={applyCoupon} size="sm" variant="outline" />
            </View>
          </View>

          <SectionHeading c={c} icon="receipt-text-check-outline" title={t.orderSummary} subtitle="Totals update instantly before you place the order." />
          <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}> 
            <SumRow label={`${t.items} (${items.length})`} value={formatPrice(total)} c={c} />
            {discount > 0 ? <SumRow label={`Discount (${discount}%)`} value={`-${formatPrice(discountAmount)}`} c={c} valueColor={c.success} /> : null}
            <SumRow label={t.deliveryFee} value={deliveryFee > 0 ? formatPrice(deliveryFee) : 'Free'} c={c} valueColor={c.success} />
            <View style={[styles.divider, { borderColor: c.border }]} />
            <SumRow label={t.total} value={formatPrice(grandTotal)} c={c} bold />
          </View>

          <View style={[styles.noteCard, { backgroundColor: c.brandSurfaceStrong }]}> 
            <MaterialCommunityIcons name="shield-lock-outline" size={18} color={c.primary} />
            <Text style={[styles.noteText, { color: c.textSecondary }]}>Your order details are confirmed before dispatch, and you can track the status after placing it.</Text>
          </View>
        </ScrollView>

        <View style={[styles.bottomBar, { backgroundColor: c.card, borderTopColor: c.border }]}> 
          <View style={styles.bottomSummary}>
            <Text style={[styles.bottomLabel, { color: c.textSecondary }]}>{t.total}</Text>
            <Text style={[styles.bottomValue, { color: c.text }]}>{formatPrice(grandTotal)}</Text>
          </View>
          <Button
            title={t.placeOrder}
            onPress={handleOrder}
            loading={loading}
            style={{ flex: 1 }}
            size="lg"
            icon={<MaterialCommunityIcons name="check-circle-outline" size={20} color={c.white} />}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CheckoutPill({ icon, label }) {
  return (
    <View style={styles.heroPill}>
      <MaterialCommunityIcons name={icon} size={16} color="#D6E5FF" />
      <Text style={styles.heroPillText}>{label}</Text>
    </View>
  );
}

function SectionHeading({ c, icon, title, subtitle }) {
  return (
    <View style={styles.sectionHeading}>
      <View style={[styles.sectionIcon, { backgroundColor: c.brandSurface }]}> 
        <MaterialCommunityIcons name={icon} size={18} color={c.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>{title}</Text>
        <Text style={[styles.sectionSubtitle, { color: c.textSecondary }]}>{subtitle}</Text>
      </View>
    </View>
  );
}

function SumRow({ label, value, c, bold, valueColor }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
      <Text style={{ color: c.textSecondary, fontSize: fontSize.base, fontWeight: bold ? '700' : '400' }}>{label}</Text>
      <Text style={{ color: valueColor || c.text, fontSize: bold ? fontSize.lg : fontSize.base, fontWeight: bold ? '700' : '500' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.base, paddingBottom: 100 },
  heroCard: { borderRadius: borderRadius.xxl, padding: spacing.xl, marginBottom: spacing.lg },
  heroEyebrow: { color: '#C6D4FF', fontSize: fontSize.xs, fontWeight: fontWeight.bold, letterSpacing: 1.1, textTransform: 'uppercase' },
  heroTitle: { color: '#FFFFFF', fontSize: fontSize.xl, fontWeight: fontWeight.heavy, lineHeight: 30, marginTop: spacing.sm },
  heroBody: { color: '#D6E5FF', fontSize: fontSize.base, lineHeight: 22, marginTop: spacing.sm },
  heroStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: spacing.lg },
  heroPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: borderRadius.full, backgroundColor: 'rgba(255,255,255,0.08)' },
  heroPillText: { color: '#D6E5FF', fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: spacing.lg, marginBottom: spacing.sm },
  sectionIcon: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  sectionSubtitle: { fontSize: fontSize.sm, lineHeight: 20, marginTop: 2 },
  section: { borderRadius: borderRadius.xl, borderWidth: 1, padding: spacing.base },
  payMethod: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, borderRadius: borderRadius.xl, borderWidth: 1.5 },
  payIcon: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  payLabel: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  couponRow: { flexDirection: 'row', alignItems: 'flex-end' },
  couponInput: { flex: 1, marginBottom: 0, marginRight: 8 },
  divider: { borderTopWidth: 1, marginVertical: 8 },
  noteCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: borderRadius.xl, padding: spacing.base, marginTop: spacing.base },
  noteText: { flex: 1, fontSize: fontSize.sm, lineHeight: 21 },
  bottomBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.base, padding: spacing.base, borderTopWidth: 1 },
  bottomSummary: { minWidth: 96 },
  bottomLabel: { fontSize: fontSize.xs, marginBottom: 4 },
  bottomValue: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
});

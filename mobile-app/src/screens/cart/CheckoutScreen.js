import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity, Modal, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import IconButton from '../../components/IconButton';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import { ordersApi, subscribeApi } from '../../services/api';
import Input from '../../components/Input';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import RemoteImage from '../../components/RemoteImage';
import ScreenHeader from '../../components/ScreenHeader';
import { formatPrice } from '../../config';
import { spacing, fontSize, fontWeight } from '../../theme';

const PROVINCES = "Badakhshan,Badghis,Baghlan,Balkh,Bamyan,Daykundi,Farah,Faryab,Ghazni,Ghor,Helmand,Herat,Jowzjan,Kabul,Kandahar,Kapisa,Khost,Kunar,Kunduz,Laghman,Logar,Nangarhar,Nimroz,Nuristan,Paktia,Paktika,Panjshir,Parwan,Samangan,Sar-e Pol,Takhar,Uruzgan,Wardak,Zabul".split(",");

const checkoutCopy = {
  en: { selectProvince: 'Select province', chooseProvince: 'Choose province', close: 'Close', freeDelivery: 'Free delivery', delivery: 'delivery', free: 'Free', payOnArrival: 'Pay when you receive your order', enterCode: 'Enter code', discount: 'Discount' },
  ps: { selectProvince: 'ولایت وټاکئ', chooseProvince: 'ولایت وټاکئ', close: 'بندول', freeDelivery: 'وړیا تحویلي', delivery: 'تحویلي', free: 'وړیا', payOnArrival: 'د سفارښت د ترلاسه کولو پر وخت پیسې ورکړئ', enterCode: 'کوډ ولیکئ', discount: 'تخفیف' },
  dr: { selectProvince: 'ولایت را انتخاب کنید', chooseProvince: 'انتخاب ولایت', close: 'بستن', freeDelivery: 'تحویل رایگان', delivery: 'تحویل', free: 'رایگان', payOnArrival: 'هنگام دریافت سفارش پرداخت کنید', enterCode: 'کد را وارد کنید', discount: 'تخفیف' },
};

export default function CheckoutScreen({ navigation }) {
  const { theme } = useTheme();
  const { t, getName, isRTL, lang } = useLanguage();
  const { items, total, clearCart } = useCart();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const c = theme.colors;
  const { width, fontScale } = useWindowDimensions();
  const copy = checkoutCopy[lang] || checkoutCopy.en;
  const rowDirection = { flexDirection: isRTL ? 'row-reverse' : 'row' };
  const alignment = { textAlign: isRTL ? 'right' : 'left' };
  const stackCoupon = width < 375 || fontScale > 1.2;

  const [form, setForm] = useState({ province: '', district: '', village: '', landmark: '', phone: '', notes: '' });
  const [provinceOpen, setProvinceOpen] = useState(false);
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
      navigation.replace('OrderSuccess', { order: data.order || data, products: items });
    } catch (err) {
      toast.error(err.message || 'Failed to place order');
    }
    setLoading(false);
  };

  const deliveryFee = form.province && form.province !== 'Kandahar' ? 150 : 0;
  const discountAmount = total * (discount / 100);
  const grandTotal = total - discountAmount + deliveryFee;

  if (items.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top', 'left', 'right']}>
        <ScreenHeader title={t.checkout} onBack={() => navigation.goBack()} />
        <EmptyState
          icon="cart-outline"
          title={t.emptyCart}
          actionLabel={t.startShopping}
          onAction={() => openTab('ShopTab')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top', 'left', 'right']}>
      <ScreenHeader title={t.checkout} onBack={() => navigation.goBack()} />
      <Modal visible={provinceOpen} transparent animationType="slide" onRequestClose={() => setProvinceOpen(false)}>
        <View style={[styles.pickerBackdrop, { paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={[styles.picker, { backgroundColor: c.card }]}>
            <View style={[styles.pickerHeading, rowDirection]}>
              <Text accessibilityRole="header" style={[styles.pickerTitle, alignment, { color: c.text }]}>{copy.chooseProvince}</Text>
              <IconButton icon="close" onPress={() => setProvinceOpen(false)} accessibilityLabel={copy.close} style={{ flexShrink: 0 }} />
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {PROVINCES.map(p => (
                <TouchableOpacity
                  key={p}
                  accessibilityRole="button"
                  accessibilityState={{ selected: form.province === p }}
                  onPress={() => { set('province', p); setProvinceOpen(false); }}
                  style={[styles.provinceOption, rowDirection, { borderBottomColor: c.borderLight }]}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.provinceName, alignment, { color: c.text }]}>{p}</Text>
                    <Text style={[styles.provinceFee, alignment, { color: c.textSecondary }]}>{p === 'Kandahar' ? copy.freeDelivery : `${formatPrice(150)} · ${copy.delivery}`}</Text>
                  </View>
                  {form.province === p ? <MaterialCommunityIcons name="check" size={20} color={c.primary} /> : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Button title={copy.close} onPress={() => setProvinceOpen(false)} variant="outline" style={{ marginTop: 12 }} />
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
          <SectionHeading c={c} title={t.orderSummary} alignment={alignment} first />
          <View style={[styles.section, { backgroundColor: c.card, borderColor: c.borderLight }]}>
            {items.map((item, index) => {
              const product = item.product || item;
              const price = product.retailPrice || product.suggestedPrice || 0;
              const image = product.images?.[0]?.url || product.image || product.thumbnail;
              return (
                <View key={String(item.id || item.productId || index)} style={[styles.productRow, rowDirection, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.borderLight, marginTop: 12, paddingTop: 12 }]}>
                  <View style={[styles.productImageFrame, { backgroundColor: c.surfaceElevated }]}>
                    <RemoteImage source={image} fallbackSource={product.images?.[1]?.url} width={180} quality={76} resizeMode="contain" style={styles.productImage} fallback={<MaterialCommunityIcons name="image-outline" size={24} color={c.textMuted} />} />
                  </View>
                  <View style={styles.productInfo}>
                    <Text numberOfLines={fontScale > 1.3 ? 3 : 2} style={[styles.productName, alignment, { color: c.text }]}>{getName(product)}</Text>
                    <Text style={[styles.productMeta, alignment, { color: c.textSecondary }]}>{t.qty} {item.quantity} × {formatPrice(price)}</Text>
                    <Text style={[styles.productTotal, alignment, { color: c.text }]}>{formatPrice(price * (item.quantity || 1))}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          <SectionHeading c={c} title={t.deliveryAddress} alignment={alignment} />
          <View style={[styles.section, { backgroundColor: c.card, borderColor: c.borderLight }]}>
            <Text style={[styles.fieldLabel, alignment, { color: c.textSecondary }]}>{t.province} *</Text>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${t.province}: ${form.province || copy.selectProvince}`} onPress={() => setProvinceOpen(true)} style={[styles.provinceControl, rowDirection, { backgroundColor: c.inputBg, borderColor: errors.province ? c.error : c.inputBorder }]}>
              <Text style={[styles.provinceValue, alignment, { color: form.province ? c.text : c.placeholder }]}>{form.province || copy.selectProvince}</Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={c.textSecondary} />
            </TouchableOpacity>
            {errors.province ? <Text accessibilityRole="alert" style={[styles.fieldError, alignment, { color: c.error }]}>{errors.province}</Text> : null}
            <Input label={t.district} value={form.district} onChangeText={(value) => set('district', value)} error={errors.district} inputStyle={alignment} />
            <Input label={t.village} value={form.village} onChangeText={(value) => set('village', value)} error={errors.village} inputStyle={alignment} />
            <Input label={`${t.landmark} (${t.optional})`} value={form.landmark} onChangeText={(value) => set('landmark', value)} inputStyle={alignment} />
            <Input label={t.phone} value={form.phone} onChangeText={(value) => set('phone', value)} error={errors.phone} keyboardType="phone-pad" placeholder="+93 7XX XXX XXX" />
            <Input label={`${t.notes} (${t.optional})`} value={form.notes} onChangeText={(value) => set('notes', value)} multiline numberOfLines={2} inputStyle={alignment} style={{ marginBottom: 0 }} />
          </View>

          <SectionHeading c={c} title={t.paymentMethod} alignment={alignment} />
          <View style={[styles.payMethod, rowDirection, { backgroundColor: c.card, borderColor: c.borderLight }]}>
            <View style={[styles.payIcon, { backgroundColor: c.surfaceElevated }]}>
              <MaterialCommunityIcons name="cash-fast" size={24} color={c.primary} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.payLabel, alignment, { color: c.text }]}>{t.cashOnDelivery}</Text>
              <Text style={[styles.payDescription, alignment, { color: c.textSecondary }]}>{copy.payOnArrival}</Text>
            </View>
            <MaterialCommunityIcons name="check-circle" size={22} color={c.success} />
          </View>

          <SectionHeading c={c} title={t.couponCode} alignment={alignment} />
          <View style={[styles.section, { backgroundColor: c.card, borderColor: c.borderLight }]}>
            <View style={[styles.couponRow, stackCoupon ? { flexDirection: 'column', alignItems: 'stretch' } : rowDirection]}>
              <Input value={coupon} onChangeText={setCoupon} placeholder={copy.enterCode} inputStyle={alignment} style={[styles.couponInput, stackCoupon && { flex: 0, width: '100%' }]} />
              <Button title={t.apply} onPress={applyCoupon} size="sm" variant="outline" style={!stackCoupon ? { minWidth: 92, alignSelf: 'center' } : undefined} />
            </View>
          </View>

          <SectionHeading c={c} title={t.total} alignment={alignment} />
          <View style={[styles.section, { backgroundColor: c.card, borderColor: c.borderLight }]}>
            <SumRow label={t.subtotal} value={formatPrice(total)} c={c} isRTL={isRTL} />
            {discount > 0 ? <SumRow label={`${copy.discount} (${discount}%)`} value={`-${formatPrice(discountAmount)}`} c={c} valueColor={c.success} isRTL={isRTL} /> : null}
            <SumRow label={t.deliveryFee} value={form.province ? (deliveryFee > 0 ? formatPrice(deliveryFee) : copy.free) : '—'} c={c} valueColor={form.province && deliveryFee === 0 ? c.success : c.text} isRTL={isRTL} />
            <View style={[styles.divider, { borderColor: c.borderLight }]} />
            <SumRow label={t.total} value={formatPrice(grandTotal)} c={c} bold isRTL={isRTL} />
          </View>
        </ScrollView>

        <View style={[styles.bottomBar, { backgroundColor: c.card, borderTopColor: c.borderLight, paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <View style={[styles.bottomSummary, rowDirection]}>
            <Text style={[styles.bottomLabel, { color: c.textSecondary }]}>{t.total}</Text>
            <Text style={[styles.bottomValue, { color: c.text }]}>{formatPrice(grandTotal)}</Text>
          </View>
          <Button
            title={t.placeOrder}
            onPress={handleOrder}
            loading={loading}
            style={styles.placeOrderBtn}
            size="lg"
            icon={<MaterialCommunityIcons name="check-circle-outline" size={20} color={c.white} />}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SectionHeading({ c, title, alignment, first }) {
  return (
    <Text accessibilityRole="header" style={[styles.sectionTitle, alignment, first && { marginTop: 0 }, { color: c.text }]}>{title}</Text>
  );
}

function SumRow({ label, value, c, bold, valueColor, isRTL }) {
  return (
    <View style={[styles.sumRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <Text style={[styles.sumLabel, { textAlign: isRTL ? 'right' : 'left', color: bold ? c.text : c.textSecondary, fontWeight: bold ? fontWeight.semibold : fontWeight.regular }]}>{label}</Text>
      <Text style={[styles.sumValue, { textAlign: isRTL ? 'left' : 'right', color: valueColor || c.text, fontSize: bold ? 20 : 15, fontWeight: bold ? fontWeight.bold : fontWeight.medium }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, width: '100%', maxWidth: 1200, alignSelf: 'center' },
  scroll: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: spacing.base, paddingBottom: spacing.xl },
  sectionTitle: { fontSize: 17, lineHeight: 25, fontWeight: fontWeight.semibold, marginTop: 24, marginBottom: 10 },
  section: { borderRadius: 16, borderWidth: 1, padding: 14 },
  productRow: { alignItems: 'center', gap: 12 },
  productImageFrame: { width: 72, height: 72, flexShrink: 0, borderRadius: 11, padding: 7, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  productImage: { width: '100%', height: '100%' },
  productInfo: { flex: 1, minWidth: 0 },
  productName: { fontSize: 15, lineHeight: 22, fontWeight: fontWeight.semibold },
  productMeta: { fontSize: 13, lineHeight: 20, marginTop: 4 },
  productTotal: { fontSize: 15, lineHeight: 22, fontWeight: fontWeight.bold, marginTop: 4 },
  fieldLabel: { fontSize: 14, lineHeight: 21, fontWeight: fontWeight.semibold, marginBottom: 8 },
  provinceControl: { minHeight: 56, alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16 },
  provinceValue: { flex: 1, minWidth: 0, fontSize: 15, lineHeight: 22 },
  fieldError: { fontSize: 14, lineHeight: 21, marginBottom: 12 },
  pickerBackdrop: { flex: 1, backgroundColor: '#0008', justifyContent: 'center', alignItems: 'center', padding: 16 },
  picker: { width: '100%', maxWidth: 640, borderRadius: 20, maxHeight: '85%', padding: 16 },
  pickerHeading: { alignItems: 'center', marginBottom: 12, gap: 12 },
  pickerTitle: { flex: 1, fontSize: 20, lineHeight: 28, fontWeight: fontWeight.semibold },
  provinceOption: { minHeight: 56, alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  provinceName: { fontSize: 15, lineHeight: 22, fontWeight: fontWeight.medium },
  provinceFee: { fontSize: 13, lineHeight: 20, marginTop: 3 },
  payMethod: { alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  payIcon: { width: 44, height: 44, flexShrink: 0, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  payLabel: { fontSize: 15, lineHeight: 22, fontWeight: fontWeight.semibold },
  payDescription: { fontSize: 13, lineHeight: 20, marginTop: 3 },
  couponRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  couponInput: { flex: 1, minWidth: 0, marginBottom: 0 },
  sumRow: { justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, paddingVertical: 7 },
  sumLabel: { flexGrow: 1, flexShrink: 1, fontSize: 15, lineHeight: 24 },
  sumValue: { flexShrink: 1, lineHeight: 28 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, marginVertical: 8 },
  bottomBar: { gap: spacing.md, padding: spacing.base, borderTopWidth: 1 },
  bottomSummary: { width: '100%', maxWidth: 688, alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  bottomLabel: { fontSize: fontSize.sm },
  bottomValue: { flexShrink: 1, fontSize: 22, lineHeight: 30, fontWeight: fontWeight.bold },
  placeOrderBtn: { width: '100%', maxWidth: 688, alignSelf: 'center' },
});

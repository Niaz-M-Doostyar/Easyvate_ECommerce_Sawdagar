import React from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Button from '../../components/Button';
import RemoteImage from '../../components/RemoteImage';
import { formatPrice } from '../../config';
import { spacing, fontWeight } from '../../theme';

// The receipt follows the server order. Cart snapshots only supply photos and
// missing names because the create response does not include product images.
export function buildReceiptItems(order, snapshots = []) {
  const savedProducts = Array.isArray(snapshots) ? snapshots : [];
  if (!Object.prototype.hasOwnProperty.call(order || {}, 'items')) return savedProducts;
  if (!Array.isArray(order.items)) return [];

  const productId = item => item.productId ?? item.product?.id ?? item.id;
  return order.items.map(item => {
    const id = productId(item);
    const snapshot = id == null ? null : savedProducts.find(saved => String(productId(saved)) === String(id));
    const savedProduct = snapshot?.product || snapshot || {};
    const product = { ...(item.product || {}) };
    for (const field of ['nameEn', 'namePs', 'nameDr', 'name']) {
      if (!product[field] && savedProduct[field]) product[field] = savedProduct[field];
    }
    const hasPhoto = product.images?.some(image => image?.url) || product.image || product.thumbnail;
    if (!hasPhoto) {
      if (savedProduct.images?.some(image => image?.url)) product.images = savedProduct.images;
      if (savedProduct.image) product.image = savedProduct.image;
      if (savedProduct.thumbnail) product.thumbnail = savedProduct.thumbnail;
    }
    return { ...item, product };
  });
}

export default function OrderSuccessScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { t, getName, isRTL } = useLanguage();
  const c = theme.colors;
  const order = route.params?.order;
  const products = buildReceiptItems(order, route.params?.products);
  const orderTotal = order?.totalAmount ?? order?.total;
  const { fontScale } = useWindowDimensions();
  const rowDirection = { flexDirection: isRTL ? 'row-reverse' : 'row' };
  const alignment = { textAlign: isRTL ? 'right' : 'left' };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.center} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.borderLight }]}>
          <View style={[styles.iconWrap, { backgroundColor: c.success + '14' }]}>
            <MaterialCommunityIcons name="check-circle-outline" size={32} color={c.success} />
          </View>
          <Text style={[styles.title, { color: c.text }]}>{t.orderPlaced}</Text>
          {order?.orderNumber ? <Text style={[styles.ordNum, { color: c.textSecondary }]}>{t.orderNumber} {order.orderNumber}</Text> : null}
          {order?.status ? <View style={[styles.status, rowDirection, { backgroundColor: c.surfaceElevated }]}><MaterialCommunityIcons name="clock-outline" size={18} color={c.textSecondary} /><Text style={[styles.statusLabel, { color: c.textSecondary }]}>{t[order.status] || order.status}</Text></View> : null}

          {products.length > 0 ? (
            <View style={[styles.receipt, { borderTopColor: c.borderLight }]}>
              {products.map((item, index) => {
                const product = item.product || item;
                const price = item.retailPrice ?? item.price ?? product.retailPrice ?? product.suggestedPrice ?? 0;
                const image = product.images?.[0]?.url || product.image || product.thumbnail;
                return (
                  <View key={String(item.id || item.productId || index)} style={[styles.productRow, rowDirection, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.borderLight }]}>
                    <View style={[styles.imageFrame, { backgroundColor: c.surfaceElevated }]}>
                      <RemoteImage source={image} fallbackSource={product.images?.[1]?.url} width={180} quality={76} resizeMode="contain" style={styles.image} fallback={<MaterialCommunityIcons name="image-outline" size={22} color={c.textMuted} />} />
                    </View>
                    <View style={styles.productInfo}>
                      <Text numberOfLines={fontScale > 1.3 ? 3 : 2} style={[styles.productName, alignment, { color: c.text }]}>{getName(product)}</Text>
                      <Text style={[styles.productMeta, alignment, { color: c.textSecondary }]}>{t.qty} {item.quantity} × {formatPrice(price)}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}
          {orderTotal != null ? (
            <View style={[styles.totalRow, rowDirection, { borderTopColor: c.borderLight }]}>
              <Text style={[styles.totalLabel, { color: c.textSecondary }]}>{t.total}</Text>
              <Text style={[styles.totalValue, { color: c.text }]}>{formatPrice(orderTotal)}</Text>
            </View>
          ) : null}

          <Button
            title={t.orderDetails}
            onPress={() => navigation.replace('OrderDetail', { id: order?.id })}
            style={styles.primaryAction}
            icon={<MaterialCommunityIcons name="clipboard-text-outline" size={20} color={c.white} />}
          />
          <Button
            title={t.startShopping}
            onPress={() => navigation.navigate('HomeTab')}
            variant="outline"
            style={styles.secondaryAction}
            icon={<MaterialCommunityIcons name="shopping-outline" size={20} color={c.primary} />}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, width: '100%', maxWidth: 1200, alignSelf: 'center' },
  center: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.base },
  card: { width: '100%', maxWidth: 680, borderWidth: 1, borderRadius: 16, padding: 20, alignItems: 'center' },
  iconWrap: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, lineHeight: 33, fontWeight: fontWeight.bold, textAlign: 'center', marginBottom: 8 },
  ordNum: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
  status: { alignItems: 'center', justifyContent: 'center', gap: 7, flexWrap: 'wrap', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginTop: 12 },
  statusLabel: { flexShrink: 1, fontSize: 13, lineHeight: 20, fontWeight: fontWeight.medium },
  receipt: { width: '100%', marginTop: 20, borderTopWidth: StyleSheet.hairlineWidth },
  productRow: { alignItems: 'center', gap: 12, paddingVertical: 12 },
  imageFrame: { width: 64, height: 64, flexShrink: 0, padding: 6, borderRadius: 11, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: '100%' },
  productInfo: { flex: 1, minWidth: 0 },
  productName: { fontSize: 15, lineHeight: 22, fontWeight: fontWeight.semibold },
  productMeta: { fontSize: 13, lineHeight: 20, marginTop: 4 },
  totalRow: { width: '100%', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth },
  totalLabel: { flexShrink: 1, fontSize: 15, lineHeight: 24 },
  totalValue: { flexShrink: 1, fontSize: 20, lineHeight: 28, fontWeight: fontWeight.bold },
  primaryAction: { marginTop: 24, width: '100%' },
  secondaryAction: { marginTop: 10, width: '100%' },
});

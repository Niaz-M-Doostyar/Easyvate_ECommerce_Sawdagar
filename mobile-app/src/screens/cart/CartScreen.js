import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import PressableScale from '../../components/PressableScale';
import QuantityInput from '../../components/QuantityInput';
import RemoteImage from '../../components/RemoteImage';
import ScreenHeader from '../../components/ScreenHeader';
import { formatPrice } from '../../config';
import { spacing, fontSize, fontWeight, borderRadius, shadows } from '../../theme';

export default function CartScreen({ navigation }) {
  const { theme } = useTheme();
  const { t, getName } = useLanguage();
  const { user } = useAuth();
  const { items, total, updateQty, removeItem, clearCart, count } = useCart();
  const c = theme.colors;

  const confirmClear = () => {
    Alert.alert(`${t.clear} ${t.cart}`, 'Remove all items from your cart?', [
      { text: t.cancel, style: 'cancel' },
      { text: t.clear, style: 'destructive', onPress: clearCart },
    ]);
  };

  const openTab = (tabName) => {
    const parent = navigation.getParent();
    if (parent?.navigate) {
      parent.navigate(tabName);
      return;
    }

    navigation.navigate(tabName);
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
        <ScreenHeader title={t.cart} showBack={false} />
        <EmptyState
          icon="cart-outline"
          title={t.emptyCart}
          subtitle="Add a few favorites and come back when you're ready to check out."
          actionLabel={t.startShopping}
          onAction={() => openTab('ShopTab')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScreenHeader
        title={t.cart}
        subtitle={`${count} ${t.items}`}
        showBack={false}
        right={(
          <PressableScale onPress={confirmClear} accessibilityLabel={`${t.clear} ${t.cart}`} style={[styles.clearBtn, { backgroundColor: c.error + '10' }]}>
            <MaterialCommunityIcons name="trash-can-outline" size={16} color={c.error} />
            <Text style={[styles.clearLabel, { color: c.error }]}>{t.clear}</Text>
          </PressableScale>
        )}
      />
      <FlatList
        data={items}
        keyExtractor={i => String(i.id || i.productId)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<Text accessibilityRole="header" style={[styles.sectionTitle, { color: c.text }]}>{t.orderSummary}</Text>}
        renderItem={({ item }) => {
          const product = item.product || item;
          const img = product.images?.[0]?.url || product.image || product.thumbnail || null;
          const fallbackImage = product.images?.[1]?.url || null;
          const price = product.retailPrice || product.suggestedPrice || 0;
          const lineTotal = price * (item.quantity || 1);
          const itemId = item.id || item.productId;
          const stockLimited = Number.isFinite(product.stock) && product.stock > 0;
          const categoryLabel = product.category ? getName(product.category) : product.unit;

          return (
            <View style={[styles.cartItem, { backgroundColor: c.card, borderColor: c.border }]}>
              <TouchableOpacity
                activeOpacity={0.9}
                accessibilityRole="button"
                accessibilityLabel={`${getName(product)}, ${formatPrice(lineTotal)}`}
                onPress={() => navigation.navigate('ProductDetail', { id: product.id || item.productId, product })}
                style={styles.itemMain}
              >
                <View style={[styles.imageFrame, { backgroundColor: c.surfaceElevated, borderColor: c.borderLight }]}>
                  <RemoteImage
                    source={img}
                    fallbackSource={fallbackImage}
                    style={styles.cartImg}
                    resizeMode="contain"
                    fallback={<MaterialCommunityIcons name="image-outline" size={30} color={c.textMuted} />}
                  />
                </View>
                <View style={styles.cartInfo}>
                  {categoryLabel ? <Text style={[styles.cartCategory, { color: c.textMuted }]}>{categoryLabel}</Text> : null}
                  <Text numberOfLines={2} style={[styles.cartName, { color: c.text }]}>{getName(product)}</Text>
                  <Text style={[styles.cartMeta, { color: c.textSecondary }]}>{t.qty} {item.quantity} × {formatPrice(price)}</Text>
                  <View style={styles.lineRow}>
                    <Text style={[styles.cartPrice, { color: c.primary }]}>{formatPrice(lineTotal)}</Text>
                    <MaterialCommunityIcons name="chevron-right" size={18} color={c.textMuted} />
                  </View>
                </View>
              </TouchableOpacity>

              <View style={[styles.cartActions, { borderTopColor: c.borderLight }]}>
                <QuantityInput
                  value={item.quantity}
                  onChange={(next) => updateQty(itemId, next)}
                  max={stockLimited ? product.stock : undefined}
                  size="sm"
                />

                <PressableScale accessibilityLabel={`${t.remove} ${getName(product)}`} onPress={() => removeItem(itemId)} style={[styles.removeBtn, { backgroundColor: c.error + '10' }]}>
                  <MaterialCommunityIcons name="trash-can-outline" size={16} color={c.error} />
                  <Text style={[styles.removeLabel, { color: c.error }]}>{t.remove}</Text>
                </PressableScale>
              </View>
            </View>
          );
        }}
      />

      <View style={[styles.bottomBar, { backgroundColor: c.card, borderTopColor: c.border }]}>
        <View style={styles.totalRow}>
          <View style={styles.totalCol}>
            <Text style={[styles.totalLabel, { color: c.textSecondary }]}>{t.subtotal}</Text>
            <Text style={[styles.totalNote, { color: c.textSecondary }]}>{count} {t.items}</Text>
          </View>
          <Text style={[styles.totalVal, { color: c.text }]}>{formatPrice(total)}</Text>
        </View>
        <Button
          title={user ? t.checkout : t.login}
          onPress={() => user ? navigation.navigate('Checkout') : navigation.navigate('Auth', {
            screen: 'Login',
            params: {
              redirectTo: {
                tab: 'CartTab',
                params: { screen: 'Checkout' },
              },
            },
          })}
          style={styles.checkoutBtn}
          icon={<MaterialCommunityIcons name={user ? 'arrow-right' : 'account-arrow-right-outline'} size={20} color={c.white} />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  clearBtn: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: borderRadius.full, paddingHorizontal: 12, paddingVertical: 8 },
  clearLabel: { fontSize: fontSize.xs, lineHeight: 16, fontWeight: fontWeight.bold, includeFontPadding: false, textAlignVertical: 'center' },
  listContent: { width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: spacing.base, paddingTop: spacing.lg, paddingBottom: spacing.lg },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, marginBottom: spacing.md },
  cartItem: { borderRadius: borderRadius.xl, borderWidth: 1, marginBottom: spacing.base, overflow: 'hidden', ...shadows.sm },
  itemMain: { flexDirection: 'row', padding: spacing.md },
  imageFrame: { width: 96, height: 108, borderRadius: borderRadius.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: spacing.sm },
  cartImg: { width: '100%', height: '100%' },
  cartInfo: { flex: 1, minWidth: 0, marginStart: spacing.md, justifyContent: 'center' },
  cartCategory: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 6 },
  cartName: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, lineHeight: 21 },
  cartMeta: { fontSize: fontSize.sm, marginTop: 8 },
  lineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  cartPrice: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  cartActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
  removeBtn: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: borderRadius.full, paddingHorizontal: 12, paddingVertical: 8 },
  removeLabel: { fontSize: fontSize.xs, lineHeight: 16, fontWeight: fontWeight.bold, includeFontPadding: false, textAlignVertical: 'center' },
  bottomBar: { gap: spacing.md, padding: spacing.base, borderTopWidth: 1, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, ...shadows.lg },
  totalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 688, alignSelf: 'center' },
  totalCol: { flex: 1, minWidth: 0 },
  totalLabel: { fontSize: fontSize.sm },
  totalVal: { fontSize: fontSize.xl, fontWeight: fontWeight.heavy },
  totalNote: { fontSize: fontSize.xs, marginTop: 4 },
  checkoutBtn: { width: '100%', maxWidth: 688, alignSelf: 'center' },
});

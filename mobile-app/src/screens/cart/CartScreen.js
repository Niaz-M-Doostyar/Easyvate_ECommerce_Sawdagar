import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import HeroCard from '../../components/HeroCard';
import QuantityInput from '../../components/QuantityInput';
import RemoteImage from '../../components/RemoteImage';
import ScreenHeader from '../../components/ScreenHeader';
import { formatPrice } from '../../config';
import { spacing, fontSize, fontWeight, borderRadius, shadows } from '../../theme';

// Space reserved at the end of the list so the last item clears the bottom checkout bar.
const LIST_BOTTOM_CLEARANCE = 132;

export default function CartScreen({ navigation }) {
  const { theme } = useTheme();
  const { t, getName } = useLanguage();
  const { user } = useAuth();
  const { items, total, updateQty, removeItem, clearCart, count } = useCart();
  const insets = useSafeAreaInsets();
  const c = theme.colors;

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
        subtitle={`${count} ${count === 1 ? 'item' : 'items'} ready for checkout`}
        showBack={false}
        right={(
          <TouchableOpacity onPress={clearCart} style={[styles.clearBtn, { backgroundColor: c.brandSurface }]}>
            <MaterialCommunityIcons name="trash-can-outline" size={16} color={c.error} />
            <Text style={[styles.clearLabel, { color: c.error }]}>{t.clear}</Text>
          </TouchableOpacity>
        )}
      />



      <FlatList
        data={items}
        keyExtractor={i => String(i.id || i.productId)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={<Text style={[styles.sectionTitle, { color: c.text }]}>Items in your cart</Text>}
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
                onPress={() => navigation.navigate('ProductDetail', { id: product.id || item.productId, product })}
                style={styles.itemMain}
              >
                {img ? <RemoteImage source={img} fallbackSource={fallbackImage} style={styles.cartImg} fallback={<View style={[styles.cartImg, { backgroundColor: c.skeleton }]} />} /> : <View style={[styles.cartImg, { backgroundColor: c.skeleton }]} />}
                <View style={styles.cartInfo}>
                  {categoryLabel ? <Text style={[styles.cartCategory, { color: c.textMuted }]}>{categoryLabel}</Text> : null}
                  <Text numberOfLines={2} style={[styles.cartName, { color: c.text }]}>{getName(product)}</Text>
                  <Text style={[styles.cartMeta, { color: c.textSecondary }]}>Qty {item.quantity} x {formatPrice(price)}</Text>
                  <View style={styles.lineRow}>
                    <Text style={[styles.cartPrice, { color: c.primary }]}>{formatPrice(lineTotal)}</Text>
                    <MaterialCommunityIcons name="chevron-right" size={18} color={c.textMuted} />
                  </View>
                </View>
              </TouchableOpacity>

              <View style={styles.cartActions}>
                <QuantityInput
                  value={item.quantity}
                  onChange={(next) => updateQty(itemId, next)}
                  max={stockLimited ? product.stock : undefined}
                  size="sm"
                />

                <TouchableOpacity onPress={() => removeItem(itemId)} style={[styles.removeBtn, { backgroundColor: c.brandSurface }]}>
                  <MaterialCommunityIcons name="trash-can-outline" size={16} color={c.error} />
                  <Text style={[styles.removeLabel, { color: c.error }]}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      <View style={[styles.bottomBar, { backgroundColor: c.card, borderTopColor: c.border, paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <View style={styles.totalCol}>
          <Text style={[styles.totalLabel, { color: c.textSecondary }]}>{t.total}</Text>
          <Text style={[styles.totalVal, { color: c.text }]}>{formatPrice(total)}</Text>
          <Text numberOfLines={2} style={[styles.totalNote, { color: c.textMuted }]}>Fast delivery and live order tracking</Text>
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
          icon={<MaterialCommunityIcons name={user ? 'arrow-right-circle-outline' : 'account-arrow-right-outline'} size={20} color={c.white} />}
        />
      </View>
    </SafeAreaView>
  );
}

function StatPill({ icon, label }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View style={[styles.statPill, { backgroundColor: c.heroSurface }]}>
      <MaterialCommunityIcons name={icon} size={16} color={c.heroTextMuted} />
      <Text style={[styles.statPillText, { color: c.heroTextMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  clearBtn: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: borderRadius.full, paddingHorizontal: 12, paddingVertical: 8 },
  clearLabel: { fontSize: fontSize.xs, lineHeight: 16, fontWeight: fontWeight.bold, includeFontPadding: false, textAlignVertical: 'center' },
  heroSpacing: { marginHorizontal: spacing.base, marginTop: spacing.base },
  heroStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: borderRadius.full },
  statPillText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  listContent: { paddingHorizontal: spacing.base, paddingTop: spacing.lg, paddingBottom: LIST_BOTTOM_CLEARANCE },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, marginBottom: spacing.md },
  cartItem: { borderRadius: borderRadius.xl, borderWidth: 1, marginBottom: spacing.md, overflow: 'hidden' },
  itemMain: { flexDirection: 'row', padding: spacing.md },
  cartImg: { width: 92, height: 92, borderRadius: borderRadius.lg },
  cartInfo: { flex: 1, marginLeft: spacing.md, justifyContent: 'center' },
  cartCategory: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 6 },
  cartName: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, lineHeight: 21 },
  cartMeta: { fontSize: fontSize.sm, marginTop: 8 },
  lineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  cartPrice: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  cartActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  removeBtn: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: borderRadius.full, paddingHorizontal: 12, paddingVertical: 8 },
  removeLabel: { fontSize: fontSize.xs, lineHeight: 16, fontWeight: fontWeight.bold, includeFontPadding: false, textAlignVertical: 'center' },
  bottomBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md, padding: spacing.base, borderTopWidth: 1, ...shadows.lg },
  totalCol: { flex: 1, minWidth: 0 },
  totalLabel: { fontSize: fontSize.sm },
  totalVal: { fontSize: fontSize.xl, fontWeight: fontWeight.heavy },
  totalNote: { fontSize: fontSize.xs, marginTop: 4 },
  checkoutBtn: { flex: 1, maxWidth: 180 },
});

import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import RemoteImage from '../../components/RemoteImage';
import { formatPrice } from '../../config';
import { spacing, fontSize, fontWeight, borderRadius, shadows } from '../../theme';

export default function CartScreen({ navigation }) {
  const { theme } = useTheme();
  const { t, getName } = useLanguage();
  const { user } = useAuth();
  const { items, total, updateQty, removeItem, clearCart, count } = useCart();
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
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
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
      <View style={[styles.header, { borderBottomColor: c.border }]}> 
        <View>
          <Text style={[styles.title, { color: c.text }]}>{t.cart}</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>{count} {count === 1 ? 'item' : 'items'} ready for checkout</Text>
        </View>
        <TouchableOpacity onPress={clearCart} style={[styles.clearBtn, { backgroundColor: c.brandSurface }]}> 
          <MaterialCommunityIcons name="trash-can-outline" size={16} color={c.error} />
          <Text style={[styles.clearLabel, { color: c.error }]}>{t.clear}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.heroCard, { backgroundColor: c.secondary }, shadows.lg]}>
        <Text style={styles.heroEyebrow}>Cart summary</Text>
        <Text style={styles.heroTitle}>Everything is lined up for a faster checkout.</Text>
        <Text style={styles.heroBody}>Review quantities, keep your best picks, and place the order when you're ready.</Text>
        <View style={styles.heroStats}>
          <StatPill icon="cart-outline" label={`${count} ${count === 1 ? 'item' : 'items'}`} />
          <StatPill icon={user ? 'shield-check-outline' : 'account-lock-outline'} label={user ? 'Secure checkout' : 'Sign in to continue'} />
        </View>
      </View>

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
          const canIncrease = !stockLimited || item.quantity < product.stock;
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
                <View style={[styles.stepper, { borderColor: c.border, backgroundColor: c.surfaceElevated }]}> 
                  <TouchableOpacity onPress={() => updateQty(itemId, item.quantity - 1)} style={styles.stepBtn}>
                    <MaterialCommunityIcons name="minus" size={18} color={c.text} />
                  </TouchableOpacity>
                  <Text style={[styles.stepVal, { color: c.text }]}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => canIncrease && updateQty(itemId, item.quantity + 1)} disabled={!canIncrease} style={styles.stepBtn}>
                    <MaterialCommunityIcons name="plus" size={18} color={canIncrease ? c.text : c.textMuted} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => removeItem(itemId)} style={[styles.removeBtn, { backgroundColor: c.brandSurface }]}> 
                  <MaterialCommunityIcons name="trash-can-outline" size={16} color={c.error} />
                  <Text style={[styles.removeLabel, { color: c.error }]}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      <View style={[styles.bottomBar, { backgroundColor: c.card, borderTopColor: c.border }]}> 
        <View>
          <Text style={[styles.totalLabel, { color: c.textSecondary }]}>{t.total}</Text>
          <Text style={[styles.totalVal, { color: c.text }]}>{formatPrice(total)}</Text>
          <Text style={[styles.totalNote, { color: c.textMuted }]}>Fast delivery and live order tracking</Text>
        </View>
        <Button
          title={user ? t.checkout : t.login}
          onPress={() => user ? navigation.navigate('Checkout') : navigation.navigate('Auth', {
            redirectTo: {
              tab: 'CartTab',
              params: { screen: 'Checkout' },
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
  return (
    <View style={styles.statPill}>
      <MaterialCommunityIcons name={icon} size={16} color="#D6E5FF" />
      <Text style={styles.statPillText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, paddingTop: spacing.base, paddingBottom: spacing.md, borderBottomWidth: 1 },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  subtitle: { fontSize: fontSize.sm, marginTop: 4 },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: borderRadius.full, paddingHorizontal: 12, paddingVertical: 10 },
  clearLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  heroCard: { marginHorizontal: spacing.base, marginTop: spacing.base, borderRadius: borderRadius.xxl, padding: spacing.xl },
  heroEyebrow: { color: '#C6D4FF', fontSize: fontSize.xs, fontWeight: fontWeight.bold, letterSpacing: 1.1, textTransform: 'uppercase' },
  heroTitle: { color: '#FFFFFF', fontSize: fontSize.xl, fontWeight: fontWeight.heavy, lineHeight: 30, marginTop: spacing.sm },
  heroBody: { color: '#D6E5FF', fontSize: fontSize.base, lineHeight: 22, marginTop: spacing.sm },
  heroStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: spacing.lg },
  statPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: borderRadius.full, backgroundColor: 'rgba(255,255,255,0.08)' },
  statPillText: { color: '#D6E5FF', fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  listContent: { paddingHorizontal: spacing.base, paddingTop: spacing.lg, paddingBottom: 120 },
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
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: borderRadius.full, paddingHorizontal: 4, paddingVertical: 4 },
  stepBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  stepVal: { paddingHorizontal: 12, fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  removeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: borderRadius.full, paddingHorizontal: 12, paddingVertical: 10 },
  removeLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  bottomBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.base, borderTopWidth: 1, ...shadows.lg },
  totalLabel: { fontSize: fontSize.sm },
  totalVal: { fontSize: fontSize.xl, fontWeight: fontWeight.heavy },
  totalNote: { fontSize: fontSize.xs, marginTop: 4 },
  checkoutBtn: { flex: 0.62 },
});

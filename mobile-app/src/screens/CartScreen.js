import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice, API_URL } from '../config';
import { colors, spacing, fontSize, borderRadius } from '../theme';

export default function CartScreen({ navigation }) {
  const { t, isRTL, getLocalizedName } = useLanguage();
  const { items, total, updateQuantity, removeItem, clearCart } = useCart();
  const { user } = useAuth();
  const rowDir = isRTL ? 'row-reverse' : 'row';

  if (!user) {
    return (
      <View style={styles.empty}>
        <Ionicons name="person-outline" size={64} color={colors.border} />
        <Text style={styles.emptyTitle}>{t('please_sign_in')}</Text>
        <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.emptyBtnText}>{t('sign_in')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="cart-outline" size={64} color={colors.border} />
        <Text style={styles.emptyTitle}>{t('cart_empty')}</Text>
        <Text style={styles.emptyDesc}>{t('cart_empty_desc')}</Text>
        <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('HomeTab')}>
          <Text style={styles.emptyBtnText}>{t('start_shopping')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleRemove = (id) => {
    Alert.alert(t('delete'), t('remove_from_cart') + '?', [
      { text: t('cancel') },
      { text: t('delete'), style: 'destructive', onPress: () => removeItem(id) },
    ]);
  };

  const handleClear = () => {
    Alert.alert(t('clear_cart'), '', [
      { text: t('cancel') },
      { text: t('delete'), style: 'destructive', onPress: () => clearCart() },
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={i => String(i.id)}
        renderItem={({ item }) => {
          const p = item.product;
          const img = p?.images?.[0]?.url;
          const uri = img ? (img.startsWith('http') ? img : `${API_URL}${img}`) : null;
          const price = p?.retailPrice || p?.suggestedPrice || 0;

          return (
            <View style={[styles.cartItem, { flexDirection: rowDir }]}>
              <View style={styles.itemImg}>
                {uri ? <Image source={{ uri }} style={styles.img} resizeMode="contain" /> :
                  <Ionicons name="image-outline" size={28} color={colors.border} />}
              </View>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, isRTL && { textAlign: 'right' }]} numberOfLines={2}>{getLocalizedName(p)}</Text>
                <Text style={[styles.itemPrice, isRTL && { textAlign: 'right' }]}>{formatPrice(price)}</Text>
                <View style={[styles.qtyRow, { flexDirection: rowDir }]}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.id, item.quantity - 1)}>
                    <Ionicons name="remove" size={16} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.id, item.quantity + 1)}>
                    <Ionicons name="add" size={16} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.lineTotal}>{formatPrice(price * item.quantity)}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(item.id)}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </TouchableOpacity>
            </View>
          );
        }}
        ListHeaderComponent={
          <View style={[styles.headerRow, { flexDirection: rowDir }]}>
            <Text style={styles.headerTitle}>{t('cart')} ({items.length})</Text>
            <TouchableOpacity onPress={handleClear}>
              <Text style={styles.clearText}>{t('clear_cart')}</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Bottom */}
      <View style={styles.bottomBar}>
        <View style={[styles.totalRow, { flexDirection: rowDir }]}>
          <Text style={styles.totalLabel}>{t('total')}</Text>
          <Text style={styles.totalAmount}>{formatPrice(total)}</Text>
        </View>
        <TouchableOpacity style={styles.checkoutBtn} onPress={() => navigation.navigate('Checkout')}>
          <Ionicons name="lock-closed-outline" size={18} color={colors.white} />
          <Text style={styles.checkoutText}>{t('checkout')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyTitle: { fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.dark, marginTop: spacing.lg },
  emptyDesc: { fontSize: fontSize.md, color: colors.textLight, marginTop: spacing.xs, textAlign: 'center' },
  emptyBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.md, marginTop: spacing.lg },
  emptyBtnText: { color: colors.white, fontWeight: 'bold', fontSize: fontSize.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingBottom: spacing.sm },
  headerTitle: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.dark },
  clearText: { fontSize: fontSize.md, color: colors.danger },
  cartItem: { flexDirection: 'row', backgroundColor: colors.white, marginHorizontal: spacing.lg, marginBottom: spacing.sm, borderRadius: borderRadius.lg, padding: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  itemImg: { width: 80, height: 80, borderRadius: borderRadius.md, backgroundColor: colors.grayLighter, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  img: { width: '100%', height: '100%' },
  itemInfo: { flex: 1, marginHorizontal: spacing.md },
  itemName: { fontSize: fontSize.md, color: colors.text, fontWeight: '500' },
  itemPrice: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '600', marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: spacing.sm },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  qtyText: { fontSize: fontSize.md, fontWeight: '600', minWidth: 24, textAlign: 'center' },
  lineTotal: { fontSize: fontSize.sm, fontWeight: 'bold', color: colors.text, marginLeft: 'auto' },
  removeBtn: { justifyContent: 'center', paddingLeft: spacing.sm },
  bottomBar: { backgroundColor: colors.white, padding: spacing.lg, paddingBottom: spacing.xl, borderTopWidth: 1, borderTopColor: colors.grayLight },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  totalLabel: { fontSize: fontSize.xl, fontWeight: '600', color: colors.dark },
  totalAmount: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.primary },
  checkoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, padding: spacing.md, borderRadius: borderRadius.md },
  checkoutText: { color: colors.white, fontSize: fontSize.lg, fontWeight: 'bold' },
});

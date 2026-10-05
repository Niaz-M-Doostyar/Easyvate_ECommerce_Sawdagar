import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { spacing, fontSize, fontWeight, borderRadius } from '../../theme';

const cartCopy = {
  en: { clearMessage: 'Remove all items from your cart?' },
  ps: { clearMessage: 'له کارټ څخه ټول توکي لرې کړئ؟' },
  dr: { clearMessage: 'تمام اقلام از سبد حذف شوند؟' },
};

export default function CartScreen({ navigation }) {
  const { theme } = useTheme();
  const { t, getName, isRTL, lang } = useLanguage();
  const { user } = useAuth();
  const { items, total, updateQty, removeItem, clearCart, count } = useCart();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const copy = cartCopy[lang] || cartCopy.en;
  const rowDirection = { flexDirection: isRTL ? 'row-reverse' : 'row' };
  const alignment = { textAlign: isRTL ? 'right' : 'left' };
  const imageSize = width < 375 || fontScale > 1.3 ? 76 : 92;

  const confirmClear = () => {
    Alert.alert(`${t.clear} ${t.cart}`, copy.clearMessage, [
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
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top', 'left', 'right']}>
        <ScreenHeader title={t.cart} showBack={false} />
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
      <ScreenHeader
        title={t.cart}
        subtitle={`${count} ${t.items}`}
        showBack={false}
        right={(
          <PressableScale onPress={confirmClear} accessibilityLabel={`${t.clear} ${t.cart}`} style={[styles.clearBtn, rowDirection, { backgroundColor: c.surfaceElevated }]}>
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
        renderItem={({ item }) => {
          const product = item.product || item;
          const img = product.images?.[0]?.url || product.image || product.thumbnail || null;
          const fallbackImage = product.images?.[1]?.url || null;
          const price = product.retailPrice || product.suggestedPrice || 0;
          const lineTotal = price * (item.quantity || 1);
          const itemId = item.id || item.productId;
          const stockLimited = Number.isFinite(product.stock) && product.stock > 0;

          return (
            <View style={[styles.cartItem, { backgroundColor: c.card, borderColor: c.borderLight }]}>
              <TouchableOpacity
                activeOpacity={0.9}
                accessibilityRole="button"
                accessibilityLabel={`${getName(product)}, ${formatPrice(lineTotal)}`}
                onPress={() => navigation.navigate('ProductDetail', { id: product.id || item.productId, product })}
                style={[styles.itemMain, rowDirection]}
              >
                <View style={[styles.imageFrame, { width: imageSize, height: imageSize, backgroundColor: c.surfaceElevated }]}>
                  <RemoteImage
                    source={img}
                    fallbackSource={fallbackImage}
                    width={180}
                    quality={76}
                    style={styles.cartImg}
                    resizeMode="contain"
                    fallback={<MaterialCommunityIcons name="image-outline" size={30} color={c.textMuted} />}
                  />
                </View>
                <View style={styles.cartInfo}>
                  <Text numberOfLines={fontScale > 1.3 ? 3 : 2} style={[styles.cartName, alignment, { color: c.text }]}>{getName(product)}</Text>
                  <Text style={[styles.cartMeta, alignment, { color: c.textSecondary }]}>{t.qty} {item.quantity} × {formatPrice(price)}</Text>
                  <View style={[styles.lineRow, rowDirection]}>
                    <Text style={[styles.cartPrice, { color: c.text }]}>{formatPrice(lineTotal)}</Text>
                    <MaterialCommunityIcons name={isRTL ? 'chevron-left' : 'chevron-right'} size={18} color={c.textMuted} />
                  </View>
                </View>
              </TouchableOpacity>

              <View style={[styles.cartActions, rowDirection, { borderTopColor: c.borderLight }]}>
                <QuantityInput
                  value={item.quantity}
                  onChange={(next) => updateQty(itemId, next)}
                  max={stockLimited ? product.stock : undefined}
                  size="sm"
                />

                <PressableScale accessibilityLabel={`${t.remove} ${getName(product)}`} onPress={() => removeItem(itemId)} style={[styles.removeBtn, rowDirection]}>
                  <MaterialCommunityIcons name="trash-can-outline" size={16} color={c.error} />
                  <Text style={[styles.removeLabel, { color: c.error }]}>{t.remove}</Text>
                </PressableScale>
              </View>
            </View>
          );
        }}
      />

      <View style={[styles.bottomBar, { backgroundColor: c.card, borderTopColor: c.borderLight, paddingBottom: Math.max(insets.bottom, spacing.base) }]}>
        <View style={[styles.totalRow, rowDirection]}>
          <View style={styles.totalCol}>
            <Text style={[styles.totalLabel, alignment, { color: c.textSecondary }]}>{t.subtotal}</Text>
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
          icon={<MaterialCommunityIcons name={user ? (isRTL ? 'arrow-left' : 'arrow-right') : 'account-arrow-right-outline'} size={20} color={c.white} />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, width: '100%', maxWidth: 1200, alignSelf: 'center' },
  clearBtn: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: borderRadius.full, paddingHorizontal: 12, paddingVertical: 8 },
  clearLabel: { fontSize: fontSize.xs, lineHeight: 18, fontWeight: fontWeight.bold, includeFontPadding: false, textAlignVertical: 'center' },
  listContent: { width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: spacing.base, paddingTop: spacing.base, paddingBottom: spacing.lg },
  cartItem: { borderRadius: 16, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  itemMain: { flexDirection: 'row', padding: 12, gap: 12 },
  imageFrame: { borderRadius: 11, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 7, flexShrink: 0 },
  cartImg: { width: '100%', height: '100%' },
  cartInfo: { flex: 1, minWidth: 0, justifyContent: 'center' },
  cartName: { fontSize: 15, fontWeight: fontWeight.semibold, lineHeight: 22 },
  cartMeta: { fontSize: 13, lineHeight: 20, marginTop: 5 },
  lineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  cartPrice: { flex: 1, minWidth: 0, fontSize: 16, lineHeight: 24, fontWeight: fontWeight.bold },
  cartActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth },
  removeBtn: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: borderRadius.full, paddingHorizontal: 12, paddingVertical: 8 },
  removeLabel: { fontSize: fontSize.xs, lineHeight: 18, fontWeight: fontWeight.bold, includeFontPadding: false, textAlignVertical: 'center' },
  bottomBar: { gap: spacing.md, padding: spacing.base, borderTopWidth: 1 },
  totalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 688, alignSelf: 'center' },
  totalCol: { flex: 1, minWidth: 0 },
  totalLabel: { fontSize: fontSize.sm },
  totalVal: { flexShrink: 1, fontSize: 22, lineHeight: 30, fontWeight: fontWeight.bold },
  checkoutBtn: { width: '100%', maxWidth: 688, alignSelf: 'center' },
});

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import Button from '../../components/Button';
import RemoteImage from '../../components/RemoteImage';
import { productsApi } from '../../services/api';
import { formatPrice } from '../../config';
import { spacing, fontSize, fontWeight, borderRadius, shadows } from '../../theme';

export default function ProductDetailScreen({ navigation, route }) {
  const { width: viewportWidth } = useWindowDimensions();
  const { theme } = useTheme();
  const { t, getName, getDesc } = useLanguage();
  const { addItem } = useCart();
  const toast = useToast();
  const c = theme.colors;
  const isTablet = viewportWidth >= 768;
  const imageWidth = isTablet ? Math.min(viewportWidth - spacing.xl * 2, 720) : viewportWidth;
  const imageHeight = Math.min(imageWidth * 0.92, isTablet ? 520 : imageWidth * 0.92);
  const contentWidth = isTablet ? Math.min(viewportWidth - spacing.xl * 2, 820) : viewportWidth;
  const [product, setProduct] = useState(route.params?.product || null);
  const [loading, setLoading] = useState(!product);
  const [imgIdx, setImgIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState('desc');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    productsApi.get(route.params?.id).then((data) => {
      setProduct(data.product || data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [route.params?.id]);

  const openTab = (tabName) => {
    const parent = navigation.getParent();
    if (parent?.navigate) {
      parent.navigate(tabName);
      return;
    }

    navigation.navigate(tabName);
  };

  const adjustQty = (delta) => {
    const maxQty = product?.stock && product.stock > 0 ? product.stock : Number.MAX_SAFE_INTEGER;
    setQty((prev) => Math.min(maxQty, Math.max(1, prev + delta)));
  };

  const handleAdd = async () => {
    if (!product || (product.stock != null && product.stock <= 0)) {
      toast.info(t.outOfStock);
      return;
    }

    setAdding(true);
    try {
      await addItem(product, qty);
      toast.success('Added to cart!');
    } catch (err) {
      toast.error(err.message || 'Failed');
    }
    setAdding(false);
  };

  const handleBuyNow = async () => {
    if (!product || (product.stock != null && product.stock <= 0)) {
      toast.info(t.outOfStock);
      return;
    }

    setAdding(true);
    try {
      await addItem(product, qty);
      openTab('CartTab');
    } catch (err) {
      toast.error(err.message || 'Failed');
    }
    setAdding(false);
  };

  if (loading) {
    return <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}><ActivityIndicator size="large" color={c.primary} style={{ marginTop: 100 }} /></SafeAreaView>;
  }

  if (!product) {
    return <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}><Text style={{ color: c.text, textAlign: 'center', marginTop: 100 }}>Product not found</Text></SafeAreaView>;
  }

  const images = product.images || [];
  const hasDiscount = product.wholesaleCost && product.retailPrice && product.wholesaleCost > product.retailPrice;
  const discount = hasDiscount ? Math.round((1 - product.retailPrice / product.wholesaleCost) * 100) : 0;
  const available = product.stock == null || product.stock > 0;
  const categoryName = product.category ? getName(product.category) : 'Selected item';
  const supplierName = product.supplier?.name || null;
  const orderTotal = (product.retailPrice || 0) * qty;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.imgWrap, isTablet && styles.imgWrapTablet]}>
          <View style={[styles.imageFrame, { width: imageWidth, height: imageHeight }]}> 
          <ScrollView
            horizontal
            pagingEnabled
            style={{ width: imageWidth, height: imageHeight }}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => setImgIdx(Math.round(event.nativeEvent.contentOffset.x / imageWidth))}
          >
            {images.length > 0 ? images.map((img, index) => (
              <RemoteImage
                key={img?.id || `${img?.url || 'product-image'}-${index}`}
                source={img?.url || img}
                style={[styles.mainImg, { width: imageWidth, height: imageHeight }]}
                fallback={(
                  <View style={[styles.mainImg, { width: imageWidth, height: imageHeight, backgroundColor: c.skeleton, justifyContent: 'center', alignItems: 'center' }]}>
                    <MaterialCommunityIcons name="image-outline" size={48} color={c.textMuted} />
                  </View>
                )}
              />
            )) : <View style={[styles.mainImg, { width: imageWidth, height: imageHeight, backgroundColor: c.skeleton, justifyContent: 'center', alignItems: 'center' }]}><MaterialCommunityIcons name="image-outline" size={48} color={c.textMuted} /></View>}
          </ScrollView>

          <View style={styles.topActions}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.floatBtn, { backgroundColor: c.card }]}> 
              <MaterialCommunityIcons name="arrow-left" size={22} color={c.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openTab('CartTab')} style={[styles.floatBtn, { backgroundColor: c.card }]}> 
              <MaterialCommunityIcons name="cart-outline" size={22} color={c.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.overlayBadges}>
            <View style={[styles.overlayPill, { backgroundColor: 'rgba(17, 19, 23, 0.62)' }]}> 
              <Text style={styles.overlayPillText}>{categoryName}</Text>
            </View>
            {discount > 0 ? <View style={[styles.discBadge, { backgroundColor: c.error }]}><Text style={styles.discText}>-{discount}%</Text></View> : null}
          </View>

          {images.length > 1 ? (
            <View style={styles.dots}>
              {images.map((_, index) => <View key={index} style={[styles.dot, { backgroundColor: index === imgIdx ? c.primary : c.border }]} />)}
            </View>
          ) : null}
          </View>
        </View>

        <View style={[styles.body, isTablet && { width: contentWidth, alignSelf: 'center' }]}> 
          <View style={[styles.infoCard, { backgroundColor: c.card, borderColor: c.border }]}> 
            <View style={styles.headingRow}>
              <View style={{ flex: 1, marginRight: spacing.md }}>
                <Text style={[styles.name, { color: c.text }]}>{getName(product)}</Text>
                <Text style={[styles.subhead, { color: c.textSecondary }]}>{supplierName ? `Sold by ${supplierName}` : 'Curated by Sawdagar'}</Text>
              </View>
              <View style={[styles.stockBadge, { backgroundColor: available ? c.success + '18' : c.error + '18' }]}> 
                <MaterialCommunityIcons name={available ? 'check-circle-outline' : 'close-circle-outline'} size={14} color={available ? c.success : c.error} />
                <Text style={{ color: available ? c.success : c.error, fontSize: fontSize.xs, fontWeight: fontWeight.bold }}>{available ? t.inStock : t.outOfStock}</Text>
              </View>
            </View>

            <View style={styles.priceRow}>
              <Text style={[styles.price, { color: c.primary }]}>{formatPrice(product.retailPrice)}</Text>
              {hasDiscount ? <Text style={[styles.oldPrice, { color: c.textMuted }]}>{formatPrice(product.wholesaleCost)}</Text> : null}
            </View>

            <Text numberOfLines={3} style={[styles.descLead, { color: c.textSecondary }]}>
              {getDesc(product) || getName(product, 'desc') || 'Browse product information, adjust quantity, and add it directly to your cart.'}
            </Text>

            <View style={styles.featureRow}>
              <FeatureTile icon="cash-fast" label={t.cashOnDelivery} />
              <FeatureTile icon="truck-fast-outline" label="Live tracking" />
              <FeatureTile icon="shield-check-outline" label="Trusted sellers" />
            </View>
          </View>

          <View style={[styles.qtyCard, { backgroundColor: c.card, borderColor: c.border }]}> 
            <View>
              <Text style={[styles.qtyHeading, { color: c.text }]}>Quantity</Text>
              <Text style={[styles.qtySubhead, { color: c.textSecondary }]}>{available ? 'Adjust before adding to cart.' : 'This item is currently unavailable.'}</Text>
            </View>
            <View style={[styles.qtyStepper, { borderColor: c.border, backgroundColor: c.surfaceElevated }]}> 
              <TouchableOpacity onPress={() => adjustQty(-1)} style={styles.qtyBtn}><MaterialCommunityIcons name="minus" size={20} color={c.text} /></TouchableOpacity>
              <Text style={[styles.qtyVal, { color: c.text }]}>{qty}</Text>
              <TouchableOpacity onPress={() => adjustQty(1)} disabled={!available} style={styles.qtyBtn}><MaterialCommunityIcons name="plus" size={20} color={available ? c.text : c.textMuted} /></TouchableOpacity>
            </View>
          </View>

          <View style={[styles.tabsCard, { backgroundColor: c.card, borderColor: c.border }]}> 
            <View style={[styles.tabs, { backgroundColor: c.brandSurface }]}> 
              {['desc', 'details'].map((key) => (
                <TouchableOpacity key={key} onPress={() => setTab(key)} style={[styles.tab, tab === key && { backgroundColor: c.card }]}> 
                  <Text style={[styles.tabText, { color: tab === key ? c.primary : c.textMuted }]}>{key === 'desc' ? t.description : t.details}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.tabContent}>
              {tab === 'desc' ? (
                <Text style={[styles.descText, { color: c.textSecondary }]}>{getDesc(product) || getName(product, 'desc') || 'No description available.'}</Text>
              ) : (
                <View>
                  <DetailRow label="Category" value={categoryName || '-'} c={c} />
                  {supplierName ? <DetailRow label="Supplier" value={supplierName} c={c} /> : null}
                  <DetailRow label="Retail Price" value={formatPrice(product.retailPrice)} c={c} />
                  <DetailRow label="Suggested Price" value={formatPrice(product.suggestedPrice)} c={c} />
                  {product.unit ? <DetailRow label="Unit" value={product.unit} c={c} /> : null}
                  {product.stock != null ? <DetailRow label="Stock" value={String(product.stock)} c={c} /> : null}
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, isTablet && { width: contentWidth, alignSelf: 'center' }, { backgroundColor: c.card, borderTopColor: c.border }]}> 
        <View style={styles.bottomSummary}>
          <Text style={[styles.bottomLabel, { color: c.textSecondary }]}>Total</Text>
          <Text style={[styles.bottomValue, { color: c.text }]}>{formatPrice(orderTotal)}</Text>
        </View>
        <View style={styles.bottomActions}>
          <Button
            title={t.addToCart}
            onPress={handleAdd}
            loading={adding}
            variant="outline"
            style={styles.bottomBtn}
            disabled={!available}
            icon={<MaterialCommunityIcons name={available ? 'cart-plus' : 'cart-off'} size={20} color={available ? c.primary : c.textMuted} />}
            textStyle={!available ? { color: c.textMuted } : undefined}
          />
          <Button
            title={t.buyNow}
            onPress={handleBuyNow}
            style={styles.bottomBtn}
            disabled={!available}
            icon={<MaterialCommunityIcons name="lightning-bolt-outline" size={20} color={c.white} />}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function FeatureTile({ icon, label }) {
  return (
    <View style={styles.featureTile}>
      <MaterialCommunityIcons name={icon} size={18} color="#D6E5FF" />
      <Text style={styles.featureText}>{label}</Text>
    </View>
  );
}

function DetailRow({ label, value, c }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
      <Text style={{ color: c.textSecondary, fontSize: fontSize.sm }}>{label}</Text>
      <Text style={{ color: c.text, fontSize: fontSize.sm, fontWeight: '500', maxWidth: '55%', textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  imgWrap: { position: 'relative' },
  imgWrapTablet: { alignItems: 'center', paddingTop: spacing.base },
  imageFrame: { position: 'relative', overflow: 'hidden' },
  mainImg: {},
  topActions: { position: 'absolute', top: 12, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  floatBtn: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', ...shadows.md },
  overlayBadges: { position: 'absolute', left: 16, right: 16, bottom: 44, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  overlayPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: borderRadius.full },
  overlayPillText: { color: '#FFFFFF', fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  dots: { position: 'absolute', bottom: 12, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  discBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: borderRadius.full },
  discText: { color: '#FFF', fontSize: fontSize.sm, fontWeight: '700' },
  body: { padding: spacing.base, paddingBottom: 140 },
  infoCard: { borderWidth: 1, borderRadius: borderRadius.xxl, padding: spacing.lg, marginTop: -28 },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  name: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, lineHeight: 30 },
  subhead: { fontSize: fontSize.sm, marginTop: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: spacing.md },
  price: { fontSize: fontSize.xxl, fontWeight: '800' },
  oldPrice: { fontSize: fontSize.md, textDecorationLine: 'line-through' },
  stockBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: borderRadius.full, alignSelf: 'flex-start' },
  descLead: { fontSize: fontSize.base, lineHeight: 23, marginTop: spacing.md },
  featureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: spacing.lg },
  featureTile: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: borderRadius.full, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: '#111317' },
  featureText: { color: '#D6E5FF', fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  qtyCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: borderRadius.xl, padding: spacing.lg, marginTop: spacing.base },
  qtyHeading: { fontSize: fontSize.base, fontWeight: fontWeight.bold },
  qtySubhead: { fontSize: fontSize.sm, marginTop: 4 },
  qtyStepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: borderRadius.full, paddingHorizontal: 4, paddingVertical: 4 },
  qtyBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  qtyVal: { paddingHorizontal: 16, fontSize: fontSize.md, fontWeight: '600' },
  tabsCard: { borderWidth: 1, borderRadius: borderRadius.xl, padding: spacing.md, marginTop: spacing.base },
  tabs: { flexDirection: 'row', borderRadius: borderRadius.full, padding: 4, marginBottom: spacing.md },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: borderRadius.full },
  tabText: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  tabContent: { minHeight: 80 },
  descText: { fontSize: fontSize.base, lineHeight: 24 },
  bottomBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.base, padding: spacing.base, borderTopWidth: 1, ...shadows.lg },
  bottomSummary: { minWidth: 92 },
  bottomLabel: { fontSize: fontSize.xs, marginBottom: 4 },
  bottomValue: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  bottomActions: { flex: 1, flexDirection: 'row', gap: 8 },
  bottomBtn: { flex: 1 },
});

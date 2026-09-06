import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, useWindowDimensions, Modal, Animated, Share, StatusBar } from 'react-native';
import { PanGestureHandler, PinchGestureHandler, State } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import ScreenHeader from '../../components/ScreenHeader';
import QuantityInput from '../../components/QuantityInput';
import RemoteImage from '../../components/RemoteImage';
import { productsApi } from '../../services/api';
import { formatPrice, WEBSITE_URL } from '../../config';
import { spacing, fontSize, fontWeight, borderRadius } from '../../theme';

export default function ProductDetailScreen({ navigation, route }) {
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t, getName, getDesc } = useLanguage();
  const { addItem } = useCart();
  const toast = useToast();
  const c = theme.colors;
  const isTablet = viewportWidth >= 768;
  const compactBottomBar = viewportWidth < 520;
  const imageWidth = Math.min(viewportWidth - spacing.base * 2, 620);
  const imageHeight = imageWidth;
  const contentWidth = isTablet ? Math.min(viewportWidth - spacing.xl * 2, 820) : viewportWidth;
  const [product, setProduct] = useState(route.params?.product || null);
  const [loading, setLoading] = useState(!product);
  const [imgIdx, setImgIdx] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIdx, setViewerIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState('desc');
  const [adding, setAdding] = useState(false);
  const viewerPinchRef = useRef(null);
  const viewerPanRef = useRef(null);
  const viewerBaseScale = useRef(new Animated.Value(1)).current;
  const viewerPinchScale = useRef(new Animated.Value(1)).current;
  const viewerBaseX = useRef(new Animated.Value(0)).current;
  const viewerBaseY = useRef(new Animated.Value(0)).current;
  const viewerPanX = useRef(new Animated.Value(0)).current;
  const viewerPanY = useRef(new Animated.Value(0)).current;
  const viewerScale = useRef(Animated.multiply(viewerBaseScale, viewerPinchScale)).current;
  const viewerTranslateX = useRef(Animated.add(viewerBaseX, viewerPanX)).current;
  const viewerTranslateY = useRef(Animated.add(viewerBaseY, viewerPanY)).current;
  const viewerLastScale = useRef(1);
  const viewerLastX = useRef(0);
  const viewerLastY = useRef(0);
  const [viewerZoom, setViewerZoom] = useState(1);
  const [viewerGestureActive, setViewerGestureActive] = useState(false);

  useEffect(() => {
    StatusBar.setBarStyle(viewerOpen || theme.dark ? 'light-content' : 'dark-content', true);
    return () => StatusBar.setBarStyle(theme.dark ? 'light-content' : 'dark-content', true);
  }, [theme.dark, viewerOpen]);

  const onPinch = Animated.event([{ nativeEvent: { scale: viewerPinchScale } }], { useNativeDriver: true });
  const onPan = Animated.event([{ nativeEvent: { translationX: viewerPanX, translationY: viewerPanY } }], { useNativeDriver: true });

  const resetViewerTransform = (animated = false) => {
    viewerLastScale.current = 1;
    viewerLastX.current = 0;
    viewerLastY.current = 0;
    viewerPinchScale.setValue(1);
    viewerPanX.setValue(0);
    viewerPanY.setValue(0);
    setViewerZoom(1);
    setViewerGestureActive(false);

    if (animated) {
      Animated.parallel([
        Animated.spring(viewerBaseScale, { toValue: 1, useNativeDriver: true }),
        Animated.spring(viewerBaseX, { toValue: 0, useNativeDriver: true }),
        Animated.spring(viewerBaseY, { toValue: 0, useNativeDriver: true }),
      ]).start();
    } else {
      viewerBaseScale.setValue(1);
      viewerBaseX.setValue(0);
      viewerBaseY.setValue(0);
    }
  };

  const finishPinch = (event) => {
    const { oldState, state, scale = 1 } = event.nativeEvent;
    if (state === State.BEGAN) setViewerGestureActive(true);
    if (oldState !== State.ACTIVE) return;

    const nextScale = Math.min(4, Math.max(1, viewerLastScale.current * scale));
    viewerLastScale.current = nextScale;
    viewerBaseScale.setValue(nextScale);
    viewerPinchScale.setValue(1);
    setViewerZoom(nextScale);
    setViewerGestureActive(false);

    if (nextScale === 1) {
      viewerLastX.current = 0;
      viewerLastY.current = 0;
      viewerBaseX.setValue(0);
      viewerBaseY.setValue(0);
    }
  };

  const finishPan = (event) => {
    const { oldState, state, translationX = 0, translationY = 0 } = event.nativeEvent;
    if (state === State.BEGAN) setViewerGestureActive(true);
    if (oldState !== State.ACTIVE) return;

    const maxX = (viewportWidth * Math.max(viewerLastScale.current - 1, 0)) / 2;
    const maxY = (viewportHeight * Math.max(viewerLastScale.current - 1, 0)) / 2;
    const nextX = Math.max(-maxX, Math.min(maxX, viewerLastX.current + translationX));
    const nextY = Math.max(-maxY, Math.min(maxY, viewerLastY.current + translationY));
    viewerLastX.current = nextX;
    viewerLastY.current = nextY;
    viewerBaseX.setValue(nextX);
    viewerBaseY.setValue(nextY);
    viewerPanX.setValue(0);
    viewerPanY.setValue(0);
    setViewerGestureActive(false);
  };

  const openViewer = (index) => {
    resetViewerTransform(false);
    setViewerIdx(index);
    setViewerOpen(true);
  };

  const closeViewer = () => {
    setViewerOpen(false);
    resetViewerTransform(false);
  };

  const handleBack = () => {
    const parent = navigation.getParent?.();
    if (navigation.canGoBack?.()) {
      navigation.goBack();
      return;
    }
    if (parent?.canGoBack?.()) {
      parent.goBack();
      return;
    }
    if (parent?.navigate) {
      parent.navigate('Main');
    }
  };

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

  const handleShare = async () => {
    // Share the public product URL: messaging apps (WhatsApp, Facebook, …) render
    // the rich preview from the website's Open Graph tags, and the OS opens this
    // link directly in the Sawdagar app (App Links / Universal Links) when installed.
    const url = `${WEBSITE_URL}/products/${product.id}`;
    const price = product.retailPrice != null ? formatPrice(product.retailPrice) : null;
    const message = `${getName(product)}${price ? `\n${price}` : ''}\n${url}`;
    try {
      // On iOS, passing `url` alongside `message` makes some apps (WhatsApp) attach
      // the URL as a binary plist and leak "bplist00…" garbage into the text.
      // iOS only reads `message`; Android reads `message` too, so send text only.
      await Share.share({ title: getName(product), message });
    } catch (error) {
      toast.error(error.message || 'Unable to share product');
    }
  };

  const openSupplierProducts = () => {
    const params = { supplierId: product.supplier?.id, title: `${supplierName || 'Supplier'} products` };
    const parent = navigation.getParent?.();
    if (parent?.navigate) parent.navigate('ShopTab', { screen: 'Products', params });
    else navigation.navigate('Products', params);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
        <ScreenHeader title="" onBack={() => navigation.goBack()} />
        <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
        <ScreenHeader title="" onBack={() => navigation.goBack()} />
        <EmptyState icon="bag-outline" title="Product not found" />
      </SafeAreaView>
    );
  }

  const images = product.images || [];
  const hasDiscount = product.wholesaleCost && product.retailPrice && product.wholesaleCost > product.retailPrice;
  const discount = hasDiscount ? Math.round((1 - product.retailPrice / product.wholesaleCost) * 100) : 0;
  const available = product.stock == null || product.stock > 0;
  const maxQty = Number.isFinite(product.stock) && product.stock > 0 ? product.stock : undefined;
  const categoryName = product.category ? getName(product.category) : 'Selected item';
  const supplierName = product.supplier?.companyName || product.supplier?.fullName || null;
  const supplierVerified = !!product.supplier?.supplierVerified;
  const orderTotal = (product.retailPrice || 0) * qty;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.imgWrap, isTablet && styles.imgWrapTablet]}>
          <View style={[styles.imageFrame, { width: imageWidth, height: imageHeight, backgroundColor: c.card, borderColor: c.borderLight }]}>
          <ScrollView
            horizontal
            pagingEnabled
            style={{ width: imageWidth, height: imageHeight }}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => setImgIdx(Math.round(event.nativeEvent.contentOffset.x / imageWidth))}
          >
            {images.length > 0 ? images.map((img, index) => (
              <TouchableOpacity key={img?.id || `${img?.url || 'product-image'}-${index}`} activeOpacity={0.95} onPress={() => openViewer(index)} accessibilityRole="button" accessibilityLabel={`Open product image ${index + 1} of ${images.length}`}>
                <RemoteImage
                  source={img?.url || img}
                  width={Math.round(imageWidth * 2)}
                  quality={80}
                  resizeMode="contain"
                  style={[styles.mainImg, { width: imageWidth, height: imageHeight }]}
                  fallback={(
                    <View style={[styles.mainImg, { width: imageWidth, height: imageHeight, backgroundColor: c.skeleton, justifyContent: 'center', alignItems: 'center' }]}>
                      <MaterialCommunityIcons name="image-outline" size={48} color={c.textMuted} />
                    </View>
                  )}
                />
              </TouchableOpacity>
            )) : <View style={[styles.mainImg, { width: imageWidth, height: imageHeight, backgroundColor: c.skeleton, justifyContent: 'center', alignItems: 'center' }]}><MaterialCommunityIcons name="image-outline" size={48} color={c.textMuted} /></View>}
          </ScrollView>

          <View style={styles.topActions}>
            <TouchableOpacity onPress={handleBack} accessibilityRole="button" accessibilityLabel="Back" hitSlop={{ top: 12, left: 12, right: 12, bottom: 12 }} style={[styles.floatBtn, { backgroundColor: c.card }]}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={c.text} />
            </TouchableOpacity>
            <View style={styles.topActionsSpacer} />
            <TouchableOpacity onPress={handleShare} accessibilityRole="button" accessibilityLabel="Share product" style={[styles.floatBtn, { backgroundColor: c.card }]}>
              <MaterialCommunityIcons name="share-variant-outline" size={22} color={c.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openTab('CartTab')} accessibilityRole="button" accessibilityLabel="Open cart" style={[styles.floatBtn, { backgroundColor: c.card }]}>
              <MaterialCommunityIcons name="cart-outline" size={22} color={c.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.overlayBadges}>
            <View style={[styles.overlayPill, { backgroundColor: 'rgba(17, 19, 23, 0.62)' }]}>
              <Text style={[styles.overlayPillText, { color: c.white }]}>{categoryName}</Text>
            </View>
            {discount > 0 ? <View style={[styles.discBadge, { backgroundColor: c.error }]}><Text style={[styles.discText, { color: c.white }]}>-{discount}%</Text></View> : null}
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
                <TouchableOpacity disabled={!product.supplier?.id} onPress={openSupplierProducts} accessibilityRole="button" accessibilityLabel={supplierName ? `View products from ${supplierName}` : undefined} style={styles.supplierLink}>
                  <Text maxFontSizeMultiplier={1.2} style={[styles.subhead, { color: product.supplier?.id ? c.primary : c.textSecondary }]}>{supplierName ? `Sold by ${supplierName}` : 'Curated by Sawdagar'}</Text>
                  {supplierVerified ? (
                    <View style={[styles.supplierVerifiedPill, { backgroundColor: c.primary + '16' }]}>
                      <MaterialCommunityIcons name="shield-check-outline" size={13} color={c.primary} />
                      <Text style={[styles.supplierVerifiedText, { color: c.primary }]}>Verified</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
                {product.supplier?.province ? <Text style={[styles.supplierLocation, { color: c.textSecondary }]}><MaterialCommunityIcons name="map-marker-outline" size={13} color={c.textSecondary} /> {product.supplier.province}</Text> : null}
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
            <View style={styles.qtyCopy}>
              <Text style={[styles.qtyHeading, { color: c.text }]}>{t.qty}</Text>
              <Text style={[styles.qtySubhead, { color: c.textSecondary }]}>{available && maxQty ? `Stock: ${maxQty}` : available ? 'Ready to add' : 'Currently unavailable'}</Text>
            </View>
            <QuantityInput
              value={qty}
              onChange={setQty}
              max={maxQty}
              disabled={!available}
              liveUpdate
            />
          </View>

          <View style={[styles.tabsCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={[styles.tabs, { backgroundColor: c.brandSurface }]}>
              {['desc', 'details'].map((key) => (
                <TouchableOpacity key={key} onPress={() => setTab(key)} accessibilityRole="tab" accessibilityState={{ selected: tab === key }} style={[styles.tab, tab === key && { backgroundColor: c.card }]}>
                  <Text numberOfLines={1} maxFontSizeMultiplier={1.15} style={[styles.tabText, { color: tab === key ? c.primary : c.textMuted }]}>{key === 'desc' ? t.description : t.details}</Text>
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
                  {product.supplier?.province ? <DetailRow label="Supplier location" value={product.supplier.province} c={c} /> : null}
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

      <View style={[styles.bottomBar, compactBottomBar && styles.bottomBarCompact, isTablet && { width: contentWidth, alignSelf: 'center' }, { backgroundColor: c.card, borderTopColor: c.border, paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <View style={[styles.bottomSummary, compactBottomBar && styles.bottomSummaryCompact]}>
          <Text style={[styles.bottomLabel, { color: c.textSecondary }]}>Total</Text>
          <Text style={[styles.bottomValue, { color: c.text }]}>{formatPrice(orderTotal)}</Text>
        </View>
        <View style={[styles.bottomActions, !compactBottomBar && styles.bottomActionsWide]}>
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
      <Modal visible={viewerOpen} transparent={false} animationType="slide" onRequestClose={closeViewer}>
        <SafeAreaView style={{ flex: 1, backgroundColor: c.black }}>
          <View style={{ flex: 1 }}>
            <ScrollView
              horizontal
              pagingEnabled
              scrollEnabled={viewerZoom <= 1.01 && !viewerGestureActive}
              contentOffset={{ x: viewerIdx * viewportWidth }}
              showsHorizontalScrollIndicator={false}
              style={{ flex: 1 }}
              onMomentumScrollEnd={(event) => {
                setViewerIdx(Math.round(event.nativeEvent.contentOffset.x / viewportWidth));
                resetViewerTransform(false);
              }}
            >
              {images.length > 0 ? images.map((img, index) => (
                <View key={img?.id || `${img?.url || 'product-image'}-${index}`} style={{ width: viewportWidth, height: viewportHeight, justifyContent: 'center', alignItems: 'center', backgroundColor: c.black }}>
                  <PanGestureHandler ref={viewerPanRef} enabled={viewerZoom > 1.01} simultaneousHandlers={viewerPinchRef} onGestureEvent={onPan} onHandlerStateChange={finishPan}>
                    <Animated.View style={{ width: viewportWidth, height: viewportHeight, justifyContent: 'center' }}>
                      <PinchGestureHandler ref={viewerPinchRef} simultaneousHandlers={viewerPanRef} onGestureEvent={onPinch} onHandlerStateChange={finishPinch}>
                        <Animated.View style={{ width: viewportWidth, height: viewportHeight, justifyContent: 'center', transform: [{ scale: viewerScale }, { translateX: viewerTranslateX }, { translateY: viewerTranslateY }] }}>
                          <RemoteImage source={img?.url || img} style={{ width: viewportWidth, height: viewportHeight }} resizeMode="contain" />
                        </Animated.View>
                      </PinchGestureHandler>
                    </Animated.View>
                  </PanGestureHandler>
                </View>
              )) : null}
            </ScrollView>

            <View pointerEvents="box-none" style={[styles.viewerTopActions, { top: Math.max(insets.top + spacing.sm, spacing.xl) }]}>
              {viewerZoom > 1.01 ? (
                <TouchableOpacity activeOpacity={0.7} onPress={() => resetViewerTransform(true)} accessibilityRole="button" accessibilityLabel="Reset image zoom" style={[styles.viewerReset, { backgroundColor: c.white }]}>
                  <MaterialCommunityIcons name="restore" size={24} color={c.black} />
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity activeOpacity={0.7} onPress={closeViewer} accessibilityRole="button" accessibilityLabel="Close image viewer" hitSlop={{ top: 16, left: 16, right: 16, bottom: 16 }} style={[styles.viewerClose, { backgroundColor: c.white }]}>
                <MaterialCommunityIcons name="close" size={30} color={c.black} />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function FeatureTile({ icon, label }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View style={[styles.featureTile, { backgroundColor: c.secondary }]}>
      <MaterialCommunityIcons name={icon} size={18} color={c.heroTextMuted} />
      <Text style={[styles.featureText, { color: c.heroTextMuted }]}>{label}</Text>
    </View>
  );
}

function DetailRow({ label, value, c }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
      <Text style={{ color: c.textSecondary, fontSize: fontSize.sm }}>{label}</Text>
      <Text style={{ color: c.text, fontSize: fontSize.sm, fontWeight: fontWeight.medium, maxWidth: '55%', textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  imgWrap: { position: 'relative', alignItems: 'center', paddingTop: spacing.base },
  imgWrapTablet: { alignItems: 'center', paddingTop: spacing.base },
  imageFrame: { position: 'relative', overflow: 'hidden', borderRadius: 28, borderWidth: 1 },
  mainImg: {},
  topActions: { position: 'absolute', top: 12, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 4, elevation: 4 },
  topActionsSpacer: { flex: 1 },
  floatBtn: { width: 44, height: 44, borderRadius: borderRadius.full, justifyContent: 'center', alignItems: 'center' },
  overlayBadges: { position: 'absolute', left: 16, right: 16, bottom: 44, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  overlayPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: borderRadius.full },
  overlayPillText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  dots: { position: 'absolute', bottom: 12, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  discBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: borderRadius.full },
  discText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  body: { padding: spacing.base, paddingBottom: spacing.xxxl },
  infoCard: { borderWidth: 1, borderRadius: borderRadius.xl, padding: spacing.lg },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  name: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, lineHeight: 30 },
  subhead: { flexShrink: 1, fontSize: fontSize.sm, lineHeight: 18, marginTop: 8, includeFontPadding: false, textAlignVertical: 'center' },
  supplierLink: { minHeight: 44, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 2, marginBottom: -6 },
  supplierVerifiedPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: borderRadius.full, marginLeft: 8 },
  supplierVerifiedText: { fontSize: fontSize.xs, lineHeight: 16, fontWeight: fontWeight.bold, includeFontPadding: false, textAlignVertical: 'center' },
  supplierLocation: { fontSize: fontSize.xs, marginTop: 5 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: spacing.md },
  price: { fontSize: fontSize.xxl, fontWeight: fontWeight.heavy },
  oldPrice: { fontSize: fontSize.md, textDecorationLine: 'line-through' },
  stockBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: borderRadius.full, alignSelf: 'flex-start' },
  descLead: { fontSize: fontSize.base, lineHeight: 23, marginTop: spacing.md },
  featureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: spacing.lg },
  featureTile: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: borderRadius.full, paddingHorizontal: 12, paddingVertical: 9 },
  featureText: { fontSize: fontSize.xs, lineHeight: 16, fontWeight: fontWeight.bold, includeFontPadding: false, textAlignVertical: 'center' },
  qtyCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderRadius: borderRadius.xl, padding: spacing.lg, marginTop: spacing.base },
  qtyCopy: { flex: 1 },
  qtyHeading: { fontSize: fontSize.base, fontWeight: fontWeight.bold },
  qtySubhead: { fontSize: fontSize.sm, marginTop: 4 },
  tabsCard: { borderWidth: 1, borderRadius: borderRadius.xl, padding: spacing.md, marginTop: spacing.base },
  tabs: { flexDirection: 'row', borderRadius: borderRadius.full, padding: 4, marginBottom: spacing.md },
  tab: { flex: 1, minHeight: 44, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', borderRadius: borderRadius.full },
  tabText: { fontSize: fontSize.base, lineHeight: 20, fontWeight: fontWeight.semibold, includeFontPadding: false, textAlign: 'center', textAlignVertical: 'center' },
  tabContent: { minHeight: 80 },
  descText: { fontSize: fontSize.base, lineHeight: 24 },
  bottomBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.base, padding: spacing.base, borderTopWidth: 1 },
  bottomBarCompact: { flexDirection: 'column', alignItems: 'stretch', gap: spacing.sm },
  bottomSummary: { minWidth: 92 },
  bottomSummaryCompact: { width: '100%', minWidth: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bottomLabel: { fontSize: fontSize.xs, marginBottom: 4 },
  bottomValue: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  bottomActions: { width: '100%', minHeight: 50, flexDirection: 'row', alignItems: 'stretch', gap: 8 },
  bottomActionsWide: { width: 'auto', flex: 1 },
  bottomBtn: { flex: 1 },
  viewerTopActions: { position: 'absolute', left: 12, right: 12, zIndex: 100, elevation: 100, flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  viewerReset: { width: 48, height: 48, borderRadius: borderRadius.full, justifyContent: 'center', alignItems: 'center' },
  viewerClose: { width: 56, height: 56, borderRadius: borderRadius.full, justifyContent: 'center', alignItems: 'center' },
});

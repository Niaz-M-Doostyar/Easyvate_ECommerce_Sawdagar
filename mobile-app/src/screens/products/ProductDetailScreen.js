import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Share } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import useResponsiveLayout from '../../hooks/useResponsiveLayout';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import ScreenHeader from '../../components/ScreenHeader';
import QuantityInput from '../../components/QuantityInput';
import RemoteImage from '../../components/RemoteImage';
import ProductImageViewer from '../../components/ProductImageViewer';
import { productsApi } from '../../services/api';
import { formatPrice, WEBSITE_URL } from '../../config';
import { spacing, fontSize, fontWeight, borderRadius } from '../../theme';

const detailCopy = {
  en: { product: 'Product', share: 'Share product', cart: 'Open cart', soldBy: 'Sold by', verified: 'Verified supplier', stock: 'Stock', unavailable: 'Currently unavailable', total: 'Total', category: 'Category', supplier: 'Supplier', location: 'Supplier location', retail: 'Price', suggested: 'Suggested price', unit: 'Unit', emptyDescription: 'No description available.', missing: 'Product not found', added: 'Added to cart', failed: 'Could not add item', images: 'Product images' },
  ps: { product: 'محصول', share: 'محصول شریک کړئ', cart: 'کارټ پرانیزئ', soldBy: 'پلورونکی', verified: 'تایید شوی پلورونکی', stock: 'موجودي', unavailable: 'اوس موجود نه دی', total: 'ټول', category: 'کټګوري', supplier: 'پلورونکی', location: 'د پلورونکي ځای', retail: 'بیه', suggested: 'وړاندیز شوې بیه', unit: 'واحد', emptyDescription: 'توضیحات نشته.', missing: 'محصول ونه موندل شو', added: 'کارټ ته اضافه شو', failed: 'توکی اضافه نه شو', images: 'د محصول انځورونه' },
  dr: { product: 'محصول', share: 'اشتراک‌گذاری محصول', cart: 'باز کردن سبد', soldBy: 'فروشنده', verified: 'فروشنده تأییدشده', stock: 'موجودی', unavailable: 'فعلاً موجود نیست', total: 'مجموع', category: 'دسته‌بندی', supplier: 'فروشنده', location: 'موقعیت فروشنده', retail: 'قیمت', suggested: 'قیمت پیشنهادی', unit: 'واحد', emptyDescription: 'توضیحی موجود نیست.', missing: 'محصول یافت نشد', added: 'به سبد اضافه شد', failed: 'افزودن محصول ممکن نشد', images: 'تصاویر محصول' },
};

export default function ProductDetailScreen({ navigation, route }) {
  const { width: viewportWidth, isTablet, fontScale } = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t, getName, getDesc, isRTL, lang } = useLanguage();
  const { addItem, count, items } = useCart();
  const toast = useToast();
  const c = theme.colors;
  const copy = detailCopy[lang] || detailCopy.en;
  const textAlignment = { textAlign: isRTL ? 'right' : 'left' };
  const rowDirection = { flexDirection: isRTL ? 'row-reverse' : 'row' };
  const splitDetail = isTablet && fontScale <= 1.4;
  const compactBottomBar = viewportWidth < 520 || fontScale > 1.3;
  const stackPurchaseActions = fontScale > 1.5 || (viewportWidth < 360 && fontScale > 1.2);
  const imageWidth = Math.min((splitDetail ? viewportWidth / 2 : viewportWidth) - spacing.base * 2, 620);
  const imageHeight = Math.min(imageWidth, splitDetail ? 520 : 360);
  const galleryWidth = Math.max(1, imageWidth - 2);
  const galleryHeight = Math.max(1, imageHeight - 2);
  const galleryRef = useRef(null);
  const contentWidth = viewportWidth;
  const [product, setProduct] = useState(route.params?.product || null);
  const [loading, setLoading] = useState(!product);
  const [imgIdx, setImgIdx] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIdx, setViewerIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState('desc');
  const [adding, setAdding] = useState(false);
  const openViewer = (index) => {
    setViewerIdx(index);
    setViewerOpen(true);
  };

  const closeViewer = () => setViewerOpen(false);

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
    let active = true;
    const id = route.params?.id || route.params?.product?.id;
    setProduct(null);
    setLoading(true);
    setImgIdx(0);
    setViewerOpen(false);
    setQty(1);
    productsApi.get(id).then((data) => {
      if (active) setProduct(data.product || data);
    }).catch(() => {}).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [route.params?.id, route.params?.product?.id]);

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
      toast.success(copy.added);
    } catch (err) {
      toast.error(err.message || copy.failed);
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
      toast.error(err.message || copy.failed);
    }
    setAdding(false);
  };

  const handleShare = async () => {
    // Share the public product URL: messaging apps (WhatsApp, Facebook, …) render
    // the rich preview from the website's Open Graph tags, and the OS opens this
    // link directly in the Sawdagar app (App Links / Universal Links) when installed.
    const url = `${WEBSITE_URL}/share/products/${encodeURIComponent(product.id)}?preview=2`;
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
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top', 'left', 'right']}>
        <ScreenHeader title="" onBack={() => navigation.goBack()} />
        <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top', 'left', 'right']}>
        <ScreenHeader title="" onBack={() => navigation.goBack()} />
        <EmptyState icon="bag-outline" title={copy.missing} />
      </SafeAreaView>
    );
  }

  const images = product.images || [];
  const hasDiscount = product.wholesaleCost && product.retailPrice && product.wholesaleCost > product.retailPrice;
  const discount = hasDiscount ? Math.round((1 - product.retailPrice / product.wholesaleCost) * 100) : 0;
  const available = product.stock == null || product.stock > 0;
  const maxQty = Number.isFinite(product.stock) && product.stock > 0 ? product.stock : undefined;
  const categoryName = product.category ? getName(product.category) : '';
  const supplierName = product.supplier?.companyName || product.supplier?.fullName || null;
  const supplierVerified = !!product.supplier?.supplierVerified;
  const orderTotal = (product.retailPrice || 0) * qty;
  const cartQuantity = items.reduce((total, item) => String(item.productId ?? item.product?.id) === String(product.id)
    ? total + (Number(item.quantity) || 0) : total, 0);
  const inCart = lang === 'ps' ? 'په کارټ کې' : lang === 'dr' ? 'در سبد شما' : 'in your cart';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top', 'left', 'right']}>
      <ScreenHeader title={copy.product} onBack={handleBack} right={(
        <View style={[styles.headerActions, rowDirection]}>
          <TouchableOpacity onPress={handleShare} accessibilityRole="button" accessibilityLabel={copy.share} style={styles.headerAction}>
            <MaterialCommunityIcons name="share-variant-outline" size={22} color={c.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openTab('CartTab')} accessibilityRole="button" accessibilityLabel={`${copy.cart}, ${count} ${inCart}`} style={styles.headerAction}>
            <MaterialCommunityIcons name="cart-outline" size={22} color={c.text} />
            {count > 0 ? <View pointerEvents="none" accessible={false} style={[styles.cartBadge, { backgroundColor: c.primary, borderColor: c.headerBg }, isRTL ? { left: 0 } : { right: 0 }]}>
              <Text maxFontSizeMultiplier={1.2} style={[styles.cartBadgeText, { color: c.white }]}>{count > 99 ? '99+' : count}</Text>
            </View> : null}
          </TouchableOpacity>
        </View>
      )} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: splitDetail ? (isRTL ? 'row-reverse' : 'row') : 'column', alignItems: splitDetail ? 'flex-start' : undefined }}>
        <View style={[styles.imgWrap, splitDetail && { width: '50%' }]}>
          <View style={[styles.imageFrame, { width: imageWidth, height: imageHeight, backgroundColor: c.surfaceElevated, borderColor: c.borderLight }]}>
          <ScrollView
            ref={galleryRef}
            horizontal
            pagingEnabled
            style={{ width: galleryWidth, height: galleryHeight }}
            showsHorizontalScrollIndicator={false}
            onLayout={() => galleryRef.current?.scrollTo({ x: imgIdx * galleryWidth, animated: false })}
            onMomentumScrollEnd={(event) => setImgIdx(Math.max(0, Math.min(images.length - 1, Math.round(event.nativeEvent.contentOffset.x / galleryWidth))))}
          >
            {images.length > 0 ? images.map((img, index) => (
              <TouchableOpacity key={img?.id || `${img?.url || 'product-image'}-${index}`} activeOpacity={0.95} onPress={() => openViewer(index)} accessibilityRole="button" accessibilityLabel={`${copy.images}: ${index + 1} / ${images.length}`} style={[styles.imagePage, { width: galleryWidth, height: galleryHeight }]}>
                <RemoteImage
                  source={img?.url || img}
                  width={Math.round(imageWidth * 2)}
                  quality={80}
                  resizeMode="contain"
                  style={styles.mainImg}
                  fallback={(
                    <View style={[styles.mainImg, { justifyContent: 'center', alignItems: 'center' }]}>
                      <MaterialCommunityIcons name="image-outline" size={48} color={c.textMuted} />
                    </View>
                  )}
                />
              </TouchableOpacity>
            )) : <View style={[styles.imagePage, { width: galleryWidth, height: galleryHeight, justifyContent: 'center', alignItems: 'center' }]}><MaterialCommunityIcons name="image-outline" size={48} color={c.textMuted} /></View>}
          </ScrollView>
          </View>
          {images.length > 1 ? <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.thumbnailStrip, { width: imageWidth }]} contentContainerStyle={styles.thumbnails}>
            {images.map((img, index) => <TouchableOpacity key={`thumbnail-${index}`} accessibilityRole="button" accessibilityLabel={`${copy.images}: ${index + 1} / ${images.length}`} accessibilityState={{ selected: index === imgIdx }} onPress={() => { setImgIdx(index); galleryRef.current?.scrollTo({ x: index * galleryWidth, animated: true }); }} style={[styles.thumbnail, { backgroundColor: c.card, borderColor: index === imgIdx ? c.primary : c.borderLight }]}>
              <RemoteImage source={img?.url || img} width={120} resizeMode="contain" style={styles.mainImg} fallback={<MaterialCommunityIcons name="image-outline" size={20} color={c.textMuted} />} />
            </TouchableOpacity>)}
          </ScrollView> : null}
        </View>

        <View style={[styles.body, splitDetail && { width: '50%' }]}>
          <View style={[styles.infoCard, { backgroundColor: c.card, borderColor: c.border }]}>
            {!!categoryName && <Text style={[styles.category, textAlignment, { color: c.textSecondary }]}>{categoryName}</Text>}
            <Text style={[styles.name, textAlignment, { color: c.text }]}>{getName(product)}</Text>
            <View style={[styles.priceRow, rowDirection]}>
              <Text style={[styles.price, { color: c.text }]}>{formatPrice(product.retailPrice)}</Text>
              {hasDiscount ? <Text style={[styles.oldPrice, { color: c.textMuted }]}>{formatPrice(product.wholesaleCost)}</Text> : null}
              {discount > 0 ? <Text style={[styles.discount, { color: c.success }]}>−{discount}%</Text> : null}
            </View>
            <View style={[styles.availability, rowDirection]}>
              <MaterialCommunityIcons name={available ? 'check-circle-outline' : 'close-circle-outline'} size={17} color={available ? c.success : c.error} />
              <Text style={[styles.metadataText, { color: available ? c.success : c.error }]}>{available ? t.inStock : t.outOfStock}</Text>
            </View>
            {supplierName ? <TouchableOpacity disabled={!product.supplier?.id} onPress={openSupplierProducts} accessibilityRole="button" accessibilityLabel={`${copy.soldBy} ${supplierName}`} style={[styles.supplierLink, rowDirection]}>
              <Text style={[styles.subhead, textAlignment, { color: product.supplier?.id ? c.primary : c.textSecondary }]}>{copy.soldBy} {supplierName}</Text>
              {supplierVerified ? <View style={[styles.supplierVerified, rowDirection]}>
                <MaterialCommunityIcons name="check-decagram" size={16} color={c.success} />
                <Text style={[styles.metadataText, { color: c.success }]}>{copy.verified}</Text>
              </View> : null}
            </TouchableOpacity> : null}
            {product.supplier?.province ? <Text style={[styles.supplierLocation, textAlignment, { color: c.textSecondary }]}><MaterialCommunityIcons name="map-marker-outline" size={15} color={c.textSecondary} /> {product.supplier.province}</Text> : null}
          </View>

          <View style={[styles.qtyCard, rowDirection, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={styles.qtyCopy}>
              <Text style={[styles.qtyHeading, textAlignment, { color: c.text }]}>{t.qty}</Text>
              {maxQty || !available ? <Text style={[styles.qtySubhead, textAlignment, { color: c.textSecondary }]}>{available ? `${copy.stock}: ${maxQty}` : copy.unavailable}</Text> : null}
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
            <View style={[styles.tabs, rowDirection, { backgroundColor: c.surfaceElevated }]}>
              {['desc', 'details'].map((key) => (
                <TouchableOpacity key={key} onPress={() => setTab(key)} accessibilityRole="tab" accessibilityState={{ selected: tab === key }} style={[styles.tab, tab === key && { backgroundColor: c.card }]}>
                  <Text style={[styles.tabText, { color: tab === key ? c.text : c.textSecondary }]}>{key === 'desc' ? t.description : t.details}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.tabContent}>
              {tab === 'desc' ? (
                <Text style={[styles.descText, textAlignment, { color: c.textSecondary }]}>{getDesc(product) || copy.emptyDescription}</Text>
              ) : (
                <View>
                  {!!categoryName && <DetailRow label={copy.category} value={categoryName} c={c} />}
                  {supplierName ? <DetailRow label={copy.supplier} value={supplierName} c={c} /> : null}
                  {product.supplier?.province ? <DetailRow label={copy.location} value={product.supplier.province} c={c} /> : null}
                  <DetailRow label={copy.retail} value={formatPrice(product.retailPrice)} c={c} />
                  {product.suggestedPrice != null ? <DetailRow label={copy.suggested} value={formatPrice(product.suggestedPrice)} c={c} /> : null}
                  {product.unit ? <DetailRow label={copy.unit} value={product.unit} c={c} /> : null}
                  {product.stock != null ? <DetailRow label={copy.stock} value={String(product.stock)} c={c} /> : null}
                </View>
              )}
            </View>
          </View>
        </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, compactBottomBar && styles.bottomBarCompact, isTablet && { width: contentWidth, alignSelf: 'center' }, { backgroundColor: c.card, borderTopColor: c.border, paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <View style={[styles.bottomSummary, compactBottomBar && styles.bottomSummaryCompact, compactBottomBar && rowDirection]}>
          <View style={styles.summaryCopy}>
            <Text style={[styles.bottomLabel, { color: c.textSecondary }]}>{copy.total}</Text>
            {cartQuantity > 0 ? <Text accessibilityLiveRegion="polite" style={[styles.inCart, { color: c.success }]}>{cartQuantity} {inCart}</Text> : null}
          </View>
          <Text style={[styles.bottomValue, { color: c.text }]}>{formatPrice(orderTotal)}</Text>
        </View>
        <View style={[styles.bottomActions, rowDirection, !compactBottomBar && styles.bottomActionsWide, stackPurchaseActions && styles.bottomActionsStacked]}>
          <Button
            title={t.addToCart}
            onPress={handleAdd}
            loading={adding}
            variant="outline"
            style={[styles.bottomBtn, stackPurchaseActions && styles.bottomBtnStacked]}
            disabled={!available || adding}
            icon={<MaterialCommunityIcons name={available ? 'cart-plus' : 'cart-off'} size={20} color={available ? c.primary : c.textMuted} />}
            textStyle={!available ? { color: c.textMuted } : undefined}
          />
          <Button
            title={t.buyNow}
            onPress={handleBuyNow}
            style={[styles.bottomBtn, stackPurchaseActions && styles.bottomBtnStacked]}
            disabled={!available || adding}
            icon={<MaterialCommunityIcons name="lightning-bolt-outline" size={20} color={c.white} />}
          />
        </View>
      </View>
      {viewerOpen && images.length > 0 ? (
        <ProductImageViewer images={images} initialIndex={viewerIdx} onClose={closeViewer} />
      ) : null}
    </SafeAreaView>
  );
}

function DetailRow({ label, value, c }) {
  const { isRTL } = useLanguage();
  return (
    <View style={[styles.detailRow, { flexDirection: isRTL ? 'row-reverse' : 'row', borderBottomColor: c.borderLight }]}>
      <Text style={[styles.detailLabel, { color: c.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: c.text, textAlign: isRTL ? 'left' : 'right' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, width: '100%', maxWidth: 1200, alignSelf: 'center' },
  headerActions: { alignItems: 'center' },
  headerAction: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  cartBadge: { position: 'absolute', top: 0, minWidth: 20, height: 20, borderRadius: 10, borderWidth: 2, paddingHorizontal: 3, alignItems: 'center', justifyContent: 'center' },
  cartBadgeText: { fontSize: 10, lineHeight: 13, fontWeight: fontWeight.bold, fontVariant: ['tabular-nums'] },
  imgWrap: { alignItems: 'center', paddingTop: spacing.sm },
  imageFrame: { overflow: 'hidden', borderRadius: 20, borderWidth: 1 },
  imagePage: { padding: spacing.base },
  mainImg: { width: '100%', height: '100%' },
  thumbnailStrip: { height: 76, flexGrow: 0 },
  thumbnails: { paddingTop: spacing.sm, gap: spacing.sm },
  thumbnail: { width: 60, height: 60, padding: 5, borderRadius: borderRadius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  body: { padding: spacing.base, paddingBottom: spacing.xxxl },
  infoCard: { borderWidth: 1, borderRadius: borderRadius.lg, padding: spacing.base },
  category: { fontSize: 13, lineHeight: 19, marginBottom: spacing.sm },
  name: { fontSize: fontSize.xl, fontWeight: fontWeight.semibold, lineHeight: 30 },
  subhead: { flexShrink: 1, fontSize: fontSize.sm, lineHeight: 20, includeFontPadding: false },
  supplierLink: { minHeight: 44, alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm, marginTop: 4 },
  supplierVerified: { alignItems: 'center', gap: 4 },
  metadataText: { flexShrink: 1, fontSize: 13, lineHeight: 19, fontWeight: fontWeight.medium },
  supplierLocation: { fontSize: 13, lineHeight: 19, marginTop: 4 },
  priceRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: spacing.md },
  price: { fontSize: 28, lineHeight: 36, fontWeight: fontWeight.bold },
  oldPrice: { fontSize: fontSize.sm, lineHeight: 20, textDecorationLine: 'line-through' },
  discount: { fontSize: 13, lineHeight: 19, fontWeight: fontWeight.semibold },
  availability: { alignItems: 'center', gap: 6, marginTop: spacing.sm },
  qtyCard: { flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderRadius: borderRadius.lg, padding: spacing.base, marginTop: spacing.md },
  qtyCopy: { flexGrow: 1, minWidth: 112 },
  qtyHeading: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  qtySubhead: { fontSize: fontSize.sm, lineHeight: 20, marginTop: 4 },
  tabsCard: { borderWidth: 1, borderRadius: borderRadius.lg, padding: spacing.base, marginTop: spacing.md },
  tabs: { borderRadius: borderRadius.md, padding: 4, marginBottom: spacing.md },
  tab: { flex: 1, minHeight: 44, padding: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  tabText: { fontSize: fontSize.base, lineHeight: 24, fontWeight: fontWeight.semibold, includeFontPadding: false, textAlign: 'center', textAlignVertical: 'center' },
  tabContent: { minHeight: 80 },
  descText: { fontSize: fontSize.base, lineHeight: 24 },
  detailRow: { justifyContent: 'space-between', gap: spacing.md, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  detailLabel: { flex: 1, fontSize: fontSize.sm, lineHeight: 20 },
  detailValue: { flex: 1, fontSize: fontSize.sm, lineHeight: 20, fontWeight: fontWeight.medium },
  bottomBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.base, padding: spacing.base, borderTopWidth: 1 },
  bottomBarCompact: { flexDirection: 'column', alignItems: 'stretch', gap: spacing.sm },
  bottomSummary: { minWidth: 92 },
  bottomSummaryCompact: { width: '100%', minWidth: 0, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'space-between', alignItems: 'center' },
  bottomLabel: { fontSize: fontSize.xs, marginBottom: 4 },
  summaryCopy: { flexShrink: 1 },
  inCart: { fontSize: 12, lineHeight: 18, fontWeight: fontWeight.semibold },
  bottomValue: { flexShrink: 1, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  bottomActions: { width: '100%', minHeight: 50, flexDirection: 'row', alignItems: 'stretch', gap: 8 },
  bottomActionsWide: { width: 'auto', flex: 1 },
  bottomActionsStacked: { flexDirection: 'column' },
  bottomBtn: { flex: 1 },
  bottomBtnStacked: { flex: 0 },
});

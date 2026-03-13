import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, FlatList, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { products as productsApi } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice, API_URL, optimizedImageUri } from '../config';
import { colors, spacing, fontSize, borderRadius } from '../theme';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen({ navigation, route }) {
  const { id } = route.params;
  const { t, isRTL, getLocalizedName, getLocalizedDesc } = useLanguage();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    setLoading(true);
    productsApi.get(id).then(data => {
      setProduct(data.product);
      setRelated(data.relatedProducts || []);
    }).catch(() => {
      Alert.alert(t('error'), t('product_not_found'));
      navigation.goBack();
    }).finally(() => setLoading(false));
  }, [id]);

  async function handleAddToCart() {
    if (!user) {
      Alert.alert(t('please_sign_in'), '', [
        { text: t('cancel') },
        { text: t('sign_in'), onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }
    setAdding(true);
    try {
      await addToCart(product.id);
      Alert.alert(t('success'), t('added_to_cart'));
    } catch (err) {
      Alert.alert(t('error'), err.message);
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  if (!product) {
    return <View style={styles.center}><Text>{t('product_not_found')}</Text></View>;
  }

  const images = product.images || [];
  const currentImg = images[selectedImage]?.url;
  const imgUri = optimizedImageUri(currentImg, { width: Math.round(width * 2) });
  const price = product.retailPrice || product.suggestedPrice;
  const align = isRTL ? 'right' : 'left';
  const rowDir = isRTL ? 'row-reverse' : 'row';

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Image Gallery */}
        <View style={styles.gallery}>
          {imgUri ? (
            <Image source={{ uri: imgUri, cacheKey: imgUri }} style={styles.mainImage} contentFit="contain" cachePolicy="memory-disk" transition={120} />
          ) : (
            <View style={[styles.mainImage, styles.noImage]}><Ionicons name="image-outline" size={60} color={colors.border} /></View>
          )}
        </View>

        {images.length > 1 && (
          <FlatList
            horizontal
            data={images}
            keyExtractor={(_, i) => String(i)}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.md }}
            renderItem={({ item, index }) => {
              const uri = optimizedImageUri(item.url, { width: 120 });
              return (
                <TouchableOpacity
                  style={[styles.thumb, selectedImage === index && styles.thumbActive]}
                  onPress={() => setSelectedImage(index)}
                >
                  <Image source={{ uri, cacheKey: uri }} style={styles.thumbImg} contentFit="contain" cachePolicy="memory-disk" transition={100} />
                </TouchableOpacity>
              );
            }}
          />
        )}

        {/* Product Info */}
        <View style={styles.info}>
          <Text style={[styles.productName, { textAlign: align }]}>{getLocalizedName(product)}</Text>

          {product.category && (
            <View style={[styles.catRow, { flexDirection: rowDir }]}>
              <Ionicons name="pricetag-outline" size={14} color={colors.textMuted} />
              <Text style={styles.catText}>{getLocalizedName(product.category)}</Text>
            </View>
          )}

          <Text style={[styles.priceText, { textAlign: align }]}>{formatPrice(price)}</Text>

          <View style={[styles.stockRow, { flexDirection: rowDir }]}>
            <Ionicons name={product.stock > 0 ? 'checkmark-circle' : 'close-circle'} size={16} color={product.stock > 0 ? colors.success : colors.danger} />
            <Text style={[styles.stockText, { color: product.stock > 0 ? colors.success : colors.danger }]}>
              {product.stock > 0 ? `${t('in_stock')} (${product.stock})` : t('out_of_stock')}
            </Text>
          </View>

          {product.supplier?.companyName && (
            <View style={[styles.sellerRow, { flexDirection: rowDir }]}>
              <Ionicons name="storefront-outline" size={14} color={colors.textMuted} />
              <Text style={styles.sellerText}>{t('seller')}: {product.supplier.companyName}</Text>
            </View>
          )}

          {/* Features */}
          <View style={styles.featureList}>
            {[
              { icon: 'bicycle-outline', text: t('free_delivery') },
              { icon: 'cash-outline', text: t('cash_on_delivery') },
              { icon: 'refresh-outline', text: 'Easy Returns' },
            ].map((f, i) => (
              <View key={i} style={[styles.featureRow, { flexDirection: rowDir }]}>
                <Ionicons name={f.icon} size={16} color={colors.primary} />
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>

          {/* Description */}
          <Text style={[styles.sectionTitle, { textAlign: align }]}>{t('description')}</Text>
          <Text style={[styles.descText, { textAlign: align }]}>
            {getLocalizedDesc(product) || t('no_description') || 'No description available.'}
          </Text>

          {/* Attributes */}
          {product.attributes && typeof product.attributes === 'object' && Object.keys(product.attributes).length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { textAlign: align }]}>{t('details')}</Text>
              {Object.entries(product.attributes).map(([k, v]) => (
                <View key={k} style={[styles.attrRow, { flexDirection: rowDir }]}>
                  <Text style={styles.attrKey}>{k}</Text>
                  <Text style={styles.attrVal}>{String(v)}</Text>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Related Products */}
        {related.length > 0 && (
          <View style={styles.relatedSection}>
            <Text style={[styles.sectionTitle, { paddingHorizontal: spacing.lg, textAlign: align }]}>{t('related_products')}</Text>
            <FlatList
              horizontal
              data={related}
              keyExtractor={i => String(i.id)}
              showsHorizontalScrollIndicator={false}
              inverted={isRTL}
              contentContainerStyle={{ paddingHorizontal: spacing.lg }}
              renderItem={({ item }) => {
                const img = item.images?.[0]?.url;
                const uri = optimizedImageUri(img, { width: 260 });
                return (
                  <TouchableOpacity style={styles.relatedCard} onPress={() => navigation.push('ProductDetail', { id: item.id })}>
                    <View style={styles.relatedImg}>
                      {uri ? <Image source={{ uri, cacheKey: uri }} style={styles.relImg} contentFit="contain" cachePolicy="memory-disk" transition={100} /> :
                        <Ionicons name="image-outline" size={24} color={colors.border} />}
                    </View>
                    <Text style={styles.relName} numberOfLines={1}>{getLocalizedName(item)}</Text>
                    <Text style={styles.relPrice}>{formatPrice(item.retailPrice || item.suggestedPrice)}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Add to Cart */}
      <View style={[styles.bottomBar, { flexDirection: rowDir }]}>
        <View style={styles.bottomPrice}>
          <Text style={styles.bottomLabel}>{t('price')}</Text>
          <Text style={styles.bottomPriceText}>{formatPrice(price)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, (product.stock <= 0 || adding) && { opacity: 0.5 }]}
          onPress={handleAddToCart}
          disabled={product.stock <= 0 || adding}
        >
          <Ionicons name="cart-outline" size={20} color={colors.white} />
          <Text style={styles.addBtnText}>{adding ? t('adding') : t('add_to_cart')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  gallery: { backgroundColor: colors.grayLighter },
  mainImage: { width, height: 300 },
  noImage: { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.grayLighter },
  thumb: { width: 60, height: 60, borderRadius: borderRadius.sm, marginRight: spacing.sm, marginVertical: spacing.sm, borderWidth: 2, borderColor: 'transparent', overflow: 'hidden' },
  thumbActive: { borderColor: colors.primary },
  thumbImg: { width: '100%', height: '100%' },
  info: { padding: spacing.lg },
  productName: { fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.dark, marginBottom: spacing.sm },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  catText: { fontSize: fontSize.sm, color: colors.textMuted },
  priceText: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.sm },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  stockText: { fontSize: fontSize.md },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.lg },
  sellerText: { fontSize: fontSize.sm, color: colors.textMuted },
  featureList: { backgroundColor: colors.grayLighter, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.lg },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  featureText: { fontSize: fontSize.sm, color: colors.text },
  sectionTitle: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.dark, marginBottom: spacing.sm, marginTop: spacing.md },
  descText: { fontSize: fontSize.md, color: colors.textLight, lineHeight: 22 },
  attrRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.grayLight },
  attrKey: { fontSize: fontSize.md, color: colors.textLight, fontWeight: '500' },
  attrVal: { fontSize: fontSize.md, color: colors.text },
  relatedSection: { paddingVertical: spacing.lg, backgroundColor: colors.grayLighter },
  relatedCard: { width: 130, marginRight: spacing.md },
  relatedImg: { width: 130, height: 100, backgroundColor: colors.white, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  relImg: { width: '100%', height: '100%' },
  relName: { fontSize: fontSize.xs, color: colors.text, marginTop: spacing.xs },
  relPrice: { fontSize: fontSize.sm, fontWeight: 'bold', color: colors.primary },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, padding: spacing.md, paddingBottom: spacing.lg, borderTopWidth: 1, borderTopColor: colors.grayLight, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 5 },
  bottomPrice: { flex: 1 },
  bottomLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  bottomPriceText: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.primary },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.md },
  addBtnText: { color: colors.white, fontSize: fontSize.lg, fontWeight: 'bold' },
});

import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import ScreenHeader from '../../components/ScreenHeader';
import { supplierApi } from '../../services/api';
import { formatPrice } from '../../config';
import { spacing, fontSize, fontWeight, borderRadius } from '../../theme';

export default function SupplierSponsorshipsScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const toast = useToast();
  const c = theme.colors;
  const [packages, setPackages] = useState([]);
  const [requests, setRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingPkgId, setSubmittingPkgId] = useState(null);

  const load = async () => {
    try {
      const [sponsorshipData, productData] = await Promise.all([
        supplierApi.sponsorships(),
        supplierApi.myProducts({ limit: 100 }),
      ]);
      const nextPackages = sponsorshipData.packages || sponsorshipData || [];
      const nextRequests = sponsorshipData.requests || [];
      const nextProducts = productData.products || productData || [];
      setPackages(nextPackages);
      setRequests(nextRequests);
      setProducts(nextProducts);
      if (!selectedProductId && nextProducts.length > 0) {
        setSelectedProductId(nextProducts[0].id);
      }
    } catch {
      toast.error('Failed to load sponsorship data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleRequest = async (pkgId) => {
    if (!selectedProductId) {
      toast.error('Please select a product first');
      return;
    }
    try {
      setSubmittingPkgId(pkgId);
      await supplierApi.requestSponsorship({ productId: selectedProductId, packageId: pkgId });
      toast.success('Sponsorship requested!');
      await load();
    }
    catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSubmittingPkgId(null); }
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScreenHeader title={t.sponsorships} onBack={() => navigation.goBack()} />
      {!loading && (
        <View style={styles.productSection}>
          <Text style={[styles.productLabel, { color: c.textSecondary }]}>Select Product</Text>
          {products.length === 0 ? (
            <Text style={{ color: c.textMuted, fontSize: fontSize.sm }}>Add a product before requesting sponsorship.</Text>
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={products}
              keyExtractor={(i) => String(i.id)}
              contentContainerStyle={{ gap: 8 }}
              renderItem={({ item }) => {
                const selected = item.id === selectedProductId;
                return (
                  <TouchableOpacity
                    onPress={() => setSelectedProductId(item.id)}
                    style={[styles.productChip, { backgroundColor: selected ? c.primary : c.card, borderColor: selected ? c.primary : c.border }]}
                  >
                    <Text numberOfLines={1} style={{ color: selected ? '#FFF' : c.text, fontSize: fontSize.sm, maxWidth: 160 }}>{item.nameEn || `#${item.id}`}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      )}
      {loading ? <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 60 }} /> : packages.length === 0 ? (
        <EmptyState icon="megaphone-outline" title="No packages available" />
      ) : (
        <FlatList data={packages} keyExtractor={i => String(i.id)} contentContainerStyle={{ padding: spacing.base }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={[styles.pkgName, { color: c.text }]}>{item.name}</Text>
              <Text style={[styles.pkgDesc, { color: c.textSecondary }]}>{item.description}</Text>
              <View style={styles.pkgRow}>
                <Text style={[styles.pkgPrice, { color: c.primary }]}>{formatPrice(item.price)}</Text>
                <Text style={{ color: c.textMuted, fontSize: fontSize.sm }}>{item.durationDays} days</Text>
              </View>
              <Button title="Request" onPress={() => handleRequest(item.id)} size="sm" loading={submittingPkgId === item.id} disabled={!selectedProduct} style={{ marginTop: spacing.md }} />
            </View>
          )}
          ListFooterComponent={
            requests.length > 0 ? (
              <View style={{ marginTop: spacing.md }}>
                <Text style={[styles.productLabel, { color: c.textSecondary }]}>Recent Requests</Text>
                {requests.slice(0, 5).map((req) => (
                  <View key={req.id} style={[styles.reqRow, { borderColor: c.border, backgroundColor: c.card }]}>
                    <Text numberOfLines={1} style={{ color: c.text, flex: 1 }}>{req.product?.nameEn || `Product #${req.productId}`}</Text>
                    <Text style={{ color: c.textSecondary, fontSize: fontSize.sm }}>{req.status}</Text>
                  </View>
                ))}
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  productSection: { paddingHorizontal: spacing.base, paddingTop: spacing.base },
  productLabel: { fontSize: fontSize.xs, fontWeight: '700', marginBottom: 8, letterSpacing: 0.8, textTransform: 'uppercase' },
  productChip: { borderWidth: 1, borderRadius: borderRadius.full, paddingHorizontal: 12, paddingVertical: 8 },
  card: { borderRadius: borderRadius.lg, borderWidth: 1, padding: spacing.base, marginBottom: spacing.base },
  pkgName: { fontSize: fontSize.md, fontWeight: fontWeight.bold, marginBottom: 4 },
  pkgDesc: { fontSize: fontSize.sm, lineHeight: 20, marginBottom: 8 },
  pkgRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pkgPrice: { fontSize: fontSize.lg, fontWeight: '800' },
  reqRow: { marginTop: 8, borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
});

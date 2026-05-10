import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { supplierApi, categoriesApi } from '../../services/api';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ScreenHeader from '../../components/ScreenHeader';
import { spacing, fontSize, fontWeight, borderRadius } from '../../theme';

export default function SupplierAddProductScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const toast = useToast();
  const c = theme.colors;
  const editing = route.params?.product;
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    nameEn: editing?.nameEn || '', namePs: editing?.namePs || '', nameDr: editing?.nameDr || '',
    descEn: editing?.descEn || '', descPs: editing?.descPs || '', descDr: editing?.descDr || '',
    wholesaleCost: String(editing?.wholesaleCost || ''),
    suggestedPrice: String(editing?.suggestedPrice || ''), stock: String(editing?.stock || ''),
    unit: editing?.unit || '', categoryId: String(editing?.categoryId || ''),
  });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    categoriesApi.list()
      .then(d => setCategories(d.categories || d || []))
      .catch(() => toast.error('Failed to load categories'));
  }, [toast]);

  const handleSave = async () => {
    if (!form.nameEn.trim()) { toast.error('Product name (English) is required'); return; }
    if (!form.wholesaleCost || Number(form.wholesaleCost) <= 0) { toast.error('Wholesale cost is required'); return; }
    if (!form.categoryId) { toast.error('Please choose a category'); return; }
    setLoading(true);
    try {
      const body = {
        ...form,
        wholesaleCost: Number(form.wholesaleCost),
        suggestedPrice: form.suggestedPrice ? Number(form.suggestedPrice) : undefined,
        stock: Number(form.stock) || 0,
        categoryId: Number(form.categoryId),
      };
      if (editing) await supplierApi.updateProduct(editing.id, body);
      else await supplierApi.createProduct(body);
      toast.success(editing ? 'Product updated' : 'Product created');
      navigation.goBack();
    } catch (err) { toast.error(err.message || 'Failed'); }
    setLoading(false);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScreenHeader title={editing ? t.editProduct : t.addProduct} onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={[styles.section, { color: c.textSecondary }]}>PRODUCT NAME</Text>
          <Input label="English *" value={form.nameEn} onChangeText={v => set('nameEn', v)} placeholder="Product name" />
          <Input label="پښتو" value={form.namePs} onChangeText={v => set('namePs', v)} placeholder="د محصول نوم" />
          <Input label="دری" value={form.nameDr} onChangeText={v => set('nameDr', v)} placeholder="نام محصول" />

          <Text style={[styles.section, { color: c.textSecondary }]}>DESCRIPTION</Text>
          <Input label="English" value={form.descEn} onChangeText={v => set('descEn', v)} placeholder="Description" multiline numberOfLines={3} />
          <Input label="پښتو" value={form.descPs} onChangeText={v => set('descPs', v)} placeholder="توضیحات" multiline numberOfLines={3} />
          <Input label="دری" value={form.descDr} onChangeText={v => set('descDr', v)} placeholder="توضیحات" multiline numberOfLines={3} />

          <Text style={[styles.section, { color: c.textSecondary }]}>PRICING & STOCK</Text>
          <Input label="Wholesale Cost" value={form.wholesaleCost} onChangeText={v => set('wholesaleCost', v)} keyboardType="numeric" placeholder="0" />
          <Input label="Suggested Price" value={form.suggestedPrice} onChangeText={v => set('suggestedPrice', v)} keyboardType="numeric" placeholder="0" />
          <Input label="Stock" value={form.stock} onChangeText={v => set('stock', v)} keyboardType="numeric" placeholder="0" />
          <Input label="Unit" value={form.unit} onChangeText={v => set('unit', v)} placeholder="e.g. kg, piece" />

          <Text style={[styles.section, { color: c.textSecondary }]}>CATEGORY</Text>
          <View style={styles.catGrid}>
            {categories.map(cat => (
              <TouchableOpacity key={cat.id} onPress={() => set('categoryId', String(cat.id))}
                style={[styles.catChip, { backgroundColor: form.categoryId === String(cat.id) ? c.primary : c.card, borderColor: form.categoryId === String(cat.id) ? c.primary : c.border }]}>
                <Text style={{ color: form.categoryId === String(cat.id) ? '#FFF' : c.text, fontSize: fontSize.sm }}>{cat.nameEn}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button title={editing ? 'Update Product' : 'Create Product'} onPress={handleSave} loading={loading} style={{ marginTop: spacing.xl }} />
          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.lg },
  section: { fontSize: fontSize.xs, fontWeight: '600', letterSpacing: 1, marginTop: spacing.lg, marginBottom: spacing.sm },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
});

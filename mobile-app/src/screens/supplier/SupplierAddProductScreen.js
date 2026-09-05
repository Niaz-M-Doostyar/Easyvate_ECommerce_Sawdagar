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
import MultiImagePicker from '../../components/MultiImagePicker';
import { spacing, fontSize, fontWeight, borderRadius } from '../../theme';

function SectionLabel({ children }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return <Text style={[styles.sectionLabel, { color: c.textMuted }]}>{children}</Text>;
}

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
    suggestedPrice: String(editing?.suggestedPrice ?? ''), stock: String(editing?.stock ?? ''),
    categoryId: String(editing?.categoryId || ''),
    images: editing?.images ? (editing.images.map(i => i.url)) : [],
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: undefined }));
  };

  useEffect(() => {
    categoriesApi.list()
      .then(d => setCategories(d.categories || d || []))
      .catch(() => toast.error('Failed to load categories'));
  }, [toast]);

  const handleSave = async () => {
    const nextErrors = {};
    if (!form.nameEn.trim()) nextErrors.nameEn = 'English name is required';
    if (!form.namePs.trim()) nextErrors.namePs = 'Pashto name is required';
    if (!form.nameDr.trim()) nextErrors.nameDr = 'Dari name is required';
    if (!form.descEn.trim()) nextErrors.descEn = 'English description is required';
    if (!form.descPs.trim()) nextErrors.descPs = 'Pashto description is required';
    if (!form.descDr.trim()) nextErrors.descDr = 'Dari description is required';
    if (!form.wholesaleCost || Number(form.wholesaleCost) <= 0) nextErrors.wholesaleCost = 'Enter a wholesale cost above zero';
    if (!form.suggestedPrice || Number(form.suggestedPrice) <= 0) nextErrors.suggestedPrice = 'Enter a suggested price above zero';
    if (form.stock === '' || !Number.isInteger(Number(form.stock)) || Number(form.stock) < 0) nextErrors.stock = 'Enter a whole number of zero or more';
    if (!form.categoryId) nextErrors.categoryId = 'Choose a category';
    if (!form.images?.length) nextErrors.images = 'Upload at least one product image';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error('Complete the highlighted required fields');
      return;
    }
    setLoading(true);
    try {
      const body = {
        ...form,
        wholesaleCost: Number(form.wholesaleCost),
        suggestedPrice: Number(form.suggestedPrice),
        stock: Number(form.stock),
        categoryId: Number(form.categoryId),
        images: form.images,
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
          <View style={[styles.sectionCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <SectionLabel>PRODUCT NAME</SectionLabel>
            <Input label="English *" value={form.nameEn} onChangeText={v => set('nameEn', v)} error={errors.nameEn} placeholder="Product name" />
            <Input label="پښتو *" value={form.namePs} onChangeText={v => set('namePs', v)} error={errors.namePs} placeholder="د محصول نوم" />
            <Input label="دری *" value={form.nameDr} onChangeText={v => set('nameDr', v)} error={errors.nameDr} placeholder="نام محصول" />
          </View>

          <View style={[styles.sectionCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <SectionLabel>DESCRIPTION</SectionLabel>
            <Input label="English *" value={form.descEn} onChangeText={v => set('descEn', v)} error={errors.descEn} placeholder="Description" multiline numberOfLines={3} />
            <Input label="پښتو *" value={form.descPs} onChangeText={v => set('descPs', v)} error={errors.descPs} placeholder="توضیحات" multiline numberOfLines={3} />
            <Input label="دری *" value={form.descDr} onChangeText={v => set('descDr', v)} error={errors.descDr} placeholder="توضیحات" multiline numberOfLines={3} />
          </View>

          <View style={[styles.sectionCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <SectionLabel>PRICING & STOCK</SectionLabel>
            <Input label="Wholesale Cost *" value={form.wholesaleCost} onChangeText={v => set('wholesaleCost', v)} error={errors.wholesaleCost} keyboardType="numeric" placeholder="0" />
            <Input label="Suggested Price *" value={form.suggestedPrice} onChangeText={v => set('suggestedPrice', v)} error={errors.suggestedPrice} keyboardType="numeric" placeholder="0" />
            <Input label="Stock *" value={form.stock} onChangeText={v => set('stock', v)} error={errors.stock} keyboardType="numeric" placeholder="0" />
          </View>

          <View style={[styles.sectionCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <SectionLabel>CATEGORY</SectionLabel>
            <View style={styles.catGrid}>
              {categories.map(cat => (
                <TouchableOpacity key={cat.id} onPress={() => set('categoryId', String(cat.id))} accessibilityRole="button" accessibilityState={{ selected: form.categoryId === String(cat.id) }}
                  style={[styles.catChip, { backgroundColor: form.categoryId === String(cat.id) ? c.primary : c.card, borderColor: form.categoryId === String(cat.id) ? c.primary : c.border }]}>
                  <Text numberOfLines={1} maxFontSizeMultiplier={1.15} style={[styles.catChipText, { color: form.categoryId === String(cat.id) ? c.white : c.text }]}>{cat.nameEn}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.categoryId ? <Text style={[styles.fieldError, { color: c.error }]}>{errors.categoryId}</Text> : null}
          </View>

          <View style={[styles.sectionCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <SectionLabel>IMAGES * (AT LEAST ONE)</SectionLabel>
            <MultiImagePicker value={form.images} onChange={(imgs) => set('images', imgs)} />
            {errors.images ? <Text style={[styles.fieldError, { color: c.error }]}>{errors.images}</Text> : null}
          </View>

          <Button title={editing ? 'Update Product' : 'Create Product'} onPress={handleSave} loading={loading} style={{ marginTop: spacing.sm }} />
          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: spacing.lg, paddingBottom: 120 },
  sectionCard: { borderWidth: 1, borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.base },
  sectionLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: borderRadius.full, borderWidth: 1 },
  catChipText: { fontSize: fontSize.sm, lineHeight: 18, fontWeight: fontWeight.medium, includeFontPadding: false, textAlign: 'center', textAlignVertical: 'center' },
  fieldError: { fontSize: fontSize.xs, marginTop: spacing.sm },
});

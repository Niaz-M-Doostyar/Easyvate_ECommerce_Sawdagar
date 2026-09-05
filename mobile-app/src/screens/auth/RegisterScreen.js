import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, StyleSheet, Alert, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ScreenHeader from '../../components/ScreenHeader';
import ProvincePicker from '../../components/ProvincePicker';
import Gradient from '../../components/Gradient';
import PressableScale from '../../components/PressableScale';
import { spacing, fontSize, fontWeight, borderRadius, shadows } from '../../theme';

export default function RegisterScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const { register } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const c = theme.colors;
  const isTablet = width >= 768;
  const contentWidth = Math.min(width - spacing.lg * 2, 620);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', role: 'customer', companyName: '', province: '', district: '', village: '', landmark: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const goToLogin = () => { navigation.goBack(); };
  const handleBack = () => { navigation.goBack(); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'At least 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (form.role === 'supplier' && !(form.companyName || '').trim()) e.companyName = 'Company name is required';
    if (form.role === 'supplier' && !form.province) e.province = 'Province is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (loading) return;
    if (!validate()) return;
    setLoading(true);
    try {
      await register({
        fullName: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        role: form.role,
        companyName: form.role === 'supplier' ? (form.companyName || '').trim() : undefined,
        province: form.province ? form.province.trim() : undefined,
        district: form.district ? form.district.trim() : undefined,
        village: form.village ? form.village.trim() : undefined,
        landmark: form.landmark ? form.landmark.trim() : undefined,
      });

      const successMessage = form.role === 'supplier'
        ? t.registrationVerifyMessageSupplier
        : t.registrationVerifyMessageCustomer;

      Alert.alert(
        t.registrationSuccessTitle,
        successMessage,
        [{ text: 'OK', onPress: goToLogin }],
        { cancelable: false },
      );
    } catch (err) {
      const msg = err?.message || 'Registration failed';
      Alert.alert('Registration failed', msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { key: 'customer', label: t.customer, icon: 'person-outline' },
    { key: 'supplier', label: t.supplier, icon: 'storefront-outline' },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top', 'bottom']}>
      <ScreenHeader title={''} onBack={handleBack} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 18 : 0}>
        <ScrollView contentContainerStyle={[styles.scroll, isTablet && styles.scrollTablet]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
          <View style={[styles.content, { maxWidth: contentWidth }]}> 
          <Gradient colors={[c.secondary, c.primaryDark]} style={styles.hero}>
            <View pointerEvents="none" style={[styles.heroGlow, { backgroundColor: c.heroSurface, borderColor: c.heroBorder }]} />
            <Text style={[styles.eyebrow, { color: c.heroTextMuted }]}>SAWDAGAR</Text>
            <Text accessibilityRole="header" style={[styles.heroTitle, { color: c.heroText }]}>{t.createYourAccount}</Text>
          </Gradient>
          <View style={[styles.formCard, { backgroundColor: c.surface, borderColor: c.border }]}> 
            <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>{t.role}</Text>
            <View style={styles.roleRow}>
              {roles.map(r => (
                <PressableScale key={r.key} onPress={() => set('role', r.key)} accessibilityRole="radio" accessibilityState={{ checked: form.role === r.key }} accessibilityLabel={r.label}
                  style={[styles.roleBtn, { borderColor: form.role === r.key ? c.primary : c.border, backgroundColor: form.role === r.key ? c.brandSurface : c.surfaceElevated }]}> 
                  <View style={styles.roleIconRow}>
                    <Ionicons name={r.icon} size={23} color={form.role === r.key ? c.primary : c.textSecondary} />
                    <Ionicons name={form.role === r.key ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={form.role === r.key ? c.primary : c.textMuted} />
                  </View>
                  <Text style={[styles.roleLabel, { color: form.role === r.key ? c.primary : c.textSecondary }]}>{r.label}</Text>
                </PressableScale>
              ))}
            </View>
            <Input label={t.fullName} icon="person-outline" value={form.name} onChangeText={v => set('name', v)} error={errors.name} autoComplete="name" textContentType="name" placeholder="Your full name" />
            <Input label={t.email} icon="mail-outline" value={form.email} onChangeText={v => set('email', v)} error={errors.email} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" placeholder="you@example.com" />
            <Input label={t.phone} icon="call-outline" value={form.phone} onChangeText={v => set('phone', v)} error={errors.phone} keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" placeholder="+93 7XX XXX XXX" />
            {form.role === 'supplier' && (
              <>
                <Input label={t.companyName} icon="business-outline" value={form.companyName || ''} onChangeText={v => set('companyName', v)} error={errors.companyName} placeholder="Required for suppliers" />
                <ProvincePicker value={form.province} onChange={v => set('province', v)} error={errors.province} />
                <Input label={t.district} icon="location-outline" value={form.district || ''} onChangeText={v => set('district', v)} placeholder={t.district} />
                <Input label={t.village} icon="home-outline" value={form.village || ''} onChangeText={v => set('village', v)} placeholder={t.village} />
                <Input label={t.landmark} icon="navigate-outline" value={form.landmark || ''} onChangeText={v => set('landmark', v)} placeholder={t.landmark} />
              </>
            )}
            <Input label={t.password} icon="lock-closed-outline" value={form.password} onChangeText={v => set('password', v)} error={errors.password} secureTextEntry autoComplete="new-password" textContentType="newPassword" placeholder="Min 6 characters" />
            <Input label={t.confirmPassword} icon="lock-closed-outline" value={form.confirmPassword} onChangeText={v => set('confirmPassword', v)} error={errors.confirmPassword} secureTextEntry autoComplete="new-password" textContentType="newPassword" returnKeyType="done" onSubmitEditing={handleRegister} placeholder="Repeat password" />
            <Button title={t.createAccount} onPress={handleRegister} loading={loading} style={{ marginTop: spacing.base }} />
          </View>
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: c.textSecondary }]}>{t.alreadyHaveAccount} </Text>
            <TouchableOpacity onPress={goToLogin} accessibilityRole="button" accessibilityLabel={t.login} hitSlop={8} style={styles.footerLinkButton}>
                <Text numberOfLines={1} maxFontSizeMultiplier={1.15} style={[styles.footerLink, { color: c.primary }]}>{t.login}</Text>
              </TouchableOpacity>
          </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  scrollTablet: { justifyContent: 'center' },
  content: { width: '100%', alignSelf: 'center' },
  hero: { padding: spacing.xl, borderRadius: borderRadius.xxl, marginBottom: spacing.base },
  heroGlow: { position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 1, top: -80, right: -90 },
  eyebrow: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, letterSpacing: 2, marginBottom: spacing.md },
  heroTitle: { fontSize: fontSize.xxl, fontWeight: fontWeight.heavy },
  sectionLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, marginBottom: spacing.md },
  formCard: { borderWidth: 1, borderRadius: borderRadius.xxl, padding: spacing.lg, ...shadows.sm },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: spacing.lg },
  roleBtn: { flex: 1, minHeight: 94, padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, justifyContent: 'space-between', gap: spacing.md },
  roleIconRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roleLabel: { fontSize: fontSize.sm, lineHeight: 20, fontWeight: fontWeight.semibold, includeFontPadding: false },
  footer: { minHeight: 44, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', paddingVertical: spacing.lg },
  footerText: { fontSize: fontSize.base },
  footerLinkButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.xs },
  footerLink: { fontSize: fontSize.base, lineHeight: 20, fontWeight: fontWeight.semibold, includeFontPadding: false, textAlignVertical: 'center' },
});

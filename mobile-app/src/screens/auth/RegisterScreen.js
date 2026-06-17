import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, StyleSheet, Alert, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import BrandLogo from '../../components/BrandLogo';
import ScreenHeader from '../../components/ScreenHeader';
import { spacing, fontSize, fontWeight } from '../../theme';

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

  const navigateToLogin = () => {
    // Prefer navigating within the Auth stack to the Login screen
    if (navigation && typeof navigation.navigate === 'function') {
      // Use replace to avoid stacking Login on top of Register for smoother back behavior
      navigation.replace('Login');
      return;
    }
    if (navigation.canGoBack?.()) {
      navigation.goBack();
      return;
    }
    const parent = navigation.getParent();
    if (parent && typeof parent.goBack === 'function') {
      parent.goBack();
      return;
    }
  };

  const handleBack = () => {
    const parent = navigation.getParent();
    const authIndex = navigation.getState?.()?.index ?? 0;

    if (authIndex > 0 && navigation.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    if (parent && typeof parent.goBack === 'function') {
      parent.goBack();
      return;
    }
    // fallback to main
    if (parent && typeof parent.navigate === 'function') parent.navigate('Main');
  };

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
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
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
        [{ text: 'OK', onPress: navigateToLogin }],
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
        <ScrollView contentContainerStyle={[styles.scroll, isTablet && styles.scrollTablet]} keyboardShouldPersistTaps="handled">
          <View style={[styles.content, { maxWidth: contentWidth }]}> 
          <View style={[styles.hero, { backgroundColor: c.secondary }]}> 
            <View style={[styles.heroGlow, { backgroundColor: c.primary + '22' }]} />
            <BrandLogo variant="symbol" size={72} style={styles.heroMark} />
            <BrandLogo width={168} />
            <Text style={[styles.subtitle, { color: '#C1D4FF' }]}>Create your account in minutes and keep your shopping, orders, and checkout details in one place.</Text>
          </View>
          <View style={[styles.formCard, { backgroundColor: c.surface, borderColor: c.border }]}> 
            <Text style={[styles.title, { color: c.text }]}>{t.createYourAccount}</Text>
            <View style={styles.roleRow}>
              {roles.map(r => (
                <TouchableOpacity key={r.key} onPress={() => set('role', r.key)}
                  style={[styles.roleBtn, { borderColor: form.role === r.key ? c.primary : c.border, backgroundColor: form.role === r.key ? c.brandSurface : c.surfaceElevated }]}> 
                  <Text style={[styles.roleLabel, { color: form.role === r.key ? c.primary : c.textSecondary }]}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Input label={t.fullName} icon="person-outline" value={form.name} onChangeText={v => set('name', v)} error={errors.name} placeholder="Your full name" />
            <Input label={t.email} icon="mail-outline" value={form.email} onChangeText={v => set('email', v)} error={errors.email} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" />
            <Input label={t.phone} icon="call-outline" value={form.phone} onChangeText={v => set('phone', v)} error={errors.phone} keyboardType="phone-pad" placeholder="+93 7XX XXX XXX" />
            {form.role === 'supplier' && (
              <>
                <Input label={t.companyName} icon="business-outline" value={form.companyName || ''} onChangeText={v => set('companyName', v)} error={errors.companyName} placeholder="Required for suppliers" />
                <Input label="Province" icon="map-marker-outline" value={form.province || ''} onChangeText={v => set('province', v)} placeholder="Province / State" />
                <Input label="District" icon="map-marker-radius" value={form.district || ''} onChangeText={v => set('district', v)} placeholder="District" />
                <Input label="Village / City" icon="city" value={form.village || ''} onChangeText={v => set('village', v)} placeholder="Village or City" />
                <Input label="Landmark" icon="map-marker" value={form.landmark || ''} onChangeText={v => set('landmark', v)} placeholder="Landmark / Address" />
              </>
            )}
            <Input label={t.password} icon="lock-closed-outline" value={form.password} onChangeText={v => set('password', v)} error={errors.password} secureTextEntry placeholder="Min 6 characters" />
            <Input label={t.confirmPassword} icon="lock-closed-outline" value={form.confirmPassword} onChangeText={v => set('confirmPassword', v)} error={errors.confirmPassword} secureTextEntry placeholder="Repeat password" />
            <Button title={t.createAccount} onPress={handleRegister} loading={loading} style={{ marginTop: spacing.base }} />
          </View>
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: c.textSecondary }]}>{t.alreadyHaveAccount} </Text>
            <TouchableOpacity onPress={navigateToLogin}>
                <Text style={[styles.footerLink, { color: c.primary }]}>{t.login}</Text>
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
  scroll: { flexGrow: 1, padding: spacing.lg, paddingBottom: spacing.xxl },
  scrollTablet: { justifyContent: 'center' },
  content: { width: '100%', alignSelf: 'center' },
  hero: { borderRadius: 30, overflow: 'hidden', padding: spacing.xl, marginTop: spacing.lg, marginBottom: spacing.lg },
  heroGlow: { position: 'absolute', width: 180, height: 180, borderRadius: 90, top: -42, right: -28 },
  heroMark: { position: 'absolute', right: spacing.lg, top: spacing.lg, opacity: 0.12 },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, marginBottom: spacing.md },
  subtitle: { fontSize: fontSize.base, marginTop: spacing.base, lineHeight: 22, maxWidth: '86%' },
  formCard: { borderWidth: 1, borderRadius: 30, padding: spacing.lg },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: spacing.lg },
  roleBtn: { flex: 1, padding: spacing.md, borderRadius: 16, borderWidth: 1.5, alignItems: 'center' },
  roleLabel: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  footer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingVertical: spacing.lg },
  footerText: { fontSize: fontSize.base },
  footerLink: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
});

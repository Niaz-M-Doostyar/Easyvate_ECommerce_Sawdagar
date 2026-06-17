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
import { spacing, fontSize, fontWeight, borderRadius } from '../../theme';

export default function LoginScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const { login } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const c = theme.colors;
  const isTablet = width >= 768;
  const contentWidth = Math.min(width - spacing.lg * 2, 560);
  const redirectTo = route.params?.redirectTo;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const closeAuthModal = () => {
    const parent = navigation.getParent?.();
    const authIndex = navigation.getState?.()?.index ?? 0;

    // If a redirect target was provided, navigate the root to that tab
    // then close the auth modal (if possible) to avoid stacked navigation actions.
    if (redirectTo && parent?.navigate) {
      parent.navigate('Main', {
        screen: redirectTo.tab,
        params: redirectTo.params,
      });
      if (parent?.canGoBack?.()) {
        parent.goBack();
      } else if (authIndex > 0 && navigation.canGoBack?.()) {
        navigation.goBack();
      }
      return;
    }

    if (parent?.canGoBack?.()) {
      parent.goBack();
      return;
    }
    if (authIndex > 0 && navigation.canGoBack?.()) {
      navigation.goBack();
      return;
    }
    if (parent?.navigate) {
      parent.navigate('Main');
    }
  };

  const handleBack = () => {
    const parent = navigation.getParent?.();
    const authIndex = navigation.getState?.()?.index ?? 0;

    if (authIndex > 0 && navigation.canGoBack?.()) {
      navigation.goBack();
      return;
    }
    if (parent?.canGoBack?.()) {
      parent.goBack();
      return;
    }
    if (parent?.navigate) {
      parent.navigate('Main');
      return;
    }
  };

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      toast.success('Welcome back!');
      closeAuthModal();
    } catch (err) {
      const msg = err?.message || 'Login failed';
      Alert.alert('Login failed', msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top', 'bottom']}>
      <ScreenHeader title={t.welcomeBack || ''} onBack={handleBack} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 18 : 0}>
        <ScrollView contentContainerStyle={[styles.scroll, isTablet && styles.scrollTablet]} keyboardShouldPersistTaps="handled">
          <View style={[styles.content, { maxWidth: contentWidth }]}> 
          <View style={[styles.hero, { backgroundColor: c.secondary }]}> 
            <View style={[styles.heroGlow, { backgroundColor: c.primary + '25' }]} />
            <BrandLogo variant="symbol" size={76} style={styles.heroMark} />
            <View style={styles.header}>
              <BrandLogo width={170} />
              <Text style={[styles.eyebrow, { color: '#BFD2FF' }]}>Secure account access</Text>
            </View>
          </View>
          <View style={[styles.formCard, { backgroundColor: c.surface, borderColor: c.border }]}> 
            <Text style={[styles.title, { color: c.text }]}>{t.welcomeBack}</Text>
            <Text style={[styles.subtitle, { color: c.textSecondary }]}>Sign in to continue shopping, track orders, and check out faster.</Text>
            <View style={styles.form}>
              <Input label={t.email} icon="mail-outline" value={email} onChangeText={setEmail} error={errors.email} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" />
              <Input label={t.password} icon="lock-closed-outline" value={password} onChangeText={setPassword} error={errors.password} secureTextEntry placeholder="Enter password" />
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotRow}>
                <Text style={[styles.forgotText, { color: c.primary }]}>{t.forgotPassword}</Text>
              </TouchableOpacity>
              <Button title={t.login} onPress={handleLogin} loading={loading} style={{ marginTop: spacing.md }} />
            </View>
          </View>
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: c.textSecondary }]}>{t.dontHaveAccount} </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.footerLink, { color: c.primary }]}>{t.createAccount}</Text>
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
  hero: { borderRadius: borderRadius.xxl, overflow: 'hidden', padding: spacing.xl, minHeight: 190, justifyContent: 'flex-end', marginTop: spacing.lg },
  heroGlow: { position: 'absolute', width: 180, height: 180, borderRadius: 90, top: -48, right: -24 },
  heroMark: { position: 'absolute', right: spacing.lg, top: spacing.lg, opacity: 0.14 },
  header: { alignItems: 'flex-start' },
  eyebrow: { fontSize: fontSize.sm, marginTop: spacing.base, fontWeight: fontWeight.semibold },
  formCard: { marginTop: -26, borderRadius: borderRadius.xxl, borderWidth: 1, padding: spacing.lg },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, marginBottom: 6 },
  subtitle: { fontSize: fontSize.base, marginBottom: spacing.lg },
  form: { marginBottom: spacing.sm },
  forgotRow: { alignSelf: 'flex-end', marginBottom: spacing.sm },
  forgotText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  footer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 'auto', paddingVertical: spacing.lg },
  footerText: { fontSize: fontSize.base },
  footerLink: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
});

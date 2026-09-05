import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, StyleSheet, Alert, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
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

  const dismiss = () => {
    // Reset the root navigator to Main — this completely replaces the
    // navigation state, removing the Auth modal entirely without any
    // dismissal animation or visual artifacts.
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'Main',
            ...(redirectTo
              ? {
                  state: {
                    routes: [{ name: redirectTo.tab, params: redirectTo.params }],
                  },
                }
              : {}),
          },
        ],
      })
    );
  };

  const handleBack = () => { dismiss(); };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      toast.success('Welcome back!');
      dismiss();
    } catch (err) {
      const msg = err?.message || 'Login failed';
      Alert.alert('Login failed', msg);
      toast.error(msg);
    } finally {
      setLoading(false);
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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top', 'bottom']}>
      <ScreenHeader title="" onBack={handleBack} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 18 : 0}>
        <ScrollView contentContainerStyle={[styles.scroll, isTablet && styles.scrollTablet]} keyboardShouldPersistTaps="handled">
          <View style={[styles.content, { maxWidth: contentWidth }]}> 
          <View style={[styles.hero, { backgroundColor: c.secondary }]}> 
            <View style={[styles.heroGlow, { backgroundColor: c.primary + '25' }]} />
            <BrandLogo variant="symbol" size={88} style={styles.heroMark} />
            <View style={styles.header}>
              <Text style={[styles.heroTitle, { color: c.heroText }]}>Welcome back</Text>
              <Text style={[styles.eyebrow, { color: c.heroTextMuted }]}>Secure access to your Sawdagar account</Text>
            </View>
          </View>
          <View style={[styles.formCard, { backgroundColor: c.surface, borderColor: c.border }]}> 
            <Text style={[styles.title, { color: c.text }]}>{t.login}</Text>
            <Text style={[styles.subtitle, { color: c.textSecondary }]}>Sign in to continue shopping, track orders, and check out faster.</Text>
            <View style={styles.form}>
              <Input label={t.email} icon="mail-outline" value={email} onChangeText={setEmail} error={errors.email} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" />
              <Input label={t.password} icon="lock-closed-outline" value={password} onChangeText={setPassword} error={errors.password} secureTextEntry placeholder="Enter password" />
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotRow}>
                <Text numberOfLines={1} maxFontSizeMultiplier={1.15} style={[styles.forgotText, { color: c.primary }]}>{t.forgotPassword}</Text>
              </TouchableOpacity>
              <Button title={t.login} onPress={handleLogin} loading={loading} style={{ marginTop: spacing.md }} />
            </View>
          </View>
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: c.textSecondary }]}>{t.dontHaveAccount} </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')} hitSlop={8} style={styles.footerLinkButton}>
              <Text numberOfLines={1} maxFontSizeMultiplier={1.15} style={[styles.footerLink, { color: c.primary }]}>{t.createAccount}</Text>
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
  hero: { borderRadius: borderRadius.xxl, overflow: 'hidden', paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: 42, minHeight: 164, justifyContent: 'center', marginTop: spacing.sm },
  heroGlow: { position: 'absolute', width: 180, height: 180, borderRadius: 90, top: -48, right: -24 },
  heroMark: { position: 'absolute', right: spacing.lg, top: spacing.lg, opacity: 0.16 },
  header: { alignItems: 'flex-start', maxWidth: '75%' },
  heroTitle: { fontSize: fontSize.xxl, fontWeight: fontWeight.heavy },
  eyebrow: { fontSize: fontSize.sm, marginTop: spacing.sm, fontWeight: fontWeight.semibold, lineHeight: 20 },
  formCard: { marginTop: -22, borderRadius: borderRadius.xxl, borderWidth: 1, padding: spacing.lg },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, marginBottom: 6 },
  subtitle: { fontSize: fontSize.base, marginBottom: spacing.lg },
  form: { marginBottom: spacing.sm },
  forgotRow: { minHeight: 44, alignSelf: 'flex-end', justifyContent: 'center', marginTop: -8, marginBottom: spacing.sm, paddingHorizontal: spacing.xs },
  forgotText: { fontSize: fontSize.sm, lineHeight: 18, fontWeight: fontWeight.semibold, includeFontPadding: false, textAlignVertical: 'center' },
  footer: { minHeight: 44, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', marginTop: 'auto', paddingVertical: spacing.lg },
  footerText: { fontSize: fontSize.base },
  footerLinkButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.xs },
  footerLink: { fontSize: fontSize.base, lineHeight: 20, fontWeight: fontWeight.semibold, includeFontPadding: false, textAlignVertical: 'center' },
});

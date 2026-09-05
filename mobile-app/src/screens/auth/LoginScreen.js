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
import Gradient from '../../components/Gradient';
import { spacing, fontSize, fontWeight, borderRadius, shadows } from '../../theme';

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
    if (loading) return;
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
        <ScrollView contentContainerStyle={[styles.scroll, isTablet && styles.scrollTablet]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
          <View style={[styles.content, { maxWidth: contentWidth }]}> 
          <Gradient colors={[c.secondary, c.primaryDark]} style={styles.hero}>
            <View pointerEvents="none" style={[styles.heroGlow, { backgroundColor: c.heroSurface, borderColor: c.heroBorder }]} />
            <View style={[styles.heroMark, { backgroundColor: c.heroSurface, borderColor: c.heroBorder }]}>
              <BrandLogo variant="symbol" size={38} style={{ tintColor: c.heroText }} />
            </View>
            <View style={styles.header}>
              <Text style={[styles.eyebrow, { color: c.heroTextMuted }]}>SAWDAGAR</Text>
              <Text accessibilityRole="header" style={[styles.heroTitle, { color: c.heroText }]}>{t.welcomeBack}</Text>
            </View>
          </Gradient>
          <View style={[styles.formCard, { backgroundColor: c.surface, borderColor: c.border }]}> 
            <Text style={[styles.title, { color: c.text }]}>{t.login}</Text>
            <Text style={[styles.subtitle, { color: c.textSecondary }]}>Sign in to continue shopping, track orders, and check out faster.</Text>
            <View style={styles.form}>
              <Input label={t.email} icon="mail-outline" value={email} onChangeText={setEmail} error={errors.email} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="username" placeholder="you@example.com" />
              <Input label={t.password} icon="lock-closed-outline" value={password} onChangeText={setPassword} error={errors.password} secureTextEntry autoComplete="current-password" textContentType="password" returnKeyType="go" onSubmitEditing={handleLogin} placeholder="Enter password" />
              <TouchableOpacity accessibilityRole="button" onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotRow}>
                <Text numberOfLines={1} maxFontSizeMultiplier={1.15} style={[styles.forgotText, { color: c.primary }]}>{t.forgotPassword}</Text>
              </TouchableOpacity>
              <Button title={t.login} onPress={handleLogin} loading={loading} style={{ marginTop: spacing.md }} />
            </View>
          </View>
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: c.textSecondary }]}>{t.dontHaveAccount} </Text>
            <TouchableOpacity accessibilityRole="button" onPress={() => navigation.navigate('Register')} hitSlop={8} style={styles.footerLinkButton}>
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
  scroll: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  scrollTablet: { justifyContent: 'center' },
  content: { width: '100%', alignSelf: 'center' },
  hero: { borderRadius: borderRadius.xxl, padding: spacing.xl, minHeight: 208, justifyContent: 'space-between' },
  heroGlow: { position: 'absolute', width: 240, height: 240, borderRadius: 120, borderWidth: 1, top: -72, right: -88 },
  heroMark: { width: 56, height: 56, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: spacing.lg },
  header: { alignItems: 'flex-start' },
  heroTitle: { fontSize: fontSize.xxl, fontWeight: fontWeight.heavy, marginTop: spacing.sm },
  eyebrow: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, lineHeight: 18, letterSpacing: 2 },
  formCard: { marginTop: spacing.base, borderRadius: borderRadius.xxl, borderWidth: 1, padding: spacing.lg, ...shadows.sm },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginBottom: 6 },
  subtitle: { fontSize: fontSize.sm, lineHeight: 21, marginBottom: spacing.lg },
  form: { marginBottom: spacing.sm },
  forgotRow: { minHeight: 44, alignSelf: 'flex-end', justifyContent: 'center', marginTop: -8, marginBottom: spacing.sm, paddingHorizontal: spacing.xs },
  forgotText: { fontSize: fontSize.sm, lineHeight: 18, fontWeight: fontWeight.semibold, includeFontPadding: false, textAlignVertical: 'center' },
  footer: { minHeight: 44, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', marginTop: 'auto', paddingVertical: spacing.lg },
  footerText: { fontSize: fontSize.base },
  footerLinkButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.xs },
  footerLink: { fontSize: fontSize.base, lineHeight: 20, fontWeight: fontWeight.semibold, includeFontPadding: false, textAlignVertical: 'center' },
});

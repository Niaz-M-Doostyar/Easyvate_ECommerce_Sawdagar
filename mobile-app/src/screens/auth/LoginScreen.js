import { nationalPhone, internationalPhone } from '../../services/afghanPhone.cjs';
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
import ScreenHeader from '../../components/ScreenHeader';
import { spacing, fontSize, fontWeight } from '../../theme';

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
  const [useEmail, setUseEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleIdentifierChange = (value) => {
    setEmail(useEmail ? value : internationalPhone(value));
    setErrors(current => ({ ...current, email: undefined }));
  };

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
    if (!email.trim()) e.email = useEmail ? 'Email is required' : 'Phone number is required';
    else if (!useEmail) {
      const digits = nationalPhone(email);
      if (!digits.startsWith('7')) e.email = 'After +93, the mobile number must start with 7';
      else if (digits.length !== 9) e.email = `Enter 9 digits after +93 (${digits.length} entered)`;
    }
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
          <View style={styles.formSection}>
            <Text style={[styles.title, { color: c.text }]}>{t.login}</Text>
            <Text style={[styles.subtitle, { color: c.textSecondary }]}>Sign in to continue shopping, track orders, and check out faster.</Text>
            <View style={styles.form}>
              <Input label={useEmail ? 'Email' : 'Phone number'} icon={useEmail ? 'mail-outline' : 'call-outline'} prefix={useEmail ? undefined : '🇦🇫 +93'} value={useEmail ? email : nationalPhone(email)} onChangeText={handleIdentifierChange} error={errors.email} keyboardType={useEmail ? 'email-address' : 'phone-pad'} autoCapitalize="none" autoCorrect={false} autoComplete={useEmail ? 'username' : 'tel'} textContentType={useEmail ? 'username' : 'telephoneNumber'} placeholder={useEmail ? 'you@example.com' : '7XX XXX XXX'} hint={useEmail ? undefined : 'Enter 9 digits after +93 (for example, 7XX XXX XXX).'} editable={!loading} />
              <TouchableOpacity onPress={() => { setUseEmail(!useEmail); setEmail(''); setErrors({}); }} disabled={loading} accessibilityRole="button" style={{paddingVertical:10,marginBottom:12}}><Text style={{color:c.primary,fontWeight:'600'}}>{useEmail ? 'Use phone number instead' : 'Use email instead'}</Text></TouchableOpacity>
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
  formSection: { paddingVertical: spacing.sm },
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

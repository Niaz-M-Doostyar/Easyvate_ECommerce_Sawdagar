import useAutoOtpVerification from '../../hooks/useAutoOtpVerification';
import useOtpCountdown from '../../hooks/useOtpCountdown';
import { nationalPhone, internationalPhone } from '../../services/afghanPhone.cjs';
import { OtpMethodPicker, OtpVerification } from '../../components/OtpControls';
import { authApi } from '../../services/api';
import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, StyleSheet, Alert, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ScreenHeader from '../../components/ScreenHeader';
import ProvincePicker from '../../components/ProvincePicker';
import PressableScale from '../../components/PressableScale';
import { spacing, fontSize, fontWeight, borderRadius } from '../../theme';

export default function RegisterScreen({ navigation }) {
  const lastNameInput = useRef(null);
  const phoneInput = useRef(null);
  const confirmInput = useRef(null);
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const toast = useToast();
  const c = theme.colors;
  const isTablet = width >= 768;
  const contentWidth = Math.min(width - spacing.lg * 2, 620);
  const [form, setForm] = useState({ lastName: '', name: '', email: '', phone: '', password: '', confirmPassword: '', role: 'customer', companyName: '', province: '', district: '', village: '', landmark: '' });
  const [loading, setLoading] = useState(false);
  const [challengeId, setChallengeId] = useState('');
  const [code, setCode] = useState('');
  const [channel, setChannel] = useState('sms');
  const [sentChannel, setSentChannel] = useState('sms');
  const [expiresAt, setExpiresAt] = useState(0);
  const [retryAt, setRetryAt] = useState(0);
  const retrySeconds = useOtpCountdown(retryAt);
  const [errors, setErrors] = useState({});
  const [verificationError, setVerificationError] = useState('');

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const goToLogin = () => { navigation.goBack(); };
  const handleBack = () => { navigation.goBack(); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (form.role === 'customer' && !form.lastName.trim()) e.lastName = 'Last name is required';
    if (form.role === 'supplier' && form.email.trim() && !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!/^7\d{8}$/.test(nationalPhone(form.phone))) e.phone = 'Enter a valid Afghan mobile number: 7 followed by 8 digits';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'At least 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (form.role === 'supplier' && !(form.companyName || '').trim()) e.companyName = 'Company name is required';
    if (form.role === 'supplier' && !form.province) e.province = 'Province is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const requestCode = async () => {
    if (Date.now() < retryAt) throw new Error(`Try again in ${Math.ceil((retryAt - Date.now()) / 1000)} seconds.`);
    try {
      const data = await authApi.requestCustomerOtp({ role: form.role, firstName: form.name.trim(), lastName: form.lastName.trim(), fullName: form.name.trim(), email: form.role === 'supplier' ? form.email.trim().toLowerCase() : '', companyName: form.companyName.trim(), province: form.province, district: form.district, village: form.village, landmark: form.landmark, phone: form.phone, password: form.password, confirmPassword: form.confirmPassword, channel });
      setChallengeId(data.challengeId); setCode(''); setSentChannel(data.channel || channel); setExpiresAt(Date.now() + (data.expiresIn || 300) * 1000); setRetryAt(Date.now() + data.retryAfter * 1000); toast.success(data.message);
    } catch (error) {
      const retryAfter = Number(error.data?.retryAfter);
      if (Number.isFinite(retryAfter) && retryAfter > 0) setRetryAt(Date.now() + retryAfter * 1000);
      throw error;
    }
  };
  const resendCode = async () => {
    if (loading) return;
    setLoading(true);
    setVerificationError('');
    try { await requestCode(); } catch (err) { setVerificationError(err.message); toast.error(err.message); }
    finally { setLoading(false); }
  };
  const handleRegister = async () => {
    if (loading) return;
    if (!validate()) return;
    setLoading(true);
    setVerificationError('');
    try {
      if (!challengeId) await requestCode();
      else {
        const data = await authApi.verifyCustomerOtp({ challengeId, code });
        Alert.alert('Account created', data.message, [{ text: 'Sign in', onPress: goToLogin }]);
      }
    } catch (err) {
      const msg = err?.message || 'Registration failed';
      setVerificationError(msg);
      if (!challengeId) Alert.alert('Registration failed', msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useAutoOtpVerification({ challengeId, code, loading, onVerify: handleRegister });

  const roles = [
    { key: 'customer', label: t.customer, icon: 'person-outline' },
    { key: 'supplier', label: t.supplier, icon: 'storefront-outline' },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={''} onBack={handleBack} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 18 : 0}>
        <ScrollView contentContainerStyle={[styles.scroll, isTablet && styles.scrollTablet]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
          <View style={[styles.content, { maxWidth: contentWidth }]}>
          <View style={[styles.formSection, { backgroundColor: c.card, borderColor: c.borderLight }]}>
            <Text style={[styles.step, {color:c.primary}]}>{challengeId ? 'STEP 2 OF 2 · VERIFICATION' : 'STEP 1 OF 2 · YOUR DETAILS'}</Text>
            <Text style={[styles.heading, {color:c.text}]}>{challengeId ? 'Verify your phone' : 'Create your account'}</Text>
            <Text style={[styles.subtitle, {color:c.textSecondary}]}>{challengeId ? 'Enter the six-digit code to finish signing up.' : 'Shop, track orders and check out faster with Sawdagar.'}</Text>
            {!challengeId && <>
            <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>{t.role}</Text>
            <View style={styles.roleRow}>
              {roles.map(r => (
                <PressableScale key={r.key} disabled={loading} onPress={() => { set('role', r.key); setChallengeId(''); setCode(''); }} accessibilityRole="radio" accessibilityState={{ checked: form.role === r.key }} accessibilityLabel={r.label}
                  style={[styles.roleBtn, { borderColor: form.role === r.key ? c.primary : c.border, backgroundColor: form.role === r.key ? c.brandSurface : c.surfaceElevated }]}>
                  <View style={styles.roleIconRow}>
                    <Ionicons name={r.icon} size={23} color={form.role === r.key ? c.primary : c.textSecondary} />
                    <Ionicons name={form.role === r.key ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={form.role === r.key ? c.primary : c.textMuted} />
                  </View>
                  <Text style={[styles.roleLabel, { color: form.role === r.key ? c.primary : c.textSecondary }]}>{r.label}</Text>
                </PressableScale>
              ))}
            </View>
            <Input editable={!challengeId && !loading} returnKeyType="next" onSubmitEditing={() => form.role === 'customer' && lastNameInput.current?.focus()} label={form.role === 'customer' ? 'First name' : t.fullName} icon="person-outline" value={form.name} onChangeText={v => set('name', v)} error={errors.name} autoComplete={form.role === 'customer' ? "given-name" : "name"} textContentType={form.role === 'customer' ? "givenName" : "name"} autoCapitalize="words" autoCorrect={false} placeholder={form.role === 'customer' ? 'First name' : 'Full name'} />
            {form.role === 'customer' && <Input editable={!challengeId && !loading} ref={lastNameInput} returnKeyType="next" onSubmitEditing={() => phoneInput.current?.focus()} label="Last name" icon="person-outline" textContentType="familyName" autoCapitalize="words" autoCorrect={false} value={form.lastName} onChangeText={v => set('lastName', v)} error={errors.lastName} autoComplete="family-name" placeholder="Last name" maxLength={80} />}
            {form.role === 'supplier' && <Input label={`${t.email} (${t.optional})`} icon="mail-outline" value={form.email} onChangeText={v => set('email', v)} error={errors.email} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" placeholder="you@example.com" />}
            <Input editable={!challengeId && !loading} ref={phoneInput} label="Phone number" icon="call-outline" prefix="🇦🇫 +93" hint="Enter 9 digits starting with 7. You can also paste 07… or +93…" value={nationalPhone(form.phone)} onChangeText={v => set('phone', internationalPhone(v))} error={errors.phone} keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" placeholder="7XX XXX XXX" maxLength={16} autoCorrect={false} />
            {form.role === 'supplier' && (
              <>
                <Input label={t.companyName} icon="business-outline" value={form.companyName || ''} onChangeText={v => set('companyName', v)} error={errors.companyName} placeholder="Required for suppliers" />
                <ProvincePicker value={form.province} onChange={v => set('province', v)} error={errors.province} />
                <Input label={t.district} icon="location-outline" value={form.district || ''} onChangeText={v => set('district', v)} placeholder={t.district} />
                <Input label={t.village} icon="home-outline" value={form.village || ''} onChangeText={v => set('village', v)} placeholder={t.village} />
                <Input label={t.landmark} icon="navigate-outline" value={form.landmark || ''} onChangeText={v => set('landmark', v)} placeholder={t.landmark} />
              </>
            )}
            <Input editable={!challengeId && !loading} maxLength={72} returnKeyType="next" onSubmitEditing={() => confirmInput.current?.focus()} autoCapitalize="none" autoCorrect={false} label={t.password} icon="lock-closed-outline" value={form.password} onChangeText={v => set('password', v)} error={errors.password} secureTextEntry autoComplete="new-password" textContentType="newPassword" placeholder="Min 6 characters" />
            <Input editable={!challengeId && !loading} ref={confirmInput} maxLength={72} autoCapitalize="none" autoCorrect={false} label={t.confirmPassword} icon="lock-closed-outline" value={form.confirmPassword} onChangeText={v => set('confirmPassword', v)} error={errors.confirmPassword} secureTextEntry autoComplete="new-password" textContentType="newPassword" returnKeyType="done" onSubmitEditing={handleRegister} placeholder="Repeat password" />
            </>}
              {challengeId && <OtpVerification code={code} onChange={value => { setCode(value); setVerificationError(''); }} phone={form.phone} sentChannel={sentChannel} channel={channel} retryAt={retryAt} expiresAt={expiresAt} onResend={resendCode} onEdit={() => { setChallengeId(''); setCode(''); setVerificationError(''); }} loading={loading} error={verificationError} />}
              <OtpMethodPicker value={channel} onChange={setChannel} disabled={loading} verifying={!!challengeId} />
            {!challengeId && verificationError ? <Text accessibilityRole="alert" style={[styles.error, { color: c.error }]}>{verificationError}</Text> : null}
            {challengeId ? <View accessibilityLiveRegion="polite" style={{marginTop:16}}>
              <Text style={{color:c.textSecondary,textAlign:'center'}}>{loading ? 'Checking your code…' : verificationError ? 'Edit the code to try again.' : 'Your code will be checked automatically.'}</Text>
            </View> : <Button title={retrySeconds > 0 ? `Try again in ${retrySeconds}s` : 'Send verification code'} onPress={handleRegister} loading={loading} disabled={retrySeconds > 0} style={{ marginTop: spacing.base }} /> }

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
  error: { fontSize: 14, lineHeight: 22, marginTop: 12 },
  step: {fontSize: 12,fontWeight:'700',letterSpacing:1.1,marginBottom:10},
  heading:{fontSize:28,fontWeight:'700',letterSpacing:-0.6,marginBottom:8},
  subtitle:{fontSize:14,lineHeight:22,marginBottom:24},
  safe: { flex: 1, width: '100%', maxWidth: 1200, alignSelf: 'center' },
  scroll: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  scrollTablet: { justifyContent: 'center' },
  content: { width: '100%', alignSelf: 'center' },
  sectionLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, marginBottom: spacing.md },
  formSection: { borderWidth: 1, borderRadius: 24, padding: 20 },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: spacing.lg },
  roleBtn: { flex: 1, minHeight: 64, padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, justifyContent: 'space-between', gap: spacing.md },
  roleIconRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roleLabel: { fontSize: fontSize.sm, lineHeight: 20, fontWeight: fontWeight.semibold, includeFontPadding: false },
  footer: { gap: 4, minHeight: 44, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', paddingVertical: spacing.lg },
  footerText: { fontSize: fontSize.base },
  footerLinkButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.xs },
  footerLink: { fontSize: fontSize.base, lineHeight: 24, fontWeight: fontWeight.semibold, includeFontPadding: false, textAlignVertical: 'center' },
});

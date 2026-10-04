import useAutoOtpVerification from '../../hooks/useAutoOtpVerification';
import { OtpMethodPicker, OtpVerification } from '../../components/OtpControls';
import { nationalPhone, internationalPhone } from '../../services/afghanPhone.cjs';
import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { authApi } from '../../services/api';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ScreenHeader from '../../components/ScreenHeader';
import { spacing, fontSize, fontWeight } from '../../theme';

export default function ForgotPasswordScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const toast = useToast();
  const c = theme.colors;
  const isTablet = width >= 768;
  const contentWidth = Math.min(width - spacing.lg * 2, 560);
  const [useEmail, setUseEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [identifierError, setIdentifierError] = useState('');
  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState('sms');
  const [challengeId, setChallengeId] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sentChannel, setSentChannel] = useState('sms');
  const [expiresAt, setExpiresAt] = useState(0);
  const [retryAt, setRetryAt] = useState(0);
  const isPhone = !useEmail;
  const [verificationError, setVerificationError] = useState('');
  const [sent, setSent] = useState(false);

  const handleIdentifierChange = (value) => {
    setEmail(useEmail ? value : internationalPhone(value));
    setIdentifierError('');
  };

  const requestCode = async () => {
    if (Date.now() < retryAt) throw new Error('Please wait 60 seconds before resending.');
    const data = await authApi.requestCustomerOtp({ phone: email, channel, purpose: 'password-reset' });
    setChallengeId(data.challengeId); setCode(''); setSentChannel(channel); setExpiresAt(Date.now() + (data.expiresIn || 300) * 1000); setRetryAt(Date.now() + 60000); toast.success(data.message);
  };
  const resend = async () => {
    if (loading) return;
    setLoading(true);
    try { await requestCode(); } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };
  const handleSend = async () => {
    if (loading) return;
    if (!email.trim()) { setIdentifierError(useEmail ? 'Email is required' : 'Phone number is required'); return; }
    if (isPhone) {
      const digits = nationalPhone(email);
      if (!digits.startsWith('7')) { setIdentifierError('After +93, the mobile number must start with 7'); return; }
      if (digits.length !== 9) { setIdentifierError(`Enter 9 digits after +93 (${digits.length} entered)`); return; }
    }
    setLoading(true); setVerificationError('');
    try {
      if (isPhone) {
        if (!challengeId) { await requestCode(); return; }
        const data = await authApi.resetPhonePassword({ challengeId, code, password, confirmPassword });
        toast.success(data.message);
      } else await authApi.forgotPassword({ email: email.trim().toLowerCase() });
      setSent(true);
      if (!isPhone) toast.success('If this email is registered, a reset link has been sent.');
    } catch (err) { setVerificationError(err.message || 'Failed'); toast.error(err.message || 'Failed'); }
    finally { setLoading(false); }
  };

  useAutoOtpVerification({ challengeId, code, loading, ready: !sent && password.length >= 6 && password.length <= 72 && password === confirmPassword, onVerify: handleSend });

  if (sent) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top', 'bottom', 'left', 'right']}>
        <View style={[styles.center, { maxWidth: contentWidth }]}>
          <Ionicons name="mail-open-outline" size={64} color={c.primary} />
          <Text style={[styles.sentTitle, { color: c.text }]}>{isPhone ? 'Password updated' : 'Check your email'}</Text>
          <Text style={[styles.sentSub, { color: c.textSecondary }]}>{isPhone ? 'Sign in with your phone number and new password.' : 'If this email is registered, a reset link has been sent.'}</Text>
          <Button title="Back to Login" onPress={() => navigation.navigate('Login')} variant="outline" style={{ marginTop: spacing.xl }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title="" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 18 : 0}>
        <ScrollView contentContainerStyle={[styles.scroll, isTablet && styles.scrollTablet]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
          <View style={[styles.content, { maxWidth: contentWidth, backgroundColor: c.card, borderColor: c.borderLight }]}>
          <Ionicons name="key-outline" size={48} color={c.primary} style={{ marginBottom: spacing.base }} />
          <Text style={[styles.title, { color: c.text }]}>{t.forgotPassword}</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>Use your Afghan phone for OTP recovery, or email for a reset link.</Text>
          {!challengeId && <>
            <Input editable={!loading} label={useEmail ? 'Email' : 'Phone number'} icon={useEmail ? 'mail-outline' : 'call-outline'} prefix={useEmail ? undefined : '🇦🇫 +93'} value={useEmail ? email : nationalPhone(email)} onChangeText={handleIdentifierChange} error={identifierError} keyboardType={useEmail ? 'email-address' : 'phone-pad'} autoCapitalize="none" autoCorrect={false} autoComplete={useEmail ? 'username' : 'tel'} textContentType={useEmail ? 'username' : 'telephoneNumber'} placeholder={useEmail ? 'you@example.com' : '7XX XXX XXX'} hint={useEmail ? undefined : 'Enter 9 digits after +93 (for example, 7XX XXX XXX).'} />
            <TouchableOpacity onPress={() => { setUseEmail(!useEmail); setEmail(''); setIdentifierError(''); }} disabled={loading} accessibilityRole="button" style={{ paddingVertical: 10, marginBottom: 12 }}><Text style={{ color: c.primary, fontWeight: '600' }}>{useEmail ? 'Use phone number instead' : 'Use email instead'}</Text></TouchableOpacity>
          </>}
          {challengeId && <>
            <Input label="New password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" maxLength={72} />
            <Input label="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoComplete="new-password" />
            <OtpVerification code={code} onChange={setCode} phone={email} sentChannel={sentChannel} channel={channel} retryAt={retryAt} expiresAt={expiresAt} onResend={resend} onEdit={() => { setChallengeId(''); setCode(''); }} loading={loading} />
          </>}
          {isPhone && <OtpMethodPicker value={channel} onChange={setChannel} disabled={loading} verifying={!!challengeId} />}
          {challengeId ? <View accessibilityLiveRegion="polite" style={{marginTop:16}}>{verificationError ? <Text accessibilityRole="alert" style={{color:c.error}}>{verificationError}</Text> : null}<Text style={{color:c.textSecondary}}>{loading ? 'Checking your code…' : password !== confirmPassword || password.length < 6 ? 'Choose and confirm your new password, then enter the code.' : 'Your code will be checked automatically. Edit it to retry.'}</Text></View> : <Button title={isPhone ? (challengeId ? 'Verify & reset password' : 'Send verification code') : t.sendResetLink} onPress={handleSend} loading={loading} disabled={!!challengeId && code.length !== 6} style={{ marginTop: spacing.md }} />}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, width: '100%', maxWidth: 1200, alignSelf: 'center' },
  scroll: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  scrollTablet: { justifyContent: 'center' },
  content: { width: '100%', alignSelf: 'center', padding: 20, borderWidth: 1, borderRadius: 24 },
  title: { fontSize: fontSize.xxl, lineHeight: 36, fontWeight: fontWeight.bold, letterSpacing: -0.7, marginBottom: 8 },
  subtitle: { fontSize: fontSize.sm, marginBottom: spacing.lg, lineHeight: 21 },
  center: { flex: 1, width: '100%', alignSelf: 'center', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  sentTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginTop: spacing.lg },
  sentSub: { fontSize: fontSize.base, textAlign: 'center', marginTop: 8, lineHeight: 22 },
});

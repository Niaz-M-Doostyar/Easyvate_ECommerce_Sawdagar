import useAutoOtpVerification from '../../hooks/useAutoOtpVerification';
import useOtpCountdown from '../../hooks/useOtpCountdown';
import { OtpMethodPicker, OtpVerification } from '../../components/OtpControls';
import { nationalPhone, internationalPhone } from '../../services/afghanPhone.cjs';
import React, { useEffect, useRef, useState } from 'react';
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

const recoveryCopy = {
  en: { intro: 'Verify your phone first, then choose a new password. You can also request an email reset link.', phone: 'Phone number', phoneHint: 'Enter 9 digits after +93 (for example, 7XX XXX XXX).', phoneRequired: 'Phone number is required', emailRequired: 'Email is required', phoneStart: 'After +93, the mobile number must start with 7', phoneLength: 'Enter 9 digits after +93', usePhone: 'Use phone number instead', useEmail: 'Use email instead', sendCode: 'Send verification code', verifyCode: 'Verify code', auto: 'Your six-digit code is checked automatically. You can also tap Verify code.', checking: 'Checking your code…', expired: 'This code has expired. Request a new one.', retry: 'Please wait 60 seconds before resending.', failed: 'Could not verify your code', emailSent: 'If this email is registered, a reset link has been sent.', checkEmail: 'Check your email', backLogin: 'Back to Login' },
  ps: { intro: 'لومړی خپل تلیفون تایید کړئ، بیا نوی پاسورډ وټاکئ. د بریښنالیک لینک هم غوښتلای شئ.', phone: 'د تلیفون شمېره', phoneHint: 'له +93 وروسته ۹ شمېرې ولیکئ، لکه 7XX XXX XXX.', phoneRequired: 'د تلیفون شمېره اړینه ده', emailRequired: 'بریښنالیک اړین دی', phoneStart: 'له +93 وروسته شمېره باید په ۷ پیل شي', phoneLength: 'له +93 وروسته ۹ شمېرې ولیکئ', usePhone: 'د تلیفون شمېره وکاروئ', useEmail: 'بریښنالیک وکاروئ', sendCode: 'د تایید کوډ واستوئ', verifyCode: 'کوډ تایید کړئ', auto: 'ستاسو شپږ شمېره کوډ په اتومات ډول تاییدېږي. د تایید تڼۍ هم وهلی شئ.', checking: 'کوډ تاییدېږي…', expired: 'د کوډ وخت پای ته رسېدلی. نوی کوډ وغواړئ.', retry: 'د بیا لېږلو لپاره ۶۰ ثانیې انتظار وکړئ.', failed: 'کوډ تایید نه شو', emailSent: 'که دا بریښنالیک ثبت وي، د پاسورډ لینک ورلېږل شوی.', checkEmail: 'خپل بریښنالیک وګورئ', backLogin: 'ننوتلو ته بېرته' },
  dr: { intro: 'ابتدا تلفن خود را تایید کنید، سپس رمز جدید انتخاب کنید. لینک ایمیل نیز در دسترس است.', phone: 'شماره تلفن', phoneHint: 'پس از +93 نه رقم وارد کنید، مانند 7XX XXX XXX.', phoneRequired: 'شماره تلفن ضروری است', emailRequired: 'ایمیل ضروری است', phoneStart: 'پس از +93 شماره باید با ۷ شروع شود', phoneLength: 'پس از +93 نه رقم وارد کنید', usePhone: 'استفاده از شماره تلفن', useEmail: 'استفاده از ایمیل', sendCode: 'ارسال کد تایید', verifyCode: 'تایید کد', auto: 'کد شش‌رقمی شما خودکار بررسی می‌شود. می‌توانید دکمه تایید را نیز بزنید.', checking: 'در حال بررسی کد…', expired: 'کد منقضی شده است. کد جدید درخواست کنید.', retry: 'برای ارسال دوباره ۶۰ ثانیه صبر کنید.', failed: 'کد تایید نشد', emailSent: 'اگر این ایمیل ثبت باشد، لینک بازیابی ارسال شده است.', checkEmail: 'ایمیل خود را بررسی کنید', backLogin: 'بازگشت به ورود' },
};

export default function ForgotPasswordScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const { t, lang, isRTL } = useLanguage();
  const toast = useToast();
  const c = theme.colors;
  const copy = recoveryCopy[lang] || recoveryCopy.en;
  const alignment = { textAlign: isRTL ? 'right' : 'left' };
  const isTablet = width >= 768;
  const contentWidth = Math.min(width - spacing.lg * 2, 560);
  const [useEmail, setUseEmail] = useState(false);
  const [identifier, setIdentifier] = useState(() => internationalPhone(route?.params?.phone));
  const [identifierError, setIdentifierError] = useState('');
  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState('sms');
  const [challengeId, setChallengeId] = useState('');
  const [challengePhone, setChallengePhone] = useState('');
  const [code, setCode] = useState('');
  const [sentChannel, setSentChannel] = useState('sms');
  const [expiresAt, setExpiresAt] = useState(0);
  const [retryAt, setRetryAt] = useState(0);
  const retrySeconds = useOtpCountdown(retryAt);
  const [verificationError, setVerificationError] = useState('');
  const [sent, setSent] = useState(false);
  const busy = useRef(false);
  const mounted = useRef(true);
  const isPhone = !useEmail;
  const retryMessage = seconds => lang === 'ps' ? `په ${seconds} ثانیو کې بیا هڅه وکړئ` : lang === 'dr' ? `پس از ${seconds} ثانیه دوباره تلاش کنید` : `Try again in ${seconds}s`;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const handleIdentifierChange = value => {
    setIdentifier(useEmail ? value : internationalPhone(value));
    setIdentifierError('');
  };
  const requestCode = async () => {
    if (Date.now() < retryAt) throw new Error(retryMessage(Math.ceil((retryAt - Date.now()) / 1000)));
    const phone = challengePhone || internationalPhone(identifier);
    try {
      const data = await authApi.requestCustomerOtp({ phone, channel, purpose: 'password-reset' });
      if (!mounted.current) return;
      setChallengeId(data.challengeId);
      setChallengePhone(phone);
      setCode('');
      setVerificationError('');
      setSentChannel(channel);
      setExpiresAt(Date.now() + (data.expiresIn || 300) * 1000);
      setRetryAt(Date.now() + data.retryAfter * 1000);
      toast.success(data.message);
    } catch (error) {
      const retryAfter = Number(error.data?.retryAfter);
      if (mounted.current && Number.isFinite(retryAfter) && retryAfter > 0) setRetryAt(Date.now() + retryAfter * 1000);
      throw error;
    }
  };
  const resend = async () => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setVerificationError('');
    try { await requestCode(); }
    catch (error) { if (mounted.current) { setVerificationError(error.message || copy.failed); toast.error(error.message || copy.failed); } }
    finally { busy.current = false; if (mounted.current) setLoading(false); }
  };
  const handleSend = async () => {
    if (busy.current) return;
    if (!identifier.trim()) { setIdentifierError(useEmail ? copy.emailRequired : copy.phoneRequired); return; }
    if (isPhone) {
      const digits = nationalPhone(identifier);
      if (!digits.startsWith('7')) { setIdentifierError(copy.phoneStart); return; }
      if (digits.length !== 9) { setIdentifierError(copy.phoneLength); return; }
    }
    busy.current = true;
    setLoading(true);
    setVerificationError('');
    try {
      if (isPhone) await requestCode();
      else {
        await authApi.forgotPassword({ email: identifier.trim().toLowerCase() });
        if (mounted.current) { setSent(true); toast.success(copy.emailSent); }
      }
    } catch (error) {
      if (mounted.current) { setVerificationError(error.message || copy.failed); toast.error(error.message || copy.failed); }
    } finally { busy.current = false; if (mounted.current) setLoading(false); }
  };
  const verifyCode = async () => {
    if (busy.current || !challengeId || !/^\d{6}$/.test(code)) return;
    if (Date.now() >= expiresAt) { setVerificationError(copy.expired); return; }
    busy.current = true;
    setLoading(true);
    setVerificationError('');
    try {
      const data = await authApi.verifyPhoneResetOtp({ challengeId, code });
      if (!mounted.current) return;
      const validity = Number(data.expiresIn);
      if (!data.challengeId || !data.resetToken || !Number.isFinite(validity) || validity <= 0) throw new Error(copy.failed);
      navigation.replace('NewPassword', { challengeId: data.challengeId, resetToken: data.resetToken, expiresAt: Date.now() + validity * 1000, phone: challengePhone });
    } catch (error) {
      if (mounted.current) { setVerificationError(error.message || copy.failed); toast.error(error.message || copy.failed); }
    } finally { busy.current = false; if (mounted.current) setLoading(false); }
  };
  useAutoOtpVerification({ challengeId, code, loading, ready: isPhone && !sent, onVerify: verifyCode });

  const editPhone = () => {
    setChallengeId('');
    setChallengePhone('');
    setCode('');
    setExpiresAt(0);
    setVerificationError('');
  };

  if (sent) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top', 'bottom', 'left', 'right']}>
        <View style={[styles.center, { maxWidth: contentWidth }]}>
          <Ionicons name="mail-open-outline" size={48} color={c.primary} />
          <Text style={[styles.sentTitle, { color: c.text }]}>{copy.checkEmail}</Text>
          <Text style={[styles.sentSub, { color: c.textSecondary }]}>{copy.emailSent}</Text>
          <Button title={copy.backLogin} onPress={() => navigation.navigate('Login')} variant="outline" style={{ marginTop: spacing.xl }} />
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
            <Text maxFontSizeMultiplier={2} style={[styles.title, alignment, { color: c.text }]}>{t.forgotPassword}</Text>
            <Text maxFontSizeMultiplier={2} style={[styles.subtitle, alignment, { color: c.textSecondary }]}>{copy.intro}</Text>
            {!challengeId ? <>
              <Input editable={!loading} label={useEmail ? t.email : copy.phone} icon={useEmail ? 'mail-outline' : 'call-outline'} prefix={useEmail ? undefined : '🇦🇫 +93'} value={useEmail ? identifier : nationalPhone(identifier)} onChangeText={handleIdentifierChange} error={identifierError} keyboardType={useEmail ? 'email-address' : 'phone-pad'} autoCapitalize="none" autoCorrect={false} autoComplete={useEmail ? 'username' : 'tel'} textContentType={useEmail ? 'username' : 'telephoneNumber'} placeholder={useEmail ? 'you@example.com' : '7XX XXX XXX'} hint={useEmail ? undefined : copy.phoneHint} />
              <TouchableOpacity onPress={() => { setUseEmail(!useEmail); setIdentifier(''); setIdentifierError(''); setVerificationError(''); }} disabled={loading} accessibilityRole="button" style={styles.methodLink}>
                <Text style={[styles.methodLinkText, alignment, { color: c.primary }]}>{useEmail ? copy.usePhone : copy.useEmail}</Text>
              </TouchableOpacity>
            </> : <OtpVerification error={verificationError} code={code} onChange={value => { setCode(value); setVerificationError(''); }} phone={challengePhone} sentChannel={sentChannel} channel={channel} retryAt={retryAt} expiresAt={expiresAt} onResend={resend} onEdit={editPhone} loading={loading} />}
            {!challengeId && verificationError ? <Text accessibilityRole="alert" style={[styles.error, alignment, { color: c.error }]}>{verificationError}</Text> : null}
            {isPhone ? <OtpMethodPicker value={channel} onChange={setChannel} disabled={loading} verifying={!!challengeId} /> : null}
            {challengeId ? <>
              <Text accessibilityLiveRegion="polite" style={[styles.status, alignment, { color: c.textSecondary }]}>{loading ? copy.checking : copy.auto}</Text>
              <Button title={copy.verifyCode} onPress={verifyCode} loading={loading} disabled={code.length !== 6} style={{ marginTop: spacing.md }} />
            </> : <Button title={isPhone ? (retrySeconds > 0 ? retryMessage(retrySeconds) : copy.sendCode) : t.sendResetLink} onPress={handleSend} loading={loading} disabled={isPhone && retrySeconds > 0} style={{ marginTop: spacing.md }} />}
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
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, letterSpacing: -0.7, marginBottom: 8 },
  subtitle: { fontSize: fontSize.sm, marginBottom: spacing.lg },
  methodLink: { minHeight: 44, justifyContent: 'center', paddingVertical: 10, marginBottom: 12 },
  methodLinkText: { fontSize: 14, lineHeight: 21, fontWeight: fontWeight.semibold },
  error: { fontSize: 14, lineHeight: 22, marginTop: 12 },
  status: { fontSize: 14, lineHeight: 22, marginTop: 16 },
  center: { flex: 1, width: '100%', alignSelf: 'center', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  sentTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginTop: spacing.lg, textAlign: 'center' },
  sentSub: { fontSize: fontSize.base, textAlign: 'center', marginTop: 8, lineHeight: 22 },
});

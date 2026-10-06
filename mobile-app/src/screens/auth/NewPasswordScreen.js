import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import useOtpCountdown from '../../hooks/useOtpCountdown';
import { authApi } from '../../services/api';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ScreenHeader from '../../components/ScreenHeader';
import { spacing, fontSize, fontWeight } from '../../theme';

const passwordCopy = {
  en: { intro: 'Your phone is verified. Choose a new password to sign in.', passwordHint: 'Use 6–72 characters.', passwordRequired: 'New password is required', passwordLength: 'Use 6–72 characters for your password', confirmRequired: 'Confirm your new password', mismatch: 'Passwords do not match', save: 'Save new password', expiredTitle: 'Request a new verification code', expired: 'Verification has expired or is no longer valid. Verify your phone again to set a new password.', requestCode: 'Request new code', success: 'Password updated. Sign in with your new password.', failed: 'Could not update your password' },
  ps: { intro: 'ستاسو تلیفون تایید شو. د ننوتلو لپاره نوی پاسورډ وټاکئ.', passwordHint: 'له ۶ تر ۷۲ توري وکاروئ.', passwordRequired: 'نوی پاسورډ اړین دی', passwordLength: 'د پاسورډ لپاره له ۶ تر ۷۲ توري وکاروئ', confirmRequired: 'خپل نوی پاسورډ تایید کړئ', mismatch: 'پاسورډونه یو شان نه دي', save: 'نوی پاسورډ خوندي کړئ', expiredTitle: 'د تایید نوی کوډ وغواړئ', expired: 'د تایید وخت پای ته رسېدلی یا نور معتبر نه دی. د نوي پاسورډ لپاره خپل تلیفون بیا تایید کړئ.', requestCode: 'نوی کوډ وغواړئ', success: 'پاسورډ بدل شو. په نوي پاسورډ ننوځئ.', failed: 'پاسورډ بدل نه شو' },
  dr: { intro: 'تلفن شما تایید شد. برای ورود رمز جدید انتخاب کنید.', passwordHint: 'از ۶ تا ۷۲ نویسه استفاده کنید.', passwordRequired: 'رمز جدید ضروری است', passwordLength: 'برای رمز از ۶ تا ۷۲ نویسه استفاده کنید', confirmRequired: 'رمز جدید خود را تایید کنید', mismatch: 'رمزها یکسان نیستند', save: 'ذخیره رمز جدید', expiredTitle: 'کد تایید جدید درخواست کنید', expired: 'تایید منقضی شده یا دیگر معتبر نیست. برای تعیین رمز جدید تلفن خود را دوباره تایید کنید.', requestCode: 'درخواست کد جدید', success: 'رمز تغییر کرد. با رمز جدید وارد شوید.', failed: 'رمز تغییر نکرد' },
};

export default function NewPasswordScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const { t, lang, isRTL } = useLanguage();
  const toast = useToast();
  const c = theme.colors;
  const copy = passwordCopy[lang] || passwordCopy.en;
  const alignment = { textAlign: isRTL ? 'right' : 'left' };
  const contentWidth = Math.min(width - spacing.lg * 2, 560);
  const { challengeId, resetToken, expiresAt, phone } = route?.params || {};
  const deadline = Number(expiresAt);
  const proofComplete = typeof challengeId === 'string' && !!challengeId.trim() && typeof resetToken === 'string' && !!resetToken.trim() && Number.isFinite(deadline) && deadline > 0;
  const remaining = useOtpCountdown(proofComplete ? deadline : 0);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [proofInvalid, setProofInvalid] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const busy = useRef(false);
  const mounted = useRef(true);
  const confirmRef = useRef(null);
  const canReset = proofComplete && remaining > 0 && !proofInvalid;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const handleSave = async () => {
    if (busy.current) return;
    if (!proofComplete || proofInvalid || Date.now() >= deadline) { setProofInvalid(true); return; }
    const nextErrors = {};
    if (!password) nextErrors.password = copy.passwordRequired;
    else if (password.length < 6 || password.length > 72) nextErrors.password = copy.passwordLength;
    if (!confirmPassword) nextErrors.confirmPassword = copy.confirmRequired;
    else if (password !== confirmPassword) nextErrors.confirmPassword = copy.mismatch;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    busy.current = true;
    setLoading(true);
    setSubmitError('');
    try {
      const data = await authApi.resetPhonePassword({ challengeId, resetToken, password, confirmPassword });
      if (!mounted.current) return;
      toast.success(data.message || copy.success);
      navigation.replace('Login');
    } catch (error) {
      if (!mounted.current) return;
      if (error.data?.code === 'RESET_PROOF_INVALID' || error.data?.code === 'RESET_PROOF_EXPIRED' || [401, 403, 410].includes(error.status)) setProofInvalid(true);
      else { setSubmitError(error.message || copy.failed); toast.error(error.message || copy.failed); }
    } finally { busy.current = false; if (mounted.current) setLoading(false); }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title="" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 18 : 0}>
        <ScrollView contentContainerStyle={[styles.scroll, width >= 768 && styles.scrollTablet]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
          <View style={[styles.content, { maxWidth: contentWidth, backgroundColor: c.card, borderColor: c.borderLight }]}>
            <Text maxFontSizeMultiplier={2} style={[styles.title, alignment, { color: c.text }]}>{canReset ? t.newPassword : copy.expiredTitle}</Text>
            <Text accessibilityLiveRegion="polite" maxFontSizeMultiplier={2} style={[styles.subtitle, alignment, { color: c.textSecondary }]}>{canReset ? copy.intro : copy.expired}</Text>
            {canReset ? <>
              <Input label={t.newPassword} icon="lock-closed-outline" value={password} onChangeText={value => { setPassword(value); setErrors({}); setSubmitError(''); }} error={errors.password} secureTextEntry autoComplete="new-password" textContentType="newPassword" autoCapitalize="none" autoCorrect={false} maxLength={72} hint={copy.passwordHint} editable={!loading} returnKeyType="next" onSubmitEditing={() => confirmRef.current?.focus()} />
              <Input ref={confirmRef} label={t.confirmPassword} icon="lock-closed-outline" value={confirmPassword} onChangeText={value => { setConfirmPassword(value); setErrors(current => ({ ...current, confirmPassword: undefined })); setSubmitError(''); }} error={errors.confirmPassword} secureTextEntry autoComplete="new-password" textContentType="newPassword" autoCapitalize="none" autoCorrect={false} maxLength={72} editable={!loading} returnKeyType="done" onSubmitEditing={handleSave} />
              {submitError ? <Text accessibilityRole="alert" style={[styles.error, alignment, { color: c.error }]}>{submitError}</Text> : null}
              <Button title={copy.save} onPress={handleSave} loading={loading} style={{ marginTop: spacing.md }} />
            </> : <Button title={copy.requestCode} onPress={() => navigation.replace('ForgotPassword', { phone })} style={{ marginTop: spacing.md }} />}
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
  error: { fontSize: 14, lineHeight: 22, marginBottom: 12 },
});

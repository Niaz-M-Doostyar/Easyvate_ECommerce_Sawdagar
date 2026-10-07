import React, { useEffect, useRef, useState } from 'react';
import { Animated, AppState, Easing, Keyboard, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import useOtpCountdown from '../hooks/useOtpCountdown';
import { normalizeOtpCode, otpInputLayout } from '../utils/otpInput';
const label = method => method === 'sms' ? 'SMS' : 'WhatsApp';
export function OtpMethodPicker({ value, onChange, disabled, verifying = false }) {
  const { theme } = useTheme(); const c = theme.colors;
  return <View style={styles.methods}>
    <Text style={[styles.label, { color: c.text }]}>{verifying ? 'Send another code using' : 'How would you like your code?'}</Text>
    <View style={styles.methodRow}>{['sms', 'whatsapp'].map(method => {
      const selected = value === method;
      return <TouchableOpacity key={method} disabled={disabled} activeOpacity={0.8} onPress={() => onChange(method)} accessibilityRole="radio" accessibilityLabel={`${label(method)}${method === 'sms' ? ', default' : ''}`} accessibilityState={{ checked: selected, disabled }} style={[styles.method, { backgroundColor: selected ? c.brandSurface : c.card, borderColor: selected ? c.primary : c.border, opacity: disabled ? 0.6 : 1 }]}>
        <View style={styles.methodTop}><View style={[styles.methodIcon, { backgroundColor: method === 'whatsapp' ? '#e8f8ef' : c.brandSurface }]}><Ionicons name={method === 'sms' ? 'chatbubble-ellipses-outline' : 'logo-whatsapp'} size={22} color={method === 'sms' ? c.primary : '#18864d'} /></View><Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={20} color={selected ? c.primary : c.textMuted} /></View>
        <Text style={[styles.methodTitle, { color: c.text }]}>{label(method)}</Text><Text style={[styles.methodHint, { color: c.textSecondary }]}>{method === 'sms' ? 'Text message · default' : 'Your WhatsApp number'}</Text>
      </TouchableOpacity>;
    })}</View>
    <Text style={[styles.hint, { color: c.textSecondary }]}>{value === 'sms' ? 'A six-digit code will be sent to your Afghan mobile number.' : 'WhatsApp must be active on this number and connected to the internet.'}</Text>
  </View>;
}
export function OtpVerification({ code, onChange, phone, sentChannel, channel, retryAt, expiresAt, onResend, onEdit, loading, error }) {
  const { theme } = useTheme(); const c = theme.colors;
  const seconds = useOtpCountdown(retryAt); const expiry = useOtpCountdown(expiresAt);
  const input = useRef(null); const [focused, setFocused] = useState(false);
  const { width, fontScale } = useWindowDimensions();
  const [codeWidth, setCodeWidth] = useState(0);
  const digits = normalizeOtpCode(code);
  const layout = otpInputLayout(codeWidth || Math.max(0, width - 120), fontScale);
  const loadingRef = useRef(loading); loadingRef.current = loading;
  const focusTimer = useRef(null);
  const progress = useRef(new Animated.Value(1)).current;
  useEffect(() => { Animated.timing(progress, { toValue: Math.min(1, seconds / 60), duration: 950, easing: Easing.linear, useNativeDriver: false }).start(); }, [seconds, progress]);
  // A challenge can mount while its request is still loading. Focus after the
  // native field becomes editable, including a resend or an invalid-code retry.
  useEffect(() => {
    if (loading) return undefined;
    focusTimer.current = setTimeout(() => input.current?.focus(), 180);
    return () => clearTimeout(focusTimer.current);
  }, [loading, phone, retryAt]);
  useEffect(() => {
    const appState = AppState.addEventListener('change', state => {
      if (state !== 'active' || loadingRef.current) return;
      clearTimeout(focusTimer.current);
      focusTimer.current = setTimeout(() => input.current?.focus(), 180);
    });
    // RN documents that focusing a still-focused Android input after Back hides
    // the keyboard may not reopen it. Blur on dismissal so the next tap can.
    const keyboard = Platform.OS === 'android' ? Keyboard.addListener('keyboardDidHide', () => input.current?.blur()) : null;
    return () => { appState.remove(); keyboard?.remove(); clearTimeout(focusTimer.current); };
  }, []);
  return <View style={[styles.verification, { backgroundColor: c.brandSurface, borderColor: c.border }]}>
    <View style={styles.sent}><View style={[styles.sentIcon, { backgroundColor: c.card }]}><Ionicons name="shield-checkmark-outline" size={25} color={c.primary} /></View><View style={{flex:1}}><Text style={[styles.sentTitle, {color:c.text}]}>Check your {label(sentChannel)}</Text><Text style={[styles.hint, {color:c.textSecondary}]}>Code sent to <Text style={{fontWeight:'600',color:c.text}}>{phone}</Text></Text></View></View>
    <Text style={[styles.hint, {color:c.textSecondary, marginBottom:16}]}>{sentChannel === 'sms' ? 'Stay on this screen. When the SMS arrives, tap the code above your keyboard to fill it in. You can also paste the six-digit code.' : 'Open WhatsApp and find your six-digit code, then return here to enter it.'}</Text>
    <Text style={[styles.label, {color:c.text}]}>Verification code</Text>
    <View style={styles.codeWrap} onLayout={event => setCodeWidth(event.nativeEvent.layout.width)}>
      <View pointerEvents="none" style={[styles.digits, { gap: layout.gap }]} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {Array.from({length:6},(_,i)=><View key={i} style={[styles.digit, { width: layout.digitWidth, height: layout.digitHeight, backgroundColor:c.card,borderColor:focused && Math.min(digits.length,5)===i ? c.primary : c.border, borderWidth:focused && Math.min(digits.length,5)===i ? 2 : 1}]}><Text style={[styles.digitText,{color:c.text}]}>{digits[i] || ''}</Text></View>)}
      </View>
      {/* Keep a real, alpha-one native input over the decorative boxes. Only its
          glyphs are transparent; native touch, selection, paste and autofill stay
          available rather than placing the editable view at opacity zero. */}
      <TextInput ref={input} style={styles.codeInput} value={digits}
        onChangeText={value => onChange(normalizeOtpCode(value))}
        keyboardType="number-pad" keyboardAppearance={theme.dark ? 'dark' : 'light'}
        textContentType={Platform.OS === 'ios' ? 'oneTimeCode' : undefined}
        autoComplete={Platform.OS === 'android' ? 'sms-otp' : undefined}
        importantForAutofill={Platform.OS === 'android' ? 'yes' : undefined}
        autoFocus showSoftInputOnFocus editable={!loading} maxLength={64}
        autoCapitalize="none" autoCorrect={false} spellCheck={false} smartInsertDelete={false}
        multiline={false} secureTextEntry={false} contextMenuHidden={false} selectTextOnFocus
        caretHidden selectionColor={c.primary} underlineColorAndroid="transparent"
        onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
        accessibilityLabel="Six-digit verification code" accessibilityHint={error || 'Enter or paste the verification code'} />
    </View>
    {!!error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.error, fontSize: 14, lineHeight: 22, marginTop: 8 }}>{error}</Text>}
    <Text style={[styles.hint, {color:expiry?c.textSecondary:c.error}]}>{expiry ? `Code expires in ${Math.floor(expiry/60)}:${String(expiry%60).padStart(2,'0')}. Use the latest code.` : 'This code has expired. Request a new one.'}</Text>
    <View style={styles.resendRow}><Text style={[styles.hint,{color:c.textSecondary}]}>Didn’t receive a code?</Text><TouchableOpacity onPress={onResend} disabled={loading || seconds>0} accessibilityRole="button" accessibilityState={{disabled:loading || seconds>0}} style={styles.resend}><Ionicons name={seconds>0?'time-outline':'refresh-outline'} size={16} color={seconds>0?c.textMuted:c.primary} /><Text style={[styles.resendText,{color:seconds>0?c.textSecondary:c.primary}]}>{seconds>0 ? `Resend in ${seconds}s` : `Resend via ${label(channel)}`}</Text></TouchableOpacity></View>
    {seconds>0 && <View style={[styles.track,{backgroundColor:c.border}]} accessible accessibilityLabel={`Resend available in ${seconds} seconds`}><Animated.View style={[styles.progress,{backgroundColor:c.primary,width:progress.interpolate({inputRange:[0,1],outputRange:['0%','100%']})}]} /></View>}
    <TouchableOpacity disabled={loading} onPress={onEdit} accessibilityRole="button" style={styles.edit}><Ionicons name="create-outline" size={16} color={c.textSecondary} /><Text style={[styles.editText,{color:c.textSecondary}]}>Change phone or details</Text></TouchableOpacity>
  </View>;
}
const styles=StyleSheet.create({
  methods:{marginTop:16,marginBottom:8},label:{fontSize:14,fontWeight:'600',marginBottom:12},methodRow:{flexDirection:'row',gap:12},method:{flex:1,padding:14,borderRadius:18,borderWidth:1.5,minHeight:112},methodTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:10},methodIcon:{width:36,height:36,borderRadius:11,alignItems:'center',justifyContent:'center'},methodTitle:{fontSize:15,fontWeight:'600'},methodHint:{fontSize:11,lineHeight:17,marginTop:3},hint:{fontSize:12,lineHeight:19,marginTop:8},verification:{padding:18,borderWidth:1,borderRadius:22,marginVertical:16},sent:{flexDirection:'row',gap:12,alignItems:'center',marginBottom:24},sentIcon:{width:46,height:46,borderRadius:15,alignItems:'center',justifyContent:'center'},sentTitle:{fontSize:17,fontWeight:'600'},codeWrap:{position:'relative',direction:'ltr'},codeInput:{position:'absolute',top:0,bottom:0,left:0,right:0,opacity:1,color:'transparent',backgroundColor:'transparent',padding:0,fontSize:22,writingDirection:'ltr',textAlign:'left'},digits:{flexDirection:'row',flexWrap:'wrap',direction:'ltr'},digit:{borderRadius:12,justifyContent:'center',alignItems:'center'},digitText:{fontSize:24,lineHeight:32,fontWeight:'700',fontVariant:['tabular-nums']},resendRow:{flexWrap:'wrap',flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:12},resend:{flexDirection:'row',gap:5,alignItems:'center',minHeight:44},resendText:{fontSize:12,fontWeight:'600',fontVariant:['tabular-nums']},track:{height:4,borderRadius:4,overflow:'hidden',marginVertical:8},progress:{height:4,borderRadius:4},edit:{flexDirection:'row',gap:5,alignItems:'center',minHeight:44},editText:{fontSize:12}
});

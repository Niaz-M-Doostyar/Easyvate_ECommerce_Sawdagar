import React, { useState, useId } from 'react';
import { View, TextInput, Text, StyleSheet, InputAccessoryView, Keyboard, Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, fontSize, fontWeight, borderRadius } from '../theme';
import PressableScale from './PressableScale';

export default React.forwardRef(function Input({
  label,
  error,
  secureTextEntry,
  icon,
  prefix,
  hint,
  style,
  inputStyle,
  onFocus,
  onBlur,
  editable = true,
  accessibilityLabel,
  accessibilityHint,
  ...props
}, ref) {
  const accessoryId = useId();
  const numericKeyboard = ['phone-pad', 'number-pad', 'decimal-pad'].includes(props.keyboardType);
  const { theme } = useTheme();
  const c = theme.colors;
  const [secure, setSecure] = useState(secureTextEntry);
  const [focused, setFocused] = useState(false);
  const borderColor = error ? c.error : focused ? c.primary : c.inputBorder;
  const isMultiline = Boolean(props.multiline);
  const isDisabled = editable === false;

  return (
    <View style={[styles.wrap, style]}>
      {label && <Text style={[styles.label, { color: error ? c.error : focused ? c.primary : c.textSecondary }]}>{label}</Text>}
      <View style={[styles.row, isMultiline ? styles.rowMultiline : null, focused ? styles.rowFocused : null, isDisabled ? styles.rowDisabled : null, { backgroundColor: isDisabled ? c.surfaceElevated : c.inputBg, borderColor, shadowColor: focused ? c.primary : c.black }]}>
        {icon && (
          <View style={[styles.leadingIcon, { backgroundColor: focused ? c.brandSurfaceStrong : c.brandSurface }]}>
            <Ionicons name={icon} size={18} color={error ? c.error : focused ? c.primary : c.textSecondary} />
          </View>
        )}
        {prefix && <Text style={{ color: c.text, fontWeight: '600', marginEnd: 10 }}>{prefix}</Text>}
        <TextInput
          ref={ref}
          {...props}
          importantForAutofill="yes"
          inputAccessoryViewID={Platform.OS === 'ios' && numericKeyboard ? accessoryId : undefined}
          placeholderTextColor={c.placeholder}
          selectionColor={c.primary}
          style={[styles.input, isMultiline ? styles.inputMultiline : null, { color: c.text }, inputStyle]}
          secureTextEntry={secure}
          editable={editable}
          textAlignVertical={isMultiline ? 'top' : 'center'}
          accessibilityLabel={accessibilityLabel || label || props.placeholder}
          accessibilityHint={error || accessibilityHint}
          accessibilityState={{ disabled: isDisabled }}
          onFocus={(event) => {
            setFocused(true);
            if (onFocus) onFocus(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            if (onBlur) onBlur(event);
          }}
        />
        {secureTextEntry && (
          <PressableScale
            onPress={() => setSecure((current) => !current)}
            disabled={isDisabled}
            style={styles.secureButton}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={secure ? 'Show password' : 'Hide password'}
            accessibilityState={{ disabled: isDisabled }}
          >
            <Ionicons name={secure ? 'eye-off-outline' : 'eye-outline'} size={20} color={c.textMuted} />
          </PressableScale>
        )}
      </View>
      {Platform.OS === 'ios' && numericKeyboard && <InputAccessoryView nativeID={accessoryId}><View style={{ backgroundColor: c.card, alignItems: 'flex-end', borderTopWidth: 1, borderColor: c.border }}><PressableScale onPress={Keyboard.dismiss} accessibilityRole="button" accessibilityLabel="Done entering phone number" style={{ padding: 14 }}><Text style={{ color: c.primary, fontWeight: '600' }}>Done</Text></PressableScale></View></InputAccessoryView>}
      {hint && !error && <Text style={[styles.error, { color: c.textSecondary }]}>{hint}</Text>}
      {error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.error, { color: c.error }]}>{error}</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.base },
  label: { fontSize: fontSize.sm, marginBottom: spacing.sm, fontWeight: fontWeight.semibold, letterSpacing: 0.1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    minHeight: 54,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.025,
    shadowRadius: 6,
    elevation: 0,
  },
  rowMultiline: {
    minHeight: 96,
    height: 'auto',
    alignItems: 'flex-start',
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  rowFocused: {
    shadowOpacity: 0.12,
    elevation: 2,
  },
  rowDisabled: { opacity: 0.58 },
  leadingIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginEnd: spacing.sm },
  input: { flex: 1, minWidth: 0, fontSize: fontSize.base, paddingHorizontal: 0, paddingVertical: 10 },
  inputMultiline: { minHeight: 72 },
  secureButton: { width: 44, height: 44, marginEnd: -12, alignItems: 'center', justifyContent: 'center' },
  error: { fontSize: fontSize.xs, lineHeight: 16, marginTop: 6, marginStart: 2 },
});

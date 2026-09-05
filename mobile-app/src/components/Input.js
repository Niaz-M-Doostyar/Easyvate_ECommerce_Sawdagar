import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, fontSize, fontWeight, borderRadius } from '../theme';

export default function Input({
  label,
  error,
  secureTextEntry,
  icon,
  style,
  inputStyle,
  onFocus,
  onBlur,
  editable = true,
  accessibilityLabel,
  accessibilityHint,
  ...props
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [secure, setSecure] = useState(secureTextEntry);
  const [focused, setFocused] = useState(false);
  const borderColor = error ? c.error : focused ? c.primary : c.inputBorder;
  const isMultiline = Boolean(props.multiline);
  const isDisabled = editable === false;

  return (
    <View style={[styles.wrap, style]}>
      {label && <Text style={[styles.label, { color: c.textSecondary }]}>{label}</Text>}
      <View style={[styles.row, isMultiline ? styles.rowMultiline : null, focused ? styles.rowFocused : null, isDisabled ? styles.rowDisabled : null, { backgroundColor: isDisabled ? c.surfaceElevated : c.inputBg, borderColor, shadowColor: c.black }]}>
        {icon && <Ionicons name={icon} size={18} color={c.textMuted} style={styles.leadingIcon} />}
        <TextInput
          {...props}
          placeholderTextColor={c.placeholder}
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
          <TouchableOpacity
            onPress={() => setSecure(!secure)}
            disabled={isDisabled}
            style={styles.secureButton}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={secure ? 'Show password' : 'Hide password'}
            accessibilityState={{ disabled: isDisabled }}
          >
            <Ionicons name={secure ? 'eye-off-outline' : 'eye-outline'} size={20} color={c.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.error, { color: c.error }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.base },
  label: { fontSize: fontSize.sm, marginBottom: 6, fontWeight: fontWeight.medium, letterSpacing: 0.2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    minHeight: 50,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
  },
  rowMultiline: {
    minHeight: 96,
    height: 'auto',
    alignItems: 'flex-start',
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  rowFocused: {
    shadowOpacity: 0.08,
    elevation: 4,
  },
  rowDisabled: { opacity: 0.58 },
  leadingIcon: { marginEnd: spacing.sm },
  input: { flex: 1, minWidth: 0, fontSize: fontSize.base, paddingHorizontal: 0, paddingVertical: 10 },
  inputMultiline: { minHeight: 72 },
  secureButton: { width: 44, height: 44, marginEnd: -12, alignItems: 'center', justifyContent: 'center' },
  error: { fontSize: fontSize.xs, marginTop: 4 },
});

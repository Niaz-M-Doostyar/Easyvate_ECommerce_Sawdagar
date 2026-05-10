import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, fontSize, borderRadius } from '../theme';

export default function Input({ label, error, secureTextEntry, icon, style, inputStyle, ...props }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [secure, setSecure] = useState(secureTextEntry);
  const [focused, setFocused] = useState(false);
  const borderColor = error ? c.error : focused ? c.primary : c.inputBorder;
  const isMultiline = Boolean(props.multiline);

  return (
    <View style={[styles.wrap, style]}>
      {label && <Text style={[styles.label, { color: c.textSecondary }]}>{label}</Text>}
      <View style={[styles.row, isMultiline ? styles.rowMultiline : null, focused ? styles.rowFocused : null, { backgroundColor: c.inputBg, borderColor, shadowColor: c.black }]}> 
        {icon && <Ionicons name={icon} size={18} color={c.textMuted} style={{ marginRight: 8 }} />}
        <TextInput
          placeholderTextColor={c.placeholder}
          style={[styles.input, isMultiline ? styles.inputMultiline : null, { color: c.text }, inputStyle]}
          secureTextEntry={secure}
          textAlignVertical={isMultiline ? 'top' : 'center'}
          onFocus={(event) => {
            setFocused(true);
            if (props.onFocus) props.onFocus(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            if (props.onBlur) props.onBlur(event);
          }}
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setSecure(!secure)}>
            <Ionicons name={secure ? 'eye-off-outline' : 'eye-outline'} size={20} color={c.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={[styles.error, { color: c.error }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.base },
  label: { fontSize: fontSize.sm, marginBottom: 6, fontWeight: '500', letterSpacing: 0.2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 54,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
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
  input: { flex: 1, fontSize: fontSize.base, padding: 0 },
  inputMultiline: { minHeight: 72 },
  error: { fontSize: fontSize.xs, marginTop: 4 },
});

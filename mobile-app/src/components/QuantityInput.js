import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { borderRadius, fontSize, fontWeight, spacing } from '../theme';

export default function QuantityInput({
  value,
  onChange,
  min = 1,
  max,
  disabled = false,
  size = 'md',
  liveUpdate = false,
  style,
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const boundedMax = Number.isFinite(max) && max >= min ? max : undefined;
  const normalize = useCallback((nextValue) => {
    const parsed = Number.parseInt(nextValue, 10);
    const safeValue = Number.isFinite(parsed) ? parsed : min;
    return Math.min(boundedMax ?? Number.MAX_SAFE_INTEGER, Math.max(min, safeValue));
  }, [boundedMax, min]);
  const [draft, setDraft] = useState(String(normalize(value)));
  const compact = size === 'sm';
  const current = normalize(draft);
  const decreaseDisabled = disabled || current <= min;
  const increaseDisabled = disabled || current >= (boundedMax ?? Number.MAX_SAFE_INTEGER);

  useEffect(() => {
    setDraft(String(normalize(value)));
  }, [normalize, value]);

  const commit = useCallback(() => {
    const next = normalize(draft);
    setDraft(String(next));
    if (next !== value) onChange?.(next);
  }, [draft, normalize, onChange, value]);

  const changeBy = (delta) => {
    const base = Number.parseInt(draft, 10);
    const next = normalize((Number.isFinite(base) ? base : value || min) + delta);
    setDraft(String(next));
    if (next !== value) onChange?.(next);
  };

  const handleTextChange = (text) => {
    const cleaned = String(text).replace(/[^0-9]/g, '');
    setDraft(cleaned);

    if (liveUpdate && cleaned) {
      const next = normalize(cleaned);
      if (String(next) !== cleaned) setDraft(String(next));
      if (next !== value) onChange?.(next);
    }
  };

  return (
    <View
      style={[
        styles.control,
        compact && styles.controlSmall,
        { backgroundColor: c.surfaceElevated, borderColor: c.border, opacity: disabled ? 0.55 : 1 },
        style,
      ]}
    >
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        accessibilityState={{ disabled: decreaseDisabled }}
        onPress={() => changeBy(-1)}
        disabled={decreaseDisabled}
        style={[
          styles.stepButton,
          compact && styles.stepButtonSmall,
          { backgroundColor: c.brandSurface },
          decreaseDisabled && { opacity: 0.45 },
        ]}
      >
        <MaterialCommunityIcons name="minus" size={compact ? 17 : 19} color={c.text} />
      </TouchableOpacity>

      <TextInput
        accessibilityLabel="Quantity"
        accessibilityValue={{ min, max: boundedMax, now: current, text: String(current) }}
        accessibilityState={{ disabled }}
        value={draft}
        onChangeText={handleTextChange}
        onEndEditing={commit}
        onSubmitEditing={commit}
        editable={!disabled}
        keyboardType="number-pad"
        returnKeyType="done"
        selectTextOnFocus
        maxLength={5}
        style={[
          styles.input,
          compact && styles.inputSmall,
          { color: c.text, backgroundColor: c.card, borderColor: c.borderLight },
        ]}
      />

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        accessibilityState={{ disabled: increaseDisabled }}
        onPress={() => changeBy(1)}
        disabled={increaseDisabled}
        style={[
          styles.stepButton,
          compact && styles.stepButtonSmall,
          { backgroundColor: c.brandSurface },
          increaseDisabled && { opacity: 0.45 },
        ]}
      >
        <MaterialCommunityIcons name="plus" size={compact ? 17 : 19} color={c.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: 5,
    gap: spacing.xs,
  },
  controlSmall: {
    borderRadius: borderRadius.md,
    padding: 4,
  },
  stepButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepButtonSmall: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
  },
  input: {
    width: 78,
    height: 44,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 0,
    textAlign: 'center',
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  inputSmall: {
    width: 62,
    height: 44,
    borderRadius: borderRadius.sm,
    fontSize: fontSize.base,
  },
});

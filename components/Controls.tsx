import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

type ButtonProps = {
  title: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'danger' | 'quiet';
  disabled?: boolean;
  compact?: boolean;
};

export function Button({ title, onPress, kind = 'secondary', disabled = false, compact = false }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[kind],
        compact && styles.compact,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.buttonText, kind === 'primary' && styles.primaryText, kind === 'danger' && styles.dangerText]}>{title}</Text>
    </Pressable>
  );
}

type FieldProps = TextInputProps & { label: string; error?: string };

export function Field({ label, error, ...inputProps }: FieldProps) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor="#8A8D84"
        {...inputProps}
        style={[styles.input, inputProps.multiline && styles.multiline, error && styles.inputError, inputProps.style]}
      />
      {error ? <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export function ChoiceChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 44, borderRadius: 7, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: '#1F5B49' }, secondary: { backgroundColor: '#E7E9E2' },
  danger: { backgroundColor: '#F5E5E0' }, quiet: { backgroundColor: 'transparent' },
  compact: { minHeight: 36, paddingHorizontal: 12 }, disabled: { opacity: 0.48 }, pressed: { opacity: 0.78 },
  buttonText: { color: '#26342E', fontSize: 14, fontWeight: '700' },
  primaryText: { color: '#FFFFFF' }, dangerText: { color: '#9B3D2D' },
  fieldWrap: { marginBottom: 14 }, label: { color: '#4E5A52', fontSize: 13, fontWeight: '700', marginBottom: 7 },
  input: { minHeight: 46, borderWidth: 1, borderColor: '#D9DDD5', backgroundColor: '#FFFFFF', borderRadius: 7, paddingHorizontal: 12, color: '#202B25', fontSize: 15 },
  multiline: { minHeight: 94, paddingTop: 11, textAlignVertical: 'top' },
  inputError: { borderColor: '#B94D3E' }, errorText: { color: '#A53E32', fontSize: 12, marginTop: 5 },
  chip: { minHeight: 36, paddingHorizontal: 13, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E9EBE5', marginRight: 7, marginBottom: 7 },
  chipSelected: { backgroundColor: '#D2E3D8' }, chipText: { color: '#48534C', fontSize: 13, fontWeight: '600' },
  chipTextSelected: { color: '#1F5B49' },
});
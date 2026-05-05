import { StyleSheet, Text, TextInput, View } from "react-native";
import type { KeyboardTypeOptions } from "react-native";
import type { AppColors } from "../theme/palette";

type TextFieldProps = {
  colors: AppColors;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  width?: number;
};

export function TextField({
  colors,
  keyboardType,
  label,
  onChangeText,
  placeholder,
  value,
  width,
}: TextFieldProps) {
  const styles = createStyles(colors);

  return (
    <View style={[styles.field, width ? { width } : styles.flexField]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    field: {
      gap: 8,
    },
    flexField: {
      flex: 1,
    },
    label: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "800",
      textTransform: "uppercase",
    },
    input: {
      minHeight: 48,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.panelAlt,
      color: colors.text,
      fontSize: 16,
      fontWeight: "700",
      paddingHorizontal: 12,
    },
  });
}

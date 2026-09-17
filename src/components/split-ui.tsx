import { useState, type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

export const colors = {
  green: "#237A5A",
  ink: "#243D33",
  muted: "#687A70",
  border: "#E5EBE5",
  bg: "#F7F9F5",
  pale: "#EDF4EC",
  white: "#FFFFFF",
};
export const fonts = {
  regular: "NotoSansThai_400Regular",
  medium: "NotoSansThai_500Medium",
  semibold: "NotoSansThai_600SemiBold",
  bold: "NotoSansThai_700Bold",
};
const paths = {
  home: "M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z",
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6m-6 4h6",
  transfer: "M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4",
  users:
    "M15 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2m18 0v-2a4 4 0 0 0-3-3.87M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm8 .13a4 4 0 0 1 0 7.74",
  wallet:
    "M20 8V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v11H5a3 3 0 0 1-3-3V6m18 7h-5v4h5",
  arrow: "M5 12h14m-5-5 5 5-5 5",
  chevron: "m9 5 7 7-7 7",
  plus: "M12 5v14M5 12h14",
  share: "M12 16V3m-5 5 5-5 5 5M5 13v7h14v-7",
  calendar: "M5 5h14v16H5V5Zm3-3v6m8-6v6M5 11h14",
  check: "m5 12 4 4L19 6",
  archive: "M3 4h18v5H3V4Zm2 5v12h14V9m-10 4h6",
  leaf: "M20 3C8 2 3 7 4 14c1 7 14 8 16-11ZM5 20 15 9",
  food: "M5 3v7m4-7v7m-6-7v4a4 4 0 0 0 8 0V3M7 11v10M20 3c-5 3-5 10 0 10V3Zm0 10v8",
  coffee:
    "M4 8h12v6a6 6 0 0 1-12 0V8Zm12 0h2a3 3 0 0 1 0 6h-2M3 21h15M7 2v3m5-3v3",
  hotel: "M3 21V4h12v17M15 10h6v11M1 21h22M7 8h4m-4 4h4m-4 4h4",
  travel: "m5 6 2-3h10l2 3 2 4v8H3v-8l2-4Zm-2 5h18M6 14h2m8 0h2M5 18v3m14-3v3",
  ticket: "M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4V6Zm12 0v3m0 2v2m0 2v3",
  close: "m6 6 12 12M6 18 18 6",
} as const;
export type IconName = keyof typeof paths;
export function Icon({
  name,
  size = 20,
  color = colors.green,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      accessible={false}
    >
      <Path
        d={paths[name]}
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
export function Button({
  title,
  onPress,
  secondary = false,
  danger = false,
  disabled = false,
  icon,
  style,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  const color = danger ? "#B44939" : secondary ? colors.green : "#fff";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        danger && { backgroundColor: "#FFF1EC" },
        style,
        { opacity: disabled ? 0.4 : pressed ? 0.76 : 1 },
      ]}
    >
      {icon && <Icon name={icon} size={18} color={color} />}
      <Text style={[s.buttonText, { color }]}>{title}</Text>
    </Pressable>
  );
}
export function Field({
  label,
  value,
  onChange,
  decimal = false,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  decimal?: boolean;
  multiline?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 8, minWidth: 0, width: "100%" }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        keyboardType={decimal ? "decimal-pad" : "default"}
        multiline={multiline}
        maxLength={multiline ? 1000000 : 120}
        placeholder={decimal ? "0.00" : undefined}
        placeholderTextColor="#9BA89D"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          s.input,
          focused && { borderColor: colors.green, backgroundColor: "#FBFDF9" },
          multiline && { minHeight: 140, textAlignVertical: "top" },
        ]}
      />
    </View>
  );
}
export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[s.card, style]}>{children}</View>;
}
export function Avatar({
  name,
  index = 0,
  size = 38,
}: {
  name: string;
  index?: number;
  size?: number;
}) {
  const tones = ["#E5EDDF", "#F7E8D9", "#E6E6F6", "#F9E3E7", "#DFEDF1"];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: tones[index % tones.length],
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        borderWidth: 2,
        borderColor: "#fff",
      }}
    >
      <Text
        numberOfLines={1}
        style={{
          fontFamily: fonts.semibold,
          fontSize: size * 0.34,
          color: colors.ink,
        }}
      >
        {Array.from(name.trim()).slice(0, 2).join("")}
      </Text>
    </View>
  );
}
export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const { width, height } = useWindowDimensions();
  const wide = width >= 640;
  return (
    <Modal
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: "rgba(20,40,29,0.4)" }}>
        <KeyboardAvoidingView
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: wide ? 28 : 0,
          }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View
            testID="form-sheet"
            accessibilityViewIsModal
            style={[
              {
                width: "100%",
                maxWidth: 620,
                backgroundColor: colors.bg,
                overflow: "hidden",
                flex: 1,
              },
              wide && {
                maxHeight: Math.min(height - 80, 840),
                borderRadius: 26,
                borderWidth: 1,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                s.row,
                {
                  padding: wide ? 24 : 18,
                  borderBottomWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: "#fff",
                },
              ]}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.eyebrow}>SPLITUP · หารกัน</Text>
                <Text
                  accessibilityRole="header"
                  style={[s.title, { fontSize: 22 }]}
                >
                  {title}
                </Text>
              </View>
              <Button title="ปิด" secondary onPress={onClose} />
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                padding: wide ? 28 : 18,
                paddingBottom: 36,
                gap: 20,
              }}
            >
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
export function Chips({
  options,
  value,
  onChange,
}: {
  options: [string, string][];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={s.wrap}>
      {options.map(([id, label]) => (
        <Pressable
          key={id}
          accessibilityRole="button"
          accessibilityState={{ selected: value === id }}
          onPress={() => onChange(id)}
          style={({ pressed }) => [
            s.chip,
            value === id && {
              backgroundColor: colors.pale,
              borderColor: "#AECDB9",
            },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text
            style={{
              fontFamily: value === id ? fonts.semibold : fonts.regular,
              fontSize: 13,
              color: value === id ? colors.green : colors.muted,
              flexShrink: 1,
            }}
          >
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
export const s = StyleSheet.create({
  content: { padding: 20, paddingBottom: 36, gap: 20 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minWidth: 0 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, minWidth: 0 },
  title: {
    fontFamily: fonts.bold,
    fontSize: 26,
    color: colors.ink,
    flexShrink: 1,
  },
  heading: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: colors.ink,
    flexShrink: 1,
  },
  text: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.ink,
    lineHeight: 24,
    flexShrink: 1,
  },
  muted: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
    lineHeight: 21,
    flexShrink: 1,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.ink,
    flexShrink: 1,
  },
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.muted,
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: "#fff",
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.ink,
    minWidth: 0,
    width: "100%",
  },
  button: {
    minHeight: 46,
    paddingHorizontal: 17,
    paddingVertical: 11,
    backgroundColor: colors.green,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    maxWidth: "100%",
    flexShrink: 1,
  },
  secondary: {
    backgroundColor: colors.pale,
    borderWidth: 1,
    borderColor: "#DFEADD",
  },
  buttonText: {
    color: "#fff",
    fontFamily: fonts.semibold,
    fontSize: 13,
    textAlign: "center",
    flexShrink: 1,
  },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 20,
    gap: 14,
    minWidth: 0,
  },
  chip: {
    minHeight: 44,
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
    maxWidth: "100%",
    justifyContent: "center",
  },
  error: {
    fontFamily: fonts.regular,
    color: "#AB392E",
    backgroundColor: "#FFF0EC",
    padding: 14,
    borderRadius: 12,
    lineHeight: 22,
  },
});

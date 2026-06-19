import React from "react";
import { Text as RNText, TextProps } from "react-native";

/**
 * Maps Tailwind font weight class names to Sora font family names.
 * Used to automatically apply the correct Sora font file for each weight.
 */
const FONT_WEIGHT_MAP: Record<string, string> = {
  normal: "Sora_400Regular",
  "400": "Sora_400Regular",
  "500": "Sora_500Medium",
  "600": "Sora_600SemiBold",
  bold: "Sora_700Bold",
  "700": "Sora_700Bold",
  "800": "Sora_800ExtraBold",
};

/**
 * Custom Text component that applies Sora font family by default.
 * Automatically maps fontWeight to the correct Sora variant.
 */
export function Text({ style, ...props }: TextProps) {
  // Resolve fontWeight from style to pick the right Sora variant
  const flatStyle = Array.isArray(style)
    ? Object.assign({}, ...style.filter(Boolean))
    : style || {};

  const weight = (flatStyle as any).fontWeight ?? "normal";
  const fontFamily =
    (flatStyle as any).fontFamily ?? FONT_WEIGHT_MAP[String(weight)] ?? "Sora_400Regular";

  return (
    <RNText
      {...props}
      style={[style, { fontFamily }]}
    />
  );
}

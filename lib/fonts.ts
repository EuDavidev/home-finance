/**
 * Sora font family mapping.
 * In React Native, each font weight requires its own font file name.
 * Use these constants for inline styles: style={{ fontFamily: fonts.regular }}
 */
export const fonts = {
  regular: "Sora_400Regular",
  medium: "Sora_500Medium",
  semibold: "Sora_600SemiBold",
  bold: "Sora_700Bold",
  extrabold: "Sora_800ExtraBold",
} as const;

export type FontWeight = keyof typeof fonts;

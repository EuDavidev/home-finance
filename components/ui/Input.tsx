/**
 * Input — Campo de entrada padronizado.
 */

import React from "react";
import { View, TextInput, TextInputProps } from "react-native";
import { Text } from "@/components/ui/Text";

interface InputProps extends TextInputProps {
  label?: string;
  variant?: "default" | "underline";
}

export function Input({
  label,
  variant = "default",
  style,
  ...props
}: InputProps) {
  const inputStyle =
    variant === "default"
      ? {
          backgroundColor: "#1F1B19",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 14,
          color: "#F5F0EC",
          fontSize: 15,
        }
      : {
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.06)",
          color: "#F5F0EC",
          fontSize: 15,
        };

  return (
    <View>
      {label && (
        <Text
          className="text-sm mb-2 font-semibold"
          style={{ color: "#F5F0EC" }}
        >
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor="#6B5C52"
        {...props}
        style={[inputStyle, style]}
      />
    </View>
  );
}

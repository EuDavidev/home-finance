/**
 * Card — Componente de cartão reutilizável com variantes.
 */

import React from "react";
import { View, ViewStyle, StyleProp } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface CardProps {
  variant?: "default" | "gradient" | "bordered";
  /** Cores do gradient (quando variant="gradient") */
  gradientColors?: readonly [string, string, ...string[]];
  style?: StyleProp<ViewStyle>;
  className?: string;
  children: React.ReactNode;
}

export function Card({
  variant = "default",
  gradientColors = ["#2A2420", "#1F1B19"],
  style,
  className,
  children,
}: CardProps) {
  if (variant === "gradient") {
    return (
      <LinearGradient
        colors={gradientColors}
        style={[{ borderRadius: 24, padding: 20 }, style]}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View
      className={className}
      style={[
        {
          backgroundColor: "#1F1B19",
          borderRadius: 20,
          padding: 20,
          borderWidth: variant === "bordered" ? 1 : 0,
          borderColor: "rgba(255,255,255,0.06)",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

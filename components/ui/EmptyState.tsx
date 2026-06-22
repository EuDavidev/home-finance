/**
 * EmptyState — Componente para estados vazios.
 * Substitui código duplicado em 5+ telas.
 */

import React from "react";
import { View, Pressable } from "react-native";
import { Text } from "@/components/ui/Text";
import { LinearGradient } from "expo-linear-gradient";

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="items-center py-16 px-5">
      <View
        className="w-20 h-20 rounded-full items-center justify-center mb-4"
        style={{ backgroundColor: "#1F1B19" }}
      >
        <Text className="text-3xl">{icon}</Text>
      </View>
      <Text className="text-white font-bold text-lg text-center mb-2">
        {title}
      </Text>
      <Text className="text-center mb-6" style={{ color: "#9B8B82" }}>
        {description}
      </Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction}>
          <LinearGradient
            colors={["#FFB59A", "#FF6B1A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 16,
              paddingHorizontal: 32,
              height: 48,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{ color: "#131315", fontWeight: "700", fontSize: 14 }}
            >
              {actionLabel}
            </Text>
          </LinearGradient>
        </Pressable>
      )}
    </View>
  );
}

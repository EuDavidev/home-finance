/**
 * Screen — Wrapper padrão para todas as telas.
 * Inclui safe area, header consistente, scroll e pull-to-refresh.
 */

import React from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  Pressable,
} from "react-native";
import { Text } from "@/components/ui/Text";
import { User, Bell } from "lucide-react-native";
import { useAuthStore } from "@/stores/authStore";

interface ScreenProps {
  title: string;
  subtitle?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Se false, renderiza sem scroll (para FlatList, etc.) */
  scrollable?: boolean;
  children: React.ReactNode;
}

export function Screen({
  title,
  subtitle,
  refreshing = false,
  onRefresh,
  scrollable = true,
  children,
}: ScreenProps) {
  const { member } = useAuthStore();

  const header = (
    <>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-14 pb-4">
        <View className="flex-row items-center gap-3">
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: member?.color || "#2A2420" }}
          >
            <User size={18} color="#FFF" />
          </View>
          <Text className="text-white font-bold text-base tracking-wider">
            HOME FINANCE
          </Text>
        </View>
        <Pressable
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: "transparent" }}
        >
          <Bell size={22} color="#FF6B1A" />
        </Pressable>
      </View>

      {/* Title */}
      <View className="px-5 mb-4">
        <Text className="text-white text-2xl font-bold">{title}</Text>
        {subtitle && (
          <Text className="mt-1" style={{ color: "#9B8B82" }}>
            {subtitle}
          </Text>
        )}
      </View>
    </>
  );

  if (!scrollable) {
    return (
      <View className="flex-1" style={{ backgroundColor: "#131315" }}>
        {header}
        {children}
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: "#131315" }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FF6B1A"
            />
          ) : undefined
        }
      >
        {header}
        {children}
      </ScrollView>
    </View>
  );
}

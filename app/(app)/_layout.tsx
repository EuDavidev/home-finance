import { useState } from "react";
import { View } from "react-native";
import { Tabs } from "expo-router";
import {
  Home,
  CreditCard,
  PieChart,
  MoreHorizontal,
} from "lucide-react-native";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { QuickTransactionModal } from "@/components/QuickTransactionModal";

export default function AppLayout() {
  const [quickModalVisible, setQuickModalVisible] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleQuickTransactionSuccess = () => {
    // Força refresh das transações
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <View className="flex-1">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#131315",
            borderTopColor: "rgba(255,255,255,0.06)",
            borderTopWidth: 1,
            height: 70,
            paddingBottom: 10,
            paddingTop: 8,
          },
          tabBarActiveTintColor: "#FF6B1A",
          tabBarInactiveTintColor: "#6B5C52",
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "600",
            letterSpacing: 0.5,
            textTransform: "uppercase",
            marginTop: 4,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <Home color={color} size={22} strokeWidth={focused ? 2.5 : 1.8} />
            ),
          }}
        />
        <Tabs.Screen
          name="transacoes/index"
          options={{
            title: "Transactions",
            tabBarIcon: ({ color, focused }) => (
              <CreditCard
                color={color}
                size={22}
                strokeWidth={focused ? 2.5 : 1.8}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="orcamentos"
          options={{
            title: "Budgets",
            tabBarIcon: ({ color, focused }) => (
              <PieChart
                color={color}
                size={22}
                strokeWidth={focused ? 2.5 : 1.8}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="mais"
          options={{
            title: "More",
            tabBarIcon: ({ color, focused }) => (
              <MoreHorizontal
                color={color}
                size={22}
                strokeWidth={focused ? 2.5 : 1.8}
              />
            ),
          }}
        />
        {/* Hide modal from tab bar */}
        <Tabs.Screen
          name="modal/nova-transacao"
          options={{
            href: null,
          }}
        />
      </Tabs>

      {/* Floating Action Button */}
      <FloatingActionButton onPress={() => setQuickModalVisible(true)} />

      {/* Quick Transaction Modal */}
      <QuickTransactionModal
        visible={quickModalVisible}
        onClose={() => setQuickModalVisible(false)}
        onSuccess={handleQuickTransactionSuccess}
      />
    </View>
  );
}

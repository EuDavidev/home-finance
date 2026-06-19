import { View, ScrollView, Pressable, RefreshControl } from "react-native";
import { Text } from "@/components/ui/Text";
import { useEffect, useState, useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  Bell,
  User,
  Home as HomeIcon,
  ShoppingCart,
  Zap,
  Car,
  UtensilsCrossed,
  AlertTriangle,
} from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { formatCurrency } from "@/lib/format";

interface BudgetItem {
  id: string;
  category: string;
  amount_limit: number;
  spent: number;
  percentage: number;
  exceeded: boolean;
}

export default function OrcamentosScreen() {
  const { member } = useAuthStore();
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalLimit, setTotalLimit] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = daysInMonth - now.getDate();

  const loadBudgets = useCallback(async () => {
    if (!member?.family_id) return;

    try {
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      // Get budgets
      const { data: budgetData } = await supabase
        .from("budgets")
        .select("*")
        .eq("family_id", member.family_id)
        .eq("month", month)
        .eq("year", year);

      // Get transactions for category spending
      const startOfMonth = new Date(year, month - 1, 1).toISOString();
      const endOfMonth = new Date(year, month, 0).toISOString();

      const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("family_id", member.family_id)
        .eq("type", "expense")
        .gte("date", startOfMonth)
        .lte("date", endOfMonth);

      // Calculate spending per category
      const categorySpending = new Map<string, number>();
      (transactions ?? []).forEach((t: any) => {
        const cat = t.category || "Outros";
        categorySpending.set(cat, (categorySpending.get(cat) || 0) + Number(t.amount));
      });

      const items: BudgetItem[] = (budgetData ?? []).map((b: any) => {
        const spent = categorySpending.get(b.category) || 0;
        const percentage = b.amount_limit > 0 ? Math.round((spent / b.amount_limit) * 100) : 0;
        return {
          id: b.id,
          category: b.category,
          amount_limit: Number(b.amount_limit),
          spent,
          percentage,
          exceeded: percentage >= 100,
        };
      });

      setBudgets(items);
      setTotalSpent(items.reduce((sum, b) => sum + b.spent, 0));
      setTotalLimit(items.reduce((sum, b) => sum + b.amount_limit, 0));
    } catch (err) {
      console.error("Error loading budgets:", err);
    }
  }, [member?.family_id]);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  // Real-time
  useEffect(() => {
    if (!member?.family_id) return;

    const channel = supabase
      .channel("budgets-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions", filter: `family_id=eq.${member.family_id}` },
        () => loadBudgets()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "budgets", filter: `family_id=eq.${member.family_id}` },
        () => loadBudgets()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [member?.family_id, loadBudgets]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBudgets();
    setRefreshing(false);
  }, [loadBudgets]);

  const totalPercentage = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;
  const remaining = totalLimit - totalSpent;
  const biggestCategory = budgets.length > 0
    ? budgets.reduce((max, b) => (b.spent > max.spent ? b : max), budgets[0])
    : null;

  const MONTHS_PT = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  return (
    <View className="flex-1" style={{ backgroundColor: "#131315" }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B1A" />
        }
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-14 pb-4">
          <View className="flex-row items-center gap-3">
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: "#2A2420" }}
            >
              <User size={18} color="#FF6B1A" />
            </View>
            <Text className="text-white font-bold text-base tracking-wider">
              HOME FINANCE
            </Text>
          </View>
          <Bell size={22} color="#FF6B1A" />
        </View>

        {/* Title */}
        <View className="px-5 mb-4">
          <Text className="text-white text-2xl font-bold">
            Orçamentos Mensais
          </Text>
          <Text className="mt-1" style={{ color: "#9B8B82" }}>
            Visão geral e controle de gastos para {MONTHS_PT[now.getMonth()]}
          </Text>
        </View>

        {/* Total Budget Card */}
        {budgets.length > 0 && (
          <View className="mx-5 mb-6">
            <LinearGradient
              colors={["#3D2010", "#1F1B19"]}
              style={{ borderRadius: 24, padding: 20 }}
            >
              <Text
                className="text-xs font-semibold tracking-widest mb-2"
                style={{ color: "#9B8B82" }}
              >
                ORÇAMENTO TOTAL
              </Text>

              <View className="flex-row items-end mb-1">
                <Text className="text-white text-4xl font-extrabold">
                  {formatCurrency(totalSpent)}
                </Text>
                <Text className="text-base mb-1 ml-1" style={{ color: "#6B5C52" }}>
                  / {formatCurrency(totalLimit)}
                </Text>
              </View>

              <View className="flex-row items-center justify-between mb-3 mt-2">
                <Text className="text-sm" style={{ color: "#9B8B82" }}>
                  {totalPercentage}% Utilizado
                </Text>
                <Text
                  className="text-sm font-semibold"
                  style={{ color: remaining >= 0 ? "#FF6B1A" : "#F44336" }}
                >
                  {remaining >= 0 ? `Restam ${formatCurrency(remaining)}` : `Excedido ${formatCurrency(Math.abs(remaining))}`}
                </Text>
              </View>

              {/* Progress bar */}
              <View
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
              >
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(totalPercentage, 100)}%`,
                    backgroundColor: totalPercentage >= 100 ? "#F44336" : "#FF6B1A",
                  }}
                />
              </View>

              {/* Stats */}
              <View className="flex-row mt-4 gap-6">
                <View>
                  <Text className="text-xs" style={{ color: "#9B8B82" }}>
                    Maior Gasto
                  </Text>
                  <Text className="text-white font-semibold text-sm mt-0.5">
                    {biggestCategory?.category || "—"}
                  </Text>
                </View>
                <View>
                  <Text className="text-xs" style={{ color: "#9B8B82" }}>
                    Dias Restantes
                  </Text>
                  <Text className="text-white font-semibold text-sm mt-0.5">
                    {daysRemaining} Dias
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Categories */}
        <View className="px-5">
          <Text className="text-white font-bold text-lg mb-4">Categorias</Text>

          {budgets.map((budget) => (
            <View
              key={budget.id}
              className="p-4 rounded-2xl mb-3"
              style={{
                backgroundColor: "#1F1B19",
                borderWidth: 1,
                borderColor: budget.exceeded
                  ? "rgba(244,67,54,0.3)"
                  : "rgba(255,255,255,0.06)",
              }}
            >
              <View className="flex-row items-start justify-between mb-2">
                <View className="flex-row items-center gap-3">
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center"
                    style={{
                      backgroundColor: budget.exceeded
                        ? "rgba(244,67,54,0.12)"
                        : "rgba(255,107,26,0.12)",
                    }}
                  >
                    <HomeIcon
                      size={18}
                      color={budget.exceeded ? "#F44336" : "#FF6B1A"}
                    />
                  </View>
                  <View>
                    <Text className="text-white font-semibold">
                      {budget.category}
                    </Text>
                    {budget.exceeded && (
                      <View className="flex-row items-center gap-1 mt-0.5">
                        <AlertTriangle size={12} color="#F44336" />
                        <Text className="text-xs" style={{ color: "#F44336" }}>
                          Orçamento Excedido
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View className="items-end">
                  <Text
                    className="font-bold"
                    style={{
                      color: budget.exceeded ? "#F44336" : "#F5F0EC",
                    }}
                  >
                    {formatCurrency(budget.spent)}
                  </Text>
                  <Text className="text-xs" style={{ color: "#6B5C52" }}>
                    de {formatCurrency(budget.amount_limit)}
                  </Text>
                </View>
              </View>

              {/* Progress */}
              <View
                className="h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
              >
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(budget.percentage, 100)}%`,
                    backgroundColor: budget.exceeded
                      ? "#F44336"
                      : budget.percentage >= 80
                      ? "#FF9800"
                      : "#FF6B1A",
                  }}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Empty state */}
        {budgets.length === 0 && (
          <View className="items-center py-16 px-5">
            <Text className="text-3xl mb-4">📊</Text>
            <Text className="text-white font-semibold text-base text-center mb-2">
              Nenhum orçamento definido
            </Text>
            <Text className="text-center text-sm" style={{ color: "#9B8B82" }}>
              Crie orçamentos para controlar seus gastos por categoria
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

import { View, ScrollView, Pressable, RefreshControl } from "react-native";
import { Text } from "@/components/ui/Text";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Bell,
  User,
} from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { formatCurrency } from "@/lib/format";

interface DashboardData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryBreakdown: { category: string; total: number; percentage: number }[];
  activeBudgets: {
    category: string;
    spent: number;
    limit: number;
    percentage: number;
  }[];
}

export default function DashboardScreen() {
  const router = useRouter();
  const { member, family } = useAuthStore();
  const [data, setData] = useState<DashboardData>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    categoryBreakdown: [],
    activeBudgets: [],
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!member?.family_id) return;

    try {
      // Get current month's transactions
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

      const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("family_id", member.family_id)
        .gte("date", startOfMonth)
        .lte("date", endOfMonth);

      const income = (transactions ?? [])
        .filter((t: any) => t.type === "income")
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

      const expense = (transactions ?? [])
        .filter((t: any) => t.type === "expense")
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

      // Category breakdown for expenses
      const categoryMap = new Map<string, number>();
      (transactions ?? [])
        .filter((t: any) => t.type === "expense")
        .forEach((t: any) => {
          const cat = t.category || "Outros";
          categoryMap.set(cat, (categoryMap.get(cat) || 0) + Number(t.amount));
        });

      const categoryBreakdown = Array.from(categoryMap.entries())
        .map(([category, total]) => ({
          category,
          total,
          percentage: expense > 0 ? Math.round((total / expense) * 100) : 0,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      // Get active budgets
      const { data: budgets } = await supabase
        .from("budgets")
        .select("*")
        .eq("family_id", member.family_id)
        .eq("month", now.getMonth() + 1)
        .eq("year", now.getFullYear());

      const activeBudgets = (budgets ?? []).map((b: any) => {
        const spent = categoryMap.get(b.category) || 0;
        return {
          category: b.category,
          spent,
          limit: Number(b.amount_limit),
          percentage: b.amount_limit > 0 ? Math.round((spent / b.amount_limit) * 100) : 0,
        };
      });

      setData({
        totalIncome: income,
        totalExpense: expense,
        balance: income - expense,
        categoryBreakdown,
        activeBudgets,
      });
    } catch (err) {
      console.error("Dashboard load error:", err);
    }
  }, [member?.family_id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time subscription
  useEffect(() => {
    if (!member?.family_id) return;

    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `family_id=eq.${member.family_id}`,
        },
        () => loadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [member?.family_id, loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const balanceColor =
    data.balance >= 0 ? "#4CAF50" : "#F44336";

  return (
    <View className="flex-1" style={{ backgroundColor: "#131315" }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF6B1A"
          />
        }
      >
        {/* Header */}
        <View
          className="flex-row items-center justify-between px-5 pt-14 pb-4"
        >
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
          <Pressable
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: "transparent" }}
          >
            <Bell size={22} color="#FF6B1A" />
          </Pressable>
        </View>

        {/* Balance Section */}
        <View className="px-5 pt-6 pb-4">
          <Text
            className="text-xs font-semibold tracking-widest mb-2"
            style={{ color: "#9B8B82" }}
          >
            SALDO LÍQUIDO
          </Text>
          <Text className="text-white text-4xl font-extrabold tracking-tight">
            {formatCurrency(data.balance)}
          </Text>
          <View className="flex-row items-center mt-2 gap-1">
            <TrendingUp size={14} color={balanceColor} />
            <Text style={{ color: balanceColor }} className="text-sm font-semibold">
              {data.balance >= 0 ? "Positivo" : "Negativo"} este mês
            </Text>
          </View>
        </View>

        {/* Income / Expense Cards */}
        <View className="flex-row px-5 gap-3 mb-6">
          {/* Income */}
          <View className="flex-1">
            <LinearGradient
              colors={["#2A2420", "#1F1B19"]}
              style={{ borderRadius: 20, padding: 16 }}
            >
              <View
                className="w-10 h-10 rounded-xl items-center justify-center mb-3"
                style={{ backgroundColor: "rgba(76,175,80,0.15)" }}
              >
                <ArrowDownLeft size={20} color="#4CAF50" />
              </View>
              <Text
                className="text-xs font-medium mb-1"
                style={{ color: "#9B8B82" }}
              >
                Entradas
              </Text>
              <Text className="text-white text-lg font-bold">
                {formatCurrency(data.totalIncome)}
              </Text>
            </LinearGradient>
          </View>

          {/* Expense */}
          <View className="flex-1">
            <LinearGradient
              colors={["#2A2420", "#1F1B19"]}
              style={{ borderRadius: 20, padding: 16 }}
            >
              <View
                className="w-10 h-10 rounded-xl items-center justify-center mb-3"
                style={{ backgroundColor: "rgba(244,67,54,0.15)" }}
              >
                <ArrowUpRight size={20} color="#F44336" />
              </View>
              <Text
                className="text-xs font-medium mb-1"
                style={{ color: "#9B8B82" }}
              >
                Saídas
              </Text>
              <Text className="text-white text-lg font-bold">
                {formatCurrency(data.totalExpense)}
              </Text>
            </LinearGradient>
          </View>
        </View>

        {/* Category Breakdown */}
        {data.categoryBreakdown.length > 0 && (
          <View className="mx-5 mb-6">
            <LinearGradient
              colors={["#2A2420", "#1F1B19"]}
              style={{ borderRadius: 24, padding: 20 }}
            >
              <Text className="text-white font-bold text-lg mb-4">
                Gastos por Categoria
              </Text>

              {data.categoryBreakdown.map((cat, i) => (
                <View key={cat.category} className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-2">
                    <View
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          ["#FF6B1A", "#FF8C42", "#FFA562", "#FFB582", "#E05C3A"][i] ?? "#9B8B82",
                      }}
                    />
                    <Text className="text-white text-sm">{cat.category}</Text>
                  </View>
                  <Text className="text-white text-sm font-semibold">
                    {cat.percentage}%
                  </Text>
                </View>
              ))}
            </LinearGradient>
          </View>
        )}

        {/* Active Budgets */}
        {data.activeBudgets.length > 0 && (
          <View className="px-5">
            <Text className="text-white font-bold text-lg mb-4">
              Orçamentos Ativos
            </Text>

            {data.activeBudgets.map((budget) => (
              <View
                key={budget.category}
                className="mb-3 p-4 rounded-2xl"
                style={{
                  backgroundColor: "#1F1B19",
                  borderWidth: 1,
                  borderColor: budget.percentage >= 100 ? "rgba(244,67,54,0.3)" : "rgba(255,255,255,0.06)",
                }}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View>
                    <Text className="text-white font-semibold">
                      {budget.category}
                    </Text>
                    <Text className="text-xs mt-0.5" style={{ color: "#9B8B82" }}>
                      {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                    </Text>
                  </View>
                  <Text
                    className="font-bold text-sm"
                    style={{
                      color:
                        budget.percentage >= 100
                          ? "#F44336"
                          : budget.percentage >= 80
                          ? "#FF9800"
                          : "#FF6B1A",
                    }}
                  >
                    {budget.percentage}%
                  </Text>
                </View>

                {/* Progress bar */}
                <View
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                >
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(budget.percentage, 100)}%`,
                      backgroundColor:
                        budget.percentage >= 100
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
        )}

        {/* Empty state */}
        {data.totalIncome === 0 && data.totalExpense === 0 && (
          <View className="px-5 py-10 items-center">
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: "#1F1B19" }}
            >
              <Text className="text-3xl">📊</Text>
            </View>
            <Text className="text-white font-bold text-lg text-center mb-2">
              Nenhuma transação ainda
            </Text>
            <Text className="text-center mb-6" style={{ color: "#9B8B82" }}>
              Adicione sua primeira transação para ver seus dados aqui
            </Text>
            <Pressable
              onPress={() => router.push("/(app)/modal/nova-transacao")}
            >
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
                <Text className="text-background font-bold text-sm">
                  + Nova Transação
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

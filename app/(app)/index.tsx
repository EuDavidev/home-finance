import { View, Pressable } from "react-native";
import { Text } from "@/components/ui/Text";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowDownLeft, ArrowUpRight, TrendingUp } from "lucide-react-native";
import { useAuthStore } from "@/stores/authStore";
import { transactionService } from "@/services/supabase/transactionService";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { formatCurrency } from "@/lib/format";
import { devError } from "@/lib/errorHandler";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { MonthlyTotals, CategoryBreakdown, BudgetWithSpending } from "@/types";
import { budgetService } from "@/services/supabase/budgetService";

interface DashboardData {
  totals: MonthlyTotals;
  categoryBreakdown: CategoryBreakdown[];
  activeBudgets: BudgetWithSpending[];
}

export default function DashboardScreen() {
  const router = useRouter();
  const { member } = useAuthStore();
  const [data, setData] = useState<DashboardData>({
    totals: { income: 0, expense: 0, balance: 0 },
    categoryBreakdown: [],
    activeBudgets: [],
  });
  const [refreshing, setRefreshing] = useState(false);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const loadData = useCallback(async () => {
    if (!member?.family_id) return;
    try {
      const [totals, categoryBreakdown, activeBudgets] = await Promise.all([
        transactionService.getMonthlyTotals(member.family_id, month, year),
        transactionService.getCategoryBreakdown(member.family_id, month, year),
        budgetService.getWithSpending(member.family_id, month, year),
      ]);
      setData({
        totals,
        categoryBreakdown: categoryBreakdown.slice(0, 5),
        activeBudgets,
      });
    } catch (err) {
      devError("Dashboard load error:", err);
    }
  }, [member?.family_id, month, year]);

  useEffect(() => { loadData(); }, [loadData]);

  useRealtimeSubscription("dashboard-rt", member?.family_id, "transactions", loadData);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const balanceColor = data.totals.balance >= 0 ? "#4CAF50" : "#F44336";
  const CAT_COLORS = ["#FF6B1A", "#FF8C42", "#FFA562", "#FFB582", "#E05C3A"];

  if (data.totals.income === 0 && data.totals.expense === 0) {
    return (
      <Screen title="Dashboard" refreshing={refreshing} onRefresh={onRefresh}>
        <EmptyState
          icon="📊"
          title="Nenhuma transação ainda"
          description="Adicione sua primeira transação para ver seus dados aqui"
          actionLabel="+ Nova Transação"
          onAction={() => router.push("/(app)/modal/nova-transacao")}
        />
      </Screen>
    );
  }

  return (
    <Screen title="" refreshing={refreshing} onRefresh={onRefresh}>
      {/* Balance Section */}
      <View className="px-5 pt-2 pb-4">
        <Text className="text-xs font-semibold tracking-widest mb-2" style={{ color: "#9B8B82" }}>
          SALDO LÍQUIDO
        </Text>
        <Text className="text-white text-4xl font-extrabold tracking-tight">
          {formatCurrency(data.totals.balance)}
        </Text>
        <View className="flex-row items-center mt-2 gap-1">
          <TrendingUp size={14} color={balanceColor} />
          <Text style={{ color: balanceColor }} className="text-sm font-semibold">
            {data.totals.balance >= 0 ? "Positivo" : "Negativo"} este mês
          </Text>
        </View>
      </View>

      {/* Income / Expense Cards */}
      <View className="flex-row px-5 gap-3 mb-6">
        <View className="flex-1">
          <Card variant="gradient">
            <View className="w-10 h-10 rounded-xl items-center justify-center mb-3" style={{ backgroundColor: "rgba(76,175,80,0.15)" }}>
              <ArrowDownLeft size={20} color="#4CAF50" />
            </View>
            <Text className="text-xs font-medium mb-1" style={{ color: "#9B8B82" }}>Entradas</Text>
            <Text className="text-white text-lg font-bold">{formatCurrency(data.totals.income)}</Text>
          </Card>
        </View>
        <View className="flex-1">
          <Card variant="gradient">
            <View className="w-10 h-10 rounded-xl items-center justify-center mb-3" style={{ backgroundColor: "rgba(244,67,54,0.15)" }}>
              <ArrowUpRight size={20} color="#F44336" />
            </View>
            <Text className="text-xs font-medium mb-1" style={{ color: "#9B8B82" }}>Saídas</Text>
            <Text className="text-white text-lg font-bold">{formatCurrency(data.totals.expense)}</Text>
          </Card>
        </View>
      </View>

      {/* Category Breakdown */}
      {data.categoryBreakdown.length > 0 && (
        <View className="mx-5 mb-6">
          <Card variant="gradient">
            <Text className="text-white font-bold text-lg mb-4">Gastos por Categoria</Text>
            {data.categoryBreakdown.map((cat, i) => (
              <View key={cat.category} className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                  <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CAT_COLORS[i] ?? "#9B8B82" }} />
                  <Text className="text-white text-sm">{cat.category}</Text>
                </View>
                <Text className="text-white text-sm font-semibold">{cat.percentage}%</Text>
              </View>
            ))}
          </Card>
        </View>
      )}

      {/* Active Budgets */}
      {data.activeBudgets.length > 0 && (
        <View className="px-5">
          <Text className="text-white font-bold text-lg mb-4">Orçamentos Ativos</Text>
          {data.activeBudgets.map((budget) => (
            <Card key={budget.id} variant="bordered" style={{
              marginBottom: 12,
              borderColor: budget.exceeded ? "rgba(244,67,54,0.3)" : "rgba(255,255,255,0.06)",
            }}>
              <View className="flex-row items-center justify-between mb-2">
                <View>
                  <Text className="text-white font-semibold">{budget.category}</Text>
                  <Text className="text-xs mt-0.5" style={{ color: "#9B8B82" }}>
                    {formatCurrency(budget.spent)} / {formatCurrency(budget.amount_limit)}
                  </Text>
                </View>
                <Text className="font-bold text-sm" style={{
                  color: budget.exceeded ? "#F44336" : budget.percentage >= 80 ? "#FF9800" : "#FF6B1A",
                }}>
                  {budget.percentage}%
                </Text>
              </View>
              <View className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                <View className="h-full rounded-full" style={{
                  width: `${Math.min(budget.percentage, 100)}%`,
                  backgroundColor: budget.exceeded ? "#F44336" : budget.percentage >= 80 ? "#FF9800" : "#FF6B1A",
                }} />
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

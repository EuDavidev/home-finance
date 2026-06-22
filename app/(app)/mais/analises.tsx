import { View } from "react-native";
import { Text } from "@/components/ui/Text";
import { useEffect, useState, useCallback } from "react";
import { TrendingUp, ArrowDown, ArrowUp } from "lucide-react-native";
import { useAuthStore } from "@/stores/authStore";
import { transactionService } from "@/services/supabase/transactionService";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { formatCurrency } from "@/lib/format";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { devError } from "@/lib/errorHandler";

const MONTHS_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

interface MonthData {
  month: number;
  year: number;
  income: number;
  expense: number;
  balance: number;
}

export default function AnalisesScreen() {
  const { member } = useAuthStore();
  const [monthlyData, setMonthlyData] = useState<MonthData[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!member?.family_id) return;
    try {
      const data = await transactionService.getMonthlyHistory(member.family_id);
      setMonthlyData(data);
    } catch (err) {
      devError("Error loading analytics:", err);
    }
  }, [member?.family_id]);

  useEffect(() => { loadData(); }, [loadData]);

  useRealtimeSubscription("analytics-rt", member?.family_id, "transactions", loadData);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const currentMonth = monthlyData[monthlyData.length - 1];
  const previousMonth = monthlyData[monthlyData.length - 2];
  const totalBalance = currentMonth?.balance ?? 0;
  const totalIncome = currentMonth?.income ?? 0;
  const totalExpense = currentMonth?.expense ?? 0;

  const balanceChange = previousMonth && previousMonth.balance !== 0
    ? ((totalBalance - previousMonth.balance) / Math.abs(previousMonth.balance)) * 100
    : 0;

  const maxIncomeExpense = Math.max(...monthlyData.map((d) => Math.max(d.income, d.expense)), 1);

  if (monthlyData.length === 0) {
    return (
      <Screen title="Análises e Gráficos" refreshing={refreshing} onRefresh={onRefresh}>
        <EmptyState icon="📈" title="Dados insuficientes" description="Adicione transações para ver suas análises financeiras aqui" />
      </Screen>
    );
  }

  return (
    <Screen title="Análises e Gráficos" subtitle="Visão detalhada do seu desempenho financeiro mensal." refreshing={refreshing} onRefresh={onRefresh}>
      {/* Total Balance Card */}
      <View className="mx-5 mb-4">
        <Card variant="gradient">
          <Text className="text-xs font-semibold tracking-widest mb-2" style={{ color: "#9B8B82" }}>SALDO TOTAL</Text>
          <Text className="text-white text-3xl font-extrabold mb-2">{formatCurrency(totalBalance)}</Text>
          <View className="flex-row items-center gap-1">
            <TrendingUp size={14} color={balanceChange >= 0 ? "#4CAF50" : "#F44336"} />
            <Text className="text-sm font-semibold" style={{ color: balanceChange >= 0 ? "#4CAF50" : "#F44336" }}>
              {balanceChange >= 0 ? "+" : ""}{balanceChange.toFixed(1)}% vs. mês anterior
            </Text>
          </View>
        </Card>
      </View>

      {/* Income / Expense Breakdown */}
      <View className="flex-row px-5 gap-3 mb-6">
        <View className="flex-1">
          <Card variant="bordered">
            <Text className="text-xs font-semibold tracking-widest mb-2" style={{ color: "#4CAF50" }}>RECEITAS</Text>
            <Text className="text-white text-lg font-bold">{formatCurrency(totalIncome)}</Text>
            <View className="w-8 h-8 rounded-full items-center justify-center mt-2 self-end" style={{ backgroundColor: "rgba(76,175,80,0.12)" }}>
              <ArrowDown size={16} color="#4CAF50" />
            </View>
          </Card>
        </View>
        <View className="flex-1">
          <Card variant="bordered">
            <Text className="text-xs font-semibold tracking-widest mb-2" style={{ color: "#F44336" }}>DESPESAS</Text>
            <Text className="text-white text-lg font-bold">{formatCurrency(totalExpense)}</Text>
            <View className="w-8 h-8 rounded-full items-center justify-center mt-2 self-end" style={{ backgroundColor: "rgba(244,67,54,0.12)" }}>
              <ArrowUp size={16} color="#F44336" />
            </View>
          </Card>
        </View>
      </View>

      {/* Bar Chart comparing income and expense */}
      <View className="mx-5 mb-6">
        <Card variant="gradient">
          <Text className="text-white font-bold text-base mb-4">Receitas vs Despesas</Text>
          <View className="flex-row items-end mt-4" style={{ height: 160 }}>
            {monthlyData.map((d) => {
              const incomeHeight = maxIncomeExpense > 0 ? Math.max((d.income / maxIncomeExpense) * 130, 2) : 2;
              const expenseHeight = maxIncomeExpense > 0 ? Math.max((d.expense / maxIncomeExpense) * 130, 2) : 2;

              return (
                <View key={`bar-${d.year}-${d.month}`} style={{ flex: 1, flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 3, height: "100%" }}>
                  <View style={{ width: 12, height: incomeHeight, borderRadius: 4, backgroundColor: "#FF6B1A" }} />
                  <View style={{ width: 12, height: expenseHeight, borderRadius: 4, backgroundColor: "#9B8B82" }} />
                </View>
              );
            })}
          </View>
          <View className="flex-row mt-2">
            {monthlyData.map((d) => (
              <View key={`label-${d.year}-${d.month}`} style={{ flex: 1, alignItems: "center" }}>
                <Text className="text-xs" style={{ color: "#6B5C52" }}>{MONTHS_SHORT[d.month]}</Text>
              </View>
            ))}
          </View>
        </Card>
      </View>
    </Screen>
  );
}

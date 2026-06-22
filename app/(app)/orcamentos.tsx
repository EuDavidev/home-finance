import { View } from "react-native";
import { Text } from "@/components/ui/Text";
import { useState, useCallback } from "react";
import { Home as HomeIcon, AlertTriangle } from "lucide-react-native";
import { formatCurrency } from "@/lib/format";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { useBudgets } from "@/hooks/useBudgets";

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function OrcamentosScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { budgets, totalSpent, totalLimit, totalPercentage, refetch } = useBudgets();

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = daysInMonth - now.getDate();
  const remaining = totalLimit - totalSpent;
  const biggestCategory = budgets.length > 0
    ? budgets.reduce((max, b) => (b.spent > max.spent ? b : max), budgets[0])
    : null;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <Screen
      title="Orçamentos Mensais"
      subtitle={`Visão geral e controle de gastos para ${MONTHS_PT[now.getMonth()]}`}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      {/* Total Budget Card */}
      {budgets.length > 0 && (
        <View className="mx-5 mb-6">
          <Card variant="gradient" gradientColors={["#3D2010", "#1F1B19"]}>
            <Text className="text-xs font-semibold tracking-widest mb-2" style={{ color: "#9B8B82" }}>
              ORÇAMENTO TOTAL
            </Text>
            <View className="flex-row items-end mb-1">
              <Text className="text-white text-4xl font-extrabold">{formatCurrency(totalSpent)}</Text>
              <Text className="text-base mb-1 ml-1" style={{ color: "#6B5C52" }}>/ {formatCurrency(totalLimit)}</Text>
            </View>
            <View className="flex-row items-center justify-between mb-3 mt-2">
              <Text className="text-sm" style={{ color: "#9B8B82" }}>{totalPercentage}% Utilizado</Text>
              <Text className="text-sm font-semibold" style={{ color: remaining >= 0 ? "#FF6B1A" : "#F44336" }}>
                {remaining >= 0 ? `Restam ${formatCurrency(remaining)}` : `Excedido ${formatCurrency(Math.abs(remaining))}`}
              </Text>
            </View>
            <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
              <View className="h-full rounded-full" style={{
                width: `${Math.min(totalPercentage, 100)}%`,
                backgroundColor: totalPercentage >= 100 ? "#F44336" : "#FF6B1A",
              }} />
            </View>
            <View className="flex-row mt-4 gap-6">
              <View>
                <Text className="text-xs" style={{ color: "#9B8B82" }}>Maior Gasto</Text>
                <Text className="text-white font-semibold text-sm mt-0.5">{biggestCategory?.category || "—"}</Text>
              </View>
              <View>
                <Text className="text-xs" style={{ color: "#9B8B82" }}>Dias Restantes</Text>
                <Text className="text-white font-semibold text-sm mt-0.5">{daysRemaining} Dias</Text>
              </View>
            </View>
          </Card>
        </View>
      )}

      {/* Categories */}
      <View className="px-5">
        {budgets.length > 0 && (
          <Text className="text-white font-bold text-lg mb-4">Categorias</Text>
        )}
        {budgets.map((budget) => (
          <Card key={budget.id} variant="bordered" style={{
            marginBottom: 12,
            borderColor: budget.exceeded ? "rgba(244,67,54,0.3)" : "rgba(255,255,255,0.06)",
          }}>
            <View className="flex-row items-start justify-between mb-2">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-xl items-center justify-center"
                  style={{ backgroundColor: budget.exceeded ? "rgba(244,67,54,0.12)" : "rgba(255,107,26,0.12)" }}>
                  <HomeIcon size={18} color={budget.exceeded ? "#F44336" : "#FF6B1A"} />
                </View>
                <View>
                  <Text className="text-white font-semibold">{budget.category}</Text>
                  {budget.exceeded && (
                    <View className="flex-row items-center gap-1 mt-0.5">
                      <AlertTriangle size={12} color="#F44336" />
                      <Text className="text-xs" style={{ color: "#F44336" }}>Orçamento Excedido</Text>
                    </View>
                  )}
                </View>
              </View>
              <View className="items-end">
                <Text className="font-bold" style={{ color: budget.exceeded ? "#F44336" : "#F5F0EC" }}>
                  {formatCurrency(budget.spent)}
                </Text>
                <Text className="text-xs" style={{ color: "#6B5C52" }}>de {formatCurrency(budget.amount_limit)}</Text>
              </View>
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

      {/* Empty state */}
      {budgets.length === 0 && (
        <EmptyState icon="📊" title="Nenhum orçamento definido"
          description="Crie orçamentos para controlar seus gastos por categoria" />
      )}
    </Screen>
  );
}

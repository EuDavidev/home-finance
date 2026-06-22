import { View, Pressable, Modal, ScrollView } from "react-native";
import { Text } from "@/components/ui/Text";
import { useState, useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Plus, X, Wallet, TrendingUp } from "lucide-react-native";
import { useAuthStore } from "@/stores/authStore";
import { debtService } from "@/services/supabase/debtService";
import { formatCurrency } from "@/lib/format";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { useDebts } from "@/hooks/useDebts";
import type { CreateDebtDTO, DebtType } from "@/types";

const DEBT_LABELS: Record<DebtType, string> = {
  mortgage: "Financiamento Imobiliário",
  credit_card: "Cartão de Crédito",
  personal_loan: "Empréstimo Pessoal",
  vehicle: "Veículo",
  other: "Outro",
};

export default function DividasScreen() {
  const { member } = useAuthStore();
  const { debts, totalDebt, totalMonthly, simulate, refetch } = useDebts();
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<DebtType>("other");
  const [formTotal, setFormTotal] = useState("");
  const [formRemaining, setFormRemaining] = useState("");
  const [formRate, setFormRate] = useState("");
  const [formMonthly, setFormMonthly] = useState("");
  const [formInstallments, setFormInstallments] = useState("");
  const [formPaid, setFormPaid] = useState("");

  // Simulator state
  const [simExtra, setSimExtra] = useState("");
  const [simPriority, setSimPriority] = useState(0);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const resetForm = () => {
    setFormName(""); setFormType("other"); setFormTotal(""); setFormRemaining("");
    setFormRate(""); setFormMonthly(""); setFormInstallments(""); setFormPaid("");
  };

  const handleSaveDebt = async () => {
    if (!member?.family_id || !formName || !formTotal) return;
    setSaving(true);
    try {
      const total = parseFloat(formTotal.replace(",", ".")) || 0;
      const remaining = parseFloat(formRemaining.replace(",", ".")) || total;
      const rate = parseFloat(formRate.replace(",", ".")) || 0;

      const dto: CreateDebtDTO = {
        family_id: member.family_id,
        name: formName,
        type: formType,
        total_amount: total,
        remaining_amount: remaining,
        interest_rate: rate,
        monthly_payment: parseFloat(formMonthly.replace(",", ".")) || 0,
        total_installments: parseInt(formInstallments) || undefined,
        paid_installments: parseInt(formPaid) || 0,
        alert: rate > 5 ? "Alerta de Juros Altos" : undefined,
      };

      await debtService.create(dto);
      setShowAddModal(false);
      resetForm();
    } catch {} finally {
      setSaving(false);
    }
  };

  const simResult = simExtra && debts.length > 0
    ? simulate(simPriority, parseFloat(simExtra.replace(",", ".")) || 0)
    : null;

  const comprometimento = totalMonthly > 0
    ? Math.min(Math.round((totalMonthly / (totalMonthly * 2.6)) * 100), 100)
    : 0;

  return (
    <Screen title="Controle de Dívidas" subtitle="Saldo Devedor Total" refreshing={refreshing} onRefresh={onRefresh}>
      {/* Total KPI Card */}
      <View className="px-5 mb-6">
        <Text className="text-white text-4xl font-extrabold mb-3">{formatCurrency(totalDebt)}</Text>
        {debts.length > 0 && (
          <View className="flex-row items-center gap-2 self-start px-4 py-2 rounded-full" style={{ backgroundColor: "#1F1B19" }}>
            <TrendingUp size={16} color="#FF6B1A" />
            <Text className="text-sm font-semibold" style={{ color: "#9B8B82" }}>COMPROMETIMENTO</Text>
            <Text className="font-bold" style={{ color: "#FF6B1A" }}>{comprometimento}%</Text>
          </View>
        )}
      </View>

      {/* Debts List */}
      {debts.length > 0 && (
        <View className="px-5 mb-6">
          <Text className="text-white font-bold text-lg mb-4">Dívidas Ativas</Text>
          {debts.map((debt, index) => {
            const hasAlert = !!debt.alert;
            const paidAmount = Number(debt.total_amount) - Number(debt.remaining_amount);
            const progressPct = Number(debt.total_amount) > 0 ? Math.round((paidAmount / Number(debt.total_amount)) * 100) : 0;

            return (
              <View key={debt.id} className="mb-3">
                <Card variant="bordered" style={{ borderColor: hasAlert ? "rgba(244,67,54,0.3)" : "rgba(255,255,255,0.06)" }}>
                  <Text className="text-white font-bold text-base mb-1">{debt.name}</Text>
                  <Text className="text-white text-2xl font-extrabold mb-1">{formatCurrency(Number(debt.remaining_amount))}</Text>
                  <Text className="text-xs mb-3" style={{ color: "#6B5C52" }}>SALDO RESTANTE</Text>
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-xs" style={{ color: "#9B8B82" }}>PROGRESSO PAGO</Text>
                    <Text className="text-xs font-semibold" style={{ color: "#FF6B1A" }}>{progressPct}%</Text>
                  </View>
                  <View className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                    <View className="h-full rounded-full" style={{ width: `${progressPct}%`, backgroundColor: hasAlert ? "#F44336" : "#FF6B1A" }} />
                  </View>
                </Card>
              </View>
            );
          })}
        </View>
      )}

      {/* Simulator */}
      {debts.length > 0 && (
        <View className="mx-5 mb-6">
          <Card variant="gradient">
            <Text className="text-white font-bold text-lg mb-4">Simulador de Antecipação</Text>
            <Input label="VALOR EXTRA MENSAL" placeholder="R$ 500,00" value={simExtra} onChangeText={setSimExtra} keyboardType="decimal-pad" style={{ marginBottom: 16 }} />
            <Text className="text-xs font-semibold mb-2" style={{ color: "#9B8B82" }}>ALOCAR EM</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
              {debts.map((d, i) => (
                <Pressable key={d.id} onPress={() => setSimPriority(i)} className="px-4 py-2 rounded-xl"
                  style={{ backgroundColor: simPriority === i ? "#FF6B1A" : "#131315" }}>
                  <Text className="text-xs font-medium" style={{ color: simPriority === i ? "#131315" : "#9B8B82" }}>{d.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
            {simResult && (
              <View className="rounded-2xl p-4 items-center" style={{ backgroundColor: "#131315" }}>
                <Text className="text-xs font-semibold mb-1" style={{ color: "#FF6B1A" }}>ECONOMIA EM JUROS</Text>
                <Text className="text-2xl font-extrabold mb-3" style={{ color: "#4CAF50" }}>{formatCurrency(simResult.savedInterest)}</Text>
                <Text className="text-xs" style={{ color: "#9B8B82" }}>Tempo reduzido:</Text>
                <Text className="text-white font-bold text-base">{simResult.timeLabel}</Text>
              </View>
            )}
          </Card>
        </View>
      )}

      {debts.length === 0 && (
        <EmptyState icon="💳" title="Nenhuma dívida cadastrada" description="Adicione suas dívidas para acompanhar pagamentos e simular antecipações" actionLabel="+ Adicionar Dívida" onAction={() => setShowAddModal(true)} />
      )}

      {/* FAB */}
      {debts.length > 0 && (
        <Pressable onPress={() => setShowAddModal(true)} className="absolute bottom-24 right-5" style={{ shadowColor: "#FF6B1A", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 }}>
          <LinearGradient colors={["#FFB59A", "#FF6B1A"]} style={{ width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" }}>
            <Plus size={24} color="#131315" strokeWidth={3} />
          </LinearGradient>
        </Pressable>
      )}

      {/* Add Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
          <Pressable className="flex-1" onPress={() => setShowAddModal(false)} />
          <View style={{ backgroundColor: "#1F1B19", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white font-bold text-lg">Nova Dívida</Text>
                <Pressable onPress={() => setShowAddModal(false)}><X size={22} color="#6B5C52" /></Pressable>
              </View>
              <Input placeholder="Nome da dívida" value={formName} onChangeText={setFormName} style={{ marginBottom: 12 }} />
              <View className="flex-row gap-3 mb-4">
                <Input placeholder="Valor total" value={formTotal} onChangeText={setFormTotal} keyboardType="decimal-pad" style={{ flex: 1 }} />
                <Input placeholder="Taxa juros (% a.a.)" value={formRate} onChangeText={setFormRate} keyboardType="decimal-pad" style={{ flex: 1 }} />
              </View>
              <View className="flex-row gap-3 mb-6">
                <Input placeholder="Parcela mensal" value={formMonthly} onChangeText={setFormMonthly} keyboardType="decimal-pad" style={{ flex: 1 }} />
                <Input placeholder="Total parcelas" value={formInstallments} onChangeText={setFormInstallments} keyboardType="number-pad" style={{ flex: 1 }} />
              </View>
              <Pressable onPress={handleSaveDebt} disabled={saving || !formName || !formTotal} style={{ opacity: saving ? 0.5 : 1 }}>
                <LinearGradient colors={["#FFB59A", "#FF6B1A"]} style={{ borderRadius: 16, height: 52, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: "#131315", fontWeight: "700", fontSize: 15 }}>{saving ? "Salvando..." : "Salvar"}</Text>
                </LinearGradient>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

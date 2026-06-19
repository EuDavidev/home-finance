import { View, ScrollView, Pressable, RefreshControl, TextInput, Modal } from "react-native";
import { Text } from "@/components/ui/Text";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  Bell,
  User,
  TrendingUp,
  AlertTriangle,
  Home as HomeIcon,
  CreditCard,
  Car,
  Landmark,
  Wallet,
  X,
  Plus,
  Banknote,
  ChevronDown,
} from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { formatCurrency } from "@/lib/format";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface Debt {
  id: string;
  name: string;
  type: string;
  total_amount: number;
  remaining_amount: number;
  interest_rate: number;
  monthly_payment: number;
  total_installments: number | null;
  paid_installments: number;
  alert: string | null;
}

const DEBT_ICONS: Record<string, any> = {
  mortgage: HomeIcon,
  credit_card: CreditCard,
  personal_loan: Banknote,
  vehicle: Car,
  other: Wallet,
};

const DEBT_LABELS: Record<string, string> = {
  mortgage: "Financiamento Imobiliário",
  credit_card: "Cartão de Crédito",
  personal_loan: "Empréstimo Pessoal",
  vehicle: "Veículo",
  other: "Outro",
};

export default function DividasScreen() {
  const router = useRouter();
  const { member } = useAuthStore();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("other");
  const [formTotal, setFormTotal] = useState("");
  const [formRemaining, setFormRemaining] = useState("");
  const [formRate, setFormRate] = useState("");
  const [formMonthly, setFormMonthly] = useState("");
  const [formInstallments, setFormInstallments] = useState("");
  const [formPaid, setFormPaid] = useState("");

  // Simulator state
  const [simExtra, setSimExtra] = useState("");
  const [simPriority, setSimPriority] = useState(0); // index into debts array

  const loadDebts = useCallback(async () => {
    if (!member?.family_id) return;

    try {
      const { data } = await supabase
        .from("debts")
        .select("*")
        .eq("family_id", member.family_id)
        .order("remaining_amount", { ascending: false });

      setDebts(data ?? []);
    } catch (err) {
      console.error("Error loading debts:", err);
    }
  }, [member?.family_id]);

  useEffect(() => {
    loadDebts();
  }, [loadDebts]);

  // Real-time
  useEffect(() => {
    if (!member?.family_id) return;

    const channel = supabase
      .channel("debts-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "debts", filter: `family_id=eq.${member.family_id}` },
        () => loadDebts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [member?.family_id, loadDebts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDebts();
    setRefreshing(false);
  }, [loadDebts]);

  const totalDebt = debts.reduce((sum, d) => sum + Number(d.remaining_amount), 0);
  const totalMonthly = debts.reduce((sum, d) => sum + Number(d.monthly_payment), 0);

  // Estimate monthly income from total debt ratio (use a basic heuristic)
  // For "comprometimento" we use monthly payments vs estimated income
  const comprometimento = totalMonthly > 0
    ? Math.min(Math.round((totalMonthly / (totalMonthly * 2.6)) * 100), 100)
    : 0;

  // Simulator calculation
  const simulateAntecipation = () => {
    const extra = parseFloat(simExtra.replace(",", ".")) || 0;
    if (extra <= 0 || debts.length === 0) return null;

    const targetDebt = debts[simPriority] ?? debts[0];
    if (!targetDebt) return null;

    const monthlyRate = Number(targetDebt.interest_rate) / 100 / 12;
    const remaining = Number(targetDebt.remaining_amount);
    const normalPayment = Number(targetDebt.monthly_payment);

    if (normalPayment <= 0) return null;

    // Calculate months without extra
    let balanceNormal = remaining;
    let monthsNormal = 0;
    let totalInterestNormal = 0;
    while (balanceNormal > 0 && monthsNormal < 600) {
      const interest = balanceNormal * monthlyRate;
      totalInterestNormal += interest;
      balanceNormal = balanceNormal + interest - normalPayment;
      monthsNormal++;
      if (balanceNormal < 0) balanceNormal = 0;
    }

    // Calculate months with extra
    let balanceExtra = remaining;
    let monthsExtra = 0;
    let totalInterestExtra = 0;
    const totalPayment = normalPayment + extra;
    while (balanceExtra > 0 && monthsExtra < 600) {
      const interest = balanceExtra * monthlyRate;
      totalInterestExtra += interest;
      balanceExtra = balanceExtra + interest - totalPayment;
      monthsExtra++;
      if (balanceExtra < 0) balanceExtra = 0;
    }

    const savedInterest = totalInterestNormal - totalInterestExtra;
    const savedMonths = monthsNormal - monthsExtra;
    const savedYears = Math.floor(savedMonths / 12);
    const savedRemMonths = savedMonths % 12;

    return {
      savedInterest: Math.max(savedInterest, 0),
      savedMonths,
      savedYears,
      savedRemMonths,
      timeLabel: savedYears > 0
        ? `${savedYears} ano${savedYears > 1 ? "s" : ""} e ${savedRemMonths} mes${savedRemMonths !== 1 ? "es" : ""}`
        : `${savedMonths} mes${savedMonths !== 1 ? "es" : ""}`,
    };
  };

  const simResult = simulateAntecipation();

  const resetForm = () => {
    setFormName("");
    setFormType("other");
    setFormTotal("");
    setFormRemaining("");
    setFormRate("");
    setFormMonthly("");
    setFormInstallments("");
    setFormPaid("");
  };

  const handleSaveDebt = async () => {
    if (!member?.family_id || !formName) return;
    setSaving(true);
    try {
      const total = parseFloat(formTotal.replace(",", ".")) || 0;
      const remaining = parseFloat(formRemaining.replace(",", ".")) || total;
      const rate = parseFloat(formRate.replace(",", ".")) || 0;

      await supabase.from("debts").insert({
        family_id: member.family_id,
        name: formName,
        type: formType,
        total_amount: total,
        remaining_amount: remaining,
        interest_rate: rate,
        monthly_payment: parseFloat(formMonthly.replace(",", ".")) || 0,
        total_installments: parseInt(formInstallments) || null,
        paid_installments: parseInt(formPaid) || 0,
        alert: rate > 5 ? "Alerta de Juros Altos" : null,
      });
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      console.error("Error saving debt:", err);
    } finally {
      setSaving(false);
    }
  };

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

        {/* KPI Section */}
        <View className="px-5 mb-6">
          <Text
            className="text-xs font-semibold tracking-widest mb-1"
            style={{ color: "#9B8B82" }}
          >
            CONTROLE DE DÍVIDAS
          </Text>
          <Text className="text-sm mb-2" style={{ color: "#9B8B82" }}>
            Saldo Devedor Total
          </Text>
          <Text className="text-white text-4xl font-extrabold mb-3">
            {formatCurrency(totalDebt)}
          </Text>

          {/* Comprometimento badge */}
          {debts.length > 0 && (
            <View
              className="flex-row items-center gap-2 self-start px-4 py-2 rounded-full"
              style={{ backgroundColor: "#1F1B19" }}
            >
              <TrendingUp size={16} color="#FF6B1A" />
              <Text className="text-sm font-semibold" style={{ color: "#9B8B82" }}>
                COMPROMETIMENTO
              </Text>
              <Text className="font-bold" style={{ color: "#FF6B1A" }}>
                {comprometimento}%
              </Text>
            </View>
          )}
        </View>

        {/* Active Debts */}
        {debts.length > 0 && (
          <View className="px-5 mb-6">
            <Text className="text-white font-bold text-lg mb-4">
              Dívidas Ativas
            </Text>

            {debts.map((debt, index) => {
              const Icon = DEBT_ICONS[debt.type] || Wallet;
              const paidAmount = Number(debt.total_amount) - Number(debt.remaining_amount);
              const progressPct = Number(debt.total_amount) > 0
                ? Math.round((paidAmount / Number(debt.total_amount)) * 100)
                : 0;
              const hasAlert = !!debt.alert;

              return (
                <View
                  key={debt.id}
                  className="p-5 rounded-2xl mb-3"
                  style={{
                    backgroundColor: "#1F1B19",
                    borderWidth: 1,
                    borderColor: hasAlert ? "rgba(244,67,54,0.3)" : "rgba(255,255,255,0.06)",
                  }}
                >
                  {/* Debt header */}
                  <Text className="text-white font-bold text-base mb-0.5">
                    {debt.name}
                  </Text>

                  {debt.interest_rate > 0 && (
                    <View className="flex-row items-center gap-1 mb-1">
                      <Icon size={13} color="#6B5C52" />
                      <Text className="text-xs" style={{ color: "#6B5C52" }}>
                        Taxa: {debt.interest_rate}% a.a.
                      </Text>
                    </View>
                  )}

                  {hasAlert && (
                    <View className="flex-row items-center gap-1 mb-2">
                      <AlertTriangle size={13} color="#F44336" />
                      <Text className="text-xs" style={{ color: "#F44336" }}>
                        {debt.alert}
                      </Text>
                    </View>
                  )}

                  {/* Remaining amount */}
                  <Text className="text-white text-2xl font-extrabold mb-1">
                    {formatCurrency(Number(debt.remaining_amount))}
                  </Text>
                  <Text className="text-xs mb-2" style={{ color: "#6B5C52" }}>
                    SALDO RESTANTE
                  </Text>

                  {/* Monthly payment */}
                  {Number(debt.monthly_payment) > 0 && (
                    <View className="flex-row items-center gap-1 mb-3">
                      <Landmark size={12} color="#6B5C52" />
                      <Text className="text-xs" style={{ color: "#6B5C52" }}>
                        Parcela: {formatCurrency(Number(debt.monthly_payment))}/mês
                      </Text>
                    </View>
                  )}

                  {/* Progress */}
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-xs" style={{ color: "#9B8B82" }}>
                      PROGRESSO PAGO
                    </Text>
                    <Text className="text-xs font-semibold" style={{ color: "#FF6B1A" }}>
                      {formatCurrency(paidAmount)} / {formatCurrency(Number(debt.total_amount))}
                    </Text>
                  </View>
                  <ProgressBar
                    percentage={progressPct}
                    height={5}
                    color={hasAlert ? "#F44336" : "#FF6B1A"}
                  />

                  {/* Limit usage for credit card type */}
                  {debt.type === "credit_card" && Number(debt.total_amount) > 0 && (
                    <View className="flex-row items-center justify-between mt-3">
                      <Text className="text-xs" style={{ color: "#9B8B82" }}>
                        LIMITE UTILIZADO
                      </Text>
                      <Text className="text-xs font-bold" style={{ color: "#FF6B1A" }}>
                        {Math.round((Number(debt.remaining_amount) / Number(debt.total_amount)) * 100)}%
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Simulator */}
        {debts.length > 0 && (
          <View className="mx-5 mb-6">
            <LinearGradient
              colors={["#2A2420", "#1F1B19"]}
              style={{ borderRadius: 24, padding: 20 }}
            >
              {/* Simulator header */}
              <View className="flex-row items-center gap-2 mb-4">
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center"
                  style={{ backgroundColor: "rgba(255,107,26,0.12)" }}
                >
                  <Text className="text-lg">🐷</Text>
                </View>
                <Text className="text-white font-bold text-lg">
                  Simulador de{"\n"}Antecipação
                </Text>
              </View>

              {/* Extra payment input */}
              <Text
                className="text-xs font-semibold tracking-widest mb-2"
                style={{ color: "#9B8B82" }}
              >
                VALOR EXTRA MENSAL (AMORTIZAÇÃO)
              </Text>
              <View
                className="rounded-xl px-4 py-3 mb-4"
                style={{
                  backgroundColor: "#131315",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.06)",
                }}
              >
                <TextInput
                  placeholder="R$ 1.500,00"
                  placeholderTextColor="#6B5C52"
                  value={simExtra}
                  onChangeText={setSimExtra}
                  keyboardType="decimal-pad"
                  style={{ color: "#F5F0EC", fontSize: 16 }}
                />
              </View>

              {/* Priority selector */}
              <Text
                className="text-xs font-semibold tracking-widest mb-2"
                style={{ color: "#9B8B82" }}
              >
                ALOCAR PRIORITARIAMENTE EM
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, marginBottom: 20 }}
              >
                {debts.map((d, i) => (
                  <Pressable
                    key={d.id}
                    onPress={() => setSimPriority(i)}
                    className="px-4 py-3 rounded-xl"
                    style={{
                      backgroundColor: simPriority === i ? "#FF6B1A" : "#131315",
                      borderWidth: 1,
                      borderColor: simPriority === i ? "#FF6B1A" : "rgba(255,255,255,0.06)",
                    }}
                  >
                    <Text
                      className="text-xs font-medium"
                      style={{ color: simPriority === i ? "#131315" : "#9B8B82" }}
                    >
                      {d.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Results */}
              {simResult && (
                <View
                  className="rounded-2xl p-5 items-center"
                  style={{ backgroundColor: "#131315" }}
                >
                  <Text
                    className="text-xs font-semibold tracking-widest mb-1"
                    style={{ color: "#FF6B1A" }}
                  >
                    ECONOMIA PROJETADA EM JUROS
                  </Text>
                  <Text className="text-3xl font-extrabold mb-1" style={{ color: "#4CAF50" }}>
                    {formatCurrency(simResult.savedInterest)}
                  </Text>

                  <Text className="text-xs mt-3 mb-1" style={{ color: "#9B8B82" }}>
                    Tempo total reduzido:
                  </Text>
                  <Text className="text-white font-bold text-lg mb-4">
                    {simResult.timeLabel}
                  </Text>

                  <Pressable>
                    <LinearGradient
                      colors={["#FFB59A", "#FF6B1A"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        borderRadius: 12,
                        paddingHorizontal: 24,
                        height: 44,
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "row",
                        gap: 6,
                      }}
                    >
                      <Text style={{ color: "#131315", fontWeight: "700", fontSize: 13 }}>
                        APLICAR SIMULAÇÃO
                      </Text>
                      <Text style={{ color: "#131315", fontSize: 16 }}>→</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              )}
            </LinearGradient>
          </View>
        )}

        {/* Empty state */}
        {debts.length === 0 && (
          <View className="items-center py-16 px-5">
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: "#1F1B19" }}
            >
              <Text className="text-3xl">💳</Text>
            </View>
            <Text className="text-white font-bold text-lg text-center mb-2">
              Nenhuma dívida cadastrada
            </Text>
            <Text className="text-center mb-6" style={{ color: "#9B8B82" }}>
              Adicione suas dívidas para acompanhar pagamentos e simular antecipações
            </Text>
            <Pressable onPress={() => setShowAddModal(true)}>
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
                <Text style={{ color: "#131315", fontWeight: "700", fontSize: 14 }}>
                  + Adicionar Dívida
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      {debts.length > 0 && (
        <Pressable
          onPress={() => setShowAddModal(true)}
          className="absolute bottom-24 right-5"
          style={{
            shadowColor: "#FF6B1A",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <LinearGradient
            colors={["#FFB59A", "#FF6B1A"]}
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Plus size={24} color="#131315" strokeWidth={3} />
          </LinearGradient>
        </Pressable>
      )}

      {/* Add Debt Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
          <Pressable className="flex-1" onPress={() => setShowAddModal(false)} />
          <View
            style={{
              backgroundColor: "#1F1B19",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              paddingBottom: 40,
              maxHeight: "85%",
            }}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Modal Header */}
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white font-bold text-lg">Nova Dívida</Text>
                <Pressable onPress={() => setShowAddModal(false)}>
                  <X size={22} color="#6B5C52" />
                </Pressable>
              </View>

              {/* Name */}
              <TextInput
                placeholder="Nome da dívida"
                placeholderTextColor="#6B5C52"
                value={formName}
                onChangeText={setFormName}
                style={{
                  color: "#F5F0EC",
                  fontSize: 15,
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: "rgba(255,255,255,0.06)",
                  marginBottom: 16,
                }}
              />

              {/* Type selector */}
              <Text className="text-xs font-semibold tracking-widest mb-3" style={{ color: "#9B8B82" }}>
                TIPO
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, marginBottom: 16 }}
              >
                {Object.entries(DEBT_LABELS).map(([key, label]) => (
                  <Pressable
                    key={key}
                    onPress={() => setFormType(key)}
                    className="px-4 py-2.5 rounded-xl"
                    style={{
                      backgroundColor: formType === key ? "#FF6B1A" : "#131315",
                      borderWidth: 1,
                      borderColor: formType === key ? "#FF6B1A" : "rgba(255,255,255,0.06)",
                    }}
                  >
                    <Text
                      className="text-xs font-medium"
                      style={{ color: formType === key ? "#131315" : "#9B8B82" }}
                    >
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Amount fields */}
              <View className="flex-row gap-3 mb-4">
                <TextInput
                  placeholder="Valor total"
                  placeholderTextColor="#6B5C52"
                  value={formTotal}
                  onChangeText={setFormTotal}
                  keyboardType="decimal-pad"
                  style={{
                    flex: 1,
                    color: "#F5F0EC",
                    fontSize: 15,
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: "rgba(255,255,255,0.06)",
                  }}
                />
                <TextInput
                  placeholder="Saldo restante"
                  placeholderTextColor="#6B5C52"
                  value={formRemaining}
                  onChangeText={setFormRemaining}
                  keyboardType="decimal-pad"
                  style={{
                    flex: 1,
                    color: "#F5F0EC",
                    fontSize: 15,
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: "rgba(255,255,255,0.06)",
                  }}
                />
              </View>

              <View className="flex-row gap-3 mb-4">
                <TextInput
                  placeholder="Taxa juros (% a.a.)"
                  placeholderTextColor="#6B5C52"
                  value={formRate}
                  onChangeText={setFormRate}
                  keyboardType="decimal-pad"
                  style={{
                    flex: 1,
                    color: "#F5F0EC",
                    fontSize: 15,
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: "rgba(255,255,255,0.06)",
                  }}
                />
                <TextInput
                  placeholder="Parcela mensal"
                  placeholderTextColor="#6B5C52"
                  value={formMonthly}
                  onChangeText={setFormMonthly}
                  keyboardType="decimal-pad"
                  style={{
                    flex: 1,
                    color: "#F5F0EC",
                    fontSize: 15,
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: "rgba(255,255,255,0.06)",
                  }}
                />
              </View>

              <View className="flex-row gap-3 mb-6">
                <TextInput
                  placeholder="Total parcelas"
                  placeholderTextColor="#6B5C52"
                  value={formInstallments}
                  onChangeText={setFormInstallments}
                  keyboardType="number-pad"
                  style={{
                    flex: 1,
                    color: "#F5F0EC",
                    fontSize: 15,
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: "rgba(255,255,255,0.06)",
                  }}
                />
                <TextInput
                  placeholder="Parcelas pagas"
                  placeholderTextColor="#6B5C52"
                  value={formPaid}
                  onChangeText={setFormPaid}
                  keyboardType="number-pad"
                  style={{
                    flex: 1,
                    color: "#F5F0EC",
                    fontSize: 15,
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: "rgba(255,255,255,0.06)",
                  }}
                />
              </View>

              {/* Save Button */}
              <Pressable
                onPress={handleSaveDebt}
                disabled={saving || !formName || !formTotal}
                style={{ opacity: saving ? 0.5 : 1 }}
              >
                <LinearGradient
                  colors={["#FFB59A", "#FF6B1A"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 16,
                    height: 52,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#131315", fontWeight: "700", fontSize: 15 }}>
                    {saving ? "Salvando..." : "Salvar Dívida"}
                  </Text>
                </LinearGradient>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

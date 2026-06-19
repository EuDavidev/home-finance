import { View, ScrollView, Pressable, RefreshControl, TextInput, Modal } from "react-native";
import { Text } from "@/components/ui/Text";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  Bell,
  User,
  Plus,
  MoreVertical,
  Heart,
  CreditCard,
  X,
} from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { formatCurrency } from "@/lib/format";

interface Account {
  id: string;
  name: string;
  type: string;
  bank: string | null;
  account_number: string | null;
  balance: number;
  color: string;
  member_id: string | null;
}

interface CreditCardItem {
  id: string;
  account_id: string | null;
  name: string;
  last_four: string | null;
  credit_limit: number;
  current_bill: number;
  closing_day: number | null;
  color: string;
}

export default function ContasScreen() {
  const router = useRouter();
  const { member } = useAuthStore();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<CreditCardItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<"account" | "card">("account");

  // Form state for new account
  const [formName, setFormName] = useState("");
  const [formBank, setFormBank] = useState("");
  const [formNumber, setFormNumber] = useState("");
  const [formBalance, setFormBalance] = useState("");
  const [formType, setFormType] = useState<"corrente" | "poupanca">("corrente");

  // Form state for new card
  const [cardName, setCardName] = useState("");
  const [cardLastFour, setCardLastFour] = useState("");
  const [cardLimit, setCardLimit] = useState("");
  const [cardClosingDay, setCardClosingDay] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!member?.family_id) return;

    try {
      const [accountsRes, cardsRes] = await Promise.all([
        supabase
          .from("accounts")
          .select("*")
          .eq("family_id", member.family_id)
          .order("created_at", { ascending: true }),
        supabase
          .from("credit_cards")
          .select("*")
          .eq("family_id", member.family_id)
          .order("created_at", { ascending: true }),
      ]);

      setAccounts(accountsRes.data ?? []);
      setCards(cardsRes.data ?? []);
    } catch (err) {
      console.error("Error loading accounts:", err);
    }
  }, [member?.family_id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time
  useEffect(() => {
    if (!member?.family_id) return;

    const channel = supabase
      .channel("accounts-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "accounts", filter: `family_id=eq.${member.family_id}` },
        () => loadData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "credit_cards", filter: `family_id=eq.${member.family_id}` },
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

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  const getMonthName = (day: number | null) => {
    if (!day) return "";
    const now = new Date();
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${day}/${months[now.getMonth()]}`;
  };

  const resetForm = () => {
    setFormName("");
    setFormBank("");
    setFormNumber("");
    setFormBalance("");
    setFormType("corrente");
    setCardName("");
    setCardLastFour("");
    setCardLimit("");
    setCardClosingDay("");
  };

  const handleSaveAccount = async () => {
    if (!member?.family_id || !formName) return;
    setSaving(true);
    try {
      await supabase.from("accounts").insert({
        family_id: member.family_id,
        member_id: member.id,
        name: formName,
        type: formType,
        bank: formBank || null,
        account_number: formNumber || null,
        balance: parseFloat(formBalance.replace(",", ".")) || 0,
        color: "#FF6B1A",
      });
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      console.error("Error saving account:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCard = async () => {
    if (!member?.family_id || !cardName) return;
    setSaving(true);
    try {
      await supabase.from("credit_cards").insert({
        family_id: member.family_id,
        account_id: accounts.length > 0 ? accounts[0].id : null,
        name: cardName,
        last_four: cardLastFour || null,
        credit_limit: parseFloat(cardLimit.replace(",", ".")) || 0,
        current_bill: 0,
        closing_day: parseInt(cardClosingDay) || null,
        color: "#FF6B1A",
      });
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      console.error("Error saving card:", err);
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
              style={{ backgroundColor: member?.color || "#FF6B1A" }}
            >
              <User size={18} color="#FFF" />
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
            Contas e Cartões
          </Text>
          <Text className="mt-1" style={{ color: "#9B8B82" }}>
            Visão geral do patrimônio
          </Text>
        </View>

        {/* Total Balance Card */}
        <View className="mx-5 mb-6">
          <LinearGradient
            colors={["#3D2010", "#2A1A0E", "#1F1B19"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 24, padding: 24 }}
          >
            <Text
              className="text-xs font-semibold tracking-widest mb-2"
              style={{ color: "#9B8B82" }}
            >
              SALDO TOTAL DISPONÍVEL
            </Text>
            <Text className="text-white text-4xl font-extrabold mb-4">
              {formatCurrency(totalBalance)}
            </Text>
            <Pressable
              onPress={() => {
                setAddType("account");
                setShowAddModal(true);
              }}
            >
              <LinearGradient
                colors={["#FFB59A", "#FF6B1A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 12,
                  paddingHorizontal: 20,
                  height: 40,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 6,
                  alignSelf: "flex-start",
                }}
              >
                <Plus size={16} color="#131315" strokeWidth={3} />
                <Text style={{ color: "#131315", fontWeight: "700", fontSize: 13 }}>
                  Adicionar
                </Text>
              </LinearGradient>
            </Pressable>
          </LinearGradient>
        </View>

        {/* Account Cards */}
        {accounts.map((account) => {
          const accountCards = cards.filter((c) => c.account_id === account.id);
          const totalBill = accountCards.reduce((sum, c) => sum + Number(c.current_bill), 0);
          const totalLimit = accountCards.reduce((sum, c) => sum + Number(c.credit_limit), 0);
          const available = totalLimit - totalBill;

          return (
            <View
              key={account.id}
              className="mx-5 mb-4 p-5 rounded-2xl"
              style={{
                backgroundColor: "#1F1B19",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.06)",
              }}
            >
              {/* Account Header */}
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-3">
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center"
                    style={{ backgroundColor: "rgba(255,107,26,0.12)" }}
                  >
                    <User size={18} color={account.color || "#FF6B1A"} />
                  </View>
                  <View>
                    <Text className="text-white font-semibold text-base">
                      {account.name}
                    </Text>
                    <Text className="text-xs" style={{ color: "#6B5C52" }}>
                      {account.type === "corrente" ? "Corrente" : "Poupança"}
                      {account.account_number ? ` • ${account.account_number}` : ""}
                    </Text>
                  </View>
                </View>
                <MoreVertical size={18} color="#6B5C52" />
              </View>

              {/* Balance */}
              <View className="mb-3">
                <Text className="text-xs font-semibold tracking-widest" style={{ color: "#9B8B82" }}>
                  SALDO
                </Text>
                <Text className="text-white text-xl font-bold mt-1">
                  {formatCurrency(Number(account.balance))}
                </Text>
              </View>

              {/* Divider */}
              <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginVertical: 12 }} />

              {/* Card Stats */}
              {accountCards.length > 0 && (
                <View className="flex-row justify-between">
                  <View>
                    <Text className="text-xs font-semibold tracking-widest" style={{ color: "#9B8B82" }}>
                      FATURA ATUAL
                    </Text>
                    <Text className="text-white font-bold mt-1">
                      {formatCurrency(totalBill)}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-xs font-semibold tracking-widest" style={{ color: "#9B8B82" }}>
                      LIMITE DISPONÍVEL
                    </Text>
                    <Text className="font-bold mt-1" style={{ color: "#FF6B1A" }}>
                      {formatCurrency(available)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          );
        })}

        {/* Credit Cards Section */}
        {cards.length > 0 && (
          <View className="px-5 mt-4">
            <Text className="text-white font-bold text-lg mb-4">
              Cartões Ativos
            </Text>

            {cards.map((card) => {
              const availableLimit = Number(card.credit_limit) - Number(card.current_bill);

              return (
                <View
                  key={card.id}
                  className="flex-row items-center p-4 rounded-2xl mb-3"
                  style={{
                    backgroundColor: "#1F1B19",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.06)",
                  }}
                >
                  {/* Card badge */}
                  <View
                    className="w-12 h-8 rounded-lg items-center justify-center mr-4"
                    style={{ backgroundColor: card.color || "#6B5C52" }}
                  >
                    <Text className="text-white text-xs font-bold">
                      {card.last_four || "••••"}
                    </Text>
                  </View>

                  <View className="flex-1">
                    <Text className="text-white font-semibold text-sm">
                      {card.name}
                    </Text>
                    <Text className="text-xs mt-0.5" style={{ color: "#6B5C52" }}>
                      Fechamento: {getMonthName(card.closing_day)}
                    </Text>
                  </View>

                  <View className="items-end">
                    <Text className="text-white font-bold text-sm">
                      {formatCurrency(Number(card.current_bill))}
                    </Text>
                    <View
                      className="mt-1 px-2 py-0.5 rounded"
                      style={{ backgroundColor: "rgba(255,107,26,0.15)" }}
                    >
                      <Text
                        className="text-xs font-semibold"
                        style={{ color: "#FF6B1A" }}
                      >
                        FATURA ABERTA
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Empty state */}
        {accounts.length === 0 && cards.length === 0 && (
          <View className="items-center py-16 px-5">
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: "#1F1B19" }}
            >
              <Text className="text-3xl">🏦</Text>
            </View>
            <Text className="text-white font-bold text-lg text-center mb-2">
              Nenhuma conta cadastrada
            </Text>
            <Text className="text-center mb-6" style={{ color: "#9B8B82" }}>
              Adicione suas contas bancárias e cartões de crédito
            </Text>
            <Pressable
              onPress={() => {
                setAddType("account");
                setShowAddModal(true);
              }}
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
                <Text style={{ color: "#131315", fontWeight: "700", fontSize: 14 }}>
                  + Adicionar Conta
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Add Modal */}
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
            }}
          >
            {/* Modal Header */}
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white font-bold text-lg">
                {addType === "account" ? "Nova Conta" : "Novo Cartão"}
              </Text>
              <Pressable onPress={() => setShowAddModal(false)}>
                <X size={22} color="#6B5C52" />
              </Pressable>
            </View>

            {/* Type Toggle */}
            <View
              className="flex-row rounded-2xl overflow-hidden mb-6"
              style={{ backgroundColor: "#131315" }}
            >
              <Pressable
                onPress={() => setAddType("account")}
                className="flex-1 py-3 items-center rounded-2xl"
                style={{
                  backgroundColor: addType === "account" ? "#2A2420" : "transparent",
                }}
              >
                <Text
                  className="font-semibold text-sm"
                  style={{ color: addType === "account" ? "#F5F0EC" : "#6B5C52" }}
                >
                  Conta
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setAddType("card")}
                className="flex-1 py-3 items-center rounded-2xl"
                style={{
                  backgroundColor: addType === "card" ? "#2A2420" : "transparent",
                }}
              >
                <Text
                  className="font-semibold text-sm"
                  style={{ color: addType === "card" ? "#F5F0EC" : "#6B5C52" }}
                >
                  Cartão
                </Text>
              </Pressable>
            </View>

            {addType === "account" ? (
              <>
                <TextInput
                  placeholder="Nome da conta"
                  placeholderTextColor="#6B5C52"
                  value={formName}
                  onChangeText={setFormName}
                  style={{
                    color: "#F5F0EC",
                    fontSize: 15,
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: "rgba(255,255,255,0.06)",
                    marginBottom: 12,
                  }}
                />
                <TextInput
                  placeholder="Banco"
                  placeholderTextColor="#6B5C52"
                  value={formBank}
                  onChangeText={setFormBank}
                  style={{
                    color: "#F5F0EC",
                    fontSize: 15,
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: "rgba(255,255,255,0.06)",
                    marginBottom: 12,
                  }}
                />
                <View className="flex-row gap-3 mb-4">
                  <TextInput
                    placeholder="Nº da conta"
                    placeholderTextColor="#6B5C52"
                    value={formNumber}
                    onChangeText={setFormNumber}
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
                    placeholder="Saldo inicial"
                    placeholderTextColor="#6B5C52"
                    value={formBalance}
                    onChangeText={setFormBalance}
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
                {/* Type selector */}
                <View className="flex-row gap-3 mb-6">
                  {(["corrente", "poupanca"] as const).map((t) => (
                    <Pressable
                      key={t}
                      onPress={() => setFormType(t)}
                      className="flex-1 py-3 items-center rounded-xl"
                      style={{
                        backgroundColor: formType === t ? "#FF6B1A" : "#131315",
                        borderWidth: 1,
                        borderColor: formType === t ? "#FF6B1A" : "rgba(255,255,255,0.06)",
                      }}
                    >
                      <Text
                        className="font-semibold text-sm"
                        style={{ color: formType === t ? "#131315" : "#9B8B82" }}
                      >
                        {t === "corrente" ? "Corrente" : "Poupança"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : (
              <>
                <TextInput
                  placeholder="Nome do cartão"
                  placeholderTextColor="#6B5C52"
                  value={cardName}
                  onChangeText={setCardName}
                  style={{
                    color: "#F5F0EC",
                    fontSize: 15,
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: "rgba(255,255,255,0.06)",
                    marginBottom: 12,
                  }}
                />
                <View className="flex-row gap-3 mb-4">
                  <TextInput
                    placeholder="Últimos 4 dígitos"
                    placeholderTextColor="#6B5C52"
                    value={cardLastFour}
                    onChangeText={setCardLastFour}
                    maxLength={4}
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
                    placeholder="Dia fechamento"
                    placeholderTextColor="#6B5C52"
                    value={cardClosingDay}
                    onChangeText={setCardClosingDay}
                    keyboardType="number-pad"
                    maxLength={2}
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
                <TextInput
                  placeholder="Limite do cartão"
                  placeholderTextColor="#6B5C52"
                  value={cardLimit}
                  onChangeText={setCardLimit}
                  keyboardType="decimal-pad"
                  style={{
                    color: "#F5F0EC",
                    fontSize: 15,
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: "rgba(255,255,255,0.06)",
                    marginBottom: 24,
                  }}
                />
              </>
            )}

            {/* Save Button */}
            <Pressable
              onPress={addType === "account" ? handleSaveAccount : handleSaveCard}
              disabled={saving || (addType === "account" ? !formName : !cardName)}
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
                  {saving ? "Salvando..." : "Salvar"}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

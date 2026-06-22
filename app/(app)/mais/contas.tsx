import { View, Pressable, Modal, ScrollView } from "react-native";
import { Text } from "@/components/ui/Text";
import { useState, useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { User, Plus, MoreVertical, X } from "lucide-react-native";
import { useAuthStore } from "@/stores/authStore";
import { accountService } from "@/services/supabase/accountService";
import { formatCurrency } from "@/lib/format";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { useAccounts } from "@/hooks/useAccounts";
import type { CreateAccountDTO, CreateCreditCardDTO } from "@/types";

export default function ContasScreen() {
  const { member } = useAuthStore();
  const { accounts, cards, totalBalance, refetch } = useAccounts();
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<"account" | "card">("account");
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState("");
  const [formBank, setFormBank] = useState("");
  const [formNumber, setFormNumber] = useState("");
  const [formBalance, setFormBalance] = useState("");
  const [formType, setFormType] = useState<"corrente" | "poupanca">("corrente");
  const [cardName, setCardName] = useState("");
  const [cardLastFour, setCardLastFour] = useState("");
  const [cardLimit, setCardLimit] = useState("");
  const [cardClosingDay, setCardClosingDay] = useState("");

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await refetch(); setRefreshing(false);
  }, [refetch]);

  const resetForm = () => {
    setFormName(""); setFormBank(""); setFormNumber(""); setFormBalance("");
    setCardName(""); setCardLastFour(""); setCardLimit(""); setCardClosingDay("");
  };

  const handleSave = async () => {
    if (!member?.family_id) return;
    setSaving(true);
    try {
      if (addType === "account") {
        await accountService.createAccount({
          family_id: member.family_id, member_id: member.id, name: formName, type: formType,
          bank: formBank || undefined, account_number: formNumber || undefined,
          balance: parseFloat(formBalance.replace(",", ".")) || 0, color: "#FF6B1A",
        });
      } else {
        await accountService.createCard({
          family_id: member.family_id, account_id: accounts[0]?.id, name: cardName,
          last_four: cardLastFour || undefined, credit_limit: parseFloat(cardLimit.replace(",", ".")) || 0,
          closing_day: parseInt(cardClosingDay) || undefined, color: "#FF6B1A",
        });
      }
      setShowAddModal(false); resetForm();
    } catch {} finally { setSaving(false); }
  };

  return (
    <Screen title="Contas e Cartões" subtitle="Visão geral do patrimônio" refreshing={refreshing} onRefresh={onRefresh}>
      <View className="mx-5 mb-6">
        <Card variant="gradient" gradientColors={["#3D2010", "#2A1A0E", "#1F1B19"]}>
          <Text className="text-xs font-semibold tracking-widest mb-2" style={{ color: "#9B8B82" }}>SALDO TOTAL DISPONÍVEL</Text>
          <Text className="text-white text-4xl font-extrabold mb-4">{formatCurrency(totalBalance)}</Text>
          <Pressable onPress={() => { setAddType("account"); setShowAddModal(true); }}>
            <LinearGradient colors={["#FFB59A", "#FF6B1A"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{ borderRadius: 12, paddingHorizontal: 20, height: 40, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6, alignSelf: "flex-start" }}>
              <Plus size={16} color="#131315" strokeWidth={3} />
              <Text style={{ color: "#131315", fontWeight: "700", fontSize: 13 }}>Adicionar</Text>
            </LinearGradient>
          </Pressable>
        </Card>
      </View>

      {accounts.map((acct) => (
        <View key={acct.id} className="mx-5 mb-4">
          <Card variant="bordered">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: "rgba(255,107,26,0.12)" }}>
                  <User size={18} color={acct.color || "#FF6B1A"} />
                </View>
                <View>
                  <Text className="text-white font-semibold text-base">{acct.name}</Text>
                  <Text className="text-xs" style={{ color: "#6B5C52" }}>{acct.type === "corrente" ? "Corrente" : "Poupança"}</Text>
                </View>
              </View>
              <MoreVertical size={18} color="#6B5C52" />
            </View>
            <Text className="text-xs font-semibold tracking-widest" style={{ color: "#9B8B82" }}>SALDO</Text>
            <Text className="text-white text-xl font-bold mt-1">{formatCurrency(Number(acct.balance))}</Text>
          </Card>
        </View>
      ))}

      {cards.length > 0 && (
        <View className="px-5 mt-4">
          <Text className="text-white font-bold text-lg mb-4">Cartões Ativos</Text>
          {cards.map((card) => (
            <Card key={card.id} variant="bordered" style={{ marginBottom: 12, flexDirection: "row", alignItems: "center" }}>
              <View className="w-12 h-8 rounded-lg items-center justify-center mr-4" style={{ backgroundColor: card.color || "#6B5C52" }}>
                <Text className="text-white text-xs font-bold">{card.last_four || "••••"}</Text>
              </View>
              <View className="flex-1"><Text className="text-white font-semibold text-sm">{card.name}</Text></View>
              <Text className="text-white font-bold text-sm">{formatCurrency(Number(card.current_bill))}</Text>
            </Card>
          ))}
        </View>
      )}

      {accounts.length === 0 && cards.length === 0 && (
        <EmptyState icon="🏦" title="Nenhuma conta cadastrada" description="Adicione suas contas bancárias" actionLabel="+ Adicionar Conta" onAction={() => { setAddType("account"); setShowAddModal(true); }} />
      )}

      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
          <Pressable className="flex-1" onPress={() => setShowAddModal(false)} />
          <View style={{ backgroundColor: "#1F1B19", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white font-bold text-lg">{addType === "account" ? "Nova Conta" : "Novo Cartão"}</Text>
              <Pressable onPress={() => setShowAddModal(false)}><X size={22} color="#6B5C52" /></Pressable>
            </View>
            {addType === "account" ? (
              <>
                <Input variant="underline" placeholder="Nome da conta" value={formName} onChangeText={setFormName} style={{ marginBottom: 12 }} />
                <Input variant="underline" placeholder="Banco" value={formBank} onChangeText={setFormBank} style={{ marginBottom: 12 }} />
                <Input variant="underline" placeholder="Saldo inicial" value={formBalance} onChangeText={setFormBalance} keyboardType="decimal-pad" style={{ marginBottom: 16 }} />
              </>
            ) : (
              <>
                <Input variant="underline" placeholder="Nome do cartão" value={cardName} onChangeText={setCardName} style={{ marginBottom: 12 }} />
                <Input variant="underline" placeholder="Limite" value={cardLimit} onChangeText={setCardLimit} keyboardType="decimal-pad" style={{ marginBottom: 16 }} />
              </>
            )}
            <Pressable onPress={handleSave} disabled={saving || (addType === "account" ? !formName : !cardName)} style={{ opacity: saving ? 0.5 : 1 }}>
              <LinearGradient colors={["#FFB59A", "#FF6B1A"]} style={{ borderRadius: 16, height: 52, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#131315", fontWeight: "700", fontSize: 15 }}>{saving ? "Salvando..." : "Salvar"}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

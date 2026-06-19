import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Upload, User } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { DEFAULT_CATEGORIES } from "@/constants/categories";

export default function NovaTransacaoScreen() {
  const router = useRouter();
  const { member, family } = useAuthStore();
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>("");

  useEffect(() => {
    if (member) {
      setSelectedMember(member.id);
    }
    loadFamilyMembers();
  }, [member]);

  const loadFamilyMembers = async () => {
    if (!member?.family_id) return;
    const { data } = await supabase
      .from("family_members")
      .select("id, name, color")
      .eq("family_id", member.family_id);
    if (data) setFamilyMembers(data);
  };

  const handleSave = async () => {
    if (!member?.family_id || !amount || !description) return;

    try {
      setError("");
      setLoading(true);

      const selectedMemberData = familyMembers.find((m) => m.id === selectedMember);

      const { error: insertError } = await supabase.from("transactions").insert({
        family_id: member.family_id,
        member_id: selectedMember || member.id,
        member_name: selectedMemberData?.name || member.name,
        type,
        amount: parseFloat(amount.replace(",", ".")),
        description,
        category: category || (type === "income" ? "Renda" : "Outros"),
        date,
      });

      if (insertError) throw insertError;
      router.back();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar transação");
    } finally {
      setLoading(false);
    }
  };

  const categories = type === "expense"
    ? DEFAULT_CATEGORIES.filter((c) => c.group !== "financeiro" || c.key === "dividas")
    : DEFAULT_CATEGORIES.filter((c) => c.key === "renda" || c.key === "investimentos");

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: "#131315" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-14 pb-4">
          <Pressable onPress={() => router.back()} className="flex-row items-center gap-2">
            <ArrowLeft size={20} color="#FF6B1A" />
            <Text className="text-white font-bold text-base tracking-wider">
              HOME FINANCE
            </Text>
          </Pressable>
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: member?.color || "#FF6B1A" }}
          >
            <Text className="text-white font-bold text-sm">
              {member?.name?.charAt(0)?.toUpperCase() || "?"}
            </Text>
          </View>
        </View>

        {/* Title */}
        <View className="px-5 mb-6">
          <Text className="text-white text-2xl font-bold">Nova Transação</Text>
          <Text className="mt-1" style={{ color: "#9B8B82" }}>
            Registre uma nova entrada ou saída.
          </Text>
        </View>

        {/* Type Toggle */}
        <View
          className="mx-5 mb-6 flex-row rounded-2xl overflow-hidden"
          style={{ backgroundColor: "#1F1B19" }}
        >
          <Pressable
            onPress={() => setType("expense")}
            className="flex-1 py-3.5 items-center rounded-2xl"
            style={{
              backgroundColor: type === "expense" ? "#2A2420" : "transparent",
            }}
          >
            <Text
              className="font-semibold"
              style={{ color: type === "expense" ? "#F5F0EC" : "#6B5C52" }}
            >
              Despesa
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setType("income")}
            className="flex-1 py-3.5 items-center rounded-2xl"
            style={{
              backgroundColor: type === "income" ? "#2A2420" : "transparent",
            }}
          >
            <Text
              className="font-semibold"
              style={{ color: type === "income" ? "#F5F0EC" : "#6B5C52" }}
            >
              Receita
            </Text>
          </Pressable>
        </View>

        {/* Amount */}
        <View className="items-center mb-8 px-5">
          <Text className="text-xs font-semibold tracking-widest mb-2" style={{ color: "#9B8B82" }}>
            VALOR
          </Text>
          <View className="flex-row items-center">
            <Text className="text-lg mr-1" style={{ color: "#6B5C52" }}>R$</Text>
            <TextInput
              placeholder="0,00"
              placeholderTextColor="#6B5C52"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              className="text-4xl font-bold text-white text-center"
              style={{ minWidth: 120 }}
            />
          </View>
          <View className="w-32 h-0.5 mt-2 rounded-full" style={{ backgroundColor: "#FF6B1A" }} />
        </View>

        {/* Error */}
        {error ? (
          <View
            className="mx-5 rounded-xl p-3 mb-4"
            style={{
              backgroundColor: "rgba(244,67,54,0.1)",
              borderWidth: 1,
              borderColor: "rgba(244,67,54,0.3)",
            }}
          >
            <Text className="text-red-400 text-sm">{error}</Text>
          </View>
        ) : null}

        {/* Description */}
        <View className="px-5 mb-4">
          <TextInput
            placeholder="Descrição"
            placeholderTextColor="#6B5C52"
            value={description}
            onChangeText={setDescription}
            className="py-4 text-white text-base"
            style={{
              borderBottomWidth: 1,
              borderBottomColor: "rgba(255,255,255,0.06)",
            }}
          />
        </View>

        {/* Category & Date */}
        <View className="flex-row px-5 gap-4 mb-6">
          <View className="flex-1">
            <Text className="text-xs mb-2 font-medium" style={{ color: "#9B8B82" }}>
              Categoria
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6 }}
            >
              {categories.map((cat) => (
                <Pressable
                  key={cat.key}
                  onPress={() => setCategory(cat.label)}
                  className="px-3 py-2 rounded-xl"
                  style={{
                    backgroundColor: category === cat.label ? "#FF6B1A" : "#1F1B19",
                    borderWidth: 1,
                    borderColor: category === cat.label ? "#FF6B1A" : "rgba(255,255,255,0.06)",
                  }}
                >
                  <Text
                    className="text-xs font-medium"
                    style={{ color: category === cat.label ? "#131315" : "#9B8B82" }}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Date */}
        <View className="px-5 mb-6">
          <Text className="text-xs mb-2 font-medium" style={{ color: "#9B8B82" }}>
            Data
          </Text>
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#6B5C52"
            className="rounded-xl px-4 py-3 text-white"
            style={{
              backgroundColor: "#1F1B19",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.06)",
            }}
          />
        </View>

        {/* Family Member selector */}
        {familyMembers.length > 1 && (
          <View className="px-5 mb-6">
            <Text className="text-xs font-semibold tracking-widest mb-3" style={{ color: "#9B8B82" }}>
              RESPONSÁVEL
            </Text>
            <View className="flex-row gap-3">
              {familyMembers.map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => setSelectedMember(m.id)}
                  className="items-center p-3 rounded-2xl"
                  style={{
                    backgroundColor: "#1F1B19",
                    borderWidth: 2,
                    borderColor: selectedMember === m.id ? "#FF6B1A" : "rgba(255,255,255,0.06)",
                    minWidth: 80,
                  }}
                >
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center mb-2"
                    style={{ backgroundColor: m.color || "#2A2420" }}
                  >
                    <User size={20} color="#FFF" />
                  </View>
                  <Text
                    className="text-xs font-medium"
                    style={{ color: selectedMember === m.id ? "#F5F0EC" : "#6B5C52" }}
                  >
                    {m.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Save Button */}
        <View className="px-5 mt-4">
          <Pressable
            onPress={handleSave}
            disabled={loading || !amount || !description}
            style={{ opacity: loading || !amount || !description ? 0.5 : 1 }}
          >
            <LinearGradient
              colors={["#FFB59A", "#FF6B1A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 16,
                height: 56,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {loading ? (
                <ActivityIndicator color="#131315" />
              ) : (
                <Text className="text-background font-bold text-base">
                  Salvar Transação
                </Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

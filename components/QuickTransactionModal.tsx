import {
  View,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Dimensions,
} from "react-native";
import { useState, useEffect } from "react";
import { X, Mic, Zap } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { useAuthStore } from "@/stores/authStore";
import { useRecentCategories } from "@/hooks/useRecentCategories";
import { DEFAULT_CATEGORIES } from "@/constants/categories";
import { transactionService } from "@/services/supabase/transactionService";
import { Text } from "@/components/ui/Text";
import type { CreateTransactionDTO } from "@/types";

const { height } = Dimensions.get("window");

interface QuickTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function QuickTransactionModal({
  visible,
  onClose,
  onSuccess,
}: QuickTransactionModalProps) {
  const { member } = useAuthStore();
  const { categories: recentCategories } = useRecentCategories();

  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) {
      setAmount("");
      setDescription("");
      setCategory("");
      setError("");
    }
  }, [visible]);

  const handleVoiceInput = async () => {
    try {
      setVoiceLoading(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Speech.speak("Recurso de voz em desenvolvimento", {
        language: "pt-BR",
        pitch: 1,
        rate: 1,
      });
      setVoiceLoading(false);
    } catch {
      setVoiceLoading(false);
    }
  };

  const handleSave = async () => {
    if (!member?.family_id || !amount || !description) {
      setError("Preencha valor e descrição");
      return;
    }

    try {
      setError("");
      setLoading(true);
      await Haptics.selectionAsync();

      const amountNumber = parseFloat(amount.replace(",", "."));
      if (isNaN(amountNumber) || amountNumber <= 0) {
        setError("Valor inválido");
        return;
      }

      const dto: CreateTransactionDTO = {
        family_id: member.family_id,
        member_id: member.id,
        member_name: member.name,
        type,
        amount: amountNumber,
        description,
        category: category || (type === "income" ? "Renda" : "Outros"),
        date: new Date().toISOString().split("T")[0],
      };

      await transactionService.create(dto);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      onClose();
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const categories =
    type === "expense"
      ? DEFAULT_CATEGORIES.filter(
          (c) => c.group !== "financeiro" || c.key === "dividas"
        )
      : DEFAULT_CATEGORIES.filter(
          (c) => c.key === "renda" || c.key === "investimentos"
        );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Pressable className="flex-1" onPress={onClose} />
        <View
          className="rounded-t-3xl px-5 py-5 flex-1"
          style={{ backgroundColor: "#131315", maxHeight: height * 0.75 }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-5">
            <View className="flex-1 flex-row items-center gap-2">
              <Zap size={20} color="#FF6B1A" />
              <Text className="text-white text-lg font-bold">Lançamento Rápido</Text>
            </View>
            <Pressable onPress={onClose} className="p-2">
              <X size={20} color="#9B8B82" />
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 20 }}>
            {/* Type Toggle */}
            <View className="flex-row rounded-2xl overflow-hidden mb-5" style={{ backgroundColor: "#1F1B19" }}>
              {(["expense", "income"] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => { setType(t); Haptics.selectionAsync(); }}
                  className="flex-1 py-2.5 items-center"
                  style={{ backgroundColor: type === t ? "#2A2420" : "transparent" }}
                >
                  <Text className="font-semibold text-sm" style={{ color: type === t ? "#F5F0EC" : "#6B5C52" }}>
                    {t === "expense" ? "Despesa" : "Receita"}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Amount */}
            <View className="mb-5">
              <Text className="text-xs font-semibold text-amber-600 mb-2 uppercase">Valor</Text>
              <View className="flex-row items-center rounded-2xl px-4 py-3" style={{ backgroundColor: "#1F1B19" }}>
                <Text className="text-white text-lg font-semibold">R$ </Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0,00"
                  placeholderTextColor="#6B5C52"
                  keyboardType="decimal-pad"
                  className="flex-1 text-white text-lg font-bold ml-2"
                  maxLength={12}
                  autoFocus
                />
              </View>
            </View>

            {/* Description */}
            <View className="mb-5">
              <Text className="text-xs font-semibold text-amber-600 mb-2 uppercase">Descrição</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Ex: Supermercado, Uber, Salário..."
                placeholderTextColor="#6B5C52"
                className="text-white text-base rounded-2xl px-4 py-3"
                style={{ backgroundColor: "#1F1B19" }}
                maxLength={60}
              />
            </View>

            {/* Voice Input */}
            <Pressable
              onPress={handleVoiceInput}
              disabled={voiceLoading}
              className="flex-row items-center justify-center gap-2 p-3 rounded-xl mb-5"
              style={{ backgroundColor: "rgba(255, 107, 26, 0.1)" }}
            >
              {voiceLoading ? (
                <ActivityIndicator color="#FF6B1A" />
              ) : (
                <>
                  <Mic size={16} color="#FF6B1A" />
                  <Text className="text-amber-600 text-sm font-semibold">Falar (beta)</Text>
                </>
              )}
            </Pressable>

            {/* Categories */}
            <View className="mb-5">
              <Text className="text-xs font-semibold text-amber-600 mb-2 uppercase">Categorias</Text>
              <View className="flex-row flex-wrap gap-2">
                {categories.map((cat) => (
                  <Pressable
                    key={cat.key}
                    onPress={() => { setCategory(cat.key); Haptics.selectionAsync(); }}
                    className="px-3 py-2 rounded-lg flex-row items-center gap-1.5"
                    style={{
                      backgroundColor: category === cat.key ? cat.color : "rgba(255,255,255,0.03)",
                      borderWidth: 1,
                      borderColor: category === cat.key ? "transparent" : "rgba(255,255,255,0.08)",
                    }}
                  >
                    <Text>{cat.icon}</Text>
                    <Text className="text-xs font-semibold" style={{ color: category === cat.key ? "#FFF" : "#6B5C52" }}>
                      {cat.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {error && (
              <View className="p-3 rounded-xl mb-4" style={{ backgroundColor: "rgba(244, 67, 54, 0.1)" }}>
                <Text className="text-red-400 text-sm font-semibold">{error}</Text>
              </View>
            )}
          </ScrollView>

          {/* Save Button */}
          <Pressable
            onPress={handleSave}
            disabled={loading || !amount || !description}
            className="py-3 rounded-2xl flex-row items-center justify-center gap-2 mt-4"
            style={{ backgroundColor: loading || !amount || !description ? "#6B5C52" : "#FF6B1A" }}
          >
            {loading ? (
              <ActivityIndicator color="#131315" />
            ) : (
              <>
                <Zap size={18} color="#131315" />
                <Text className="text-base font-bold" style={{ color: "#131315" }}>Salvar Transação</Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

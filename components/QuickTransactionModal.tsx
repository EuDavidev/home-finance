import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Dimensions,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { X, Mic, MicOff, Zap } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { useRecentCategories } from "@/hooks/useRecentCategories";
import { DEFAULT_CATEGORIES } from "@/constants/categories";

const { height } = Dimensions.get("window");

interface QuickTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Modal para lançamento rápido de transações
 * - Campos mínimos: tipo, valor, descrição
 * - Categorias recentes como sugestão
 * - Voice input opcional
 * - Swipe para confirmar
 */
export function QuickTransactionModal({
  visible,
  onClose,
  onSuccess,
}: QuickTransactionModalProps) {
  const { member, family } = useAuthStore();
  const { categories: recentCategories } = useRecentCategories();

  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset ao fechar
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

      // Simula captura de voz
      // Em produção, integrar com expo-speech ou react-native-voice
      // Por enquanto, apenas placeholder
      Speech.speak("Recurso de voz em desenvolvimento", {
        language: "pt-BR",
        pitch: 1,
        rate: 1,
      });

      setVoiceLoading(false);
    } catch (err) {
      console.error("Erro no voice input:", err);
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

      const { error: insertError } = await supabase
        .from("transactions")
        .insert({
          family_id: member.family_id,
          member_id: member.id,
          member_name: member.name,
          type,
          amount: amountNumber,
          description,
          category: category || (type === "income" ? "Renda" : "Outros"),
          date: new Date().toISOString().split("T")[0],
        });

      if (insertError) throw insertError;

      // Feedback de sucesso
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Reset e fecha
      setAmount("");
      setDescription("");
      setCategory("");
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
          (c) => c.group !== "financeiro" || c.key === "dividas",
        )
      : DEFAULT_CATEGORIES.filter(
          (c) => c.key === "renda" || c.key === "investimentos",
        );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        className="flex-1"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Overlay clickable */}
        <Pressable className="flex-1" onPress={onClose} />

        {/* Modal Content */}
        <View
          className="rounded-t-3xl px-5 py-5 flex-1"
          style={{ backgroundColor: "#131315", maxHeight: height * 0.75 }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-5">
            <View className="flex-1 flex-row items-center gap-2">
              <Zap size={20} color="#FF6B1A" />
              <Text className="text-white text-lg font-bold">
                Lançamento Rápido
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              className="p-2"
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <X size={20} color="#9B8B82" />
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* Type Toggle */}
            <View
              className="flex-row rounded-2xl overflow-hidden mb-5"
              style={{ backgroundColor: "#1F1B19" }}
            >
              <Pressable
                onPress={() => {
                  setType("expense");
                  Haptics.selectionAsync();
                }}
                className="flex-1 py-2.5 items-center"
                style={{
                  backgroundColor:
                    type === "expense" ? "#2A2420" : "transparent",
                }}
              >
                <Text
                  className="font-semibold text-sm"
                  style={{
                    color: type === "expense" ? "#F5F0EC" : "#6B5C52",
                  }}
                >
                  Despesa
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setType("income");
                  Haptics.selectionAsync();
                }}
                className="flex-1 py-2.5 items-center"
                style={{
                  backgroundColor:
                    type === "income" ? "#2A2420" : "transparent",
                }}
              >
                <Text
                  className="font-semibold text-sm"
                  style={{
                    color: type === "income" ? "#F5F0EC" : "#6B5C52",
                  }}
                >
                  Receita
                </Text>
              </Pressable>
            </View>

            {/* Amount Input */}
            <View className="mb-5">
              <Text className="text-xs font-semibold text-amber-600 mb-2 uppercase">
                Valor
              </Text>
              <View
                className="flex-row items-center rounded-2xl px-4 py-3"
                style={{ backgroundColor: "#1F1B19" }}
              >
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

            {/* Description Input */}
            <View className="mb-5">
              <Text className="text-xs font-semibold text-amber-600 mb-2 uppercase">
                Descrição
              </Text>
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
                  <Text className="text-amber-600 text-sm font-semibold">
                    Falar (beta)
                  </Text>
                </>
              )}
            </Pressable>

            {/* Recent Categories */}
            {recentCategories.length > 0 && (
              <View className="mb-5">
                <Text className="text-xs font-semibold text-amber-600 mb-2 uppercase">
                  Categorias Recentes
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {recentCategories.map((cat) => (
                    <Pressable
                      key={cat.key}
                      onPress={() => {
                        setCategory(cat.key);
                        Haptics.selectionAsync();
                      }}
                      className="px-3 py-2 rounded-full flex-row items-center gap-1.5"
                      style={{
                        backgroundColor:
                          category === cat.key
                            ? cat.color
                            : "rgba(255,255,255,0.05)",
                        borderWidth: category === cat.key ? 0 : 1,
                        borderColor: "rgba(255,255,255,0.1)",
                      }}
                    >
                      <Text>{cat.icon}</Text>
                      <Text
                        className="text-xs font-semibold"
                        style={{
                          color: category === cat.key ? "#FFF" : "#9B8B82",
                        }}
                      >
                        {cat.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* All Categories (Grid) */}
            <View className="mb-5">
              <Text className="text-xs font-semibold text-amber-600 mb-2 uppercase">
                {recentCategories.length > 0 ? "Todas" : "Categorias"}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {categories.map((cat) => (
                  <Pressable
                    key={cat.key}
                    onPress={() => {
                      setCategory(cat.key);
                      Haptics.selectionAsync();
                    }}
                    className="px-3 py-2 rounded-lg flex-row items-center gap-1.5"
                    style={{
                      backgroundColor:
                        category === cat.key
                          ? cat.color
                          : "rgba(255,255,255,0.03)",
                      borderWidth: category === cat.key ? 0 : 1,
                      borderColor: "rgba(255,255,255,0.08)",
                    }}
                  >
                    <Text>{cat.icon}</Text>
                    <Text
                      className="text-xs font-semibold"
                      style={{
                        color: category === cat.key ? "#FFF" : "#6B5C52",
                      }}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Error Message */}
            {error && (
              <View
                className="p-3 rounded-xl mb-4 flex-row items-center gap-2"
                style={{ backgroundColor: "rgba(244, 67, 54, 0.1)" }}
              >
                <Text className="text-red-400 text-sm font-semibold flex-1">
                  {error}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Save Button */}
          <Pressable
            onPress={handleSave}
            disabled={loading || !amount || !description}
            className="py-3 rounded-2xl flex-row items-center justify-center gap-2 mt-4"
            style={{
              backgroundColor:
                loading || !amount || !description ? "#6B5C52" : "#FF6B1A",
            }}
          >
            {loading ? (
              <ActivityIndicator color="#131315" />
            ) : (
              <>
                <Zap size={18} color="#131315" />
                <Text
                  className="text-base font-bold"
                  style={{ color: "#131315" }}
                >
                  Salvar Transação
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

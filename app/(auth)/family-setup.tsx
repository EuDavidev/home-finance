import {
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Text } from "@/components/ui/Text";
import { useState } from "react";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { LinearGradient } from "expo-linear-gradient";

export default function FamilySetupScreen() {
  const [familyName, setFamilyName] = useState("");
  const [yourName, setYourName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user, fetchMember } = useAuthStore();

  const handleCreateFamily = async () => {
    if (!user) return;

    try {
      setError("");
      setLoading(true);

      // 1. Create family
      const { data: familyData, error: familyError } = await supabase
        .from("families")
        .insert({
          name: familyName,
          created_by: user.id,
        })
        .select("id")
        .single();

      if (familyError) throw familyError;
      if (!familyData) throw new Error("Erro ao criar família");

      // 2. Add user as admin member
      const { error: memberError } = await supabase
        .from("family_members")
        .insert({
          user_id: user.id,
          family_id: familyData.id,
          name: yourName,
          role: "admin",
          color: "#FF6B1A",
        });

      if (memberError) throw memberError;

      // 3. Refresh member data and navigate
      await fetchMember();
      router.replace("/(app)/");
    } catch (err: any) {
      setError(err.message || "Erro ao criar família");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = familyName.trim() && yourName.trim();

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 justify-between py-12">
          {/* Back */}
          <Pressable onPress={() => router.back()}>
            <Text className="text-primary text-base mb-8">← Voltar</Text>
          </Pressable>

          <View className="gap-6">
            {/* Header */}
            <View>
              <Text className="text-3xl font-bold text-white mb-2">
                Criar Família
              </Text>
              <Text className="text-neutral-400">
                Configure seu grupo familiar
              </Text>
            </View>

            {/* Error */}
            {error ? (
              <View
                className="rounded-xl p-3"
                style={{
                  backgroundColor: "rgba(244,67,54,0.1)",
                  borderWidth: 1,
                  borderColor: "rgba(244,67,54,0.3)",
                }}
              >
                <Text className="text-red-400 text-sm">{error}</Text>
              </View>
            ) : null}

            {/* Form */}
            <View className="gap-4">
              <View>
                <Text className="text-white text-sm mb-2 font-medium">
                  Nome da Família
                </Text>
                <TextInput
                  placeholder="Ex: Família Silva"
                  placeholderTextColor="#6B5C52"
                  value={familyName}
                  onChangeText={setFamilyName}
                  className="rounded-xl px-4 py-3.5 text-white"
                  style={{
                    backgroundColor: "#1F1B19",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.08)",
                  }}
                />
              </View>

              <View>
                <Text className="text-white text-sm mb-2 font-medium">
                  Seu Nome
                </Text>
                <TextInput
                  placeholder="Ex: Davi"
                  placeholderTextColor="#6B5C52"
                  value={yourName}
                  onChangeText={setYourName}
                  className="rounded-xl px-4 py-3.5 text-white"
                  style={{
                    backgroundColor: "#1F1B19",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.08)",
                  }}
                />
              </View>
            </View>

            {/* Submit */}
            <Pressable
              onPress={handleCreateFamily}
              disabled={loading || !isFormValid}
              style={{ opacity: loading || !isFormValid ? 0.5 : 1 }}
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
                    Criar Família
                  </Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>

          <View className="items-center mt-6">
            <Text className="text-neutral-500 text-xs text-center">
              Você poderá convidar seu parceiro(a) depois no app
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

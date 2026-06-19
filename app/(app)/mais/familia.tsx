import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { UserPlus, Mail, Shield, Trash2, Users } from "lucide-react-native";
import { Text } from "@/components/ui/Text";

interface FamilyMemberUI {
  id: string;
  name: string;
  user_id: string;
  role: "admin" | "member";
  color: string;
}

export default function FamiliaScreen() {
  const { member, family } = useAuthStore();
  const [members, setMembers] = useState<FamilyMemberUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [inviting, setInviting] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#FF6B1A");

  const COLORS = [
    "#FF6B1A",
    "#FF006E",
    "#00B4D8",
    "#00D9FF",
    "#FFC300",
    "#A2FF86",
  ];
  const isAdmin = member?.role === "admin";

  // Carregar membros
  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("family_members")
        .select("*")
        .eq("family_id", member?.family_id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar membros:", error);
      Alert.alert("Erro", "Falha ao carregar membros da família");
    } finally {
      setLoading(false);
    }
  };

  // Adicionar novo membro (por email)
  const handleInviteMember = async () => {
    if (!inviteEmail.trim() || !newMemberName.trim()) {
      Alert.alert("Erro", "Preencha todos os campos");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      Alert.alert("Erro", "Email inválido");
      return;
    }

    try {
      setInviting(true);

      // 1. Buscar usuário na tabela profiles (seguro, sem admin key)
      const { data: userProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .eq("email", inviteEmail.toLowerCase())
        .single();

      if (profileError) {
        if (profileError.code === "PGRST116") {
          // Não encontrou usuário
          Alert.alert(
            "Erro",
            "Usuário não encontrado. Peça que ele se registre primeiro.",
          );
        } else {
          throw profileError;
        }
        return;
      }

      // 2. Verificar se já é membro da família
      const { data: existingMember } = await supabase
        .from("family_members")
        .select("id")
        .eq("family_id", member?.family_id)
        .eq("user_id", userProfile.id)
        .single();

      if (existingMember) {
        Alert.alert("Erro", "Este usuário já é membro da família");
        return;
      }

      // 3. Adicionar novo membro
      const { error: insertError } = await supabase
        .from("family_members")
        .insert({
          family_id: member?.family_id,
          user_id: userProfile.id,
          name: newMemberName,
          email: inviteEmail.toLowerCase(),
          role: "member",
          color: selectedColor,
        });

      if (insertError) throw insertError;

      Alert.alert("Sucesso", `${newMemberName} adicionado à família!`);
      setInviteEmail("");
      setNewMemberName("");
      setSelectedColor("#FF6B1A");
      await loadMembers();
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Falha ao adicionar membro");
      console.error(error);
    } finally {
      setInviting(false);
    }
  };

  // Remover membro
  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!isAdmin) {
      Alert.alert("Permissão Negada", "Apenas admins podem remover membros");
      return;
    }

    Alert.alert(
      "Remover Membro",
      `Tem certeza que deseja remover ${memberName}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("family_members")
                .delete()
                .eq("id", memberId);

              if (error) throw error;

              Alert.alert("Sucesso", `${memberName} foi removido da família`);
              await loadMembers();
            } catch (error) {
              Alert.alert("Erro", "Falha ao remover membro");
              console.error(error);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#FF6B1A" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4 gap-6">
        {/* Header */}
        <View>
          <Text className="text-3xl font-bold text-white mb-2">
            Minha Família
          </Text>
          <Text className="text-neutral-400">{family?.name}</Text>
        </View>

        {/* Membros Atuais */}
        <View>
          <View className="flex-row items-center gap-2 mb-3">
            <Users size={20} color="#FF6B1A" />
            <Text className="text-white font-semibold text-lg">
              Membros ({members.length})
            </Text>
          </View>

          <FlatList
            scrollEnabled={false}
            data={members}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View
                className="flex-row items-center justify-between p-3 bg-neutral-800 rounded-lg mb-2"
                style={{ borderLeftWidth: 4, borderLeftColor: item.color }}
              >
                <View className="flex-row items-center flex-1 gap-3">
                  <View
                    className="w-10 h-10 rounded-full justify-center items-center"
                    style={{ backgroundColor: item.color }}
                  >
                    <Text className="text-white font-bold">
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-center gap-1">
                      <Text className="text-white font-semibold">
                        {item.name}
                      </Text>
                      {item.id === member?.id && (
                        <Text className="text-primary text-xs font-bold">
                          (Você)
                        </Text>
                      )}
                    </View>
                    {item.role === "admin" && (
                      <View className="flex-row items-center gap-1 mt-1">
                        <Shield size={12} color="#FFB700" />
                        <Text className="text-yellow-500 text-xs">
                          Administrador
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {isAdmin && item.id !== member?.id && (
                  <TouchableOpacity
                    onPress={() => handleRemoveMember(item.id, item.name)}
                    className="p-2"
                  >
                    <Trash2 size={18} color="#FF6B6B" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          />
        </View>

        {/* Divider */}
        <View className="border-t border-neutral-700" />

        {/* Adicionar Novo Membro */}
        {isAdmin && (
          <View className="bg-neutral-800 rounded-xl p-4 gap-4">
            <View className="flex-row items-center gap-2 mb-2">
              <UserPlus size={20} color="#FF6B1A" />
              <Text className="text-white font-semibold text-lg">
                Adicionar Membro
              </Text>
            </View>

            {/* Input: Nome */}
            <View>
              <Text className="text-white text-sm mb-2 font-semibold">
                Nome do Membro
              </Text>
              <TextInput
                placeholder="Ex: Esposa, Filho, Mãe"
                placeholderTextColor="#6B5C52"
                value={newMemberName}
                onChangeText={setNewMemberName}
                editable={!inviting}
                className="rounded-lg px-4 py-3 text-white"
                style={{
                  backgroundColor: "#1F1B19",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.08)",
                }}
              />
            </View>

            {/* Input: Email */}
            <View>
              <View className="flex-row items-center gap-1 mb-2">
                <Mail size={14} color="#FF6B1A" />
                <Text className="text-white text-sm font-semibold">
                  Email Registrado
                </Text>
              </View>
              <TextInput
                placeholder="email@example.com"
                placeholderTextColor="#6B5C52"
                value={inviteEmail}
                onChangeText={setInviteEmail}
                keyboardType="email-address"
                editable={!inviting}
                className="rounded-lg px-4 py-3 text-white"
                style={{
                  backgroundColor: "#1F1B19",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.08)",
                }}
              />
            </View>

            {/* Cores Disponíveis */}
            <View>
              <Text className="text-white text-sm mb-3 font-semibold">
                Escolha uma Cor
              </Text>
              <View className="flex-row gap-3 flex-wrap">
                {COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => setSelectedColor(color)}
                    className="w-12 h-12 rounded-lg border-2 justify-center items-center"
                    style={{
                      backgroundColor: color,
                      borderColor:
                        selectedColor === color ? "#FFF" : "transparent",
                      borderWidth: selectedColor === color ? 3 : 0,
                    }}
                  />
                ))}
              </View>
            </View>

            {/* Botão Adicionar */}
            <TouchableOpacity
              onPress={handleInviteMember}
              disabled={
                inviting || !newMemberName.trim() || !inviteEmail.trim()
              }
              className="bg-primary rounded-lg p-4 flex-row justify-center items-center gap-2"
              style={{
                opacity:
                  inviting || !newMemberName.trim() || !inviteEmail.trim()
                    ? 0.5
                    : 1,
              }}
            >
              {inviting ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <UserPlus size={18} color="white" />
                  <Text className="text-white font-semibold">
                    Adicionar Membro
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Info */}
        <View className="bg-blue-500/10 rounded-lg p-4 border border-blue-400/30 gap-2">
          <Text className="text-blue-300 text-xs font-semibold">
            💡 Como adicionar membros:
          </Text>
          <Text className="text-blue-300 text-xs leading-5">
            1. O membro precisa estar registrado no app{"\n"}
            2. Use o email com que ele se registrou{"\n"}
            3. Escolha um nome e cor para identificá-lo{"\n"}
            4. Pronto! Ele terá acesso aos dados da família
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

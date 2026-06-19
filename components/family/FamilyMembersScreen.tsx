import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { UserPlus, Mail, Shield, Trash2, Copy } from "lucide-react-native";

interface FamilyMemberUI {
  id: string;
  name: string;
  user_id: string;
  role: "admin" | "member";
  color: string;
  email?: string;
}

export function FamilyMembersScreen() {
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
    } catch (error) {
      Alert.alert("Erro", "Falha ao carregar membros da família");
      console.error(error);
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

    try {
      setInviting(true);

      // 1. Verificar se email existe em auth.users
      const { data: existingUser } = await supabase
        .from("auth.users")
        .select("id")
        .eq("email", inviteEmail)
        .single();

      if (!existingUser) {
        Alert.alert(
          "Usuário não encontrado",
          "O usuário com este email não existe no app. Peça para ele fazer registro primeiro.",
        );
        return;
      }

      // 2. Verificar se já é membro da família
      const { data: alreadyMember } = await supabase
        .from("family_members")
        .select("id")
        .eq("family_id", member?.family_id)
        .eq("user_id", existingUser.id)
        .single();

      if (alreadyMember) {
        Alert.alert("Aviso", "Este usuário já é membro da sua família");
        return;
      }

      // 3. Adicionar novo membro
      const { error: insertError } = await supabase
        .from("family_members")
        .insert({
          family_id: member?.family_id,
          user_id: existingUser.id,
          name: newMemberName,
          role: "member",
          color: selectedColor,
        });

      if (insertError) throw insertError;

      Alert.alert("Sucesso", `${newMemberName} foi adicionado à família!`);
      setInviteEmail("");
      setNewMemberName("");
      setSelectedColor("#FF6B1A");
      await loadMembers();
    } catch (error) {
      Alert.alert(
        "Erro",
        `Falha ao adicionar membro: ${error instanceof Error ? error.message : ""}`,
      );
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

  // Copiar código de convite (para simples)
  const handleCopyInviteCode = () => {
    const inviteCode = `${family?.id}-${member?.id}`;
    Alert.alert("Código de Convite", inviteCode);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#FF6B1A" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background p-4">
      <View className="gap-6">
        {/* Header */}
        <View>
          <Text className="text-3xl font-bold text-white mb-2">
            Minha Família
          </Text>
          <Text className="text-neutral-400 mb-4">{family?.name}</Text>
        </View>

        {/* Membros Atuais */}
        <View>
          <Text className="text-white font-semibold text-lg mb-3">
            Membros ({members.length})
          </Text>

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
                    <Text className="text-white font-semibold">
                      {item.name}
                    </Text>
                    <View className="flex-row items-center gap-1">
                      {item.role === "admin" && (
                        <>
                          <Shield size={12} color="#FFB700" />
                          <Text className="text-yellow-500 text-xs">Admin</Text>
                        </>
                      )}
                      {item.id === member?.id && (
                        <Text className="text-primary text-xs">(Você)</Text>
                      )}
                    </View>
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
              <Text className="text-white text-sm mb-2">Nome do Membro</Text>
              <TextInput
                placeholder="Ex: Esposa, Filho"
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
              <Text className="text-white text-sm mb-2 flex-row items-center gap-1">
                <Mail size={14} color="#FF6B1A" />
                Email (usuário já registrado no app)
              </Text>
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
              <Text className="text-white text-sm mb-2">Escolher Cor</Text>
              <View className="flex-row gap-2 flex-wrap">
                {COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => setSelectedColor(color)}
                    className="w-12 h-12 rounded-lg border-2"
                    style={{
                      backgroundColor: color,
                      borderColor:
                        selectedColor === color ? "#FFF" : "transparent",
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

        {/* Código de Convite */}
        <View className="bg-neutral-800 rounded-xl p-4">
          <Text className="text-white font-semibold mb-2">
            Compartilhar Família
          </Text>
          <Text className="text-neutral-400 text-sm mb-3">
            Peça para os membros fazerem registro no app e compartilhe seu
            código:
          </Text>
          <TouchableOpacity
            onPress={handleCopyInviteCode}
            className="bg-neutral-700 rounded-lg p-3 flex-row justify-between items-center"
          >
            <Text className="text-primary font-mono text-sm">
              {family?.id?.substring(0, 8)}...
            </Text>
            <Copy size={16} color="#FF6B1A" />
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View className="bg-blue-500/10 rounded-lg p-3 border border-blue-400/30">
          <Text className="text-blue-300 text-xs leading-5">
            💡 <Text className="font-semibold">Nota:</Text> Membros precisam
            fazer registro no app primeiro. Após isso, você pode adicioná-los
            usando o email deles.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

import React, { useState, useEffect, useCallback } from "react";
import { View, Pressable, Alert } from "react-native";
import { Shield, Trash2, Users, UserPlus } from "lucide-react-native";
import { Text } from "@/components/ui/Text";
import { useAuthStore } from "@/stores/authStore";
import { familyService } from "@/services/supabase/familyService";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/button";
import type { FamilyMember } from "@/types";

const COLORS = ["#FF6B1A", "#FF006E", "#00B4D8", "#00D9FF", "#FFC300", "#A2FF86"];

export default function FamiliaScreen() {
  const { member, family } = useAuthStore();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [inviting, setInviting] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#FF6B1A");

  const isAdmin = member?.role === "admin";

  const loadMembers = useCallback(async () => {
    if (!member?.family_id) return;
    try {
      setLoading(true);
      const data = await familyService.listMembers(member.family_id);
      setMembers(data);
    } catch {
      Alert.alert("Erro", "Falha ao carregar membros da família");
    } finally {
      setLoading(false);
    }
  }, [member?.family_id]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const handleInviteMember = async () => {
    if (!inviteEmail.trim() || !newMemberName.trim() || !member?.family_id) {
      Alert.alert("Erro", "Preencha todos os campos");
      return;
    }

    try {
      setInviting(true);
      const userProfile = await familyService.findUserByEmail(inviteEmail.trim());

      if (!userProfile) {
        Alert.alert("Erro", "Usuário não encontrado. Peça que ele se registre primeiro.");
        return;
      }

      await familyService.addMember({
        familyId: member.family_id,
        userId: userProfile.id,
        name: newMemberName.trim(),
        email: inviteEmail.trim().toLowerCase(),
        color: selectedColor,
      });

      Alert.alert("Sucesso", `${newMemberName} adicionado à família!`);
      setInviteEmail("");
      setNewMemberName("");
      setSelectedColor("#FF6B1A");
      await loadMembers();
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Falha ao adicionar membro");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!isAdmin) return;

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
              await familyService.removeMember(memberId);
              Alert.alert("Sucesso", `${memberName} foi removido da família`);
              await loadMembers();
            } catch {
              Alert.alert("Erro", "Falha ao remover membro");
            }
          },
        },
      ]
    );
  };

  return (
    <Screen title="Minha Família" subtitle={family?.name} refreshing={loading} onRefresh={loadMembers}>
      <View className="px-5 gap-6">
        {/* Members list */}
        <View>
          <View className="flex-row items-center gap-2 mb-4">
            <Users size={20} color="#FF6B1A" />
            <Text className="text-white font-semibold text-lg">Membros ({members.length})</Text>
          </View>

          {members.map((item) => (
            <Card key={item.id} variant="bordered" style={{ borderLeftWidth: 4, borderLeftColor: item.color, marginBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12 }}>
              <View className="flex-row items-center flex-1 gap-3">
                <View className="w-10 h-10 rounded-full justify-center items-center" style={{ backgroundColor: item.color }}>
                  <Text className="text-white font-bold">{item.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-1">
                    <Text className="text-white font-semibold">{item.name}</Text>
                    {item.id === member?.id && <Text className="text-primary text-xs font-bold">(Você)</Text>}
                  </View>
                  {item.role === "admin" && (
                    <View className="flex-row items-center gap-1 mt-1">
                      <Shield size={12} color="#FFB700" />
                      <Text className="text-yellow-500 text-xs">Administrador</Text>
                    </View>
                  )}
                </View>
              </View>
              {isAdmin && item.id !== member?.id && (
                <Pressable onPress={() => handleRemoveMember(item.id, item.name)} className="p-2">
                  <Trash2 size={18} color="#FF6B6B" />
                </Pressable>
              )}
            </Card>
          ))}
        </View>

        {/* Invite section */}
        {isAdmin && (
          <Card variant="bordered" style={{ gap: 16 }}>
            <View className="flex-row items-center gap-2 mb-2">
              <UserPlus size={20} color="#FF6B1A" />
              <Text className="text-white font-semibold text-lg">Adicionar Membro</Text>
            </View>

            <Input placeholder="Nome do Membro (Ex: Esposa, Filho)" value={newMemberName} onChangeText={setNewMemberName} />
            <Input placeholder="Email do usuário cadastrado" value={inviteEmail} onChangeText={setInviteEmail} keyboardType="email-address" />

            <View>
              <Text className="text-white text-xs font-semibold mb-3">Escolha uma Cor</Text>
              <View className="flex-row gap-3 flex-wrap">
                {COLORS.map((color) => (
                  <Pressable key={color} onPress={() => setSelectedColor(color)} className="w-10 h-10 rounded-lg"
                    style={{ backgroundColor: color, borderRadius: 8, borderStyle: "solid", borderColor: selectedColor === color ? "#FFF" : "transparent", borderWidth: selectedColor === color ? 3 : 0 }} />
                ))}
              </View>
            </View>

            <Button label="Adicionar Membro" onPress={handleInviteMember} loading={inviting} disabled={inviting || !newMemberName.trim() || !inviteEmail.trim()} />
          </Card>
        )}
      </View>
    </Screen>
  );
}

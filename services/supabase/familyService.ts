/**
 * Family Service — Acesso ao Supabase para famílias e membros.
 */

import { supabase } from "@/lib/supabase";
import { toAppError } from "@/lib/errorHandler";
import type { Family, FamilyMember, Profile } from "@/types";

const MEMBER_COLUMNS =
  "id, family_id, user_id, name, role, color, email, created_at, updated_at" as const;

export const familyService = {
  /**
   * Busca o membro e família do usuário autenticado
   */
  async getMemberByUserId(
    userId: string,
  ): Promise<{ member: FamilyMember; family: Family } | null> {
    const { data, error } = await supabase
      .from("family_members")
      .select(`${MEMBER_COLUMNS}, families(id, name, created_by, created_at, updated_at)`)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw toAppError(error);
    }

    if (!data) return null;

    const family = data.families as unknown as Family;
    const member: FamilyMember = {
      id: data.id,
      family_id: data.family_id,
      user_id: data.user_id,
      name: data.name,
      role: data.role,
      color: data.color,
      email: data.email,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    return { member, family };
  },

  /**
   * Lista todos os membros de uma família
   */
  async listMembers(familyId: string): Promise<FamilyMember[]> {
    const { data, error } = await supabase
      .from("family_members")
      .select(MEMBER_COLUMNS)
      .eq("family_id", familyId)
      .order("created_at", { ascending: true })
      .returns<FamilyMember[]>();

    if (error) {
      throw toAppError(error);
    }

    return data ?? [];
  },

  /**
   * Busca um usuário na tabela profiles pelo email
   * (seguro — sem acesso direto a auth.users)
   */
  async findUserByEmail(email: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url")
      .eq("email", email.toLowerCase())
      .single<Profile>();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw toAppError(error);
    }

    return data;
  },

  /**
   * Adiciona um novo membro à família
   */
  async addMember(data: {
    familyId: string;
    userId: string;
    name: string;
    email: string;
    color: string;
  }): Promise<FamilyMember> {
    // Verificar se já é membro
    const { data: existing } = await supabase
      .from("family_members")
      .select("id")
      .eq("family_id", data.familyId)
      .eq("user_id", data.userId)
      .maybeSingle();

    if (existing) {
      throw { message: "Este usuário já é membro da família" };
    }

    const { data: created, error } = await supabase
      .from("family_members")
      .insert({
        family_id: data.familyId,
        user_id: data.userId,
        name: data.name,
        email: data.email,
        role: "member",
        color: data.color,
      })
      .select(MEMBER_COLUMNS)
      .single<FamilyMember>();

    if (error) {
      throw toAppError(error);
    }

    return created;
  },

  /**
   * Remove um membro da família
   */
  async removeMember(memberId: string): Promise<void> {
    const { error } = await supabase
      .from("family_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      throw toAppError(error);
    }
  },
};

import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface FamilyMember {
  id: string;
  name: string;
  family_id: string;
  role: "admin" | "member";
  color: string;
}

interface Family {
  id: string;
  name: string;
  created_by: string;
}

interface AuthState {
  user: User | null;
  member: FamilyMember | null;
  family: Family | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setMember: (member: FamilyMember | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
  fetchMember: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  member: null,
  family: null,
  loading: true,

  setUser: (user) => set({ user }),
  setMember: (member) => set({ member }),
  setLoading: (loading) => set({ loading }),

  fetchMember: async () => {
    const { user } = get();
    if (!user) {
      set({ member: null, family: null, loading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("family_members")
        .select("*, families(*)")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.log("No family member found:", error.message);
        set({ member: null, family: null, loading: false });
        return;
      }

      if (data) {
        const family = data.families as unknown as Family;
        set({
          member: {
            id: data.id,
            name: data.name,
            family_id: data.family_id,
            role: data.role,
            color: data.color,
          },
          family: family ?? null,
          loading: false,
        });
      }
    } catch (err) {
      console.error("Error fetching member:", err);
      set({ member: null, family: null, loading: false });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, member: null, family: null, loading: false });
  },
}));

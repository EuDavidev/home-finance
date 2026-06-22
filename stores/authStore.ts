import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { familyService } from "@/services/supabase/familyService";
import { devError } from "@/lib/errorHandler";
import type { User } from "@supabase/supabase-js";
import type { FamilyMember, Family, AuthStatus } from "@/types";

interface AuthState {
  user: User | null;
  member: FamilyMember | null;
  family: Family | null;
  status: AuthStatus;

  // Actions
  setUser: (user: User | null) => void;
  setMember: (member: FamilyMember | null) => void;
  setStatus: (status: AuthStatus) => void;
  fetchMember: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  member: null,
  family: null,
  status: "loading",

  setUser: (user) => set({ user }),
  setMember: (member) => set({ member }),
  setStatus: (status) => set({ status }),

  fetchMember: async () => {
    const { user } = get();
    if (!user) {
      set({ member: null, family: null, status: "unauthenticated" });
      return;
    }

    try {
      const result = await familyService.getMemberByUserId(user.id);

      if (result) {
        set({
          member: result.member,
          family: result.family,
          status: "authenticated",
        });
      } else {
        set({ member: null, family: null, status: "no-family" });
      }
    } catch (err) {
      devError("Error fetching member:", err);
      set({ member: null, family: null, status: "no-family" });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({
      user: null,
      member: null,
      family: null,
      status: "unauthenticated",
    });
  },
}));

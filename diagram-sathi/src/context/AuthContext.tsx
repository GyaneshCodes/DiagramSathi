import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio?: string | null;
  role?: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  updateProfile: (
    displayName: string,
    avatarUrl: string,
    bio?: string,
    role?: string,
  ) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  signOut: async () => {},
  updateProfile: async () => ({ error: null }),
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to manage resilient local storage cache
  const getLocalProfile = (userId: string) => {
    try {
      const avatar = localStorage.getItem(`ds_avatar_${userId}`);
      const bio = localStorage.getItem(`ds_bio_${userId}`);
      const role = localStorage.getItem(`ds_role_${userId}`);
      const name = localStorage.getItem(`ds_name_${userId}`);
      return { avatar, bio, role, name };
    } catch {
      return {};
    }
  };

  const setLocalProfile = (
    userId: string,
    data: {
      avatar_url?: string;
      bio?: string;
      role?: string;
      display_name?: string;
    },
  ) => {
    try {
      if (data.avatar_url)
        localStorage.setItem(`ds_avatar_${userId}`, data.avatar_url);
      if (data.bio !== undefined && data.bio !== null)
        localStorage.setItem(`ds_bio_${userId}`, data.bio);
      if (data.role !== undefined && data.role !== null)
        localStorage.setItem(`ds_role_${userId}`, data.role);
      if (data.display_name)
        localStorage.setItem(`ds_name_${userId}`, data.display_name);
    } catch (e) {
      console.warn("Failed to update localStorage profile cache:", e);
    }
  };

  // Fetch profile with multi-tier fallbacks (DB -> Auth Metadata -> LocalStorage)
  const fetchProfile = async (userId: string) => {
    const local = getLocalProfile(userId);
    let dbProfile: Profile | null = null;

    try {
      // 1. Try querying full profiles table
      const result = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, bio, role")
        .eq("id", userId)
        .single();

      if (!result.error && result.data) {
        dbProfile = result.data as Profile;
      } else {
        // Fallback: query basic profiles table if bio/role columns do not exist in DB
        const basicResult = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .eq("id", userId)
          .single();

        if (!basicResult.error && basicResult.data) {
          dbProfile = basicResult.data as Profile;
        }
      }
    } catch (err) {
      console.warn("[Auth] DB profile fetch failed, using fallback stores:", err);
    }

    // 2. Fetch Auth User Metadata as backup
    let metaProfile: Partial<Profile> = {};
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.id === userId && userData.user.user_metadata) {
        const meta = userData.user.user_metadata;
        metaProfile = {
          display_name: meta.display_name,
          avatar_url: meta.avatar_url,
          bio: meta.bio,
          role: meta.role,
        };
      }
    } catch {}

    // Merge in priority: DB > Auth Metadata > LocalStorage
    const finalProfile: Profile = {
      id: userId,
      display_name:
        dbProfile?.display_name ||
        metaProfile.display_name ||
        local.name ||
        null,
      avatar_url:
        dbProfile?.avatar_url ||
        metaProfile.avatar_url ||
        local.avatar ||
        null,
      bio: dbProfile?.bio || metaProfile.bio || local.bio || null,
      role: dbProfile?.role || metaProfile.role || local.role || null,
    };

    return finalProfile;
  };

  useEffect(() => {
    let mounted = true;

    // Safety net only for extreme cases (30 seconds)
    const emergencyTimeout = setTimeout(() => {
      if (mounted) {
        console.warn(
          "[Auth] Session check taking extremely long. Removing loading blocker.",
        );
        setIsLoading(false);
      }
    }, 30000);

    const initAuth = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);

          if (currentSession?.user) {
            const profileData = await fetchProfile(currentSession.user.id);
            if (mounted) setProfile(profileData);
          }
        }
      } catch (error) {
        console.error("[Auth] Failed to initialize auth session:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
          clearTimeout(emergencyTimeout);
        }
      }
    };

    initAuth();

    // Listen for auth changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        // Fetch profile asynchronously so we don't block auth state update
        fetchProfile(newSession.user.id).then((profileData) => {
          if (mounted) setProfile(profileData);
        });
      } else {
        setProfile(null);
      }

      setIsLoading(false);
      clearTimeout(emergencyTimeout);
    });

    return () => {
      mounted = false;
      clearTimeout(emergencyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    // Optimistically clear local state regardless of server response to prevent UI hanging
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsLoading(false);

    try {
      // Sometimes signOut throws if the session is already invalid
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Sign out network timeout")), 2000),
        ),
      ]);
    } catch (err) {
      console.warn(
        "Sign out completed locally, but server sync failed or timed out:",
        err,
      );
    }
  };

  const updateProfile = async (
    display_name: string,
    avatar_url: string,
    bio?: string,
    role?: string,
  ) => {
    if (!user) return { error: new Error("User not authenticated") };

    // 1. Immediately cache in localStorage for zero-latency resilience
    setLocalProfile(user.id, { avatar_url, display_name, bio, role });

    // 2. Try upserting full payload to PostgreSQL profiles table
    const profilePayload: Record<string, any> = {
      id: user.id,
      display_name,
      avatar_url,
      updated_at: new Date().toISOString(),
    };
    if (bio !== undefined) profilePayload.bio = bio;
    if (role !== undefined) profilePayload.role = role;

    let { error } = await supabase
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" });

    // If Postgres failed (e.g. bio/role columns missing in SQL table), try upserting basic columns
    if (error) {
      console.warn("Full profiles upsert notice:", error.message);
      const basicPayload = {
        id: user.id,
        display_name,
        avatar_url,
        updated_at: new Date().toISOString(),
      };
      await supabase.from("profiles").upsert(basicPayload, { onConflict: "id" });
    }

    // 3. Always sync with Supabase Auth user metadata as secondary persistence
    try {
      await supabase.auth.updateUser({
        data: { display_name, avatar_url, bio, role },
      });
    } catch (metaErr) {
      console.warn("Error updating user_metadata:", metaErr);
    }

    // 4. Update Context state
    setProfile((prev) => ({
      id: user.id,
      display_name,
      avatar_url,
      bio: bio ?? prev?.bio ?? null,
      role: role ?? prev?.role ?? null,
    }));
    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{ user, session, profile, isLoading, signOut, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

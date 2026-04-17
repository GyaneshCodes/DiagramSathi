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
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  updateProfile: (displayName: string, avatarUrl: string) => Promise<{ error: Error | null }>;
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

  // Fetch profile from profiles table
  const fetchProfile = async (userId: string) => {
    try {
      console.log("[Auth] Fetching profile for user:", userId);
      const result = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .eq("id", userId)
        .single();
        
      if (result.error) {
        console.error("[Auth] Error fetching profile:", result.error.message);
        return null;
      }
      console.log("[Auth] Profile fetched successfully");
      return result.data as Profile;
    } catch (err) {
      console.error("[Auth] Profile fetch failed:", err);
      return null;
    }
  };

  useEffect(() => {
    // Get initial session
    const initSession = async () => {
      console.log("[Auth] Starting initSession...");
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();
        console.log("[Auth] getSession finished. User:", currentSession?.user?.id);

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          const profileData = await fetchProfile(currentSession.user.id);
          setProfile(profileData);
        }
      } catch (error) {
        console.error("[Auth] Failed to initialize auth session:", error);
      } finally {
        console.log("[Auth] initSession completed.");
        setIsLoading(false);
      }
    };

    // Safety net: if session check takes too long, stop loading anyway
    const timeout = setTimeout(() => {
      setIsLoading((prev) => {
        if (prev) console.warn("Auth session check timed out — proceeding as unauthenticated.");
        return false;
      });
    }, 5000);

    // Ensure timeout is cleared if initSession finishes quickly
    initSession().then(() => clearTimeout(timeout));

    // Listen for auth changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log(`[Auth] onAuthStateChange event: ${event}. User: ${newSession?.user?.id || 'none'}`);
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        const profileData = await fetchProfile(newSession.user.id);
        setProfile(profileData);
      } else {
        setProfile(null);
      }

      console.log("[Auth] onAuthStateChange complete.");
      setIsLoading(false);
    });

    return () => {
      clearTimeout(timeout);
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
        new Promise((_, reject) => setTimeout(() => reject(new Error("Sign out network timeout")), 2000))
      ]);
    } catch (err) {
      console.warn("Sign out completed locally, but server sync failed or timed out:", err);
    }
  };

  const updateProfile = async (display_name: string, avatar_url: string) => {
    if (!user) return { error: new Error("User not authenticated") };
    
    // We update the profiles table
    const { error } = await supabase
      .from("profiles")
      .update({ display_name, avatar_url })
      .eq("id", user.id);
      
    if (error) {
      console.error("Error updating profile:", error.message);
      return { error };
    }
    
    // Optimistic UI update in the context
    setProfile((prev) => prev ? { ...prev, display_name, avatar_url } : { id: user.id, display_name, avatar_url });
    return { error: null };
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, isLoading, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

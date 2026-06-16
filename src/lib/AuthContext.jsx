import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const loadProfile = async (authUser) => {
    if (!authUser) {
      setUser(null);
      return;
    }

    const { data: recruiter, error } = await supabase
  .from("recruiters")
  .select("*")
  .eq("auth_user_id", authUser.id)
  .maybeSingle();

console.log("LOOKUP ID", authUser.id);
console.log("RECRUITER PROFILE", recruiter);
console.log("RECRUITER ERROR", error);

    if (error) {
      console.error("Recruiter lookup error:", error);
    }

    const mergedUser = {
      ...authUser,
      ...(recruiter || {}),
    };

    console.log("RECRUITER PROFILE", recruiter);
console.log("MERGED USER", mergedUser);
    setUser(mergedUser);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      await loadProfile(authUser);

      setIsLoadingAuth(false);
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await loadProfile(session?.user);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoadingAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
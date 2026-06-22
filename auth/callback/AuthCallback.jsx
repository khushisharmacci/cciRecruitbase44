import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      await supabase.auth.getSession();
      navigate("/dashboard", { replace: true });
    };

    handleAuth();
  }, [navigate]);

  return <div>Signing in...</div>;
}
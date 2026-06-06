"use client";

import { createBrowserSupabaseClient } from "@/lib/integrations/supabase";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      title="Cerrar sesión"
      className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition hover:bg-white/8 hover:text-white"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}

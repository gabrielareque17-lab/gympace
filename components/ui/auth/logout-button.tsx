"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase";

export function LogoutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleLogout() {
    setIsSigningOut(true);

    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isSigningOut}
      className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/8 bg-[#151515] px-3 text-sm font-semibold text-[#F5F5F5]/72 transition duration-200 hover:border-[#B6FF00]/35 hover:text-[#B6FF00] disabled:pointer-events-none disabled:opacity-60"
    >
      <LogOut className="size-4" />
      {isSigningOut ? "Saindo..." : "Logout"}
    </button>
  );
}

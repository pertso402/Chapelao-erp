"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.generated";

// Singleton: um único cliente de navegador por aba, para não acumular
// timers de auto-refresh de token (que geravam rejeições não tratadas).
let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  if (browserClient) return browserClient;
  browserClient = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return browserClient;
}

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Rota de auto-login do modo demonstração. Entra como o usuário DEMO e
// redireciona para o dashboard. Só funciona com DEMO_MODE=true.
export async function GET(request: NextRequest) {
  if (process.env.DEMO_MODE !== "true") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: process.env.DEMO_EMAIL!,
    password: process.env.DEMO_PASSWORD!,
  });

  const destino = error ? "/login" : "/dashboard";
  return NextResponse.redirect(new URL(destino, request.url));
}

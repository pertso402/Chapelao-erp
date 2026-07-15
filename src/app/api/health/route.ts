import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Página de saúde: verifica app + conexão com o banco.
export async function GET() {
  const checks: Record<string, unknown> = {
    app: "ok",
    ts: new Date().toISOString(),
  };

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("units").select("id").limit(1);
    checks.database = error ? `erro: ${error.message}` : "ok";
  } catch (e) {
    checks.database = `erro: ${(e as Error).message}`;
  }

  const healthy = checks.database === "ok";
  return NextResponse.json({ status: healthy ? "ok" : "degraded", checks }, {
    status: healthy ? 200 : 503,
  });
}

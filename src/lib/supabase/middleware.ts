import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.generated";

// Renova a sessão do usuário e protege as rotas do ERP.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const demo = process.env.DEMO_MODE === "true";
  const isPublic =
    path.startsWith("/login") ||
    path.startsWith("/api/health") ||
    path.startsWith("/api/demo-login") ||
    path.startsWith("/_next") ||
    path === "/";

  // Sem sessão em rota protegida → auto-login (demo) ou tela de login.
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = demo ? "/api/demo-login" : "/login";
    return NextResponse.redirect(url);
  }

  // Em demo, quem cair na tela de login é encaminhado ao auto-login.
  if (!user && demo && path.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/api/demo-login";
    return NextResponse.redirect(url);
  }

  // Já logado tentando acessar /login → dashboard.
  if (user && path.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

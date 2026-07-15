"use server";

import { getCurrentUser, firstAllowedRoute } from "@/lib/auth/session";

// Após autenticar no cliente, descobrimos no servidor a primeira rota permitida.
export async function landingRoute(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) return "/login";
  return firstAllowedRoute(user);
}

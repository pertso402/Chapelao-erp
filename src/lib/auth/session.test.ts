import { describe, it, expect } from "vitest";
import { hasPermission, firstAllowedRoute, type CurrentUser } from "./session";

function usuario(permissions: string[]): CurrentUser {
  return { id: "u1", email: "teste@chapelao.com", profile: null, roles: [], permissions };
}

describe("hasPermission", () => {
  it("retorna true quando o usuário tem a permissão", () => {
    expect(hasPermission(usuario(["pdv.use"]), "pdv.use")).toBe(true);
  });
  it("retorna false quando não tem", () => {
    expect(hasPermission(usuario(["pdv.use"]), "finance.view")).toBe(false);
  });
  it("retorna false para usuário nulo (sem sessão)", () => {
    expect(hasPermission(null, "pdv.use")).toBe(false);
  });
});

describe("firstAllowedRoute", () => {
  it("retorna a primeira rota do menu que o usuário tem permissão de ver", () => {
    // atendente típico: só pdv.use — dashboard.view vem antes na lista do nav,
    // mas ele não tem essa permissão, então a primeira rota visível é /pdv.
    expect(firstAllowedRoute(usuario(["pdv.use"]))).toBe("/pdv");
  });

  it("prioriza dashboard quando o usuário tem essa permissão (é o primeiro item do menu)", () => {
    expect(firstAllowedRoute(usuario(["dashboard.view", "pdv.use"]))).toBe("/dashboard");
  });

  it("manda pra /sem-acesso quando não tem nenhuma permissão de navegação", () => {
    expect(firstAllowedRoute(usuario([]))).toBe("/sem-acesso");
  });
});

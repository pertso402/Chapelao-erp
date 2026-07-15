@AGENTS.md

# ERP Chapelão — regras do projeto (erp-web)

ERP web da 2ª unidade do Restaurante Chapelão. Ler antes de codar:
`../progress.md` (roadmap), `../docs/IMPLEMENTATION_STATUS.md` (estado), `../ERP_CHAPELAO_ARQUITETURA_TECNICA.md` (arquitetura), `../docs/AUDITORIA_FASE0.md` (legado).

## Stack
- Next.js 16 (App Router) + React 19 + TypeScript estrito. Tailwind v4 (tema em `globals.css`).
- Supabase (Postgres/Auth/Storage). Cliente browser: `src/lib/supabase/client.ts`; server: `src/lib/supabase/server.ts`; middleware de sessão: `src/lib/supabase/middleware.ts`.
- Projeto Supabase: `qlswjefuinhbtlhauhgj`. Migrations aplicadas via MCP Supabase, prefixo `erp_NNNN_...`.

## Regras invioláveis
- **Preservar o legado.** Nunca renomear/remover tabelas usadas pelo agente WhatsApp ou pelo painel (`pedidos`, `itens_pedido`, `clientes`, `produtos`, etc.). Evoluir só de forma **aditiva** (nova coluna / view / adaptador).
- **Painel de pedidos convive lado a lado** (Vercel). Não quebrar os valores de `pedidos.status` que ele usa.
- Só a chave **publishable** no navegador. **Nunca** service_role no cliente. Regras de negócio fora dos componentes.
- Toda tabela nova: RLS + policies por usuário/função/unidade. Rodar advisors após DDL.
- Uma fase por vez (ver `progress.md`). Ao terminar, atualizar `IMPLEMENTATION_STATUS.md`.

## Autorização
- Papéis: `atendente`, `proprietario`, `administrador` (tabela `roles`). Permissões em `permissions`/`role_permissions`.
- No app: `getCurrentUser()` e `requirePermission(perm)` em `src/lib/auth/session.ts`. Navegação em `src/lib/nav.ts` (cada item → permissão).
- Atendente não vê custo/margem/DRE/financeiro.

## Comandos
- Dev: `npm run dev` (porta 3000). Build/validação: `npm run build`, `npx tsc --noEmit`, `npm run lint`.
- Health: `GET /api/health`.
- Usuários de teste (senha `chapelao123`): atendente@ / dono@ / admin@chapelao.com.

## Tipos do banco
`src/types/database.generated.ts`. Regenerar após mudanças de schema (MCP Supabase `generate_typescript_types`).

# Especificação — Módulo de Porcionamento e Comanda de Montagem (Chapelão)

> **Para quem vai implementar (Claude Code):** este documento é a especificação
> completa de uma nova função dentro do ERP que já está em desenvolvimento para
> a marmitaria Chapelão (Umuarama/PR). Antes de escrever qualquer código,
> **inspecione o repositório existente** (stack, schema do banco, convenções de
> nomenclatura, autenticação já usada no painel) e adapte esta especificação à
> arquitetura real do projeto — não crie um projeto paralelo. Onde este
> documento assume algo sobre a stack que não bater com o repo, siga o repo.

---

## 0. Resumo executivo

Chapelão é uma marmitaria buffet (self-service por kg + marmitex em 3
tamanhos fixos: P/M/G) que está com problema de **CMV inconsistente** porque
cada funcionária monta a marmita "no olho" — mais ou menos carne dependendo
de quem está servindo. Já existe uma base de custo por grama de cada
ingrediente (planilha de CMV entregue anteriormente nesta mesma conversa) e
metas de CMV por tamanho.

**O que este módulo resolve:** padronizar exatamente quanto de cada item vai
em cada tamanho de marmita, e transformar isso em uma **comanda impressa** que
a funcionária segue ao montar a marmita — eliminando a variação humana.

**Duas funções a construir:**

1. **Itens do dia** — toda manhã, alguém marca no sistema quais carnes e
   acompanhamentos estão no cardápio daquele dia (o cardápio muda diariamente,
   ex: sexta-feira tem peixe, outro dia não).
2. **Porcionamento por tamanho + impressão de comanda** — para cada tamanho
   (P/M/G), existe uma configuração de "quantas conchas/unidades de cada item"
   vão naquele tamanho. Quando o cliente escolhe o tamanho, a atendente
   seleciona no notebook, e a impressora térmica cospe uma notinha com a lista
   exata de itens + quantidades daquele tamanho, **filtrada pelos itens ativos
   do dia**. A funcionária monta a marmita olhando pra notinha.

O ponto mais importante do módulo inteiro: **cada item do catálogo carrega
dois custos** — o custo teórico (preço pago por kg, cru, direto da nota
fiscal) e o custo real considerando o fator de rendimento (perda de peso no
preparo — assar, cozinhar, fritar). É o custo real que deve ser usado em
qualquer cálculo de CMV. Isso é detalhado na Seção 3.

---

## 1. Contexto de negócio (não pular esta seção)

- Chapelão vende por dois canais no salão: **buffet por kg** (livre) e
  **marmitex de preço fixo** em 3 tamanhos — Pequena R$19, Média R$21, Grande
  R$23 (delivery/iFood terá preços diferentes, fora do escopo deste módulo).
- O cardápio muda todo dia (ex.: sexta-feira tem peixe empanado; outros dias
  têm outras carnes/guarnições). Ver exemplo real do cardápio de uma
  sexta-feira:

  ```
  CARDÁPIO — Sexta-feira
  Arroz, Feijão, Refogado de abobrinha, Farofa, Macarrão alho e óleo,
  Banana à milanesa, Batata frita, Anéis de cebola, Bolinho de carne,
  Porco ao molho de cebola, Paleta assada, Frango assado, Costela assada
  Buffet livre por kg e Marmitex
  ```

- Problema identificado: **não existe ficha técnica por porção**. O
  cozimento acontece em bandejas grandes (GN), e cada funcionária serve
  quantidade diferente por marmita. Isso já foi discutido em conversa
  anterior com este mesmo projeto — CMV teórico (o que deveria custar) vs CMV
  real (o que efetivamente custou, medido por contagem de estoque) têm gap
  aceitável de até ~4%; acima de 8-10% indica problema operacional sério. A
  causa raiz é justamente a ausência de porção padronizada — este módulo
  ataca essa causa raiz na ponta de montagem.
- Já existe (pesagem real feita pelo dono) uma referência de quanto pesa cada
  item na **marmita Pequena**:

  | Item | Quantidade servida | Peso medido |
  |---|---|---|
  | Arroz | 2 conchas | 105g (52,5g/concha) |
  | Feijão | 1 concha | 100g |
  | Frango assado | 1 unidade/pedaço | 85g |
  | Paleta suína (porco ao molho) | 2 conchas | 125g (62,5g/concha) |
  | Costela assada | 1 pedaço | 40g |

  Ou seja: a marmita Pequena, hoje, já sai com **3 proteínas** (frango +
  paleta + costela). Isso é dado real medido, não estimativa — é a base mais
  confiável que temos e deve ser o seed inicial da configuração P (ver Seção
  5).

- Para Média e Grande, o dono descreveu (mas não pesou ainda):
  - **Média:** 3 conchas de arroz, 1 concha "inteira" de feijão, "2 carne e 2
    pedaço de cada"
  - **Grande:** 4 conchas de arroz, 1 concha "cheia" de feijão, "2 carne e 2
    pedaço de cada"

  ⚠️ **Atenção — ambiguidade que precisa ser confirmada com o dono antes de
  travar os valores padrão** (ver Seção 11, pergunta 1): a descrição da
  quantidade de carne em M e G é literalmente igual ("2 carne e 2 pedaço de
  cada"), o que sugere que a diferença de tamanho entre M e G pode estar
  concentrada no arroz/feijão, não na carne — ou pode ser que o dono só não
  detalhou a diferença. Trate os valores de carne de M e G como
  **placeholder editável**, não como verdade travada.

- Existe também uma meta de CMV (R$) por tamanho, calculada anteriormente
  nesta conversa, que serve de teto de referência para quem for ajustar a
  configuração de porcionamento pela UI administrativa (Seção 7):

  | Tamanho | Preço venda balcão | Teto de CMV alvo (R$) | % sobre o preço |
  |---|---|---|---|
  | P | R$19,00 | R$6,65 | ~35% |
  | M | R$21,00 | R$7,35 | ~35% |
  | G | R$23,00 | R$8,05 | ~35% |

  Esse teto não precisa ser validado por este módulo em tempo real
  necessariamente (pode ser Fase 2 / nice-to-have), mas a estrutura de dados
  precisa **permitir** esse cálculo no futuro — por isso todo item carrega
  custo por grama, e toda configuração de porcionamento carrega peso, para
  que "somar o custo de uma comanda" seja trivial de calcular depois.

---

## 2. Stack técnica

O ecossistema ARTe/Chapelão já usa: **Supabase** (Postgres + Realtime +
Auth), **Node.js/Express**, **n8n**, **Evolution API**, hospedagem em
**EasyPanel**, frontends normalmente em Vercel (vanilla JS/HTML/CSS,
mobile-first, sem frameworks pesados). Assuma esse stack como padrão:

- **Banco:** Supabase/Postgres. Ver schema sugerido na Seção 4.
- **Frontend do módulo (2 telas):** pode viver dentro do painel
  administrativo que já existe (se houver um projeto de painel/admin no
  repo) ou como projeto novo simples (HTML/CSS/JS vanilla + Supabase JS
  client), seguindo o mesmo padrão visual do resto do sistema.
- **Impressão térmica:** ver Seção 8 — duas opções técnicas, escolher
  conforme o que já está montado no PC do restaurante (se já existe algum
  fluxo de impressão térmica no projeto do painel de pedidos, **reaproveitar
  o mesmo mecanismo**, não duplicar).
- **Antes de criar tabelas novas:** rodar um `list_tables` / inspecionar
  `supabase/migrations` existentes. Se já existir uma tabela de produtos,
  categorias ou pedidos no schema atual, este módulo deve **referenciar/
  reaproveitar** o que fizer sentido (ex.: se já existe uma tabela
  `produtos`, talvez `itens_catalogo` deste módulo devesse ser uma extensão
  dela em vez de uma tabela nova concorrente). Use julgamento — o objetivo é
  não fragmentar o banco.

---

## 3. Os dois custos que TODO item carrega (não pode faltar)

Este é o conceito central do módulo. Cada item do catálogo tem:

1. **Custo teórico** = preço pago por kg, **cru**, exatamente como está na
   nota fiscal do fornecedor. Campo: `preco_kg_cru`.
2. **Fator de rendimento** = quanto daquele kg cru sobra depois do preparo
   (assar, cozinhar, fritar). Um fator de `0.70` significa que 30% do peso se
   perde no preparo (evapora, escorre gordura, etc). Para itens que
   **ganham** peso no preparo (arroz, feijão — absorvem água), o fator é
   **maior que 1** (ex.: `2.50` = 1kg cru vira 2,5kg pronto). Campo:
   `fator_rendimento`.
3. **Custo real (custo/kg pronto)** = `preco_kg_cru / fator_rendimento`. Essa
   é a fórmula que sempre vale, tanto para perda de peso (fator < 1, custo
   sobe) quanto para ganho de peso (fator > 1, custo cai). **É este valor —
   nunca o custo teórico cru — que deve ser usado em qualquer cálculo de CMV,
   custo de porção, ou custo de comanda.**

O custo teórico existe no sistema principalmente para auditoria (bater com a
nota fiscal quando o preço do fornecedor mudar) e para permitir recalcular o
custo real automaticamente quando o preço de compra for atualizado.

---

## 4. Modelo de dados sugerido

Adaptar nomes/tipos ao padrão já usado no repo. DDL de referência (Postgres):

```sql
-- Catálogo mestre de itens (carnes e acompanhamentos)
create table itens_catalogo (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria text not null check (categoria in ('carne', 'acompanhamento', 'base')),
  subcategoria text, -- 'carne_assada_seca' | 'carne_molho' | 'embutido' | 'peixe_frito' | 'frito' | 'guarnicao_fresca' | 'base_cozida'
  tipo_porcionamento text not null check (tipo_porcionamento in ('concha', 'unidade', 'pedaco', 'colher')),
  peso_padrao_g numeric(6,2), -- peso de 1 concha/unidade/pedaço/colher. NULL = ainda não pesado
  preco_kg_cru numeric(8,2), -- custo teórico. NULL = falta preço (item pendente)
  fator_rendimento numeric(5,3) not null default 1.000, -- <1 = perde peso no preparo, >1 = ganha peso
  status text not null default 'ativo_catalogo' check (status in ('ativo_catalogo', 'inativo', 'pendente_peso', 'pendente_preco')),
  observacao text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Custo real por kg (pronto) e por porção, sempre derivados — nunca editados à mão
alter table itens_catalogo add column custo_kg_pronto numeric(9,4)
  generated always as (
    case when fator_rendimento > 0 and preco_kg_cru is not null
         then round(preco_kg_cru / fator_rendimento, 4)
         else null end
  ) stored;

alter table itens_catalogo add column custo_por_porcao numeric(9,4)
  generated always as (
    case when peso_padrao_g is not null and fator_rendimento > 0 and preco_kg_cru is not null
         then round((preco_kg_cru / fator_rendimento) * peso_padrao_g / 1000, 4)
         else null end
  ) stored;

-- Quais itens do catálogo estão no cardápio hoje (Função 1)
create table itens_do_dia (
  id uuid primary key default gen_random_uuid(),
  data date not null default current_date,
  item_id uuid not null references itens_catalogo(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  unique (data, item_id)
);

-- Configuração de quantas conchas/unidades de cada item vão em cada tamanho (Função 2)
create table config_porcionamento (
  id uuid primary key default gen_random_uuid(),
  tamanho text not null check (tamanho in ('P', 'M', 'G')),
  item_id uuid not null references itens_catalogo(id),
  quantidade numeric(5,2) not null, -- nº de conchas/unidades/pedaços/colheres
  ativo boolean not null default true, -- permite "desligar" um item de um tamanho sem apagar histórico
  observacao text,
  atualizado_em timestamptz not null default now(),
  unique (tamanho, item_id)
);

-- Histórico de comandas impressas (auditoria + insumo futuro pra CMV real)
create table comandas_impressas (
  id uuid primary key default gen_random_uuid(),
  criado_em timestamptz not null default now(),
  tamanho text not null check (tamanho in ('P', 'M', 'G')),
  itens_snapshot jsonb not null, -- [{item_id, nome, quantidade, unidade, custo_estimado}]
  custo_total_estimado numeric(8,2),
  atendente text
);
```

Habilitar RLS conforme padrão do resto do projeto. `itens_do_dia` e
`config_porcionamento` são as duas tabelas que a UI vai escrever
diretamente; `comandas_impressas` é somente-inserção pelo fluxo de
impressão.

---

## 5. Seed de dados — catálogo de itens com custo teórico e custo real

Inserir estes itens no `itens_catalogo` como carga inicial. Os pesos
marcados como "medido" vêm de pesagem real feita pelo dono; os demais estão
como `NULL` (status `pendente_peso`) até serem pesados — **não inventar
peso para eles**, deixar pendente é o comportamento correto. Preços
marcados como "TBD" ficam com `preco_kg_cru = NULL` (status
`pendente_preco`).

| Nome | Categoria/Subcategoria | Tipo porcionamento | Peso padrão | Preço/kg cru (custo teórico) | Fator rendimento | Custo/kg pronto (custo real) | Custo por porção | Status |
|---|---|---|---|---|---|---|---|---|
| Costela bovina (Pantanal/Minga grill) | carne / carne_assada_seca | pedaço | **40g (medido)** | R$22,74 | 0,70 | R$32,49 | **R$1,30** | ativo |
| Fralda bovina (Rio Maria) | carne / carne_assada_seca | pedaço | NULL | R$36,30 | 0,70 | R$51,86 | — | pendente_peso |
| Peito bovino | carne / carne_molho | pedaço | NULL | R$20,47 | 0,78 | R$26,24 | — | pendente_peso |
| Barriga suína (Cg) | carne / carne_assada_seca | pedaço | NULL | R$15,99 | 0,65 | R$24,60 | — | pendente_peso |
| Carne suína recorte s/ toucinho (paleta / porco ao molho) | carne / carne_molho | concha | **62,5g (medido)** | R$17,90 | 0,78 | R$22,95 | **R$1,43** | ativo |
| Retalho costela suína Premium | carne / carne_molho | concha | NULL | R$15,90 | 0,78 | R$20,38 | — | pendente_peso |
| Pele de suíno (pururuca) | carne / carne_assada_seca | pedaço | NULL | R$7,15 | 0,55 | R$13,00 | — | pendente_peso |
| Frango assado (coxa/sobrecoxa) | carne / carne_assada_seca | unidade | **85g (medido)** | R$6,90 | 0,70 | R$9,86 | **R$0,84** | ativo |
| Frango filé peito s/ osso | carne / carne_molho | pedaço | NULL | R$12,79 | 0,75 | R$17,05 | — | pendente_peso |
| Linguiça toscana | carne / embutido | pedaço | NULL | R$12,50 | 0,85 | R$14,71 | — | pendente_peso |
| Linguiça calabresa | carne / embutido | pedaço | NULL | R$4,64 | 0,85 | R$5,46 | — | pendente_peso |
| Linguiça suína (Sadia) | carne / embutido | pedaço | NULL | R$4,59 | 0,85 | R$5,40 | — | pendente_peso |
| Peixe filé cascudinho empanado | carne / peixe_frito | pedaço | NULL | R$21,98 | 0,80 | R$27,48 | — | pendente_peso |
| Arroz | base / base_cozida | concha | **52,5g (medido)** | R$3,67 | 2,50 | R$1,47 | **R$0,08** | ativo |
| Feijão | base / base_cozida | concha | **100g (medido)** | R$6,83 | 2,50 | R$2,73 | **R$0,27** | ativo |
| Anéis de cebola (congelado) | acompanhamento / frito | unidade | NULL | R$21,74 | 0,90 | R$24,16 | — | pendente_peso |
| Macarrão alho e óleo | acompanhamento / base_cozida | concha | NULL | — (TBD) | 2,20 (estimado) | — | — | pendente_preco |
| Farofa | acompanhamento / frito | colher | NULL | — (TBD) | 1,00 (estimado) | — | — | pendente_preco |
| Banana à milanesa | acompanhamento / frito | unidade | NULL | — (TBD) | 0,90 (estimado) | — | — | pendente_preco |
| Batata frita | acompanhamento / frito | unidade | NULL | — (TBD) | 0,75 (estimado) | — | — | pendente_preco |
| Salada / guarnição mista (tomate, alface, cenoura, milho, pepino) | acompanhamento / guarnicao_fresca | concha | NULL | — (TBD) | 0,95 (estimado) | — | — | pendente_preco |

> Os fatores de rendimento marcados "(estimado)" são médias de mercado, não
> medição real do Chapelão — o dono já foi orientado a validar isso com
> teste cru→pronto quando possível. Não é bloqueante para lançar o módulo.

---

## 6. Função 1 — Itens do dia

### O que faz
Toda manhã, a pessoa responsável (dono ou funcionária de confiança) abre uma
tela simples, vê o catálogo completo agrupado por categoria (Carnes /
Acompanhamentos / Base), e marca com um toggle/checkbox quais itens estão
disponíveis **hoje**. Confirma, e o sistema grava em `itens_do_dia` para a
data corrente.

### Regras
- Só itens com `status = 'ativo_catalogo'` no catálogo aparecem na lista
  (itens `inativo` — ex.: descontinuados — não aparecem nunca).
- Arroz e feijão devem vir **marcados como ativos por padrão** todo dia (são
  praticamente sempre servidos) — mas ainda editável, caso um dia falte.
- Se a pessoa esquecer de configurar o dia, o sistema deve assumir os itens
  do último dia configurado (fallback), nunca lista vazia — isso evita que a
  Função 2 fique sem itens pra imprimir por esquecimento operacional.
- Interface deve deixar claro, por item, se ele está **pendente de peso ou
  preço** (badge visual) — não bloqueia marcar como ativo hoje, mas avisa que
  o custo daquele item não vai entrar no cálculo de CMV até ser
  completado.

### Tela (requisitos de UI)
- Lista agrupada por categoria, com checkbox/toggle por item.
- Botão "Marcar todos" / "Desmarcar todos" por categoria (agiliza o dia a
  dia).
- Botão "Salvar itens de hoje" — grava tudo de uma vez.
- Mobile-first (provavelmente usado num tablet/celular na cozinha de manhã).

---

## 7. Função 2 — Porcionamento por tamanho + impressão de comanda

Esta função tem duas partes: (A) tela administrativa onde o dono configura
quantas conchas/unidades de cada item vão em cada tamanho, e (B) o fluxo de
venda onde a atendente seleciona o tamanho e a comanda sai na impressora.

### 7.A — Tela de configuração de porcionamento (admin)

- Grade/tabela: colunas = P, M, G; linhas = todos os itens do catálogo
  (agrupados por categoria, igual à Função 1).
- Cada célula = campo numérico editável (`quantidade`) representando quantas
  conchas/unidades/pedaços daquele item vão naquele tamanho. Vazio ou zero =
  item não entra naquele tamanho.
- Ao lado de cada linha, mostrar a **unidade de porcionamento** daquele item
  (concha/unidade/pedaço/colher) — não editável aqui, vem do catálogo.
- **Isto precisa ser 100% editável sem deploy** — é o requisito central que o
  dono pediu: ele quer poder ajustar "vai 2 unidades de frango assado na M"
  para 1 ou 3 a qualquer momento, direto pela tela, sem precisar chamar
  desenvolvimento.
- Ao salvar uma célula, grava/atualiza `config_porcionamento` (upsert por
  `tamanho + item_id`).
- **Bônus recomendado (não bloqueante para v1):** mostrar, ao lado de cada
  coluna de tamanho, o **custo total estimado daquela configuração** somando
  `quantidade × custo_por_porcao` de cada item ativo naquele tamanho, e
  comparar com o teto de CMV alvo da Seção 1 (R$6,65 / R$7,35 / R$8,05),
  com indicador visual verde/vermelho — assim o dono ajusta a configuração
  vendo o impacto no CMV em tempo real, exatamente como a planilha que ele já
  usa, mas dentro do próprio sistema.

### 7.B — Fluxo de venda / impressão da comanda

1. Atendente abre uma tela simples com 3 botões grandes: **Pequena / Média /
   Grande**.
2. Ao clicar em um tamanho, o sistema:
   - Busca os itens ativos hoje em `itens_do_dia` (data = hoje).
   - Cruza com `config_porcionamento` do tamanho selecionado (só itens com
     `quantidade > 0` e `ativo = true`).
   - Monta a lista final: **apenas itens que estão ativos hoje E têm
     configuração > 0 para aquele tamanho.**
   - Gera o texto da comanda (formato na Seção 8) e envia para a impressora
     térmica.
   - Grava um registro em `comandas_impressas` com o snapshot completo
     (itens + quantidades + custo total estimado, se o bônus da Seção 7.A
     estiver implementado).
3. Tela volta ao estado inicial (3 botões), pronta pro próximo pedido.

### Regra de borda importante
- Se um item está configurado para aquele tamanho (`config_porcionamento`)
  mas **não está ativo hoje** (`itens_do_dia`), ele **não aparece** na
  comanda — isso é o comportamento correto e esperado (ex.: peixe só existe
  na configuração mas só imprime nas sextas, quando está marcado como ativo
  do dia).
- Se um item está ativo hoje mas **não tem configuração** para aquele
  tamanho específico (esqueceram de configurar), ele simplesmente não entra
  na comanda — não deve gerar erro, mas é interessante logar/exibir um aviso
  discreto pro admin revisar depois ("3 itens ativos hoje sem configuração
  para o tamanho G", por exemplo), para não esconder lacunas de configuração
  silenciosamente para sempre.

---

## 8. Especificação da comanda impressa

### Formato de texto (impressora térmica 58mm ou 80mm — confirmar largura do
equipamento do restaurante antes de fixar a formatação)

```
        CHAPELÃO
     MARMITA MÉDIA
     17/07 12:04

--------------------------
ARROZ .................. 3 concha
FEIJÃO ................. 1 concha
FRANGO ASSADO ........... 2 un
PALETA (PORCO AO MOLHO) . 3 concha
COSTELA ASSADA .......... 2 pedaço
ANÉIS DE CEBOLA .......... 2 un
BATATA FRITA ............ 7 un
--------------------------
```

- Cabeçalho: nome do restaurante, tamanho, data/hora.
- Corpo: um item por linha, nome à esquerda, quantidade + unidade à direita
  (alinhamento simples, sem preço — a comanda é operacional, não é conta do
  cliente).
- Ordem sugerida: carnes primeiro (é o que a funcionária vai pesar/contar com
  mais atenção), depois base (arroz/feijão), depois acompanhamentos.
- Se o bônus de custo estimado (Seção 7.A) estiver ativo, opcionalmente
  incluir uma linha de rodapé só visível em modo "debug"/admin, não na
  comanda operacional do dia a dia (a atendente não precisa ver preço).

### Opções técnicas de impressão (já exploradas em conversa anterior deste
mesmo projeto — reaproveitar a decisão se já foi tomada em outra parte do
sistema)

1. **`window.print()` do navegador** — mais simples. Funciona bem se o
   notebook da atendente é fixo e a impressora térmica está configurada como
   impressora padrão do sistema operacional. Abre diálogo de impressão (ou
   pula direto, dependendo da configuração do driver).
2. **QZ Tray** — app gratuito que roda em background no notebook da
   atendente e permite impressão **silenciosa**, sem diálogo, direto da
   página web pro nome da impressora. Requer instalação única no
   computador do restaurante (pode ser feito remotamente via AnyDesk/
   TeamViewer). É a opção recomendada para o dia a dia de balcão, porque
   elimina qualquer clique extra da atendente no fluxo de venda.

Se o painel de pedidos que já existe no ecossistema Chapelão já resolve
impressão térmica de algum outro jeito, **usar o mesmo mecanismo** aqui, para
não duplicar configuração/dependência.

---

## 9. Casos de borda a tratar

- Catálogo sem nenhum item ativo hoje (esqueceram de configurar pela manhã)
  → fallback para o último dia configurado (ver Seção 6).
- Item com `preco_kg_cru = NULL` (pendente_preco) entrando numa comanda →
  não trava a impressão, mas se o bônus de custo estimado estiver ativo,
  contar como R$0,00 no total e sinalizar visualmente no admin que aquele
  total está subestimado.
- Duas atendentes imprimindo simultaneamente → sem problema, cada impressão
  é um registro independente em `comandas_impressas`, não há estado
  compartilhado sendo travado.
- Mudança de configuração de porcionamento no meio do dia (dono ajusta a
  quantidade de um item) → deve valer imediatamente para a próxima comanda
  impressa (não requer reiniciar nada). Comandas já impressas antes da
  mudança não são retroativamente alteradas (o snapshot em
  `comandas_impressas` preserva o que foi realmente impresso naquele
  momento).

---

## 10. Checklist de implementação

- [ ] Inspecionar repo existente (schema atual, stack, auth do painel) antes
      de criar tabelas novas
- [ ] Criar/adaptar tabelas: `itens_catalogo`, `itens_do_dia`,
      `config_porcionamento`, `comandas_impressas`
- [ ] Rodar seed dos itens da Seção 5 (com custo teórico, fator de
      rendimento, e status pendente_peso/pendente_preco onde aplicável)
- [ ] Tela Função 1 — Itens do dia (toggle por item, agrupado por categoria,
      fallback pro último dia configurado)
- [ ] Tela Função 2.A — Grade de configuração de porcionamento por tamanho
      (editável, upsert em `config_porcionamento`)
- [ ] (Bônus) Cálculo de custo estimado por tamanho na própria grade,
      comparando com teto de CMV (R$6,65 / R$7,35 / R$8,05)
- [ ] Tela Função 2.B — 3 botões (P/M/G) que geram e imprimem a comanda
- [ ] Lógica de cruzamento `itens_do_dia` ∩ `config_porcionamento` do
      tamanho selecionado
- [ ] Implementar impressão térmica (`window.print()` ou QZ Tray — decidir
      conforme Seção 8)
- [ ] Gravar `comandas_impressas` a cada impressão
- [ ] Testar fluxo completo: configurar itens do dia → configurar
      porcionamento → selecionar tamanho → conferir texto da comanda →
      imprimir de verdade na impressora do restaurante

---

## 11. Perguntas em aberto — confirmar com o dono (Peter) antes de travar os
valores padrão de M e G

1. **Quantidade de carne em Média vs Grande.** A descrição original foi "2
   carne e 2 pedaço de cada" para os dois tamanhos, idêntica. A diferença
   entre M e G é só em arroz/feijão (3 vs 4 conchas de arroz; "inteira" vs
   "cheia" no feijão), ou a carne também deveria aumentar da M pra G? Isso
   muda bastante o custo da G e deveria refletir no preço/margem dela.
2. **"2 pedaço de cada" — de cada o quê exatamente?** Confirmar se significa
   2 pedaços de cada uma das carnes disponíveis no dia (ex.: se hoje tem
   frango + costela + porco, seria 2 de cada = 6 pedaços de carne no total),
   ou se é uma escolha limitada (ex.: cliente escolhe 2 carnes, 2 pedaços de
   cada = 4 no total). O cardápio anexado diz "pode pegar quantos
   acompanhamentos quiser e 2 carnes" — isso sugere a segunda leitura (2
   tipos de carne escolhidos, 2 pedaços de cada tipo = 4 pedaços), mas vale
   confirmar antes de travar a configuração padrão de M/G no sistema.
3. **Pesagem pendente.** Vários itens do catálogo (Seção 5) estão sem peso
   padrão medido — quando possível, pesar a concha/unidade padrão de cada um
   (igual já foi feito para arroz, feijão, frango, paleta e costela) e
   atualizar o campo `peso_padrao_g` no catálogo.
4. **Preços pendentes.** Macarrão, farofa, banana à milanesa, batata frita e
   salada estão sem preço de compra cadastrado — confirmar preço/kg desses
   itens (ou informar que são insumos de baixo impacto e podem ficar com
   custo aproximado/zero por ora).

-- Migration: investimento_posicao_movimentacao
-- Transforma snapshots mensais em modelo Posição + Movimentações
-- NOTA: tabela original não tinha pessoaId — todas posições migram com pessoaId = NULL

-- Passo 1: Criar tabela de movimentações
CREATE TABLE "MovimentacaoInvestimento" (
  "id"             INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "investimentoId" INTEGER NOT NULL,
  "mesRef"         TEXT    NOT NULL,
  "tipo"           TEXT    NOT NULL,
  "valor"          REAL    NOT NULL,
  "notas"          TEXT,
  CONSTRAINT "MovimentacaoInvestimento_investimentoId_fkey"
    FOREIGN KEY ("investimentoId") REFERENCES "Investimento"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "MovimentacaoInvestimento_investimentoId_mesRef_idx" ON "MovimentacaoInvestimento"("investimentoId", "mesRef");
CREATE INDEX "MovimentacaoInvestimento_mesRef_idx" ON "MovimentacaoInvestimento"("mesRef");

-- Passo 2: Criar nova estrutura de posição permanente
CREATE TABLE "Investimento_new" (
  "id"          INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "pessoaId"    INTEGER,
  "categoria"   TEXT    NOT NULL,
  "instituicao" TEXT    NOT NULL DEFAULT '',
  "ativo"       BOOLEAN NOT NULL DEFAULT 1,
  "notas"       TEXT,
  CONSTRAINT "Investimento_pessoaId_fkey"
    FOREIGN KEY ("pessoaId") REFERENCES "Pessoa"("id") ON UPDATE CASCADE ON DELETE SET NULL
);

-- Passo 3: Migrar posições únicas (sem pessoaId — nunca existiu na tabela original)
INSERT INTO "Investimento_new" ("id", "pessoaId", "categoria", "instituicao", "ativo", "notas")
SELECT
  MIN("id")    AS "id",
  NULL         AS "pessoaId",
  "categoria",
  "instituicao",
  1            AS "ativo",
  MAX("notas") AS "notas"
FROM "Investimento"
GROUP BY "categoria", "instituicao";

-- Passo 4: Migrar APORTEs históricos (aporteMe > 0)
INSERT INTO "MovimentacaoInvestimento" ("investimentoId", "mesRef", "tipo", "valor", "notas")
SELECT
  n."id"         AS "investimentoId",
  old."mesRef",
  'APORTE'       AS "tipo",
  old."aporteMe" AS "valor",
  NULL           AS "notas"
FROM "Investimento" AS old
JOIN "Investimento_new" AS n
  ON n."categoria"    = old."categoria"
 AND n."instituicao"  = old."instituicao"
WHERE old."aporteMe" > 0;

-- Passo 5: Migrar saldo residual como RENDIMENTO seed (apenas mês mais antigo por posição)
INSERT INTO "MovimentacaoInvestimento" ("investimentoId", "mesRef", "tipo", "valor", "notas")
SELECT
  n."id"                               AS "investimentoId",
  oldest."mesRef",
  'RENDIMENTO'                         AS "tipo",
  (oldest."valor" - oldest."aporteMe") AS "valor",
  'Migrado do snapshot inicial'        AS "notas"
FROM (
  SELECT "categoria", "instituicao", MIN("mesRef") AS "min_mes"
  FROM "Investimento"
  GROUP BY "categoria", "instituicao"
) AS grp
JOIN "Investimento" AS oldest
  ON oldest."categoria"    = grp."categoria"
 AND oldest."instituicao"  = grp."instituicao"
 AND oldest."mesRef"       = grp."min_mes"
JOIN "Investimento_new" AS n
  ON n."categoria"   = oldest."categoria"
 AND n."instituicao" = oldest."instituicao"
WHERE (oldest."valor" - oldest."aporteMe") > 0;

-- Passo 6: Substituir tabela antiga
DROP TABLE "Investimento";
ALTER TABLE "Investimento_new" RENAME TO "Investimento";

-- Passo 7: Índice unique na nova tabela
CREATE UNIQUE INDEX "Investimento_pessoaId_categoria_instituicao_key"
  ON "Investimento"("pessoaId", "categoria", "instituicao");

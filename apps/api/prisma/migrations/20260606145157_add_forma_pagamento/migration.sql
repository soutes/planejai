-- CreateTable
CREATE TABLE "FormaPagamento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pessoaId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "FormaPagamento_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "Pessoa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Despesa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "abaId" INTEGER NOT NULL,
    "mesRef" TEXT NOT NULL,
    "data" TEXT,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "notas" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'manual',
    "recorrente" BOOLEAN NOT NULL DEFAULT false,
    "totalRepeticoes" INTEGER,
    "origemId" INTEGER,
    "parcelaNum" INTEGER,
    "totalParcelas" INTEGER,
    "emFaturaCartao" BOOLEAN NOT NULL DEFAULT false,
    "cartaoId" INTEGER,
    "somenteMeu" BOOLEAN NOT NULL DEFAULT false,
    "pagadorId" INTEGER,
    "formaPagamentoId" INTEGER,
    CONSTRAINT "Despesa_abaId_fkey" FOREIGN KEY ("abaId") REFERENCES "AbaDespesa" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Despesa_cartaoId_fkey" FOREIGN KEY ("cartaoId") REFERENCES "Cartao" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Despesa_pagadorId_fkey" FOREIGN KEY ("pagadorId") REFERENCES "Pessoa" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Despesa_formaPagamentoId_fkey" FOREIGN KEY ("formaPagamentoId") REFERENCES "FormaPagamento" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Despesa" ("abaId", "cartaoId", "categoria", "data", "descricao", "emFaturaCartao", "id", "mesRef", "notas", "origemId", "pagadorId", "parcelaNum", "recorrente", "somenteMeu", "tipo", "totalParcelas", "totalRepeticoes", "valor") SELECT "abaId", "cartaoId", "categoria", "data", "descricao", "emFaturaCartao", "id", "mesRef", "notas", "origemId", "pagadorId", "parcelaNum", "recorrente", "somenteMeu", "tipo", "totalParcelas", "totalRepeticoes", "valor" FROM "Despesa";
DROP TABLE "Despesa";
ALTER TABLE "new_Despesa" RENAME TO "Despesa";
CREATE INDEX "Despesa_abaId_mesRef_idx" ON "Despesa"("abaId", "mesRef");
CREATE INDEX "Despesa_cartaoId_mesRef_idx" ON "Despesa"("cartaoId", "mesRef");
CREATE INDEX "Despesa_origemId_idx" ON "Despesa"("origemId");
CREATE INDEX "Despesa_pagadorId_idx" ON "Despesa"("pagadorId");
CREATE INDEX "Despesa_formaPagamentoId_idx" ON "Despesa"("formaPagamentoId");
CREATE TABLE "new_Rendimento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pessoaId" INTEGER,
    "mesRef" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'Salário',
    "valor" REAL NOT NULL,
    "recorrente" BOOLEAN NOT NULL DEFAULT false,
    "totalRepeticoes" INTEGER,
    "origemId" INTEGER,
    "formaPagamentoId" INTEGER,
    CONSTRAINT "Rendimento_formaPagamentoId_fkey" FOREIGN KEY ("formaPagamentoId") REFERENCES "FormaPagamento" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Rendimento" ("categoria", "descricao", "id", "mesRef", "origemId", "pessoaId", "recorrente", "totalRepeticoes", "valor") SELECT "categoria", "descricao", "id", "mesRef", "origemId", "pessoaId", "recorrente", "totalRepeticoes", "valor" FROM "Rendimento";
DROP TABLE "Rendimento";
ALTER TABLE "new_Rendimento" RENAME TO "Rendimento";
CREATE INDEX "Rendimento_mesRef_idx" ON "Rendimento"("mesRef");
CREATE INDEX "Rendimento_pessoaId_mesRef_idx" ON "Rendimento"("pessoaId", "mesRef");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "FormaPagamento_pessoaId_idx" ON "FormaPagamento"("pessoaId");

-- CreateIndex
CREATE UNIQUE INDEX "FormaPagamento_pessoaId_nome_key" ON "FormaPagamento"("pessoaId", "nome");

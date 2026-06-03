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
    CONSTRAINT "Despesa_abaId_fkey" FOREIGN KEY ("abaId") REFERENCES "AbaDespesa" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Despesa_cartaoId_fkey" FOREIGN KEY ("cartaoId") REFERENCES "Cartao" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Despesa_pagadorId_fkey" FOREIGN KEY ("pagadorId") REFERENCES "Pessoa" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Despesa" ("abaId", "cartaoId", "categoria", "data", "descricao", "emFaturaCartao", "id", "mesRef", "notas", "origemId", "parcelaNum", "recorrente", "somenteMeu", "tipo", "totalParcelas", "totalRepeticoes", "valor") SELECT "abaId", "cartaoId", "categoria", "data", "descricao", "emFaturaCartao", "id", "mesRef", "notas", "origemId", "parcelaNum", "recorrente", "somenteMeu", "tipo", "totalParcelas", "totalRepeticoes", "valor" FROM "Despesa";
DROP TABLE "Despesa";
ALTER TABLE "new_Despesa" RENAME TO "Despesa";
CREATE INDEX "Despesa_abaId_mesRef_idx" ON "Despesa"("abaId", "mesRef");
CREATE INDEX "Despesa_cartaoId_mesRef_idx" ON "Despesa"("cartaoId", "mesRef");
CREATE INDEX "Despesa_origemId_idx" ON "Despesa"("origemId");
CREATE INDEX "Despesa_pagadorId_idx" ON "Despesa"("pagadorId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateTable
CREATE TABLE "AcertoEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pessoaId" INTEGER NOT NULL,
    "mesRef" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "data" TEXT NOT NULL,
    "formaPagamento" TEXT NOT NULL,
    "observacao" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AcertoEntry_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "Pessoa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AcertoDespesaSplit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "acertoId" INTEGER NOT NULL,
    "splitId" INTEGER NOT NULL,
    "valorCoberto" REAL NOT NULL,
    CONSTRAINT "AcertoDespesaSplit_acertoId_fkey" FOREIGN KEY ("acertoId") REFERENCES "AcertoEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AcertoDespesaSplit_splitId_fkey" FOREIGN KEY ("splitId") REFERENCES "DespesaSplit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DespesaSplit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "despesaId" INTEGER NOT NULL,
    "pessoaId" INTEGER NOT NULL,
    "ratio" REAL NOT NULL,
    "valorCalculado" REAL NOT NULL,
    "valorQuitado" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "DespesaSplit_despesaId_fkey" FOREIGN KEY ("despesaId") REFERENCES "Despesa" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DespesaSplit_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "Pessoa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DespesaSplit" ("despesaId", "id", "pessoaId", "ratio", "valorCalculado") SELECT "despesaId", "id", "pessoaId", "ratio", "valorCalculado" FROM "DespesaSplit";
DROP TABLE "DespesaSplit";
ALTER TABLE "new_DespesaSplit" RENAME TO "DespesaSplit";
CREATE TABLE "new_Rendimento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pessoaId" INTEGER,
    "mesRef" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'Salário',
    "valor" REAL NOT NULL,
    "recorrente" BOOLEAN NOT NULL DEFAULT false,
    "totalRepeticoes" INTEGER,
    "origemId" INTEGER
);
INSERT INTO "new_Rendimento" ("categoria", "descricao", "id", "mesRef", "origemId", "pessoaId", "recorrente", "totalRepeticoes", "valor") SELECT "categoria", "descricao", "id", "mesRef", "origemId", "pessoaId", "recorrente", "totalRepeticoes", "valor" FROM "Rendimento";
DROP TABLE "Rendimento";
ALTER TABLE "new_Rendimento" RENAME TO "Rendimento";
CREATE INDEX "Rendimento_mesRef_idx" ON "Rendimento"("mesRef");
CREATE INDEX "Rendimento_pessoaId_mesRef_idx" ON "Rendimento"("pessoaId", "mesRef");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "AcertoEntry_pessoaId_mesRef_idx" ON "AcertoEntry"("pessoaId", "mesRef");

-- CreateIndex
CREATE INDEX "AcertoDespesaSplit_acertoId_idx" ON "AcertoDespesaSplit"("acertoId");

-- CreateIndex
CREATE INDEX "AcertoDespesaSplit_splitId_idx" ON "AcertoDespesaSplit"("splitId");

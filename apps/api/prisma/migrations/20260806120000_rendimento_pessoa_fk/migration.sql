-- RedefineTables: adiciona FK Rendimento.pessoaId -> Pessoa(id) ON DELETE SET NULL
--
-- Rendimento nao tem NENHUMA tabela dependente (nada referencia Rendimento), entao
-- este rebuild nao dispara cascade em outra tabela. Foi por isso que a FK aqui e
-- segura, enquanto a de Despesa.origemId nao seria: reconstruir Despesa cascatearia
-- em DespesaSplit.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    CONSTRAINT "Rendimento_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "Pessoa" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Rendimento" ("categoria", "descricao", "id", "mesRef", "origemId", "pessoaId", "recorrente", "totalRepeticoes", "valor") SELECT "categoria", "descricao", "id", "mesRef", "origemId", "pessoaId", "recorrente", "totalRepeticoes", "valor" FROM "Rendimento";
DROP TABLE "Rendimento";
ALTER TABLE "new_Rendimento" RENAME TO "Rendimento";
CREATE INDEX "Rendimento_mesRef_idx" ON "Rendimento"("mesRef");
CREATE INDEX "Rendimento_pessoaId_mesRef_idx" ON "Rendimento"("pessoaId", "mesRef");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Cartao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "proprietario" TEXT,
    "finalDigitos" TEXT,
    "cor" TEXT NOT NULL DEFAULT '#10F5A3',
    "limite" REAL,
    "diaFechamento" INTEGER NOT NULL DEFAULT 5,
    "diaVencimento" INTEGER NOT NULL DEFAULT 10,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "abaId" INTEGER,
    CONSTRAINT "Cartao_abaId_fkey" FOREIGN KEY ("abaId") REFERENCES "AbaDespesa" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Cartao" ("abaId", "ativo", "cor", "diaFechamento", "finalDigitos", "id", "limite", "nome", "proprietario") SELECT "abaId", "ativo", "cor", "diaFechamento", "finalDigitos", "id", "limite", "nome", "proprietario" FROM "Cartao";
DROP TABLE "Cartao";
ALTER TABLE "new_Cartao" RENAME TO "Cartao";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

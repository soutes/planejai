-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AbaDespesa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '💸',
    "cor" TEXT NOT NULL DEFAULT '#10F5A3',
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "splitDestinoCategoria" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "pessoaId" INTEGER,
    CONSTRAINT "AbaDespesa_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "Pessoa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AbaDespesa" ("ativo", "cor", "icon", "id", "nome", "ordem", "splitDestinoCategoria") SELECT "ativo", "cor", "icon", "id", "nome", "ordem", "splitDestinoCategoria" FROM "AbaDespesa";
DROP TABLE "AbaDespesa";
ALTER TABLE "new_AbaDespesa" RENAME TO "AbaDespesa";
CREATE TABLE "new_Pessoa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "cor" TEXT NOT NULL DEFAULT '#B07AFF',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "familiar" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Pessoa" ("ativo", "cor", "id", "nome") SELECT "ativo", "cor", "id", "nome" FROM "Pessoa";
DROP TABLE "Pessoa";
ALTER TABLE "new_Pessoa" RENAME TO "Pessoa";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Data migration: link existing "Pessoal" aba to first pessoa, mark them familiar
UPDATE "Pessoa" SET "familiar" = true WHERE "id" = (SELECT MIN("id") FROM "Pessoa");
UPDATE "AbaDespesa"
  SET "pessoaId" = (SELECT MIN("id") FROM "Pessoa"),
      "nome"    = (SELECT "nome" FROM "Pessoa" WHERE "id" = (SELECT MIN("id") FROM "Pessoa"))
  WHERE "nome" = 'Pessoal';

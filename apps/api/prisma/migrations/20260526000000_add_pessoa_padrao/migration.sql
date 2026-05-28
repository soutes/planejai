-- Restaura coluna Pessoa.padrao removida acidentalmente na migration 20260522162101
ALTER TABLE "Pessoa" ADD COLUMN "padrao" BOOLEAN NOT NULL DEFAULT false;

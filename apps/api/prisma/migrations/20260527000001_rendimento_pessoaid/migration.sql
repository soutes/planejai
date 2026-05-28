-- AddColumn pessoaId to Rendimento (schema drift fix)
ALTER TABLE "Rendimento" ADD COLUMN "pessoaId" INTEGER REFERENCES "Pessoa"("id") ON UPDATE CASCADE ON DELETE SET NULL;
CREATE INDEX "Rendimento_pessoaId_mesRef_idx" ON "Rendimento"("pessoaId", "mesRef");

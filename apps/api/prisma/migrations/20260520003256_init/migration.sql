-- CreateTable
CREATE TABLE "Pessoa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "cor" TEXT NOT NULL DEFAULT '#B07AFF',
    "ativo" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "AbaDespesa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '💸',
    "cor" TEXT NOT NULL DEFAULT '#10F5A3',
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "splitDestinoCategoria" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "AbaPessoa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "abaId" INTEGER NOT NULL,
    "pessoaId" INTEGER NOT NULL,
    "ratioDefault" REAL NOT NULL DEFAULT 0.5,
    CONSTRAINT "AbaPessoa_abaId_fkey" FOREIGN KEY ("abaId") REFERENCES "AbaDespesa" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AbaPessoa_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "Pessoa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '📌',
    "padrao" BOOLEAN NOT NULL DEFAULT false,
    "permanente" BOOLEAN NOT NULL DEFAULT true,
    "ativa" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "RegraFixa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "abaId" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "diaVencimento" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "RegraFixa_abaId_fkey" FOREIGN KEY ("abaId") REFERENCES "AbaDespesa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CategoryRule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pattern" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Despesa" (
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
    CONSTRAINT "Despesa_abaId_fkey" FOREIGN KEY ("abaId") REFERENCES "AbaDespesa" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Despesa_cartaoId_fkey" FOREIGN KEY ("cartaoId") REFERENCES "Cartao" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DespesaSplit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "despesaId" INTEGER NOT NULL,
    "pessoaId" INTEGER NOT NULL,
    "ratio" REAL NOT NULL,
    "valorCalculado" REAL NOT NULL,
    CONSTRAINT "DespesaSplit_despesaId_fkey" FOREIGN KEY ("despesaId") REFERENCES "Despesa" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DespesaSplit_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "Pessoa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DivisaoEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pessoaId" INTEGER NOT NULL,
    "mesRef" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valorTotal" REAL NOT NULL,
    "direcao" TEXT NOT NULL DEFAULT 'a_receber',
    "parcelado" BOOLEAN NOT NULL DEFAULT false,
    "totalParcelas" INTEGER,
    "parcelaAtual" INTEGER DEFAULT 1,
    "dataInicio" TEXT,
    "origemDespesaId" INTEGER,
    "quitado" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT,
    CONSTRAINT "DivisaoEntry_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "Pessoa" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DivisaoEntry_origemDespesaId_fkey" FOREIGN KEY ("origemDespesaId") REFERENCES "Despesa" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Orcamento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "abaId" INTEGER NOT NULL,
    "mesRef" TEXT,
    "categoria" TEXT NOT NULL,
    "valorMeta" REAL NOT NULL,
    CONSTRAINT "Orcamento_abaId_fkey" FOREIGN KEY ("abaId") REFERENCES "AbaDespesa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Rendimento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mesRef" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'Salário',
    "valor" REAL NOT NULL,
    "recorrente" BOOLEAN NOT NULL DEFAULT false,
    "totalRepeticoes" INTEGER,
    "origemId" INTEGER
);

-- CreateTable
CREATE TABLE "Investimento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mesRef" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "instituicao" TEXT NOT NULL DEFAULT '',
    "valor" REAL NOT NULL,
    "aporteMe" REAL NOT NULL DEFAULT 0,
    "notas" TEXT
);

-- CreateTable
CREATE TABLE "Cartao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "proprietario" TEXT,
    "finalDigitos" TEXT,
    "cor" TEXT NOT NULL DEFAULT '#10F5A3',
    "limite" REAL,
    "diaFechamento" INTEGER NOT NULL DEFAULT 5,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "abaId" INTEGER,
    CONSTRAINT "Cartao_abaId_fkey" FOREIGN KEY ("abaId") REFERENCES "AbaDespesa" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CartaoSplit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cartaoId" INTEGER NOT NULL,
    "pessoaId" INTEGER NOT NULL,
    "ratio" REAL NOT NULL,
    CONSTRAINT "CartaoSplit_cartaoId_fkey" FOREIGN KEY ("cartaoId") REFERENCES "Cartao" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CartaoSplit_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "Pessoa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Fatura" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fileHash" TEXT NOT NULL,
    "arquivoOriginal" TEXT NOT NULL,
    "banco" TEXT,
    "mesReferencia" TEXT,
    "vencimento" TEXT,
    "total" REAL,
    "limite" REAL,
    "comentarioExecutivo" TEXT,
    "analiseJson" TEXT NOT NULL,
    "criadoEm" TEXT NOT NULL,
    "cartaoId" INTEGER NOT NULL,
    CONSTRAINT "Fatura_cartaoId_fkey" FOREIGN KEY ("cartaoId") REFERENCES "Cartao" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transacao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "faturaId" INTEGER NOT NULL,
    "data" TEXT,
    "descricao" TEXT,
    "estabelecimento" TEXT,
    "valor" REAL,
    "categoria" TEXT,
    "parcela" TEXT,
    CONSTRAINT "Transacao_faturaId_fkey" FOREIGN KEY ("faturaId") REFERENCES "Fatura" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SnapshotCiclo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cartaoId" INTEGER NOT NULL,
    "cicloInicio" TEXT NOT NULL,
    "cicloFim" TEXT NOT NULL,
    "dataUpload" TEXT NOT NULL,
    "total" REAL NOT NULL,
    "qtdTransacoes" INTEGER NOT NULL DEFAULT 0,
    "jsonDados" TEXT NOT NULL,
    CONSTRAINT "SnapshotCiclo_cartaoId_fkey" FOREIGN KEY ("cartaoId") REFERENCES "Cartao" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AbaPessoa_abaId_pessoaId_key" ON "AbaPessoa"("abaId", "pessoaId");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nome_key" ON "Categoria"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryRule_pattern_key" ON "CategoryRule"("pattern");

-- CreateIndex
CREATE INDEX "Despesa_abaId_mesRef_idx" ON "Despesa"("abaId", "mesRef");

-- CreateIndex
CREATE INDEX "Despesa_cartaoId_mesRef_idx" ON "Despesa"("cartaoId", "mesRef");

-- CreateIndex
CREATE INDEX "Despesa_origemId_idx" ON "Despesa"("origemId");

-- CreateIndex
CREATE INDEX "DivisaoEntry_pessoaId_quitado_idx" ON "DivisaoEntry"("pessoaId", "quitado");

-- CreateIndex
CREATE INDEX "DivisaoEntry_mesRef_idx" ON "DivisaoEntry"("mesRef");

-- CreateIndex
CREATE UNIQUE INDEX "Orcamento_abaId_mesRef_categoria_key" ON "Orcamento"("abaId", "mesRef", "categoria");

-- CreateIndex
CREATE INDEX "Rendimento_mesRef_idx" ON "Rendimento"("mesRef");

-- CreateIndex
CREATE INDEX "Investimento_mesRef_idx" ON "Investimento"("mesRef");

-- CreateIndex
CREATE UNIQUE INDEX "Investimento_mesRef_categoria_instituicao_key" ON "Investimento"("mesRef", "categoria", "instituicao");

-- CreateIndex
CREATE INDEX "CartaoSplit_cartaoId_idx" ON "CartaoSplit"("cartaoId");

-- CreateIndex
CREATE UNIQUE INDEX "CartaoSplit_cartaoId_pessoaId_key" ON "CartaoSplit"("cartaoId", "pessoaId");

-- CreateIndex
CREATE UNIQUE INDEX "Fatura_fileHash_key" ON "Fatura"("fileHash");

-- CreateIndex
CREATE INDEX "Fatura_cartaoId_idx" ON "Fatura"("cartaoId");

-- CreateIndex
CREATE INDEX "Fatura_mesReferencia_idx" ON "Fatura"("mesReferencia");

-- CreateIndex
CREATE INDEX "Transacao_faturaId_idx" ON "Transacao"("faturaId");

-- CreateIndex
CREATE INDEX "Transacao_categoria_idx" ON "Transacao"("categoria");

-- CreateIndex
CREATE INDEX "Transacao_data_idx" ON "Transacao"("data");

-- CreateIndex
CREATE INDEX "SnapshotCiclo_cartaoId_idx" ON "SnapshotCiclo"("cartaoId");

-- CreateIndex
CREATE INDEX "SnapshotCiclo_cicloInicio_cicloFim_idx" ON "SnapshotCiclo"("cicloInicio", "cicloFim");

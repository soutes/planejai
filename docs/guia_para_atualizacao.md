# Guia para Atualização — planejAÍ

> **Objetivo:** garantir que qualquer atualização (incluindo a v2.0) **nunca apague nem corrompa os dados do usuário**.
> Leia antes de tocar em schema, migrations, instalador ou caminho de dados.

---

## Princípio inviolável

> **O arquivo `data/planejAI.db` é sagrado. Toda atualização deve assumir que ele já existe e contém dados reais do usuário que NÃO podem ser perdidos.**

Antes de qualquer mudança que toque o banco: **backup primeiro, migração depois, validação no fim.**

---

## Onde os dados vivem (verificado)

| Item | Caminho / Mecanismo | Fonte |
|------|---------------------|-------|
| Banco SQLite | `data/planejAI.db` | [`paths.ts`](../apps/api/src/shared/paths.ts) `getDatabaseFile()` |
| Diretório de dados | `<repo>/data/` ou `$PLANEJAI_DATA_DIR` | `getDataDir()` |
| Backups automáticos | `data/planejAI.db.bak-{YYYY-MM-DD_HHmmss}` | [`backup.ts`](../apps/api/src/shared/backup.ts) |
| Segredo de criptografia | `data/.secret` | `getSecretFile()` |
| Conexão Prisma | `DATABASE_URL` do `.env`, fallback `file:${getDatabaseFile()}` | [`prisma.ts`](../apps/api/src/shared/prisma.ts) |
| Chave de API IA | `AIConfig.apiKey` — **AES-256-GCM**, cifrada com `data/.secret` | schema `AIConfig` |

**Implicação crítica:** o `.secret` e o `planejAI.db` são um par. Se um for substituído sem o outro, a `apiKey` cifrada fica ilegível. O `backupDatabase()` já copia os dois juntos — ao restaurar manualmente, **restaure o par do mesmo `{timestamp}`.**

---

## Checklist pré-atualização (executar nesta ordem)

1. **Backup manual antes de tudo**
   ```bash
   cd apps/api
   npm run db:backup        # gera data/planejAI.db.bak-{timestamp}
   ```
   O backup já inclui automaticamente o `.db` + sidecars SQLite (`-journal`/`-wal`/`-shm`) e o `.secret` (salvo como `.secret.bak-{timestamp}`). Retenção: últimos 10 conjuntos (`PLANEJAI_BACKUP_KEEP` para ajustar).

2. **Verifique migrations pendentes**
   ```bash
   cd apps/api
   npx prisma migrate status
   ```

3. **Aplique migrations pelo wrapper seguro — nunca o comando cru**
   ```bash
   npm run db:migrate:deploy   # = tsx scripts/migrate-safe.ts (backup + migrate deploy)
   ```
   O `migrate-safe.ts` faz backup antes e, em falha, loga `Backup disponível em: <path>`.

4. **Valide os dados depois**
   - Abra o app, confirme contagem de despesas/rendimentos/cartões do mês corrente.
   - Confira que a chave de IA ainda descriptografa (Gestão → IA não pede recadastro).

5. **Só então** descarte os `.bak-` antigos (mantenha pelo menos o último).

---

## Regras de migration — evitar perda de dados

### Migrations destrutivas exigem migração de dados explícita
Prisma gera `DROP COLUMN` / `DROP TABLE` quando um campo some do schema. **Antes de remover/renomear:**

- **Renomear coluna:** não delete + recrie. Use migração SQL manual com `ALTER TABLE ... RENAME COLUMN`, ou crie a nova coluna → copie os dados → remova a antiga em migration separada.
- **Mudar tipo de coluna:** migre os valores explicitamente (ex.: criar coluna nova, `UPDATE` copiando convertido, dropar a antiga).
- **Remover tabela com dados:** exporte/migre antes. Confirme que nenhuma feature ainda lê dela.

### Contratos que NÃO podem mudar de forma (quebram dados existentes)
- `mesRef` sempre `String` no formato `YYYY-MM` — nunca virar `Date`/`Int`.
- Datas de transação ISO `YYYY-MM-DD` como `String`.
- Valores monetários em `Float` (reais) — **nunca migrar para centavos/Int** (quebra todos os registros do legado).
- `origemId` (Despesa/Rendimento) é coluna plain sem FK — manter assim.
- IDs sentinela: `Cartao id=1` ('Sem cartão'), `AIConfig id=1` (singleton). Nunca deletar nem renumerar.

### Co-commit obrigatório
Toda mudança de schema deve atualizar juntos: [`schema.prisma`](../apps/api/prisma/schema.prisma) + migration SQL + [`docs/erd.md`](erd.md).

---

## O que NUNCA fazer em ambiente com dados do usuário

- ❌ `npm run db:reset` / `prisma migrate reset` — **apaga o banco inteiro**. Só em dev descartável.
- ❌ `prisma db push --force-reset` — idem.
- ❌ Copiar/sobrescrever `data/planejAI.db` com `prisma/template.db`. O `ensureDatabase()` em [`server.ts`](../apps/api/src/server.ts) só copia o template **quando o arquivo não existe** — não quebre essa guarda; nunca force a cópia.
- ❌ Rodar migration sem backup. Use sempre `db:migrate` / `db:migrate:deploy` (wrappers com backup), não os comandos `prisma` crus.
- ❌ Regenerar/apagar `data/.secret` — torna a `apiKey` cifrada irrecuperável.
- ❌ Mudar o caminho de `getDataDir()` sem migrar o `.db` (+ `.secret`) existente para o novo local. O usuário pensaria que perdeu tudo.
- ❌ Instalador sobrescrever a pasta `data/`. Verifique [`installer/scripts/build-all.mjs`](../installer/scripts/build-all.mjs): o pacote de atualização **não** pode incluir nem limpar `data/`.

---

## Rollback (se a atualização falhar)

1. Pare a API.
2. Restaure o conjunto do mesmo `{timestamp}` (`.db` + sidecars + `.secret`):
   ```bash
   # dentro de data/  (Windows)
   copy /Y planejAI.db.bak-{timestamp}         planejAI.db
   copy /Y .secret.bak-{timestamp}             .secret
   # se houver sidecars do mesmo stamp, restaure -journal/-wal/-shm também
   ```
3. Faça checkout do código na versão anterior à migration.
4. Reinicie e valide.

---

## Prompt pronto — colar no agente ao iniciar a v2.0

```
Vou atualizar o planejAÍ para a v2.0. RESTRIÇÃO ABSOLUTA: não posso perder
nenhum dado do usuário. O banco real está em data/planejAI.db e o segredo de
criptografia em data/.secret (par indissociável — a apiKey de IA é cifrada com ele).

Antes de qualquer mudança no banco, siga docs/guia_para_atualizacao.md. Em especial:

1. Faça backup ANTES de migrar: rode `npm run db:backup` (já cobre .db + sidecars + .secret).
2. Aplique migrations só pelo wrapper seguro `npm run db:migrate:deploy`
   (scripts/migrate-safe.ts faz backup + prisma migrate deploy). NUNCA use
   `prisma migrate reset`, `db:reset` ou `db push --force-reset`.
3. Migrations destrutivas (DROP/rename de coluna, troca de tipo) exigem migração
   de dados explícita em SQL — nunca delete+recrie campos com dados.
4. NÃO mude os contratos: mesRef = String 'YYYY-MM', valores = Float reais (não
   centavos), datas = String 'YYYY-MM-DD'. IDs sentinela Cartao id=1 e
   AIConfig id=1 são intocáveis.
5. NÃO sobrescreva data/planejAI.db com prisma/template.db. A guarda em
   server.ts ensureDatabase() só copia template quando o arquivo não existe —
   preserve isso. O instalador não pode tocar na pasta data/.
6. Co-commit: schema.prisma + migration SQL + docs/erd.md sempre juntos.
7. Ao final, valide: contagens de despesas/rendimentos/cartões batem e a chave
   de IA ainda descriptografa (Gestão → IA não pede recadastro).

Se algo falhar no migrate, NÃO tente "consertar" o banco — restaure o backup
mais recente (data/planejAI.db.bak-{timestamp}) e me avise.
```

---

> Mantenha este guia versionado. Atualize-o se mudar o caminho de dados, o mecanismo de backup ou o esquema de criptografia.

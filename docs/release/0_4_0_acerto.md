# Release v0.4.0-acerto

Data: 2026-05-29
Time: planejai-acerto-team (lead-acerto-agent)
US: US-12 (Visualizar saldo consolidado) + US-13 (Registrar acerto e histórico)

---

## Escopo

Feature de Acerto de Contas end-to-end: cálculo de saldo por pessoa, registro de acertos com FIFO parcial, histórico com filtros, reversão ao excluir.

---

## Arquivos criados

### Backend (`apps/api`)
| Arquivo | Descrição |
|---------|-----------|
| `prisma/migrations/20260528233230_acerto_entry/` | Migration: AcertoEntry, AcertoDespesaSplit, DespesaSplit.valorQuitado |
| `domain/entities/Acerto.ts` | SaldoPessoa, SaldoDespesa, AcertoEntry, CreateAcertoInput, HistoricoFilter |
| `domain/repositories/IAcertoRepository.ts` | Interface com 5 métodos |
| `application/use-cases/calcular-acerto.use-case.ts` | Delega calcularSaldo ao repo |
| `application/use-cases/registrar-acerto.use-case.ts` | Valida input + delega registrar |
| `application/use-cases/delete-acerto.use-case.ts` | Delega deletar (reverte valorQuitado) |
| `application/use-cases/listar-historico-acerto.use-case.ts` | Filtra por pessoaId/mesRef |
| `infra/prisma-acerto.repository.ts` | FIFO parcial, transações, toDomain() inline |
| `http/acerto.routes.ts` | 4 endpoints com Zod schemas completos |

### Frontend (`apps/web`)
| Arquivo | Descrição |
|---------|-----------|
| `app/acerto/page.tsx` | Server Component, data-section="acerto" |
| `app/acerto/AcertoClient.tsx` | Tabs Saldo Atual / Histórico, apiFetch, useMesRef |
| `app/acerto/AcertoCard.tsx` | Card por pessoa, direção explícita, lista expandível |
| `app/acerto/AcertoModal.tsx` | Modal: valor editável, data, formaPagamento, observacao |

### Documentação
| Arquivo | Descrição |
|---------|-----------|
| `docs/api-contracts/acerto.md` | Contrato completo dos 4 endpoints |
| `docs/user-stories/decisions.md` | DEC-ACERTO-001 a 010 |
| `docs/adr/acerto-review-log.md` | Reviews backend (APROVADO) + frontend (APROVADO) |
| `docs/qa/qa-acerto-2026-05-29.md` | QA backend PASSOU + QA frontend PASSOU |

---

## Arquivos modificados

### Backend
| Arquivo | Modificação |
|---------|-------------|
| `prisma/schema.prisma` | + DespesaSplit.valorQuitado, AcertoEntry, AcertoDespesaSplit, Pessoa.acertos |
| `delete-despesa.use-case.ts` | + verificação acertoRepo.despesaTemAcerto → HttpError 409 |
| `get-dashboard.use-case.ts` | + saldoAcertoPendente via acertoRepo.calcularSaldo |
| `http/despesas.routes.ts` | + valorQuitado no schema de resposta do DespesaSplit |
| `finances.module.ts` | + PrismaAcertoRepository, 4 use cases, acertoRoutes |

### Frontend
| Arquivo | Modificação |
|---------|-------------|
| `components/layout/Sidebar.tsx` | + HandCoins, link /acerto |
| `app/despesas/DespesasClient.tsx` | + badges ✓ e ½ por split.valorQuitado |
| `app/dashboard/page.tsx` | + saldoAcertoPendente?: number, widget condicional → /acerto |

---

## Novas entidades de banco

```
DespesaSplit.valorQuitado Float @default(0)

AcertoEntry {
  id, pessoaId (FK Pessoa), mesRef (YYYY-MM), valor, data (YYYY-MM-DD),
  formaPagamento (pix|ted|dinheiro|outro), observacao?, criadoEm
  @@index([pessoaId, mesRef])
}

AcertoDespesaSplit {
  id, acertoId (FK CASCADE), splitId (FK RESTRICT), valorCoberto
  @@index([acertoId]), @@index([splitId])
}
```

---

## Novos endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/acerto?mesRef=YYYY-MM&incluirAnteriores=true` | Saldo por pessoa |
| POST | `/api/acerto` | Registrar acerto (FIFO parcial) |
| DELETE | `/api/acerto/:id` | Excluir + reverter valorQuitado |
| GET | `/api/acerto/historico` | Histórico filtrável |

---

## Decisões de negócio (resumo)

- mesRef do acerto = mesRef da **despesa** (não do vencimento)
- somenteMeu=true: excluído do cálculo
- FIFO parcial: splits ordenados por Despesa.data ASC
- Usuário principal (padrao=true): excluído da lista de devedores
- Acerto não editável — excluir e re-lançar
- DELETE despesa com split em acerto → 409

---

## Validações

- `tsc --noEmit` apps/api: **zero erros**
- `npm run build` apps/web: **12/12 páginas, zero erros**
- QA backend: **PASSOU** (0 críticos, 0 médios)
- QA frontend: **PASSOU** (0 críticos, 0 médios)

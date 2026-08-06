import type { Despesa } from '../entities/Despesa.js'
import type { AbaDespesa } from '../entities/AbaDespesa.js'

// Escopo de leitura dos números do app:
//   number    = pessoa específica
//   null      = aba de grupo / Familiar (só o que é compartilhado)
//   undefined = global (tudo)
export type EscopoPessoa = number | null | undefined

// Tipos que existem só como espelho de outro lançamento — nunca somam.
export const TIPOS_SINTETICOS = new Set<string>(['split_auto'])

type ComTipo = { tipo: string }
type ParaDedup = ComTipo & { id: number; cartaoId: number | null; mesRef: string; valor: number }

// Remove só os espelhos sintéticos. Para listagens de CRUD, onde o usuário
// precisa enxergar (e poder apagar) cada linha real que existe no banco.
export function semSinteticas<T extends ComTipo>(despesas: T[]): T[] {
  return despesas.filter((d) => !TIPOS_SINTETICOS.has(d.tipo))
}

// ÚNICA definição de "despesa real" do sistema — use esta em qualquer lugar que
// some despesas (dashboard, relatório IA, export). Duas regras:
//   1. exclui sintéticas (split_auto já é contado na despesa de origem)
//   2. deduplica cartao_ciclo por (cartaoId, mesRef), mantendo a de MAIOR ID —
//      uploads/correções parciais da mesma fatura deixam entradas redundantes, e
//      o id mais alto é a mais recente. Precisa concordar com a escrita: o resync
//      de fatura (resyncFaturaTotais) atualiza in-place a linha que
//      `IDespesaRepository.findByCartaoCiclo` devolve — esse repo ordena por
//      `id desc` justamente pra sempre mirar na mesma linha que o dedup de leitura
//      escolhe. Se um dia trocar o critério aqui, troque o orderBy junto.
export function despesasReais<T extends ParaDedup>(despesas: T[]): T[] {
  const cicloDedup = new Map<string, T>()
  for (const d of despesas) {
    if (d.tipo !== 'cartao_ciclo') continue
    const key = `${d.cartaoId ?? 0}-${d.mesRef}`
    const prev = cicloDedup.get(key)
    if (!prev || d.id > prev.id) cicloDedup.set(key, d)
  }
  return [
    ...despesas.filter((d) => !TIPOS_SINTETICOS.has(d.tipo) && d.tipo !== 'cartao_ciclo'),
    ...Array.from(cicloDedup.values()),
  ]
}

// Abas cujo dono é a pessoa do escopo. Vazio para escopo familiar/global.
export function abasProprias(abas: AbaDespesa[], escopo: EscopoPessoa): Set<number> {
  if (typeof escopo !== 'number') return new Set<number>()
  return new Set(abas.filter((a) => a.pessoaId === escopo).map((a) => a.id))
}

// Valor que cabe à pessoa do escopo: se há split dela, aplica o ratio;
// senão é despesa própria e vale cheio.
export function valorEfetivo(d: Despesa, escopo: EscopoPessoa): number {
  if (typeof escopo === 'number') {
    const meu = d.splits?.find((s) => s.pessoaId === escopo)
    if (meu) return d.valor * meu.ratio
  }
  return d.valor
}

// Pessoa: despesas das abas dela + qualquer despesa em que tenha split.
// Familiar: só o que é rateado. Global: tudo.
export function filtrarDespesasPorEscopo(
  despesas: Despesa[],
  escopo: EscopoPessoa,
  abasDaPessoa: Set<number>,
): Despesa[] {
  if (typeof escopo === 'number') {
    return despesas.filter(
      (d) => abasDaPessoa.has(d.abaId) || (d.splits?.some((s) => s.pessoaId === escopo) ?? false),
    )
  }
  if (escopo === null) return despesas.filter((d) => (d.splits?.length ?? 0) > 0)
  return despesas
}

// Rendimentos e posições de investimento carregam pessoaId direto — mesma regra para os dois.
export function filtrarPorPessoaId<T extends { pessoaId: number | null }>(
  items: T[],
  escopo: EscopoPessoa,
): T[] {
  if (typeof escopo === 'number') return items.filter((i) => i.pessoaId === escopo)
  if (escopo === null) return items.filter((i) => i.pessoaId === null)
  return items
}

export interface AgregadoMes {
  despesas: Despesa[]
  rendimentos: Array<{ pessoaId: number | null; valor: number }>
  totalDespesas: number
  totalRendimentos: number
  saldo: number
}

// Agrega um mês inteiro no escopo pedido. Único caminho para "quanto entrou e
// saiu neste mês" — dashboard e relatório IA passam por aqui.
export function agregarMes(
  despesasBrutas: Despesa[],
  rendimentosBrutos: Array<{ pessoaId: number | null; valor: number }>,
  escopo: EscopoPessoa,
  abasDaPessoa: Set<number>,
): AgregadoMes {
  const despesas = filtrarDespesasPorEscopo(despesasReais(despesasBrutas), escopo, abasDaPessoa)
  const rendimentos = filtrarPorPessoaId(rendimentosBrutos, escopo)

  const totalDespesas = despesas.reduce((s, d) => s + valorEfetivo(d, escopo), 0)
  const totalRendimentos = rendimentos.reduce((s, r) => s + r.valor, 0)

  return { despesas, rendimentos, totalDespesas, totalRendimentos, saldo: totalRendimentos - totalDespesas }
}

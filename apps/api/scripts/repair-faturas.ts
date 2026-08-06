/**
 * Reparo de faturas importadas antes da regra única de total.
 *
 * Até a correção em `AnalyzePdfUseCase`, três representações do mesmo valor podiam
 * divergir numa fatura já importada:
 *
 *   - `Fatura.total`      → gravado com o total que a IA leu impresso na fatura
 *   - `SUM(Transacao)`    → soma das linhas que a IA extraiu
 *   - `analiseJson`       → congelado na primeira importação (o modo APPEND nunca o regravava)
 *
 * Além disso, linhas que não são despesa (pagamento da fatura anterior, saldo
 * transportado) entravam como gasto, contando o mês passado duas vezes.
 *
 * Este script traz as faturas existentes para o invariante atual:
 *
 *     Fatura.total === somarTransacoes(Transacao) === analiseJson.fatura.total
 *
 * e ressincroniza a despesa `cartao_ciclo` correspondente, preservando as
 * proporções dos splits.
 *
 * Uso:
 *   npm run db:repair-faturas            # simulação, não escreve nada
 *   npm run db:repair-faturas -- --apply # faz backup e aplica
 */

import { prisma } from '../src/shared/prisma.js'
import { backupDatabase } from '../src/shared/backup.js'
import {
  arredondarCentavos,
  ehLinhaNaoDespesa,
  montarResumoCategorias,
  recalcularSplitsProporcionais,
  somarTransacoes,
} from '../src/modules/finances/domain/services/fatura-transacoes.js'

const APLICAR = process.argv.includes('--apply')

function parseAnalise(raw: string): Record<string, unknown> | null {
  try {
    const limpo =
      raw
        .replace(/^[\s\S]*?```(?:json)?\s*/i, '')
        .replace(/```[\s\S]*$/, '')
        .trim() || raw.trim()
    return JSON.parse(limpo) as Record<string, unknown>
  } catch {
    return null
  }
}

const brl = (v: number | null | undefined) =>
  v == null ? '—' : v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

interface Mudanca {
  faturaId: number
  mesRef: string | null
  totalAntes: number | null
  totalDepois: number
  linhasRemovidas: Array<{ estabelecimento: string | null; valor: number | null; data: string | null }>
  jsonDesatualizado: boolean
  despesaId: number | null
  residuoVsImpresso: number
}

async function main() {
  console.log(APLICAR ? '>>> MODO APLICAR — o banco será alterado\n' : '>>> SIMULAÇÃO — nada será escrito (use --apply para valer)\n')

  const faturas = await prisma.fatura.findMany({ orderBy: { id: 'asc' } })
  const mudancas: Mudanca[] = []

  for (const fatura of faturas) {
    const txs = await prisma.transacao.findMany({ where: { faturaId: fatura.id }, orderBy: { id: 'asc' } })

    const remover = txs.filter(ehLinhaNaoDespesa)
    const manter = txs.filter((t) => !ehLinhaNaoDespesa(t))
    const totalDepois = somarTransacoes(manter)

    const analise = parseAnalise(fatura.analiseJson)
    const jsonTxs = Array.isArray(analise?.transacoes) ? (analise!.transacoes as unknown[]).length : -1
    const jsonTotal =
      analise && typeof analise.fatura === 'object' && analise.fatura !== null
        ? ((analise.fatura as Record<string, unknown>).total as number | undefined)
        : undefined
    const jsonDesatualizado =
      jsonTxs !== manter.length || jsonTotal == null || Math.abs(jsonTotal - totalDepois) > 0.01

    const totalMudou = Math.abs((fatura.total ?? 0) - totalDepois) > 0.01
    if (!totalMudou && remover.length === 0 && !jsonDesatualizado) continue

    // Despesa do ciclo derivada desta fatura (mesma regra do resync)
    const cartao = await prisma.cartao.findUnique({ where: { id: fatura.cartaoId } })
    const mesRefDespesa = (fatura.vencimento ?? fatura.mesReferencia)?.slice(0, 7) ?? null
    const despesa =
      cartao?.abaId && mesRefDespesa
        ? await prisma.despesa.findFirst({
            where: { cartaoId: cartao.id, mesRef: mesRefDespesa, tipo: 'cartao_ciclo' },
            orderBy: { id: 'desc' },
          })
        : null

    mudancas.push({
      faturaId: fatura.id,
      mesRef: fatura.mesReferencia,
      totalAntes: fatura.total,
      totalDepois,
      linhasRemovidas: remover.map((t) => ({ estabelecimento: t.estabelecimento, valor: t.valor, data: t.data })),
      jsonDesatualizado,
      despesaId: despesa?.id ?? null,
      residuoVsImpresso: arredondarCentavos((fatura.total ?? 0) - totalDepois),
    })
  }

  if (mudancas.length === 0) {
    console.log('Nenhuma fatura precisa de reparo — invariante já vale para todas.')
    return
  }

  console.log('fatura  mês       total antes    total depois   delta        despesa  json')
  console.log('─────────────────────────────────────────────────────────────────────────────')
  let delta = 0
  for (const m of mudancas) {
    // `|| 0` normaliza -0, senão a formatação sai como "+-0,00"
    const d = arredondarCentavos(m.totalDepois - (m.totalAntes ?? 0)) || 0
    delta += d
    console.log(
      `${String(m.faturaId).padStart(5)}   ${(m.mesRef ?? '—').padEnd(8)}  ` +
        `${brl(m.totalAntes).padStart(12)}   ${brl(m.totalDepois).padStart(12)}   ` +
        `${(d >= 0 ? '+' : '') + brl(d)}`.padStart(11) +
        `  ${String(m.despesaId ?? '—').padStart(7)}  ${m.jsonDesatualizado ? 'regravar' : 'ok'}`,
    )
    for (const l of m.linhasRemovidas) {
      console.log(`        └─ remove linha não-despesa: ${l.data} ${l.estabelecimento} R$ ${brl(l.valor)}`)
    }
  }
  console.log('─────────────────────────────────────────────────────────────────────────────')
  console.log(`${mudancas.length} fatura(s) · efeito líquido nas despesas: ${(delta >= 0 ? '+' : '') + brl(delta)}\n`)

  const comResiduo = mudancas.filter((m) => Math.abs(m.residuoVsImpresso) > 1)
  if (comResiduo.length > 0) {
    console.log('Atenção — nestas o total impresso continua diferente da soma das linhas.')
    console.log('A soma passa a valer (é o que o app exibe e categoriza), mas vale conferir na fatura original:')
    for (const m of comResiduo) {
      console.log(`  fatura ${m.faturaId} (${m.mesRef}): impresso ${brl(m.totalAntes)} · soma ${brl(m.totalDepois)} · diferença ${brl(m.residuoVsImpresso)}`)
    }
    console.log()
  }

  if (!APLICAR) {
    console.log('Simulação encerrada. Rode com --apply para gravar.')
    return
  }

  const backup = backupDatabase()
  console.log(`[backup] ${backup ?? 'não gerado'}\n`)

  for (const m of mudancas) {
    await prisma.$transaction(async (tx) => {
      // 1. Remove linhas que não são despesa
      const txs = await tx.transacao.findMany({ where: { faturaId: m.faturaId }, orderBy: { id: 'asc' } })
      const remover = txs.filter(ehLinhaNaoDespesa)
      if (remover.length > 0) {
        await tx.transacao.deleteMany({ where: { id: { in: remover.map((t) => t.id) } } })
      }
      const manter = txs.filter((t) => !ehLinhaNaoDespesa(t))
      const novoTotal = somarTransacoes(manter)

      // 2. Total da fatura = soma das linhas vivas
      await tx.fatura.update({ where: { id: m.faturaId }, data: { total: novoTotal } })

      // 3. analiseJson descrevendo exatamente o que ficou no banco
      const fatura = await tx.fatura.findUnique({ where: { id: m.faturaId } })
      const analise = parseAnalise(fatura!.analiseJson) ?? {}
      const faturaBase = (typeof analise.fatura === 'object' && analise.fatura !== null ? analise.fatura : {}) as Record<string, unknown>
      const transacoesVivas = manter.map((t) => ({
        data: t.data,
        descricao: t.descricao,
        estabelecimento: t.estabelecimento,
        valor: t.valor,
        categoria: t.categoria,
        parcela: t.parcela,
      }))
      await tx.fatura.update({
        where: { id: m.faturaId },
        data: {
          analiseJson: JSON.stringify({
            ...analise,
            fatura: { ...faturaBase, total: novoTotal },
            transacoes: transacoesVivas,
            resumo_categorias: montarResumoCategorias(transacoesVivas),
          }),
        },
      })

      // 4. Despesa cartao_ciclo + splits (proporções preservadas)
      if (m.despesaId != null) {
        await tx.despesa.update({ where: { id: m.despesaId }, data: { valor: novoTotal } })
        const splits = await tx.despesaSplit.findMany({ where: { despesaId: m.despesaId }, orderBy: { id: 'asc' } })
        if (splits.length > 0) {
          for (const r of recalcularSplitsProporcionais(splits, novoTotal)) {
            await tx.despesaSplit.update({ where: { id: r.id }, data: { valorCalculado: r.valorCalculado } })
          }
        }
      }
    })
    console.log(`fatura ${m.faturaId}: reparada`)
  }

  console.log('\nVerificando o invariante em todas as faturas…')
  let falhas = 0
  for (const f of await prisma.fatura.findMany()) {
    const txs = await prisma.transacao.findMany({ where: { faturaId: f.id } })
    const soma = somarTransacoes(txs)
    const analise = parseAnalise(f.analiseJson)
    const jsonTotal =
      analise && typeof analise.fatura === 'object' && analise.fatura !== null
        ? ((analise.fatura as Record<string, unknown>).total as number | undefined)
        : undefined
    const jsonTxs = Array.isArray(analise?.transacoes) ? (analise!.transacoes as unknown[]).length : -1
    const ok =
      Math.abs((f.total ?? 0) - soma) <= 0.01 &&
      jsonTotal != null &&
      Math.abs(jsonTotal - soma) <= 0.01 &&
      jsonTxs === txs.length
    if (!ok) {
      falhas += 1
      console.log(`  FALHA fatura ${f.id}: total=${f.total} soma=${soma} jsonTotal=${jsonTotal} jsonTx=${jsonTxs} tx=${txs.length}`)
    }
  }
  console.log(falhas === 0 ? 'Invariante vale para todas as faturas.' : `${falhas} fatura(s) ainda fora do invariante.`)
}

main()
  .catch((err) => {
    console.error('Reparo falhou:', err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())

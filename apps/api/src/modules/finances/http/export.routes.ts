import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import type { ExportLancamentosUseCase, LancamentoExportRow } from '../application/use-cases/export-lancamentos.use-case.js'
import type { ExportFaturasUseCase, FaturaExportRow } from '../application/use-cases/export-faturas.use-case.js'

export interface ExportRoutesDeps {
  exportLancamentos: ExportLancamentosUseCase
  exportFaturas: ExportFaturasUseCase
}

// UTF-8 BOM: faz o Excel (pt-BR) reconhecer acentuacao corretamente.
const BOM = '﻿'

// CSV compativel com Excel (pt-BR) e Google Sheets:
// separador ';', decimal virgula, quebra de linha CRLF.
function csvQuote(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

function csvNumber(value: number): string {
  return value.toFixed(2).replace('.', ',') // sem aspas -> Excel/Sheets reconhecem como numero
}

// Monta o CSV a partir de cabecalhos e linhas ja serializadas em string (numeros sem aspas).
function toCsv(headers: string[], lines: string[][]): string {
  const head = headers.map(csvQuote).join(';')
  const body = lines.map((cols) => cols.join(';'))
  return BOM + [head, ...body].join('\r\n')
}

function filename(prefix: string): string {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}.csv`
}

const LANCAMENTOS_HEADERS = [
  'Tipo', 'Subtipo', 'Data', 'Mês', 'Categoria', 'Descrição',
  'Valor', 'Grupo/Conta', 'Pessoa', 'Cartão', 'Recorrente', 'Notas',
]

function lancamentoCols(r: LancamentoExportRow): string[] {
  return [
    csvQuote(r.tipo),
    csvQuote(r.subtipo),
    csvQuote(r.data),
    csvQuote(r.mesRef),
    csvQuote(r.categoria),
    csvQuote(r.descricao),
    csvNumber(r.valor),
    csvQuote(r.grupoConta),
    csvQuote(r.pessoa),
    csvQuote(r.cartao),
    csvQuote(r.recorrente),
    csvQuote(r.notas),
  ]
}

const FATURAS_HEADERS = [
  'Cartão', 'Banco', 'Fatura (Mês)', 'Vencimento', 'Data', 'Descrição',
  'Estabelecimento', 'Categoria', 'Parcela', 'Valor',
]

function faturaCols(r: FaturaExportRow): string[] {
  return [
    csvQuote(r.cartao),
    csvQuote(r.banco),
    csvQuote(r.faturaMes),
    csvQuote(r.vencimento),
    csvQuote(r.data),
    csvQuote(r.descricao),
    csvQuote(r.estabelecimento),
    csvQuote(r.categoria),
    csvQuote(r.parcela),
    csvNumber(r.valor),
  ]
}

export const exportRoutes: FastifyPluginAsyncZod<ExportRoutesDeps> = async (app, deps) => {
  app.get('/export/csv', async (_req, reply) => {
    const rows = await deps.exportLancamentos.execute()
    const csv = toCsv(LANCAMENTOS_HEADERS, rows.map(lancamentoCols))
    return reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="${filename('planejai-lancamentos')}"`)
      .send(csv)
  })

  app.get('/export/faturas/csv', async (_req, reply) => {
    const rows = await deps.exportFaturas.execute()
    const csv = toCsv(FATURAS_HEADERS, rows.map(faturaCols))
    return reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="${filename('planejai-faturas')}"`)
      .send(csv)
  })
}

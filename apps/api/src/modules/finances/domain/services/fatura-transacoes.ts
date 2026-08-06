// Regras de interpretação das transações de uma fatura de cartão.
//
// Existem porque o mesmo número (o total da fatura) vivia em três lugares que
// divergiam: `Fatura.total`, a soma de `Transacao` e `Fatura.analiseJson`. A
// definição única passa a ser:
//
//     Fatura.total === somarTransacoes(Transacao da fatura) === analiseJson.fatura.total
//
// Qualquer caminho que grave fatura (importação por IA, edição manual de
// transação, exclusão) converge para cá. O total declarado pela IA vira apenas
// um sinal de conferência — ver `conferirTotal`.

export interface TransacaoValor {
  data?: string | null
  descricao?: string | null
  estabelecimento?: string | null
  valor?: number | null
  categoria?: string | null
  parcela?: string | null
}

// Linhas que aparecem na fatura mas NÃO são despesa: pagamento da fatura
// anterior, saldo transportado, etc. Somá-las conta o mês passado duas vezes.
//
// Os padrões são deliberadamente estreitos. "pagamento" sozinho NÃO basta —
// "PAGAMENTO ELETRONICO SUPERMERCADO" é compra de verdade, e o próprio prompt
// manda limpar esse prefixo do nome do estabelecimento.
const PADROES_NAO_DESPESA = [
  /pagamento\s+(de\s+)?fatura/i,
  /pagto\.?\s*(de\s+)?fatura/i,
  /pagamento\s+(efetuado|recebido|realizado)/i,
  /saldo\s+(anterior|transportado)/i,
  /^\s*pagamento\s*$/i,
]

// Só descarta débito (valor positivo). Valor negativo é crédito/estorno legítimo,
// que o prompt manda manter como ajuste.
//
// Cada campo é testado isolado, nunca concatenado: os padrões ancorados
// (`^pagamento$`) perdem o sentido se estabelecimento e descrição virarem uma
// string só.
export function ehLinhaNaoDespesa(t: TransacaoValor): boolean {
  if ((t.valor ?? 0) <= 0) return false
  const campos = [t.estabelecimento, t.descricao].filter((c): c is string => !!c)
  return campos.some((campo) => PADROES_NAO_DESPESA.some((re) => re.test(campo)))
}

export function filtrarTransacoesDespesa<T extends TransacaoValor>(
  transacoes: T[],
): { mantidas: T[]; descartadas: T[] } {
  const mantidas: T[] = []
  const descartadas: T[] = []
  for (const t of transacoes) {
    if (ehLinhaNaoDespesa(t)) descartadas.push(t)
    else mantidas.push(t)
  }
  return { mantidas, descartadas }
}

export function arredondarCentavos(valor: number): number {
  return Math.round(valor * 100) / 100
}

export function somarTransacoes(transacoes: TransacaoValor[]): number {
  return arredondarCentavos(transacoes.reduce((s, t) => s + (t.valor ?? 0), 0))
}

export interface ConferenciaTotal {
  totalDeclarado: number | null   // o que a IA leu impresso na fatura
  somaTransacoes: number          // o que as linhas extraídas somam
  diferenca: number               // declarado − soma
  confere: boolean
  linhasDescartadas: number       // pagamentos de fatura removidos antes da soma
}

// Tolerância: centavos de arredondamento passam; erro estrutural (linha faltando,
// linha duplicada, pagamento contado como gasto) não. Precisa das DUAS condições —
// R$ 1,00 numa fatura de R$ 6 mil é ruído; R$ 1,00 numa de R$ 20 não é.
const TOLERANCIA_ABSOLUTA = 1.0
const TOLERANCIA_RELATIVA = 0.01

export function conferirTotal(
  totalDeclarado: number | null | undefined,
  transacoes: TransacaoValor[],
  linhasDescartadas = 0,
): ConferenciaTotal {
  const somaTransacoes = somarTransacoes(transacoes)
  if (totalDeclarado == null) {
    return { totalDeclarado: null, somaTransacoes, diferenca: 0, confere: true, linhasDescartadas }
  }
  const diferenca = arredondarCentavos(totalDeclarado - somaTransacoes)
  const abs = Math.abs(diferenca)
  const rel = totalDeclarado !== 0 ? abs / Math.abs(totalDeclarado) : 0
  return {
    totalDeclarado,
    somaTransacoes,
    diferenca,
    confere: abs <= TOLERANCIA_ABSOLUTA || rel <= TOLERANCIA_RELATIVA,
    linhasDescartadas,
  }
}

export interface ResumoCategoria {
  categoria: string
  valor: number
  percentual: number
  qtd_transacoes: number
}

// Reconstrói `resumo_categorias` a partir das transações vivas. Usado sempre que o
// analiseJson é regravado, para o resumo nunca descrever um conjunto de linhas que
// não existe mais.
export function montarResumoCategorias(transacoes: TransacaoValor[]): ResumoCategoria[] {
  const agg = new Map<string, { valor: number; qtd: number }>()
  for (const t of transacoes) {
    const cat = t.categoria ?? 'Outros'
    const cur = agg.get(cat) ?? { valor: 0, qtd: 0 }
    cur.valor += t.valor ?? 0
    cur.qtd += 1
    agg.set(cat, cur)
  }
  const total = Array.from(agg.values()).reduce((s, v) => s + v.valor, 0)
  return Array.from(agg.entries())
    .sort(([, a], [, b]) => b.valor - a.valor)
    .map(([categoria, v]) => ({
      categoria,
      valor: arredondarCentavos(v.valor),
      percentual: total > 0 ? (v.valor / total) * 100 : 0,
      qtd_transacoes: v.qtd,
    }))
}

export interface SplitParaRecalculo {
  id: number
  ratio: number
  valorQuitado: number
}

export interface SplitRecalculado {
  id: number
  valorCalculado: number
}

// Redistribui um novo total entre splits existentes MANTENDO as proporções.
// O resíduo de arredondamento cai no último split para a soma fechar exatamente
// com o total — sem isso, dividir R$ 100 em três dá R$ 99,99.
//
// Lança se o novo valor de alguém ficar abaixo do que já foi quitado: reduzir
// abaixo do pago transformaria acerto liquidado em crédito fantasma.
export function recalcularSplitsProporcionais(
  splits: SplitParaRecalculo[],
  novoTotal: number,
): SplitRecalculado[] {
  if (splits.length === 0) return []
  const totalRatio = splits.reduce((s, x) => s + x.ratio, 0)
  if (totalRatio <= 0) throw new Error('Ratios inválidos para ressincronização')

  const out: SplitRecalculado[] = []
  let acumulado = 0
  for (let i = 0; i < splits.length; i += 1) {
    const split = splits[i]
    const valorCalculado =
      i === splits.length - 1
        ? arredondarCentavos(novoTotal - acumulado)
        : arredondarCentavos((novoTotal * split.ratio) / totalRatio)
    if (valorCalculado + 0.0001 < split.valorQuitado) {
      throw new Error('Novo total da fatura é menor que o valor já quitado')
    }
    acumulado = arredondarCentavos(acumulado + valorCalculado)
    out.push({ id: split.id, valorCalculado })
  }
  return out
}

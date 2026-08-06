import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  conferirTotal,
  ehLinhaNaoDespesa,
  filtrarTransacoesDespesa,
  recalcularSplitsProporcionais,
  somarTransacoes,
  type TransacaoValor,
} from './fatura-transacoes.js'

const tx = (over: Partial<TransacaoValor> = {}): TransacaoValor => ({
  data: '2026-04-10',
  descricao: 'Compra',
  estabelecimento: 'Mercado',
  valor: 100,
  parcela: null,
  ...over,
})

// ---------------------------------------------------------------------------
// Linhas que não são despesa
// ---------------------------------------------------------------------------

describe('ehLinhaNaoDespesa', () => {
  it('descarta o pagamento da fatura anterior', () => {
    assert.equal(ehLinhaNaoDespesa(tx({ estabelecimento: 'Pagamento Fatura', valor: 5147.45 })), true)
    assert.equal(ehLinhaNaoDespesa(tx({ estabelecimento: 'PAGTO FATURA', valor: 300 })), true)
    assert.equal(ehLinhaNaoDespesa(tx({ descricao: 'Pagamento de fatura', valor: 10 })), true)
    assert.equal(ehLinhaNaoDespesa(tx({ estabelecimento: 'Pagamento efetuado', valor: 10 })), true)
    assert.equal(ehLinhaNaoDespesa(tx({ estabelecimento: 'Saldo anterior', valor: 10 })), true)
    assert.equal(ehLinhaNaoDespesa(tx({ estabelecimento: '  Pagamento  ', valor: 10 })), true)
  })

  it('NÃO descarta compra cujo nome contém "pagamento"', () => {
    // A fatura traz "PAGAMENTO ELETRONICO <loja>" em compras normais.
    assert.equal(ehLinhaNaoDespesa(tx({ estabelecimento: 'Pagamento Eletronico Bistek', valor: 536.66 })), false)
    assert.equal(ehLinhaNaoDespesa(tx({ estabelecimento: 'Casa de Pagamentos LTDA', valor: 50 })), false)
  })

  it('NÃO descarta crédito/estorno (valor negativo)', () => {
    assert.equal(ehLinhaNaoDespesa(tx({ estabelecimento: 'Pagamento Fatura', valor: -100 })), false)
    assert.equal(ehLinhaNaoDespesa(tx({ estabelecimento: 'Estorno compra', valor: -30 })), false)
  })

  it('separa mantidas de descartadas', () => {
    const { mantidas, descartadas } = filtrarTransacoesDespesa([
      tx({ estabelecimento: 'Mercado', valor: 100 }),
      tx({ estabelecimento: 'Pagamento Fatura', valor: 5147.45 }),
      tx({ estabelecimento: 'Posto', valor: 200 }),
    ])
    assert.equal(mantidas.length, 2)
    assert.equal(descartadas.length, 1)
    assert.equal(somarTransacoes(mantidas), 300)
  })
})

// ---------------------------------------------------------------------------
// Soma
// ---------------------------------------------------------------------------

describe('somarTransacoes', () => {
  it('trata valor nulo como zero', () => {
    assert.equal(somarTransacoes([tx({ valor: 10 }), tx({ valor: null }), tx({ valor: 5.5 })]), 15.5)
  })

  it('arredonda para centavos, sem lixo de ponto flutuante', () => {
    assert.equal(somarTransacoes([tx({ valor: 0.1 }), tx({ valor: 0.2 })]), 0.3)
  })

  it('lista vazia soma zero', () => {
    assert.equal(somarTransacoes([]), 0)
  })
})

// ---------------------------------------------------------------------------
// Conferência do total declarado pela IA
// ---------------------------------------------------------------------------

describe('conferirTotal', () => {
  it('aceita divergência de centavos', () => {
    // Fatura 12 do banco real: total 2844.13 vs soma 2844.33
    const r = conferirTotal(2844.13, [tx({ valor: 2844.33 })])
    assert.equal(r.confere, true)
    assert.equal(r.diferenca, -0.2)
  })

  it('aceita diferença pequena em valor absoluto mesmo sem ser relativa', () => {
    // Fatura 9: total 2739.54 vs soma 2738.54 → R$ 1,00
    assert.equal(conferirTotal(2739.54, [tx({ valor: 2738.54 })]).confere, true)
  })

  it('reprova quando o pagamento da fatura anterior entrou como gasto', () => {
    // Fatura 4: total declarado 6704.82, soma das linhas 11818.59
    const r = conferirTotal(6704.82, [tx({ valor: 11818.59 })])
    assert.equal(r.confere, false)
    assert.equal(r.diferenca, -5113.77)
  })

  it('reprova divergência estrutural de alguns por cento', () => {
    // Fatura 6: 5734.56 vs 6017.66 → 4,9%
    assert.equal(conferirTotal(5734.56, [tx({ valor: 6017.66 })]).confere, false)
    // Fatura 8: 3254.75 vs 3332.63 → 2,4%
    assert.equal(conferirTotal(3254.75, [tx({ valor: 3332.63 })]).confere, false)
  })

  it('aceita quando a diferença é menor que 1% do total', () => {
    // Fatura 3: 5548.79 vs 5516.55 → 0,58%
    assert.equal(conferirTotal(5548.79, [tx({ valor: 5516.55 })]).confere, true)
  })

  it('sem total declarado, não há o que conferir', () => {
    const r = conferirTotal(null, [tx({ valor: 100 })])
    assert.equal(r.confere, true)
    assert.equal(r.somaTransacoes, 100)
    assert.equal(r.totalDeclarado, null)
  })

  it('reporta quantas linhas foram descartadas', () => {
    assert.equal(conferirTotal(100, [tx({ valor: 100 })], 3).linhasDescartadas, 3)
  })
})

// ---------------------------------------------------------------------------
// Recálculo de splits
// ---------------------------------------------------------------------------

describe('recalcularSplitsProporcionais', () => {
  it('preserva proporção desigual em vez de achatar em partes iguais', () => {
    const r = recalcularSplitsProporcionais(
      [
        { id: 1, ratio: 0.7, valorQuitado: 0 },
        { id: 2, ratio: 0.3, valorQuitado: 0 },
      ],
      1000,
    )
    assert.deepEqual(r, [
      { id: 1, valorCalculado: 700 },
      { id: 2, valorCalculado: 300 },
    ])
  })

  it('fecha exatamente com o total quando a divisão não é exata', () => {
    const r = recalcularSplitsProporcionais(
      [
        { id: 1, ratio: 1 / 3, valorQuitado: 0 },
        { id: 2, ratio: 1 / 3, valorQuitado: 0 },
        { id: 3, ratio: 1 / 3, valorQuitado: 0 },
      ],
      100,
    )
    assert.equal(r.reduce((s, x) => s + x.valorCalculado, 0), 100)
    assert.deepEqual(r.map((x) => x.valorCalculado), [33.33, 33.33, 33.34])
  })

  it('normaliza ratios que não somam 1', () => {
    const r = recalcularSplitsProporcionais(
      [
        { id: 1, ratio: 2, valorQuitado: 0 },
        { id: 2, ratio: 2, valorQuitado: 0 },
      ],
      50,
    )
    assert.deepEqual(r.map((x) => x.valorCalculado), [25, 25])
  })

  it('recusa reduzir um split abaixo do que já foi quitado', () => {
    assert.throws(
      () =>
        recalcularSplitsProporcionais(
          [
            { id: 1, ratio: 0.5, valorQuitado: 400 },
            { id: 2, ratio: 0.5, valorQuitado: 0 },
          ],
          100,
        ),
      /menor que o valor já quitado/,
    )
  })

  it('recusa ratios inválidos', () => {
    assert.throws(
      () => recalcularSplitsProporcionais([{ id: 1, ratio: 0, valorQuitado: 0 }], 100),
      /Ratios inválidos/,
    )
  })

  it('sem splits, não há o que recalcular', () => {
    assert.deepEqual(recalcularSplitsProporcionais([], 100), [])
  })
})

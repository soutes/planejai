import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  abasProprias,
  agregarMes,
  despesasReais,
  filtrarDespesasPorEscopo,
  filtrarPorPessoaId,
  semSinteticas,
  valorEfetivo,
} from './escopo-despesas.js'
import type { Despesa, DespesaTipo } from '../entities/Despesa.js'
import type { DespesaSplit } from '../entities/DespesaSplit.js'
import type { AbaDespesa } from '../entities/AbaDespesa.js'

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

let proximoId = 1

function split(pessoaId: number, ratio: number, valorCalculado = 0): DespesaSplit {
  return { id: proximoId++, despesaId: 0, pessoaId, ratio, valorCalculado, valorQuitado: 0 }
}

function despesa(over: Partial<Despesa> = {}): Despesa {
  return {
    id: proximoId++,
    abaId: 1,
    mesRef: '2026-08',
    data: null,
    descricao: 'x',
    categoria: 'Outros',
    valor: 100,
    notas: null,
    tipo: 'manual' as DespesaTipo,
    recorrente: false,
    totalRepeticoes: null,
    origemId: null,
    parcelaNum: null,
    totalParcelas: null,
    emFaturaCartao: false,
    cartaoId: null,
    somenteMeu: false,
    pagadorId: null,
    formaPagamentoId: null,
    formaPagamentoNome: null,
    ...over,
  }
}

function aba(over: Partial<AbaDespesa> = {}): AbaDespesa {
  return {
    id: proximoId++,
    nome: 'Aba',
    icon: '',
    cor: '',
    ordem: 0,
    splitDestinoCategoria: null,
    ativo: true,
    pessoaId: null,
    membros: [],
    ...over,
  }
}

const soma = (ds: Despesa[]) => ds.reduce((s, d) => s + d.valor, 0)
const ids = (ds: Despesa[]) => ds.map((d) => d.id).sort((a, b) => a - b)

// ---------------------------------------------------------------------------
// semSinteticas
// ---------------------------------------------------------------------------

describe('semSinteticas', () => {
  it('remove split_auto e preserva o resto, inclusive cartao_ciclo redundante', () => {
    const manual = despesa({ tipo: 'manual' })
    const espelho = despesa({ tipo: 'split_auto' })
    const cicloA = despesa({ tipo: 'cartao_ciclo', cartaoId: 1, valor: 500 })
    const cicloB = despesa({ tipo: 'cartao_ciclo', cartaoId: 1, valor: 800 })

    const out = semSinteticas([manual, espelho, cicloA, cicloB])

    // listagem CRUD: as duas cartao_ciclo continuam visíveis para o usuário poder apagar
    assert.deepEqual(ids(out), ids([manual, cicloA, cicloB]))
  })

  it('devolve lista vazia quando tudo é sintético', () => {
    assert.deepEqual(semSinteticas([despesa({ tipo: 'split_auto' })]), [])
  })
})

// ---------------------------------------------------------------------------
// despesasReais — dedup de cartao_ciclo
// ---------------------------------------------------------------------------

describe('despesasReais', () => {
  it('deduplica cartao_ciclo do mesmo cartão/mês mantendo a mais recente (maior id)', () => {
    const manual = despesa({ valor: 100 })
    const parcial = despesa({ tipo: 'cartao_ciclo', cartaoId: 1, mesRef: '2026-08', valor: 500 })
    const completa = despesa({ tipo: 'cartao_ciclo', cartaoId: 1, mesRef: '2026-08', valor: 800 }) // criada depois → id maior

    const out = despesasReais([manual, parcial, completa])

    assert.deepEqual(ids(out), ids([manual, completa]))
    assert.equal(soma(out), 900) // não 1400
  })

  it('mantém a mais recente (maior id), mesmo com valor menor — correção de fatura pra baixo', () => {
    const antiga = despesa({ tipo: 'cartao_ciclo', cartaoId: 1, valor: 800 })
    const recente = despesa({ tipo: 'cartao_ciclo', cartaoId: 1, valor: 500 }) // resync corrigiu o total pra baixo

    assert.deepEqual(ids(despesasReais([antiga, recente])), [recente.id])
  })

  it('a escolha por id não depende da ordem em que os itens aparecem no array', () => {
    const antiga = despesa({ tipo: 'cartao_ciclo', cartaoId: 1, valor: 800 })
    const recente = despesa({ tipo: 'cartao_ciclo', cartaoId: 1, valor: 500 })

    assert.deepEqual(ids(despesasReais([antiga, recente])), [recente.id])
    assert.deepEqual(ids(despesasReais([recente, antiga])), [recente.id])
  })

  it('não deduplica entre cartões diferentes', () => {
    const c1 = despesa({ tipo: 'cartao_ciclo', cartaoId: 1, mesRef: '2026-08', valor: 500 })
    const c2 = despesa({ tipo: 'cartao_ciclo', cartaoId: 2, mesRef: '2026-08', valor: 800 })

    assert.equal(soma(despesasReais([c1, c2])), 1300)
  })

  it('não deduplica entre meses diferentes do mesmo cartão', () => {
    const jul = despesa({ tipo: 'cartao_ciclo', cartaoId: 1, mesRef: '2026-07', valor: 500 })
    const ago = despesa({ tipo: 'cartao_ciclo', cartaoId: 1, mesRef: '2026-08', valor: 800 })

    assert.equal(soma(despesasReais([jul, ago])), 1300)
  })

  it('trata cartaoId null como uma chave própria — dedup entre elas por id, sem colidir com o cartão 0', () => {
    const semCartao = despesa({ tipo: 'cartao_ciclo', cartaoId: null, valor: 300 })
    const outroSemCartao = despesa({ tipo: 'cartao_ciclo', cartaoId: null, valor: 400 }) // id maior

    assert.equal(soma(despesasReais([semCartao, outroSemCartao])), 400)
  })

  it('exclui sintéticas junto com o dedup', () => {
    const manual = despesa({ valor: 100 })
    const espelho = despesa({ tipo: 'split_auto', valor: 50 })
    const ciclo = despesa({ tipo: 'cartao_ciclo', cartaoId: 1, valor: 800 })

    assert.equal(soma(despesasReais([manual, espelho, ciclo])), 900)
  })

  it('não confunde tipo cartao com cartao_ciclo', () => {
    const a = despesa({ tipo: 'cartao', cartaoId: 1, valor: 200 })
    const b = despesa({ tipo: 'cartao', cartaoId: 1, valor: 300 })

    // 'cartao' é lançamento real avulso — soma os dois, sem dedup
    assert.equal(soma(despesasReais([a, b])), 500)
  })

  it('é idempotente', () => {
    const entrada = [
      despesa({ valor: 100 }),
      despesa({ tipo: 'cartao_ciclo', cartaoId: 1, valor: 500 }),
      despesa({ tipo: 'cartao_ciclo', cartaoId: 1, valor: 800 }),
    ]
    const uma = despesasReais(entrada)
    assert.deepEqual(ids(despesasReais(uma)), ids(uma))
  })

  it('não muta a lista de entrada', () => {
    const entrada = [despesa({ tipo: 'split_auto' }), despesa({ valor: 100 })]
    despesasReais(entrada)
    assert.equal(entrada.length, 2)
  })

  it('lista vazia devolve vazio', () => {
    assert.deepEqual(despesasReais([]), [])
  })
})

// ---------------------------------------------------------------------------
// valorEfetivo — splits
// ---------------------------------------------------------------------------

describe('valorEfetivo', () => {
  it('aplica o ratio do split da pessoa do escopo', () => {
    const d = despesa({ valor: 200, splits: [split(1, 0.5), split(2, 0.5)] })
    assert.equal(valorEfetivo(d, 1), 100)
  })

  it('usa o ratio da pessoa certa quando os ratios são desiguais', () => {
    const d = despesa({ valor: 300, splits: [split(1, 0.7), split(2, 0.3)] })
    assert.equal(valorEfetivo(d, 1), 210)
    assert.equal(valorEfetivo(d, 2), 90)
  })

  it('vale cheio quando a pessoa não tem split na despesa (despesa própria)', () => {
    const d = despesa({ valor: 200, splits: [split(2, 0.5)] })
    assert.equal(valorEfetivo(d, 1), 200)
  })

  it('vale cheio quando não há splits', () => {
    assert.equal(valorEfetivo(despesa({ valor: 200 }), 1), 200)
    assert.equal(valorEfetivo(despesa({ valor: 200, splits: [] }), 1), 200)
  })

  it('escopo familiar (null) e global (undefined) ignoram o ratio e somam cheio', () => {
    const d = despesa({ valor: 200, splits: [split(1, 0.5), split(2, 0.5)] })
    assert.equal(valorEfetivo(d, null), 200)
    assert.equal(valorEfetivo(d, undefined), 200)
  })

  it('ratio 0 zera a parte da pessoa', () => {
    const d = despesa({ valor: 200, splits: [split(1, 0)] })
    assert.equal(valorEfetivo(d, 1), 0)
  })

  it('ratio 1 mantém o valor cheio', () => {
    const d = despesa({ valor: 200, splits: [split(1, 1)] })
    assert.equal(valorEfetivo(d, 1), 200)
  })

  it('as partes de todas as pessoas do split somam o valor da despesa', () => {
    const d = despesa({ valor: 100, splits: [split(1, 1 / 3), split(2, 1 / 3), split(3, 1 / 3)] })
    const total = [1, 2, 3].reduce((s, p) => s + valorEfetivo(d, p), 0)
    assert.ok(Math.abs(total - 100) < 1e-9)
  })
})

// ---------------------------------------------------------------------------
// abasProprias / filtrarDespesasPorEscopo / filtrarPorPessoaId
// ---------------------------------------------------------------------------

describe('abasProprias', () => {
  const abaPessoa1 = aba({ pessoaId: 1 })
  const abaPessoa2 = aba({ pessoaId: 2 })
  const abaGrupo = aba({ pessoaId: null })
  const todas = [abaPessoa1, abaPessoa2, abaGrupo]

  it('escopo pessoa devolve só as abas dela', () => {
    assert.deepEqual([...abasProprias(todas, 1)], [abaPessoa1.id])
  })

  it('escopo familiar e global devolvem conjunto vazio', () => {
    assert.equal(abasProprias(todas, null).size, 0)
    assert.equal(abasProprias(todas, undefined).size, 0)
  })
})

describe('filtrarDespesasPorEscopo', () => {
  const abaDe1 = aba({ pessoaId: 1 })
  const abaDe2 = aba({ pessoaId: 2 })
  const abaGrupo = aba({ pessoaId: null })
  const abas = [abaDe1, abaDe2, abaGrupo]

  const propriaDe1 = despesa({ abaId: abaDe1.id, valor: 100 })
  const propriaDe2 = despesa({ abaId: abaDe2.id, valor: 200 })
  const rateada = despesa({ abaId: abaGrupo.id, valor: 300, splits: [split(1, 0.5), split(2, 0.5)] })
  const grupoSemSplit = despesa({ abaId: abaGrupo.id, valor: 400 })
  const todas = [propriaDe1, propriaDe2, rateada, grupoSemSplit]

  it('pessoa: abas próprias + qualquer despesa com split dela', () => {
    const out = filtrarDespesasPorEscopo(todas, 1, abasProprias(abas, 1))
    assert.deepEqual(ids(out), ids([propriaDe1, rateada]))
  })

  it('pessoa: despesa em aba de outra pessoa entra se ela tiver split nela', () => {
    const naAbaDoOutro = despesa({ abaId: abaDe2.id, valor: 50, splits: [split(1, 0.4)] })
    const out = filtrarDespesasPorEscopo([...todas, naAbaDoOutro], 1, abasProprias(abas, 1))
    assert.ok(ids(out).includes(naAbaDoOutro.id))
  })

  it('pessoa: não conta a mesma despesa duas vezes quando está na aba dela E tem split dela', () => {
    const ambos = despesa({ abaId: abaDe1.id, valor: 60, splits: [split(1, 0.5)] })
    const out = filtrarDespesasPorEscopo([ambos], 1, abasProprias(abas, 1))
    assert.equal(out.length, 1)
  })

  it('familiar (null): só o que é rateado', () => {
    const out = filtrarDespesasPorEscopo(todas, null, new Set<number>())
    assert.deepEqual(ids(out), ids([rateada]))
  })

  it('global (undefined): tudo, sem filtro', () => {
    const out = filtrarDespesasPorEscopo(todas, undefined, new Set<number>())
    assert.deepEqual(ids(out), ids(todas))
  })
})

describe('filtrarPorPessoaId', () => {
  const de1 = { pessoaId: 1, valor: 1000 }
  const de2 = { pessoaId: 2, valor: 2000 }
  const semDono = { pessoaId: null, valor: 3000 }
  const todos = [de1, de2, semDono]

  it('pessoa: só os itens dela', () => {
    assert.deepEqual(filtrarPorPessoaId(todos, 1), [de1])
  })

  it('familiar (null): só os itens sem dono', () => {
    assert.deepEqual(filtrarPorPessoaId(todos, null), [semDono])
  })

  it('global (undefined): tudo', () => {
    assert.deepEqual(filtrarPorPessoaId(todos, undefined), todos)
  })
})

// ---------------------------------------------------------------------------
// agregarMes — três escopos
// ---------------------------------------------------------------------------

describe('agregarMes', () => {
  const abaDe1 = aba({ pessoaId: 1 })
  const abaDe2 = aba({ pessoaId: 2 })
  const abaGrupo = aba({ pessoaId: null })
  const abas = [abaDe1, abaDe2, abaGrupo]

  // Cenário único, lido pelos três escopos:
  //   própria de 1        100  (aba de 1, sem split)
  //   própria de 2        200  (aba de 2, sem split)
  //   rateada 60/40       500  (aba de grupo)
  //   espelho split_auto  200  (sintética — nunca soma)
  //   cartao_ciclo #1     500  (parcial, mesmo cartão/mês da próxima)
  //   cartao_ciclo #1     800  (completa — só esta conta)
  const propriaDe1 = despesa({ abaId: abaDe1.id, valor: 100 })
  const propriaDe2 = despesa({ abaId: abaDe2.id, valor: 200 })
  const rateada = despesa({
    abaId: abaGrupo.id,
    valor: 500,
    splits: [split(1, 0.6), split(2, 0.4)],
  })
  const espelho = despesa({ abaId: abaDe2.id, tipo: 'split_auto', valor: 200 })
  const cicloParcial = despesa({
    abaId: abaDe1.id,
    tipo: 'cartao_ciclo',
    cartaoId: 7,
    valor: 500,
  })
  const cicloCompleto = despesa({
    abaId: abaDe1.id,
    tipo: 'cartao_ciclo',
    cartaoId: 7,
    valor: 800,
  })

  const despesasBrutas = [propriaDe1, propriaDe2, rateada, espelho, cicloParcial, cicloCompleto]
  const rendimentos = [
    { pessoaId: 1, valor: 3000 },
    { pessoaId: 2, valor: 2000 },
    { pessoaId: null, valor: 500 },
  ]

  it('global: soma tudo cheio, sem sintética e com dedup de ciclo', () => {
    const out = agregarMes(despesasBrutas, rendimentos, undefined, new Set<number>())

    // 100 + 200 + 500 + 800 (o ciclo de 500 e o espelho de 200 caem fora)
    assert.equal(out.totalDespesas, 1600)
    assert.equal(out.totalRendimentos, 5500)
    assert.equal(out.saldo, 3900)
    assert.equal(out.despesas.length, 4)
  })

  it('familiar: só o rateado, pelo valor cheio', () => {
    const out = agregarMes(despesasBrutas, rendimentos, null, new Set<number>())

    assert.equal(out.totalDespesas, 500) // a rateada inteira, não a metade
    assert.equal(out.totalRendimentos, 500) // só o rendimento sem dono
    assert.equal(out.saldo, 0)
    assert.deepEqual(ids(out.despesas), ids([rateada]))
  })

  it('pessoa: abas próprias cheias + parte dela no rateio, com dedup de ciclo', () => {
    const out = agregarMes(despesasBrutas, rendimentos, 1, abasProprias(abas, 1))

    // 100 (própria) + 800 (ciclo deduplicado, aba dela) + 300 (60% de 500)
    assert.equal(out.totalDespesas, 1200)
    assert.equal(out.totalRendimentos, 3000)
    assert.equal(out.saldo, 1800)
    assert.deepEqual(ids(out.despesas), ids([propriaDe1, rateada, cicloCompleto]))
  })

  it('pessoa 2: mesma cena, ratio e abas diferentes', () => {
    const out = agregarMes(despesasBrutas, rendimentos, 2, abasProprias(abas, 2))

    // 200 (própria; o espelho split_auto da aba dela não conta) + 200 (40% de 500)
    assert.equal(out.totalDespesas, 400)
    assert.equal(out.totalRendimentos, 2000)
    assert.equal(out.saldo, 1600)
    assert.deepEqual(ids(out.despesas), ids([propriaDe2, rateada]))
  })

  it('a soma das partes das pessoas no rateio fecha com o valor familiar', () => {
    const familiar = agregarMes([rateada], [], null, new Set<number>())
    const p1 = agregarMes([rateada], [], 1, abasProprias(abas, 1))
    const p2 = agregarMes([rateada], [], 2, abasProprias(abas, 2))

    assert.equal(p1.totalDespesas + p2.totalDespesas, familiar.totalDespesas)
  })

  it('mês sem lançamento nenhum zera em qualquer escopo', () => {
    for (const escopo of [undefined, null, 1] as const) {
      const out = agregarMes([], [], escopo, new Set<number>())
      assert.equal(out.totalDespesas, 0)
      assert.equal(out.totalRendimentos, 0)
      assert.equal(out.saldo, 0)
      assert.deepEqual(out.despesas, [])
    }
  })

  it('saldo negativo quando gasta mais do que entra', () => {
    const out = agregarMes([despesa({ valor: 900 })], [{ pessoaId: null, valor: 400 }], undefined, new Set<number>())
    assert.equal(out.saldo, -500)
  })

  it('despesas devolvidas já vêm filtradas e deduplicadas (não só os totais)', () => {
    const out = agregarMes(despesasBrutas, [], undefined, new Set<number>())
    assert.ok(!out.despesas.some((d) => d.tipo === 'split_auto'))
    assert.ok(!ids(out.despesas).includes(cicloParcial.id))
  })
})

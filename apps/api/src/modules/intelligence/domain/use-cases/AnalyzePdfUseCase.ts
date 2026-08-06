import { HttpError } from '../../../../shared/errors.js'
import type { IAnthropicRepository } from '../repositories/IAnthropicRepository.js'
import type { IFaturaRepository } from '../../../finances/domain/repositories/IFaturaRepository.js'
import type { ICartaoRepository } from '../../../finances/domain/repositories/ICartaoRepository.js'
import type { IAbaRepository } from '../../../finances/domain/repositories/IAbaRepository.js'
import type { IPessoaRepository } from '../../../finances/domain/repositories/IPessoaRepository.js'
import type { IDespesaRepository } from '../../../finances/domain/repositories/IDespesaRepository.js'
import type { ICategoriaRepository } from '../../../finances/domain/repositories/ICategoriaRepository.js'
import type { ICategoryRuleRepository } from '../../../finances/domain/repositories/ICategoryRuleRepository.js'
import type { IUnitOfWork } from '../../../finances/domain/repositories/IUnitOfWork.js'
import type { IFxRateRepository } from '../repositories/IFxRateRepository.js'
import {
  conferirTotal,
  filtrarTransacoesDespesa,
  montarResumoCategorias,
  somarTransacoes,
  type ConferenciaTotal,
} from '../../../finances/domain/services/fatura-transacoes.js'
import { PROMPTS } from '../prompts/index.js'
import { createHash } from 'crypto'

// Moedas estrangeiras comuns em faturas BR — cotação injetada como estimativa de conversão
const MOEDAS_INTERNACIONAIS = ['USD', 'EUR', 'GBP', 'ARS', 'CAD', 'AUD', 'CHF', 'JPY']

// Vencimento real a partir do ciclo do cartão. O dia de vencimento cai no mesmo mês do
// fechamento quando diaVencimento >= diaFechamento; senão, no mês seguinte.
// Ex: fecha dia 5, vence dia 15 → mesmo mês. Fecha dia 25, vence dia 3 → mês seguinte.
function vencimentoDoCiclo(mesRefFechamento: string, diaFechamento: number, diaVencimento: number): string {
  const [y, m] = mesRefFechamento.split('-').map(Number)
  let vy = y
  let vm = m // 1-indexed
  if (diaVencimento < diaFechamento) {
    const d = new Date(y, m, 1) // m (1-indexed) como índice = mês seguinte (0-indexed)
    vy = d.getFullYear()
    vm = d.getMonth() + 1
  }
  const ultimoDia = new Date(vy, vm, 0).getDate()
  const dd = Math.min(diaVencimento, ultimoDia)
  return `${vy}-${String(vm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`
}

// Data de vencimento: prioriza o que a IA leu na fatura; senão calcula pelo ciclo do cartão.
function resolveVencimento(
  mesRefFatura: string,
  iaVencimento: string | null | undefined,
  cartao: { diaFechamento: number; diaVencimento: number } | null | undefined,
): string | null {
  if (iaVencimento && /^\d{4}-\d{2}-\d{2}$/.test(iaVencimento)) return iaVencimento
  if (cartao) return vencimentoDoCiclo(mesRefFatura, cartao.diaFechamento, cartao.diaVencimento)
  return null
}

// IA às vezes devolve "Desconhecido" quando não identifica o emissor → cai pro nome do cartão.
function bancoLimpo(iaBanco: string | null | undefined): string | null {
  if (!iaBanco) return null
  if (/desconhecid/i.test(iaBanco)) return null
  return iaBanco.trim() || null
}

export interface AnalyzePdfInput {
  pdfBase64: string
  cartaoId: number
  arquivoOriginal?: string
  mesRefOverride?: string
  mediaType?: string  // ex: 'application/pdf', 'image/jpeg', 'image/png'
  substituir?: boolean  // fatura consolidada: substitui lançamentos do mês em vez de acrescentar
  responsavelId?: number  // cartão de grupo: pessoa que fronteia o pagamento da fatura (vira pagador da despesa)
}

export interface FaturaAnalisadaResult extends FaturaAnalisada {
  faturaId: number
  // Conferência entre o total impresso na fatura e a soma das linhas extraídas.
  // `confere: false` significa que a IA leu linhas demais ou de menos — o cliente
  // deve avisar em vez de mostrar o número como se fosse certo.
  conferencia: ConferenciaTotal
}

export interface FaturaAnalisada {
  fatura: {
    banco: string
    mes_referencia: string
    vencimento: string
    total: number
    limite: number | null
  }
  transacoes: Array<{
    data: string
    descricao: string
    estabelecimento: string
    valor: number
    categoria: string
    parcela: string | null
  }>
  resumo_categorias: Array<{
    categoria: string
    valor: number
    percentual: number
    qtd_transacoes: number
  }>
  comentario_executivo: string
}

export class AnalyzePdfUseCase {
  constructor(
    private readonly anthropicRepo: IAnthropicRepository,
    private readonly faturaRepo: IFaturaRepository,
    private readonly cartaoRepo: ICartaoRepository,
    private readonly abaRepo: IAbaRepository,
    private readonly pessoaRepo: IPessoaRepository,
    private readonly despesaRepo: IDespesaRepository,
    private readonly categoriaRepo: ICategoriaRepository,
    private readonly categoryRuleRepo: ICategoryRuleRepository,
    private readonly uow: IUnitOfWork,
    private readonly fxRateRepo?: IFxRateRepository,
  ) {}

  async execute(input: AnalyzePdfInput): Promise<FaturaAnalisadaResult> {
    if (!input.pdfBase64) throw HttpError.badRequest('pdfBase64 é obrigatório')

    const fileHash = createHash('sha256').update(input.pdfBase64).digest('hex')

    const existing = await this.faturaRepo.findByHash(fileHash)
    if (existing) throw HttpError.conflict('Esta fatura já foi importada anteriormente')

    // Busca categorias e regras em paralelo para injetar no prompt
    const [categorias, categoryRules] = await Promise.all([
      this.categoriaRepo.findAll(),
      this.categoryRuleRepo.findAll(),
    ])

    const categoriasAtivas = categorias.filter((c) => c.ativa).map((c) => c.nome)

    // Cotações do dia para conversão de compras internacionais (não-fatal: se offline, segue sem)
    let fxRates: Record<string, number> | null = null
    if (this.fxRateRepo) {
      try {
        fxRates = await this.fxRateRepo.getRatesToBRL(MOEDAS_INTERNACIONAIS)
      } catch {
        fxRates = null
      }
    }

    const systemPrompt = PROMPTS.analyzeFatura(
      input.mesRefOverride,
      input.mediaType,
      categoriasAtivas.length > 0 ? categoriasAtivas : undefined,
      categoryRules.length > 0 ? categoryRules : undefined,
      fxRates,
    )

    let raw: string
    try {
      raw = await this.anthropicRepo.call({
        systemPrompt,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image', // AnthropicRepository roteia para 'document' se media_type for PDF
                source: {
                  type: 'base64',
                  media_type: input.mediaType ?? 'application/pdf',
                  data: input.pdfBase64,
                },
              },
              {
                type: 'text',
                text: 'Analise esta fatura de cartão de crédito e retorne o JSON estruturado conforme as instruções.',
              },
            ],
          },
        ],
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      const isProviderError = msg.toLowerCase().includes('provider') || msg.includes('400')
      if (isProviderError) {
        throw HttpError.unprocessable(
          'A IA não conseguiu processar este arquivo. Causas comuns: ' +
          '(1) PDF protegido por senha — bancos como C6 e Nubank usam o CPF como senha. ' +
          'Abra o PDF, remova a senha e tente novamente. ' +
          '(2) Arquivo corrompido ou formato não suportado. ' +
          'Alternativa: exporte como imagem (PNG/JPG) e importe a imagem.',
        )
      }
      throw HttpError.unprocessable(`Erro ao chamar a IA: ${msg}`)
    }

    let analise: FaturaAnalisada
    try {
      // Remove cercas markdown se a IA encapsular o JSON
      const cleaned = raw
        .replace(/^[\s\S]*?```(?:json)?\s*/i, '')
        .replace(/```[\s\S]*$/, '')
        .trim() || raw.trim()
      analise = JSON.parse(cleaned) as FaturaAnalisada
    } catch {
      throw HttpError.unprocessable(`Resposta da IA não é um JSON válido. Trecho: ${raw.slice(0, 300)}`)
    }

    if (!analise.fatura || !analise.transacoes) {
      throw HttpError.unprocessable('JSON da IA não contém os campos obrigatórios')
    }

    // Pós-processamento: aplicar CategoryRules garantidas (independente da IA)
    // Constrói mapa pattern → categoria para lookup O(1)
    const ruleMap = new Map(categoryRules.map((r) => [r.pattern.toLowerCase(), r.categoria]))
    analise.transacoes = analise.transacoes.map((t) => {
      const key = (t.estabelecimento ?? '').toLowerCase()
      const categoriaForçada = ruleMap.get(key)
      return categoriaForçada ? { ...t, categoria: categoriaForçada } : t
    })

    // Remove linhas que não são despesa (pagamento da fatura anterior, saldo
    // transportado). O prompt já pede isso, mas prompt não é garantia: quando o
    // modelo escorrega, o pagamento do mês passado entra como gasto do mês atual.
    const { mantidas, descartadas } = filtrarTransacoesDespesa(analise.transacoes)
    analise.transacoes = mantidas

    // O total impresso na fatura vira sinal de conferência, não fonte do número.
    // A partir daqui o dono do valor é sempre a soma das transações persistidas.
    const conferencia = conferirTotal(analise.fatura?.total, mantidas, descartadas.length)

    const criadoEm = new Date().toISOString()
    const mesRefFinal = input.mesRefOverride ?? analise.fatura.mes_referencia ?? null

    // Chave de deduplicação por transação. Inclui a descrição porque duas compras
    // legítimas podem coincidir em data, estabelecimento, valor e parcela — sem ela,
    // reimportar a fatura descartaria repetições reais (4 cafés no mesmo dia).
    const txKey = (t: {
      data?: string | null
      descricao?: string | null
      estabelecimento?: string | null
      valor?: number | null
      parcela?: string | null
    }) =>
      [
        t.data ?? '',
        (t.descricao ?? '').toLowerCase().trim(),
        (t.estabelecimento ?? '').toLowerCase().trim(),
        t.valor ?? '',
        t.parcela ?? '',
      ].join('|')

    // Regrava o snapshot JSON a partir das linhas que estão de fato no banco.
    // Sem isso o analiseJson congela na primeira importação e passa a descrever
    // uma fatura que não existe mais (era o caso do modo APPEND).
    const montarAnaliseJson = (
      base: FaturaAnalisada,
      transacoesVivas: Array<{
        data: string | null
        descricao: string | null
        estabelecimento: string | null
        valor: number | null
        categoria: string | null
        parcela: string | null
      }>,
      total: number,
    ): string =>
      JSON.stringify({
        ...base,
        fatura: { ...base.fatura, total },
        transacoes: transacoesVivas,
        resumo_categorias: montarResumoCategorias(transacoesVivas),
      })

    // Toda a persistência numa transação só: fatura + transações + despesa do ciclo + splits.
    // Falha em qualquer ponto desfaz tudo — não sobra fatura importada sem despesa, nem
    // fileHash gravado bloqueando a retentativa do mesmo arquivo.
    const faturaId = await this.uow.run(async ({ faturaRepo, cartaoRepo, abaRepo, pessoaRepo, despesaRepo }) => {
      // Recheca o hash dentro da transação. O guard lá em cima roda antes da chamada de IA
      // (evita gastar a chamada); este fecha a corrida entre dois uploads simultâneos.
      const jaImportada = await faturaRepo.findByHash(fileHash)
      if (jaImportada) throw HttpError.conflict('Esta fatura já foi importada anteriormente')

      // Verifica se já existe fatura para este cartão + mesRef → modo APPEND
      let faturaExistente = mesRefFinal
        ? await faturaRepo.findByCartaoAndMesRef(input.cartaoId, mesRefFinal)
        : null

      // MODO SUBSTITUIR (fatura consolidada/fechada): apaga a fatura do mês (cascateia transações)
      // e segue pelo fluxo CREATE — o consolidado vira a fonte de verdade. A despesa do ciclo é
      // atualizada via upsert (não duplica).
      if (input.substituir && faturaExistente) {
        await faturaRepo.delete(faturaExistente.id)
        faturaExistente = null
      }

      if (faturaExistente) {
        const alvo = faturaExistente
        // MODO APPEND: adiciona somente transações novas (deduplicação)
        const transacoesExistentes = await faturaRepo.findTransacoes(alvo.id)
        const keysExistentes = new Set(transacoesExistentes.map(txKey))

        const novasTransacoes = analise.transacoes.filter((t) => !keysExistentes.has(txKey(t)))

        if (novasTransacoes.length > 0) {
          await faturaRepo.createTransacoes(
            novasTransacoes.map((t) => ({
              faturaId: alvo.id,
              data: t.data ?? null,
              descricao: t.descricao ?? null,
              estabelecimento: t.estabelecimento ?? null,
              valor: t.valor ?? null,
              categoria: t.categoria ?? null,
              parcela: t.parcela ?? null,
            })),
          )
        }

        // Ressincroniza SEMPRE, não só quando entraram linhas novas: mesmo um
        // upload totalmente duplicado precisa deixar total, analiseJson e despesa
        // coerentes entre si — antes daqui eles podiam já estar divergindo.
        const todasTransacoes = await faturaRepo.findTransacoes(alvo.id)
        const novoTotal = somarTransacoes(todasTransacoes)
        await faturaRepo.updateTotal(alvo.id, novoTotal)
        await faturaRepo.updateAnaliseJson(alvo.id, montarAnaliseJson(analise, todasTransacoes, novoTotal))

        const cartao = await cartaoRepo.findById(input.cartaoId)
        if (cartao?.abaId && novoTotal > 0) {
          const aba = await abaRepo.findById(cartao.abaId)
          // Só sobrescreve o pagador em cartão de grupo quando um responsável é informado.
          const pagadorPatch =
            aba && aba.pessoaId == null && input.responsavelId != null
              ? { pagadorId: input.responsavelId }
              : {}
          const vencimento = resolveVencimento(mesRefFinal!, alvo.vencimento ?? analise.fatura.vencimento, cartao)
          const mesRef = vencimento ? vencimento.slice(0, 7) : mesRefFinal!
          const despesaExistente = await despesaRepo.findByCartaoCiclo(cartao.id, mesRef)
          if (despesaExistente) {
            await despesaRepo.update(despesaExistente.id, { ...(vencimento ? { data: vencimento } : {}), ...pagadorPatch })
            // resyncCartaoCiclo grava o valor e redistribui os splits MANTENDO as
            // proporções. O código anterior reescrevia tudo com 1/n, achatando um
            // rateio 70/30 em 50/50 a cada upload parcial.
            await despesaRepo.resyncCartaoCiclo(despesaExistente.id, novoTotal)
          }
        }

        return alvo.id
      }

      // MODO CREATE: primeira importação para este cartão + mesRef
      const cartao = await cartaoRepo.findById(input.cartaoId)
      const mesFaturaRef = mesRefFinal ?? new Date().toISOString().slice(0, 7)
      const vencimento = resolveVencimento(mesFaturaRef, analise.fatura.vencimento, cartao)
      const banco = bancoLimpo(analise.fatura.banco) ?? cartao?.nome ?? null
      // `total` é a soma das linhas persistidas — a mesma definição usada no APPEND
      // e no resync após edição manual. O total impresso vai em `conferencia`.
      const total = somarTransacoes(analise.transacoes)
      const fatura = await faturaRepo.create({
        fileHash,
        arquivoOriginal: input.arquivoOriginal ?? 'fatura.pdf',
        banco,
        mesReferencia: mesRefFinal,
        vencimento,
        total,
        limite: analise.fatura.limite ?? null,
        comentarioExecutivo: analise.comentario_executivo ?? null,
        // JSON normalizado (linhas já filtradas, total recalculado) em vez da
        // resposta crua do modelo — o snapshot tem que descrever o que foi gravado.
        analiseJson: montarAnaliseJson(
          analise,
          analise.transacoes.map((t) => ({
            data: t.data ?? null,
            descricao: t.descricao ?? null,
            estabelecimento: t.estabelecimento ?? null,
            valor: t.valor ?? null,
            categoria: t.categoria ?? null,
            parcela: t.parcela ?? null,
          })),
          total,
        ),
        criadoEm,
        cartaoId: input.cartaoId,
      })

      if (analise.transacoes.length > 0) {
        await faturaRepo.createTransacoes(
          analise.transacoes.map((t) => ({
            faturaId: fatura.id,
            data: t.data ?? null,
            descricao: t.descricao ?? null,
            estabelecimento: t.estabelecimento ?? null,
            valor: t.valor ?? null,
            categoria: t.categoria ?? null,
            parcela: t.parcela ?? null,
          })),
        )
      }

      // Cria despesa cartao_ciclo com split (grupo) ou pessoal
      if (cartao?.abaId && total > 0) {
        const aba = await abaRepo.findById(cartao.abaId)
        // Despesa cai no mês do VENCIMENTO (regime de caixa). mesFaturaRef = mês de fechamento da fatura.
        const mesRef = vencimento ? vencimento.slice(0, 7) : mesFaturaRef
        const data = vencimento
        const descricao = `Fatura ${banco ?? cartao.nome} - ${mesFaturaRef}`

        // Cartão de grupo (aba sem dono): respeita o responsável escolhido como pagador da fatura.
        // Cartão pessoal: pagador é implícito (dono da aba) → pagadorId null.
        const pagadorId = aba && aba.pessoaId == null ? (input.responsavelId ?? null) : null

        // Upsert: se já existe despesa cartao_ciclo deste mês (parciais), atualiza em vez de duplicar.
        const despesaExistente = await despesaRepo.findByCartaoCiclo(cartao.id, mesRef)
        const despesa = despesaExistente
          ? await despesaRepo.update(despesaExistente.id, { mesRef, data, descricao, valor: total, pagadorId })
          : await despesaRepo.create({
              abaId: cartao.abaId,
              mesRef,
              data,
              descricao,
              categoria: 'Cartão',
              valor: total,
              tipo: 'cartao_ciclo',
              cartaoId: cartao.id,
              emFaturaCartao: true,
              pagadorId,
            })

        // Se a despesa do ciclo já tinha splits (upload parcial anterior), preserva
        // as proporções em vez de recriar. Rateio uniforme só na primeira vez.
        const splitsExistentes = await despesaRepo.findSplits(despesa.id)
        if (splitsExistentes.length > 0) {
          await despesaRepo.resyncCartaoCiclo(despesa.id, total)
        } else if (aba && aba.pessoaId == null) {
          // Rateio entre membros DO GRUPO da aba (não flag global familiar).
          // Fallback: se grupo sem membros cadastrados, usa familiares ativos.
          const todasPessoas = await pessoaRepo.findAll()
          const ativasPorId = new Map(todasPessoas.filter((p) => p.ativo).map((p) => [p.id, p]))
          const membros = aba.membros.length > 0
            ? aba.membros.map((id) => ativasPorId.get(id)).filter((p): p is NonNullable<typeof p> => p != null)
            : todasPessoas.filter((p) => p.familiar && p.ativo)
          if (membros.length > 0) {
            const ratio = 1 / membros.length
            await despesaRepo.setSplits(
              despesa.id,
              membros.map((p) => ({
                pessoaId: p.id,
                ratio,
                valorCalculado: total * ratio,
              })),
            )
          }
        }
      }

      return fatura.id
    })

    return { faturaId, ...analise, conferencia }
  }
}

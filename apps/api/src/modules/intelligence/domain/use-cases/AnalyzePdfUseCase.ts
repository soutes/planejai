import { HttpError } from '../../../../shared/errors.js'
import type { IAnthropicRepository } from '../repositories/IAnthropicRepository.js'
import type { IFaturaRepository } from '../../../finances/domain/repositories/IFaturaRepository.js'
import type { ICartaoRepository } from '../../../finances/domain/repositories/ICartaoRepository.js'
import type { IAbaRepository } from '../../../finances/domain/repositories/IAbaRepository.js'
import type { IPessoaRepository } from '../../../finances/domain/repositories/IPessoaRepository.js'
import type { IDespesaRepository } from '../../../finances/domain/repositories/IDespesaRepository.js'
import type { ICategoriaRepository } from '../../../finances/domain/repositories/ICategoriaRepository.js'
import type { ICategoryRuleRepository } from '../../../finances/domain/repositories/ICategoryRuleRepository.js'
import { PROMPTS } from '../prompts/index.js'
import { createHash } from 'crypto'

export interface AnalyzePdfInput {
  pdfBase64: string
  cartaoId: number
  arquivoOriginal?: string
  mesRefOverride?: string
  mediaType?: string  // ex: 'application/pdf', 'image/jpeg', 'image/png'
}

export interface FaturaAnalisadaResult extends FaturaAnalisada {
  faturaId: number
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
    const systemPrompt = PROMPTS.analyzeFatura(
      input.mesRefOverride,
      input.mediaType,
      categoriasAtivas.length > 0 ? categoriasAtivas : undefined,
      categoryRules.length > 0 ? categoryRules : undefined,
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

    const criadoEm = new Date().toISOString()
    const mesRefFinal = input.mesRefOverride ?? analise.fatura.mes_referencia ?? null

    // Chave de deduplicação por transação: (data, estabelecimento normalizado, valor, parcela)
    const txKey = (t: { data?: string | null; estabelecimento?: string | null; valor?: number | null; parcela?: string | null }) =>
      `${t.data ?? ''}|${(t.estabelecimento ?? '').toLowerCase().trim()}|${t.valor ?? ''}|${t.parcela ?? ''}`

    // Verifica se já existe fatura para este cartão + mesRef → modo APPEND
    const faturaExistente = mesRefFinal
      ? await this.faturaRepo.findByCartaoAndMesRef(input.cartaoId, mesRefFinal)
      : null

    let faturaId: number

    if (faturaExistente) {
      // MODO APPEND: adiciona somente transações novas (deduplicação)
      const transacoesExistentes = await this.faturaRepo.findTransacoes(faturaExistente.id)
      const keysExistentes = new Set(transacoesExistentes.map(txKey))

      const novasTransacoes = analise.transacoes.filter((t) => !keysExistentes.has(txKey(t)))

      if (novasTransacoes.length > 0) {
        await this.faturaRepo.createTransacoes(
          novasTransacoes.map((t) => ({
            faturaId: faturaExistente.id,
            data: t.data ?? null,
            descricao: t.descricao ?? null,
            estabelecimento: t.estabelecimento ?? null,
            valor: t.valor ?? null,
            categoria: t.categoria ?? null,
            parcela: t.parcela ?? null,
          })),
        )

        // Recalcula total somando todas as transações (incluindo as novas)
        const todasTransacoes = await this.faturaRepo.findTransacoes(faturaExistente.id)
        const novoTotal = todasTransacoes.reduce((s, t) => s + (t.valor ?? 0), 0)
        await this.faturaRepo.updateTotal(faturaExistente.id, novoTotal)

        // Atualiza despesa cartao_ciclo existente com o novo total
        const cartao = await this.cartaoRepo.findById(input.cartaoId)
        if (cartao?.abaId && novoTotal > 0) {
          const mesRef = mesRefFinal!
          const despesaExistente = await this.despesaRepo.findByCartaoCiclo(cartao.id, mesRef)
          if (despesaExistente) {
            await this.despesaRepo.update(despesaExistente.id, { valor: novoTotal })
            // Recalcula splits se existirem
            const splits = await this.despesaRepo.findSplits(despesaExistente.id)
            if (splits.length > 0) {
              const ratio = 1 / splits.length
              await this.despesaRepo.setSplits(
                despesaExistente.id,
                splits.map((s) => ({ pessoaId: s.pessoaId, ratio, valorCalculado: novoTotal * ratio })),
              )
            }
          }
        }
      }

      faturaId = faturaExistente.id
    } else {
      // MODO CREATE: primeira importação para este cartão + mesRef
      const cartao = await this.cartaoRepo.findById(input.cartaoId)
      const fatura = await this.faturaRepo.create({
        fileHash,
        arquivoOriginal: input.arquivoOriginal ?? 'fatura.pdf',
        banco: analise.fatura.banco || cartao?.nome || null,
        mesReferencia: mesRefFinal,
        vencimento: analise.fatura.vencimento ?? null,
        total: analise.fatura.total ?? null,
        limite: analise.fatura.limite ?? null,
        comentarioExecutivo: analise.comentario_executivo ?? null,
        analiseJson: raw,
        criadoEm,
        cartaoId: input.cartaoId,
      })

      if (analise.transacoes.length > 0) {
        await this.faturaRepo.createTransacoes(
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

      // Cria despesa cartao_ciclo com split (familiar) ou pessoal
      const total = analise.fatura.total ?? 0
      if (cartao?.abaId && total > 0) {
        const aba = await this.abaRepo.findById(cartao.abaId)
        const mesRef = mesRefFinal ?? new Date().toISOString().slice(0, 7)
        const data = analise.fatura.vencimento ?? null
        const descricao = `Fatura ${analise.fatura.banco ?? cartao.nome} - ${mesRef}`

        const despesa = await this.despesaRepo.create({
          abaId: cartao.abaId,
          mesRef,
          data,
          descricao,
          categoria: 'Cartão',
          valor: total,
          tipo: 'cartao_ciclo',
          cartaoId: cartao.id,
          emFaturaCartao: true,
        })

        if (aba && aba.pessoaId == null) {
          const todasPessoas = await this.pessoaRepo.findAll()
          const familiares = todasPessoas.filter((p) => p.familiar && p.ativo)
          if (familiares.length > 0) {
            const ratio = 1 / familiares.length
            await this.despesaRepo.setSplits(
              despesa.id,
              familiares.map((p) => ({
                pessoaId: p.id,
                ratio,
                valorCalculado: total * ratio,
              })),
            )
          }
        }
      }

      faturaId = fatura.id
    }

    return { faturaId, ...analise }
  }
}

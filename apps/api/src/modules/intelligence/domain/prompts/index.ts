import { readFileSync } from 'fs'
import { join } from 'path'

export interface PromptCategoryRule {
  pattern: string
  categoria: string
}

export const PROMPTS = {
  analyzeFatura: (
    mesRef?: string | null,
    mediaType?: string | null,
    categorias?: string[],
    categoryRules?: PromptCategoryRule[],
  ) => {
    let base = readFileSync(join(__dirname, 'analyze-fatura.md'), 'utf-8')

    // Injeta lista de categorias dinâmica (do banco)
    const cats = categorias && categorias.length > 0
      ? categorias
      : ['Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Casa', 'Vestuário', 'Assinaturas', 'Pets', 'Viagem', 'Presente', 'Cartão', 'Outros']
    base = base.replace('{{CATEGORIAS}}', cats.map((c) => `- ${c}`).join('\n'))

    const isPdf = !mediaType || mediaType === 'application/pdf'
    const tipoArquivo = isPdf
      ? 'PDF'
      : mediaType.startsWith('image/')
        ? `imagem (${mediaType.replace('image/', '')})`
        : mediaType

    let extra = `\n\n## Contexto desta análise\n\n`
    extra += `**Formato do arquivo:** ${tipoArquivo}.\n`

    if (isPdf) {
      extra += `O documento é um PDF — pode conter múltiplas páginas. Extraia todas as transações de todas as páginas.\n`
    } else {
      extra += `O documento é uma imagem — pode ser print de tela ou foto da fatura. Extraia o máximo de informações visíveis.\n`
    }

    if (mesRef) {
      extra +=
        `\n**Mês de referência confirmado pelo usuário: ${mesRef}.**\n` +
        `Use este valor como âncora obrigatória para inferir o ano correto em datas incompletas ou ambíguas.\n` +
        `Transações de parcelas iniciadas em meses anteriores devem ter suas datas com o ano real da compra (ex: parcela 08/10 num mês atual indica que a compra foi feita ~8 meses atrás — calcule o ano correto).\n` +
        `O campo \`mes_referencia\` da fatura deve ser exatamente **${mesRef}**.\n`
    }

    // Regras de categorização conhecidas (aprendidas de correções anteriores)
    if (categoryRules && categoryRules.length > 0) {
      extra += `\n## Regras de categorização do usuário\n\n`
      extra += `O usuário já corrigiu manualmente as categorias dos estabelecimentos abaixo. Use **obrigatoriamente** estas categorias para esses estabelecimentos:\n`
      for (const r of categoryRules) {
        extra += `- "${r.pattern}" → ${r.categoria}\n`
      }
    }

    return base + extra
  },
  generateReport: () => readFileSync(join(__dirname, 'generate-report.md'), 'utf-8'),
}

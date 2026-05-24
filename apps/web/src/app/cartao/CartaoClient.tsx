'use client'

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Upload, Pencil, AlertCircle, CreditCard, FileSearch, Trash2,
  TrendingUp, User, Users, ChevronDown, Calendar, Zap, Eye, EyeOff,
  Target, Clock, Wallet,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { FormField } from '@/components/ui/FormField'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatMoney } from '@/components/ui/MoneyValue'
import { apiFetch, currentMesRef } from '@/shared/lib/api'
import { formatDataBR, formatMesRefBR } from '@/shared/lib/format'
import { useCategorias } from '@/shared/hooks/useCategorias'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CartaoApi {
  id: number
  nome: string
  proprietario: string | null
  finalDigitos: string | null
  cor: string
  limite: number | null
  diaFechamento: number
  ativo: boolean
  abaId: number | null
  abaPessoaId: number | null
}

interface FaturaApi {
  id: number
  cartaoId: number
  banco: string | null
  mesReferencia: string | null
  vencimento: string | null
  total: number | null
  limite: number | null
  comentarioExecutivo: string | null
  analiseJson: string
  criadoEm: string
  arquivoOriginal: string
  fileHash: string
}

interface TransacaoApi {
  id: number
  faturaId: number
  data: string | null
  descricao: string | null
  estabelecimento: string | null
  valor: number | null
  categoria: string | null
  parcela: string | null
}

interface FaturaAnalisada {
  fatura: { banco: string; mes_referencia: string; vencimento: string; total: number; limite: number | null }
  transacoes: Array<{ data: string; descricao: string; estabelecimento: string; valor: number; categoria: string; parcela: string | null }>
  resumo_categorias: Array<{ categoria: string; valor: number; percentual: number; qtd_transacoes: number }>
  comentario_executivo: string
}

interface CicloInfo {
  inicio: string
  fim: string
  diasRestantes: number
  diasDecorridos: number
  diasTotal: number
}

type Grupo = 'pessoal' | 'familiar'
type Tab = 'acompanhamento' | 'historico' | 'tendencias'

// ─── Constants ────────────────────────────────────────────────────────────────

const CAT_COLORS: Record<string, string> = {
  Alimentação: '#FF4B6E', Assinaturas: '#B07AFF', Transporte: '#6FA9D6',
  Lazer: '#F4A261', Saúde: '#34D399', Outros: '#5A6273', Casa: '#60A5FA',
  Educação: '#FBBF24', Vestuário: '#F472B6', Pets: '#A3E635',
  Viagem: '#38BDF8', Presente: '#E879F9', Cartão: '#94A3B8',
}

const LINHA_COLORS = ['#10F5A3', '#B07AFF', '#6FA9D6', '#F4A261', '#FF4B6E']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcCiclo(diaFechamento: number): CicloInfo {
  const today = new Date()
  const d = today.getDate()
  const m = today.getMonth()
  const y = today.getFullYear()

  let inicio: Date, fim: Date
  if (d > diaFechamento) {
    inicio = new Date(y, m, diaFechamento + 1)
    fim = new Date(y, m + 1, diaFechamento)
  } else {
    inicio = new Date(y, m - 1, diaFechamento + 1)
    fim = new Date(y, m, diaFechamento)
  }

  const msDay = 1000 * 60 * 60 * 24
  const diasTotal = Math.round((fim.getTime() - inicio.getTime()) / msDay) + 1
  const diasDecorridos = Math.max(1, Math.ceil((today.getTime() - inicio.getTime()) / msDay) + 1)
  const diasRestantes = Math.max(0, Math.ceil((fim.getTime() - today.getTime()) / msDay))
  return {
    inicio: inicio.toISOString().slice(0, 10),
    fim: fim.toISOString().slice(0, 10),
    diasRestantes,
    diasDecorridos: Math.min(diasDecorridos, diasTotal),
    diasTotal,
  }
}

function parseAnaliseJson(raw: string): FaturaAnalisada | null {
  try {
    const cleaned = raw
      .replace(/^[\s\S]*?```(?:json)?\s*/i, '')
      .replace(/```[\s\S]*$/, '')
      .trim() || raw.trim()
    return JSON.parse(cleaned) as FaturaAnalisada
  } catch {
    return null
  }
}

function computeAlertas(transacoes: TransacaoApi[]) {
  const alertas: { tipo: 'termina' | 'inicio'; msg: string; valor: number; parcela: string }[] = []
  transacoes.forEach((t) => {
    if (!t.parcela) return
    const match = t.parcela.match(/^(\d+)\/(\d+)$/)
    if (!match) return
    const atual = parseInt(match[1])
    const total = parseInt(match[2])
    const restantes = total - atual
    if (total >= 6 && restantes <= 2 && restantes >= 0) {
      alertas.push({ tipo: 'termina', msg: `${t.estabelecimento ?? t.descricao} termina em ${restantes + 1} parcela(s)`, valor: t.valor ?? 0, parcela: t.parcela })
    }
    if (total >= 6 && atual <= 2) {
      alertas.push({ tipo: 'inicio', msg: `${t.estabelecimento ?? t.descricao} — novo parcelamento (${total}x)`, valor: t.valor ?? 0, parcela: t.parcela })
    }
  })
  return alertas
}

function computeTopEstabs(transacoes: TransacaoApi[], limit = 5) {
  const agg: Record<string, number> = {}
  transacoes.forEach((t) => {
    const est = t.estabelecimento ?? t.descricao ?? 'Desconhecido'
    agg[est] = (agg[est] ?? 0) + (t.valor ?? 0)
  })
  return Object.entries(agg)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([nome, total]) => ({ nome, total }))
}

function labelMes(mesRef: string | null) {
  if (!mesRef) return '—'
  const [y, m] = mesRef.split('-')
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${meses[parseInt(m) - 1]}/${y?.slice(2)}`
}

// ─── PDF → PNG converter ──────────────────────────────────────────────────────

let pdfjsWorkerReady = false
function ensurePdfjsWorker() {
  if (pdfjsWorkerReady) return
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
  pdfjsWorkerReady = true
}

async function pdfToBase64Png(buffer: ArrayBuffer, password?: string): Promise<string> {
  ensurePdfjsWorker()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pdfDoc: any
  await new Promise<void>((resolve, reject) => {
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) })
    // onPassword é chamado quando o PDF está protegido — throw aqui não propaga,
    // então usamos reject() explicitamente
    loadingTask.onPassword = (updatePassword: (pw: string) => void, reason: number) => {
      if (reason === 2) {
        reject(new Error('Senha incorreta. Tente novamente.'))
        return
      }
      if (!password) {
        reject(new Error('Este PDF está protegido por senha. Informe a senha no campo acima.'))
        return
      }
      updatePassword(password)
    }
    loadingTask.promise
      .then((doc) => { pdfDoc = doc; resolve() })
      .catch((err: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e = err as any
        if (e?.name === 'PasswordException') {
          reject(new Error(e.code === 2 ? 'Senha incorreta. Tente novamente.' : 'Este PDF está protegido por senha. Informe a senha no campo acima.'))
        } else {
          reject(new Error(`Erro ao processar PDF: ${err instanceof Error ? err.message : String(err)}`))
        }
      })
  })

  const pageCanvases: HTMLCanvasElement[] = []
  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i)
    const viewport = page.getViewport({ scale: 2 }) // 2× para qualidade
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')!
    await page.render({ canvasContext: ctx, viewport }).promise
    pageCanvases.push(canvas)
  }

  // Combina todas as páginas verticalmente num canvas único
  const totalHeight = pageCanvases.reduce((s, c) => s + c.height, 0)
  const maxWidth = Math.max(...pageCanvases.map((c) => c.width))
  const combined = document.createElement('canvas')
  combined.width = maxWidth
  combined.height = totalHeight
  const ctx = combined.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, maxWidth, totalHeight)
  let y = 0
  for (const c of pageCanvases) {
    ctx.drawImage(c, 0, y)
    y += c.height
  }

  return combined.toDataURL('image/png').split(',')[1]
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CartaoClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const categorias = useCategorias()

  // ── URL state ──────────────────────────────────────────────────────────────
  const grupoParam = (searchParams.get('grupo') ?? 'pessoal') as Grupo
  const cartaoIdParam = searchParams.get('cartaoId')
  const urlCartaoId = cartaoIdParam ? parseInt(cartaoIdParam) : null

  function pushUrl(grupo: Grupo, cartaoId: number | null) {
    const p = new URLSearchParams()
    p.set('grupo', grupo)
    if (cartaoId != null) p.set('cartaoId', String(cartaoId))
    router.replace(`/cartao?${p.toString()}`, { scroll: false })
  }

  // ── Data state ─────────────────────────────────────────────────────────────
  const [cartoes, setCartoes] = useState<CartaoApi[]>([])
  const [faturas, setFaturas] = useState<FaturaApi[]>([])
  const [faturasCarregando, setFaturasCarregando] = useState(false)
  const [selectedFaturaId, setSelectedFaturaId] = useState<number | null>(null)
  const [transacoes, setTransacoes] = useState<TransacaoApi[]>([])
  const [transacoesCarregando, setTransacoesCarregando] = useState(false)
  const [tab, setTab] = useState<Tab>('acompanhamento')

  // ── Upload state ───────────────────────────────────────────────────────────
  const [uploadOpen, setUploadOpen] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [uploadingIndex, setUploadingIndex] = useState(0)
  const [modalCartaoId, setModalCartaoId] = useState<number | null>(null)
  const [modalMesRef, setModalMesRef] = useState(currentMesRef())
  const [pdfSenha, setPdfSenha] = useState('')
  const [pdfSenhaVisivel, setPdfSenhaVisivel] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadElapsed, setUploadElapsed] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const addFileRef = useRef<HTMLInputElement>(null)
  const uploadTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const uploadAbortRef = useRef<AbortController | null>(null)

  // ── Delete / edit state ────────────────────────────────────────────────────
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [modoEdicao, setModoEdicao] = useState(false)
  const [edicoesPendentes, setEdicoesPendentes] = useState<Record<number, string>>({})

  // ── Tendências toggle ──────────────────────────────────────────────────────
  const [tendToggle, setTendToggle] = useState<'consolidado' | 'por-cartao'>('consolidado')

  // ── Acompanhamento: total do ciclo atual (independente do Histórico) ───────
  const [acompTotal, setAcompTotal] = useState<number>(0)
  const [acompMesRef, setAcompMesRef] = useState<string | null>(null)
  const [metaCartao, setMetaCartao] = useState<number>(0)
  const [metaFatura, setMetaFatura] = useState<number>(0)

  // ── Reload keys ────────────────────────────────────────────────────────────
  const [faturasReloadKey, setFaturasReloadKey] = useState(0)
  const [acompReloadKey, setAcompReloadKey] = useState(0)

  // ── Load cartões ───────────────────────────────────────────────────────────
  useEffect(() => {
    apiFetch<CartaoApi[]>('/api/cartoes')
      .then((rows) => {
        const ativos = rows.filter((c) => c.ativo)
        setCartoes(ativos)
      })
      .catch(() => {})
  }, [])

  // ── Derive groups ──────────────────────────────────────────────────────────
  const pessoalCartoes = useMemo(
    () => cartoes.filter((c) => c.abaPessoaId !== null || c.abaId === null),
    [cartoes],
  )
  const familiarCartoes = useMemo(
    () => cartoes.filter((c) => c.abaId !== null && c.abaPessoaId === null),
    [cartoes],
  )

  const hasPessoal = pessoalCartoes.length > 0
  const hasFamiliar = familiarCartoes.length > 0
  const hasBothGroups = hasPessoal && hasFamiliar

  // Effective grupo (fallback to whichever group exists)
  const grupo: Grupo =
    grupoParam === 'familiar' && hasFamiliar
      ? 'familiar'
      : grupoParam === 'pessoal' && hasPessoal
        ? 'pessoal'
        : hasPessoal
          ? 'pessoal'
          : 'familiar'

  const grupoCartoes = grupo === 'pessoal' ? pessoalCartoes : familiarCartoes

  // Is viewing consolidado (null cartaoId) or a specific cartão?
  const isConsolidado = urlCartaoId === null && grupoCartoes.length > 1
  const selectedCartao = urlCartaoId ? grupoCartoes.find((c) => c.id === urlCartaoId) ?? null : null

  // Auto-select first cartão if only 1 in group or if URL points to wrong group
  useEffect(() => {
    if (cartoes.length === 0) return
    const inGroup = grupoCartoes.find((c) => c.id === urlCartaoId)
    if (!inGroup && grupoCartoes.length === 1) {
      pushUrl(grupo, grupoCartoes[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartoes, grupo])

  // ── Load fatura do ciclo atual + meta para Acompanhamento ─────────────────
  useEffect(() => {
    if (tab !== 'acompanhamento' || !selectedCartao) {
      setAcompTotal(0)
      setAcompMesRef(null)
      setMetaCartao(0)
      return
    }
    const today = new Date()
    const d = today.getDate()
    const dia = selectedCartao.diaFechamento
    const fim = d > dia
      ? new Date(today.getFullYear(), today.getMonth() + 1, dia)
      : new Date(today.getFullYear(), today.getMonth(), dia)
    const targetMesRef = `${fim.getFullYear()}-${String(fim.getMonth() + 1).padStart(2, '0')}`

    const fetchFatura = apiFetch<FaturaApi[]>(`/api/faturas?cartaoId=${selectedCartao.id}`)
      .then((rows) => {
        const match = rows.find((f) => f.mesReferencia === targetMesRef)
        setAcompTotal(match?.total ?? 0)
        setAcompMesRef(match?.mesReferencia ?? null)
      })
      .catch(() => { setAcompTotal(0); setAcompMesRef(null) })

    const fetchMeta = selectedCartao.abaId
      ? apiFetch<{ id: number; valorMeta: number }[]>(`/api/orcamentos?abaId=${selectedCartao.abaId}&mesRef=${targetMesRef}`)
          .then((ors) => setMetaCartao(ors.reduce((s, o) => s + o.valorMeta, 0)))
          .catch(() => setMetaCartao(0))
      : Promise.resolve(setMetaCartao(0))

    void Promise.all([fetchFatura, fetchMeta])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, selectedCartao?.id, acompReloadKey])

  // ── Load faturas when tab/cartão/grupo changes ─────────────────────────────
  // Skip only when viewing a specific cartão on acompanhamento tab (no fatura list needed there)
  useEffect(() => {
    if (tab === 'acompanhamento' && urlCartaoId !== null) return
    if (grupoCartoes.length === 0) return

    const ids = selectedCartao ? [selectedCartao.id] : grupoCartoes.map((c) => c.id)
    setFaturasCarregando(true)
    setFaturas([])
    setSelectedFaturaId(null)
    setTransacoes([])

    Promise.all(ids.map((id) => apiFetch<FaturaApi[]>(`/api/faturas?cartaoId=${id}`)))
      .then((results) => {
        const all = results.flat().sort((a, b) =>
          (b.mesReferencia ?? '').localeCompare(a.mesReferencia ?? ''),
        )
        setFaturas(all)
        if (all.length > 0) {
          setSelectedFaturaId(all[0].id)
        }
      })
      .catch(() => {})
      .finally(() => setFaturasCarregando(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, urlCartaoId, grupo, grupoCartoes.length, faturasReloadKey])

  // ── Load transações when fatura changes ────────────────────────────────────
  useEffect(() => {
    if (!selectedFaturaId) { setTransacoes([]); return }
    setTransacoesCarregando(true)
    apiFetch<TransacaoApi[]>(`/api/faturas/${selectedFaturaId}/transacoes`)
      .then(setTransacoes)
      .catch(() => setTransacoes([]))
      .finally(() => setTransacoesCarregando(false))
  }, [selectedFaturaId])

  // ── Meta da fatura selecionada (orçamentos da aba para o mesRef) ───────────
  useEffect(() => {
    const fatura = faturas.find((f) => f.id === selectedFaturaId)
    if (!fatura || !selectedCartao?.abaId || !fatura.mesReferencia) { setMetaFatura(0); return }
    apiFetch<{ id: number; valorMeta: number }[]>(`/api/orcamentos?abaId=${selectedCartao.abaId}&mesRef=${fatura.mesReferencia}`)
      .then((ors) => setMetaFatura(ors.reduce((s, o) => s + o.valorMeta, 0)))
      .catch(() => setMetaFatura(0))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFaturaId, selectedCartao?.abaId])

  // ── Cycle data ─────────────────────────────────────────────────────────────
  const ciclo = selectedCartao ? calcCiclo(selectedCartao.diaFechamento) : null

  // Latest fatura per group for acompanhamento summary
  const latestFaturaPerCartao = useMemo(() => {
    const byCartao: Record<number, FaturaApi> = {}
    faturas.forEach((f) => {
      if (!byCartao[f.cartaoId] || (f.mesReferencia ?? '') > (byCartao[f.cartaoId].mesReferencia ?? '')) {
        byCartao[f.cartaoId] = f
      }
    })
    return byCartao
  }, [faturas])

  const totalConsolidadoGrupo = useMemo(
    () => Object.values(latestFaturaPerCartao).reduce((s, f) => s + (f.total ?? 0), 0),
    [latestFaturaPerCartao],
  )

  // Selected fatura obj
  const selectedFatura = faturas.find((f) => f.id === selectedFaturaId) ?? null
  const selectedAnalise = selectedFatura ? parseAnaliseJson(selectedFatura.analiseJson) : null

  // Transações filtradas — exclui lançamentos de pagamento de fatura (não são compras)
  // Cobre: "Pagamento", "Inclusão de Pagamento", "Pagamento Pix PDF", etc.
  const transacoesFiltradas = useMemo(
    () => transacoes.filter((t) => {
      const est = (t.estabelecimento ?? '').toLowerCase()
      const desc = (t.descricao ?? '').toLowerCase()
      return !est.includes('pagamento') && !desc.includes('pagamento')
    }),
    [transacoes],
  )

  // Category summary — always derived from live transacoesFiltradas so edits are reflected immediately
  const catSummary = useMemo(() => {
    const agg: Record<string, { valor: number; qtd: number }> = {}
    transacoesFiltradas.forEach((t) => {
      const cat = t.categoria ?? 'Outros'
      if (!agg[cat]) agg[cat] = { valor: 0, qtd: 0 }
      agg[cat].valor += t.valor ?? 0
      agg[cat].qtd += 1
    })
    const totalVal = Object.values(agg).reduce((s, v) => s + v.valor, 0)
    return Object.entries(agg)
      .sort(([, a], [, b]) => b.valor - a.valor)
      .map(([categoria, v]) => ({
        categoria,
        valor: v.valor,
        percentual: totalVal > 0 ? (v.valor / totalVal) * 100 : 0,
        qtd_transacoes: v.qtd,
      }))
  }, [transacoesFiltradas])

  const pieData = catSummary.map((r) => ({ name: r.categoria, value: r.valor }))
  const alertas = computeAlertas(transacoesFiltradas)
  const topEstabs = computeTopEstabs(transacoesFiltradas)

  // KPIs do Acompanhamento — meta = orçamentos somados, fallback para limite do cartão
  const metaEfetiva = metaCartao > 0 ? metaCartao : (selectedCartao?.limite ?? 0)
  const metaFaturaEfetiva = metaFatura > 0 ? metaFatura : (selectedCartao?.limite ?? 0)
  const pctMeta = metaEfetiva > 0 ? (acompTotal / metaEfetiva) * 100 : 0
  const restanteMeta = metaEfetiva - acompTotal
  const gastoPorDia = ciclo && ciclo.diasRestantes > 0 && metaEfetiva > 0 ? restanteMeta / ciclo.diasRestantes : 0
  const gastoMedioAtual = ciclo && ciclo.diasDecorridos > 0 ? acompTotal / ciclo.diasDecorridos : 0
  const projecaoCiclo = ciclo ? gastoMedioAtual * ciclo.diasTotal : 0
  const projecaoEstoura = metaEfetiva > 0 ? projecaoCiclo > metaEfetiva : false

  // Hero number split for acompanhamento
  const acompAbs = Math.abs(acompTotal)
  const acompFormatted = acompAbs.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const acompCommaIdx = acompFormatted.lastIndexOf(',')
  const acompInt = acompFormatted.slice(0, acompCommaIdx)
  const acompDec = acompFormatted.slice(acompCommaIdx)

  const consolAbs = Math.abs(totalConsolidadoGrupo)
  const consolFormatted = consolAbs.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const consolCommaIdx = consolFormatted.lastIndexOf(',')
  const consolInt = consolFormatted.slice(0, consolCommaIdx)
  const consolDec = consolFormatted.slice(consolCommaIdx)

  // ── Tendências data ────────────────────────────────────────────────────────
  const tendenciaData = useMemo(() => {
    if (faturas.length === 0) return []

    const sorted = [...faturas]
      .filter((f) => f.mesReferencia)
      .sort((a, b) => (a.mesReferencia ?? '').localeCompare(b.mesReferencia ?? ''))
      .slice(-12)

    if (tendToggle === 'consolidado' || !isConsolidado) {
      // Aggregate by mesRef
      const byMes: Record<string, number> = {}
      sorted.forEach((f) => {
        const mes = f.mesReferencia!
        byMes[mes] = (byMes[mes] ?? 0) + (f.total ?? 0)
      })
      return Object.entries(byMes).map(([mes, total]) => ({ mes: labelMes(mes), total }))
    } else {
      // One entry per mes, one key per cartão
      const byMes: Record<string, Record<string, number>> = {}
      sorted.forEach((f) => {
        const mes = f.mesReferencia!
        const nome = grupoCartoes.find((c) => c.id === f.cartaoId)?.nome ?? `Cartão ${f.cartaoId}`
        if (!byMes[mes]) byMes[mes] = {}
        byMes[mes][nome] = (byMes[mes][nome] ?? 0) + (f.total ?? 0)
      })
      return Object.entries(byMes).map(([mes, vals]) => ({ mes: labelMes(mes), ...vals }))
    }
  }, [faturas, tendToggle, isConsolidado, grupoCartoes])

  const tendenciaCartaoKeys = useMemo(() => {
    if (!isConsolidado || tendToggle !== 'por-cartao') return []
    return grupoCartoes.map((c) => c.nome)
  }, [isConsolidado, tendToggle, grupoCartoes])

  const catTrendData = useMemo(() => {
    const parsed = faturas
      .filter((f) => f.mesReferencia)
      .map((f) => ({ mes: f.mesReferencia!, analise: parseAnaliseJson(f.analiseJson) }))
      .filter((x) => x.analise != null)
      .sort((a, b) => a.mes.localeCompare(b.mes))
      .slice(-6)

    const topCats = new Set<string>()
    parsed.forEach(({ analise }) =>
      analise!.resumo_categorias.slice(0, 5).forEach((r) => topCats.add(r.categoria)),
    )
    const cats = [...topCats]

    const byMes: Record<string, Record<string, number>> = {}
    parsed.forEach(({ mes, analise }) => {
      if (!byMes[mes]) byMes[mes] = {}
      analise!.resumo_categorias.forEach((r) => {
        if (cats.includes(r.categoria)) byMes[mes][r.categoria] = (byMes[mes][r.categoria] ?? 0) + r.valor
      })
    })
    return { data: Object.entries(byMes).map(([mes, vals]) => ({ mes: labelMes(mes), ...vals })), cats }
  }, [faturas])

  // ── Upload handlers ────────────────────────────────────────────────────────
  function openUploadModal(files: File[]) {
    if (files.length === 0) return
    const targetId = selectedCartao?.id ?? grupoCartoes[0]?.id ?? null
    setPendingFiles(files)
    setUploadingIndex(0)
    setModalCartaoId(targetId)
    setModalMesRef(currentMesRef())
    setUploadError(null)
    setPdfSenha('')
    setPdfSenhaVisivel(false)
    setUploadOpen(true)
  }

  const handleConfirmUpload = useCallback(async () => {
    if (pendingFiles.length === 0 || !modalCartaoId) return
    setUploading(true)
    setUploadError(null)

    const controller = new AbortController()
    uploadAbortRef.current = controller
    // 2 min por arquivo
    const timeoutId = setTimeout(() => controller.abort(), 120_000 * pendingFiles.length)

    try {
      for (let i = 0; i < pendingFiles.length; i++) {
        setUploadingIndex(i)
        setUploadElapsed(0)
        if (uploadTimerRef.current) clearInterval(uploadTimerRef.current)
        uploadTimerRef.current = setInterval(() => setUploadElapsed((s) => s + 1), 1000)

        const file = pendingFiles[i]
        const buffer = await file.arrayBuffer()
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

        let base64: string
        let effectiveMediaType: string

        if (isPdf) {
          try {
            base64 = await pdfToBase64Png(buffer, pdfSenha.trim() || undefined)
            effectiveMediaType = 'image/png'
          } catch (err) {
            setUploadError(`${file.name}: ${err instanceof Error ? err.message : 'Erro ao processar PDF.'}`)
            return
          }
        } else {
          const bytes = new Uint8Array(buffer)
          let binary = ''
          for (let j = 0; j < bytes.byteLength; j++) binary += String.fromCharCode(bytes[j])
          base64 = btoa(binary)
          effectiveMediaType = file.type || 'image/jpeg'
        }

        await apiFetch('/api/intelligence/analyze-pdf', {
          method: 'POST',
          body: JSON.stringify({
            pdfBase64: base64,
            cartaoId: modalCartaoId,
            arquivoOriginal: file.name,
            mesRefOverride: modalMesRef,
            mediaType: effectiveMediaType,
          }),
          signal: controller.signal,
        })
      }

      // Após todos os uploads: se estava em Acompanhamento, recarrega ciclo sem mudar aba
      if (tab === 'acompanhamento') {
        setAcompReloadKey((k) => k + 1)
      } else {
        setFaturasReloadKey((k) => k + 1)
      }
      setUploadOpen(false)
      setPendingFiles([])
      setUploadingIndex(0)
      pushUrl(grupo, modalCartaoId)
      // Não muda de aba — usuário fica onde estava
    } catch (err) {
      console.error('[upload fatura]', err)
      if (err instanceof Error && err.name === 'AbortError') {
        setUploadError('A análise ultrapassou o tempo limite. Verifique o terminal da API.')
      } else {
        setUploadError(err instanceof Error ? err.message : 'erro desconhecido')
      }
    } finally {
      clearTimeout(timeoutId)
      if (uploadTimerRef.current) { clearInterval(uploadTimerRef.current); uploadTimerRef.current = null }
      uploadAbortRef.current = null
      setUploading(false)
    }
  }, [pendingFiles, modalCartaoId, modalMesRef, grupo, pdfSenha, tab])

  async function handleDeleteFatura() {
    if (!selectedFatura) return
    setDeleting(true)
    try {
      await apiFetch(`/api/faturas/${selectedFatura.id}`, { method: 'DELETE' })
      setFaturas((prev) => prev.filter((f) => f.id !== selectedFatura.id))
      setSelectedFaturaId(null)
      setTransacoes([])
      setDeleteConfirmOpen(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir fatura')
    } finally {
      setDeleting(false)
    }
  }

  async function handleSalvarEdicoes() {
    if (!selectedFaturaId) return
    const entries = Object.entries(edicoesPendentes)
    if (entries.length > 0) {
      try {
        await Promise.all(
          entries.map(([id, categoria]) =>
            apiFetch(`/api/faturas/${selectedFaturaId}/transacoes/${id}`, {
              method: 'PUT',
              body: JSON.stringify({ categoria }),
            }),
          ),
        )
      } catch {}
      // Reload para buscar todas as transações atualizadas pela propagação
      setTransacoesCarregando(true)
      apiFetch<TransacaoApi[]>(`/api/faturas/${selectedFaturaId}/transacoes`)
        .then(setTransacoes)
        .catch(() => {})
        .finally(() => setTransacoesCarregando(false))
    }
    setEdicoesPendentes({})
    setModoEdicao(false)
  }

  function handleCancelarEdicao() {
    setEdicoesPendentes({})
    setModoEdicao(false)
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (cartoes.length === 0) {
    return (
      <div className="af-card" style={{ padding: 0 }}>
        <EmptyState
          icon={CreditCard}
          title="Nenhum cartão cadastrado"
          subtitle="Cadastre um cartão em Gestão para começar a analisar faturas."
          ctaLabel="Cadastrar cartão"
          ctaHref="/gestao"
        />
      </div>
    )
  }

  if (grupoCartoes.length === 0) {
    return (
      <div className="af-card" style={{ padding: 0 }}>
        <EmptyState
          icon={CreditCard}
          title={`Nenhum cartão ${grupo}`}
          subtitle="Volte ao outro grupo ou cadastre um cartão."
        />
      </div>
    )
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Inputs de arquivo — sempre montados */}
      <input
        ref={fileRef} type="file" accept="application/pdf,image/*" multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          if (files.length > 0) { openUploadModal(files); e.target.value = '' }
        }}
      />
      <input
        ref={addFileRef} type="file" accept="application/pdf,image/*" multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          if (files.length > 0) { setPendingFiles((prev) => [...prev, ...files]); e.target.value = '' }
        }}
      />

      {/* Group selector */}
      {hasBothGroups && (
        <div className="flex items-center gap-2 mb-5">
          {(['pessoal', 'familiar'] as Grupo[]).map((g) => (
            <button
              key={g}
              onClick={() => {
                const target = g === 'pessoal' ? pessoalCartoes : familiarCartoes
                // Clear stale fatura data immediately — before URL update triggers re-render
                setFaturas([])
                setSelectedFaturaId(null)
                setTransacoes([])
                setFaturasCarregando(false)
                pushUrl(g, target.length === 1 ? target[0].id : null)
                setTab('acompanhamento')
              }}
              className="chip"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                cursor: 'pointer',
                borderColor: grupo === g ? 'var(--app-accent)' : 'var(--app-border)',
                color: grupo === g ? 'var(--app-accent)' : 'var(--app-text-muted)',
                background: grupo === g ? 'rgba(16,245,163,0.08)' : undefined,
                fontWeight: grupo === g ? 700 : 400,
              }}
            >
              {g === 'pessoal' ? <User size={13} /> : <Users size={13} />}
              {g === 'pessoal' ? 'Pessoal' : 'Familiar'}
            </button>
          ))}
        </div>
      )}

      {/* Card chips */}
      <div className="flex items-center gap-2 mb-5" style={{ flexWrap: 'wrap' }}>
        {/* Consolidado chip — only when >1 cartão in group */}
        {grupoCartoes.length > 1 && (
          <button
            onClick={() => {
              setFaturas([])
              setSelectedFaturaId(null)
              setTransacoes([])
              pushUrl(grupo, null)
            }}
            className="chip"
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              borderColor: isConsolidado ? 'var(--roxo)' : 'var(--app-border)',
              color: isConsolidado ? 'var(--roxo)' : 'var(--app-text-muted)',
              background: isConsolidado ? 'rgba(176,122,255,0.1)' : undefined,
              fontWeight: isConsolidado ? 700 : 400,
            }}
          >
            <span style={{ fontSize: 11 }}>Todos ({grupoCartoes.length})</span>
          </button>
        )}
        {grupoCartoes.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              if (c.id !== urlCartaoId && tab !== 'acompanhamento') {
                setFaturas([])
                setSelectedFaturaId(null)
                setTransacoes([])
              }
              pushUrl(grupo, c.id)
            }}
            className="chip"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', cursor: 'pointer',
              borderColor: selectedCartao?.id === c.id ? c.cor : 'var(--app-border)',
              color: selectedCartao?.id === c.id ? c.cor : 'var(--app-text-muted)',
              background: selectedCartao?.id === c.id ? `${c.cor}18` : undefined,
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.cor, flexShrink: 0 }} />
            {c.nome}{c.finalDigitos ? ` ···${c.finalDigitos}` : ''}
          </button>
        ))}
      </div>

      {/* Tab bar */}
      <div className="tab-bar mb-6" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['acompanhamento', 'historico', 'tendencias'] as Tab[]).map((t) => (
            <button
              key={t}
              className={`tab-item${tab === t ? ' tab-item--active' : ''}`}
              onClick={() => {
                if (t === 'acompanhamento') {
                  setSelectedFaturaId(null)
                  setTransacoes([])
                }
                setTab(t)
              }}
            >
              {t === 'acompanhamento' ? 'Acompanhamento do Mês' : t === 'historico' ? 'Histórico & Análise' : 'Tendências'}
            </button>
          ))}
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 8,
            border: '1px solid var(--app-accent)',
            background: 'rgba(16,245,163,0.08)',
            color: 'var(--app-accent)',
            fontSize: 13, fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap',
            alignSelf: 'center', marginBottom: 4,
          }}
        >
          <Upload size={14} />
          {tab === 'acompanhamento' ? 'Importar ciclo atual' : 'Importar fatura'}
        </button>
      </div>

      {/* ── Tab: Acompanhamento ────────────────────────────────────────────── */}
      {tab === 'acompanhamento' && (
        <>
          {isConsolidado ? (
            // Consolidado view
            <div style={{
              background: 'var(--section-hero-bg, #2E1A06)',
              border: '1px solid var(--section-hero-border, rgba(242,129,29,0.28))',
              borderRadius: 16, padding: '28px', marginBottom: 20,
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.10em', color: 'var(--section-accent, #F2811D)', marginBottom: 20 }}>
                Consolidado {grupo === 'pessoal' ? 'Pessoal' : 'Familiar'}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 24 }}>
                <span style={{ fontSize: 22, fontWeight: 500, color: '#fff' }}>R$</span>
                <span style={{ fontSize: 64, fontWeight: 700, color: '#fff', lineHeight: 0.95, letterSpacing: '-0.035em', fontVariantNumeric: 'tabular-nums' as const }}>
                  {consolInt}
                </span>
                <span style={{ fontSize: 24, fontWeight: 500, color: '#fff', fontVariantNumeric: 'tabular-nums' as const }}>
                  {consolDec}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                {grupoCartoes.map((c) => {
                  const latest = latestFaturaPerCartao[c.id]
                  const tot = latest?.total ?? 0
                  const pct = c.limite ? (tot / c.limite) * 100 : 0
                  return (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.cor, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: '#fff' }}>{c.nome}{c.finalDigitos ? ` ···${c.finalDigitos}` : ''}</span>
                          <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{formatMoney(tot)}</span>
                        </div>
                        {c.limite && (
                          <div className="progress-track" style={{ height: 4 }}>
                            <div className="progress-fill" style={{ width: `${Math.min(pct, 100)}%`, background: c.cor }} />
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => pushUrl(grupo, c.id)}
                        style={{ fontSize: 11, color: 'var(--section-accent, #F2811D)', background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' as const }}
                      >
                        Ver →
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : selectedCartao && ciclo ? (
            <>
              {/* Hero + 3 mini KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 20 }}>

                {/* Hero card — Gasto Atual */}
                <div style={{
                  background: 'var(--section-hero-bg, #2E1A06)',
                  border: '1px solid var(--section-hero-border, rgba(242,129,29,0.28))',
                  borderRadius: 16, padding: '28px', overflow: 'hidden',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.10em', color: 'var(--section-accent, #F2811D)' }}>
                      Ciclo em aberto
                    </span>
                    <span style={{ fontSize: 11, color: '#fff', fontWeight: 500 }}>
                      {formatDataBR(ciclo.inicio)} → {formatDataBR(ciclo.fim)}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#fff', marginBottom: 22 }}>
                    Dia {selectedCartao.diaFechamento} · {ciclo.diasDecorridos}/{ciclo.diasTotal} dias decorridos
                  </div>

                  {/* Big number */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 14 }}>
                    <span style={{ fontSize: 22, fontWeight: 500, color: '#fff' }}>R$</span>
                    <span style={{ fontSize: 64, fontWeight: 700, color: '#fff', lineHeight: 0.95, letterSpacing: '-0.035em', fontVariantNumeric: 'tabular-nums' as const }}>
                      {acompInt}
                    </span>
                    <span style={{ fontSize: 24, fontWeight: 500, color: '#fff', fontVariantNumeric: 'tabular-nums' as const }}>
                      {acompDec}
                    </span>
                  </div>

                  <div style={{ fontSize: 13, color: '#fff', marginBottom: 22 }}>
                    {acompMesRef ? labelMes(acompMesRef) : 'Sem fatura do ciclo atual'}
                  </div>

                  {/* Progress bar */}
                  {metaEfetiva > 0 && (
                    <div>
                      <div style={{ height: 6, background: 'rgba(255,255,255,0.12)', borderRadius: 999 }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min(pctMeta, 100)}%`,
                          background: pctMeta > 100 ? '#D93232' : 'var(--section-accent, #F2811D)',
                          borderRadius: 999,
                        }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                        <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>{pctMeta.toFixed(1)}% utilizado</span>
                        <span style={{ fontSize: 11, color: '#fff' }}>meta: {formatMoney(metaEfetiva)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mini KPI stack */}
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>
                  {/* Meta */}
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderLeft: `3px solid ${pctMeta > 100 ? '#D93232' : 'var(--section-accent, #F2811D)'}`, borderRadius: 16, padding: '20px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: pctMeta > 100 ? '#D93232' : 'var(--section-accent, #F2811D)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Target size={17} color="#fff" />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.10em', color: '#fff' }}>Meta</span>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: pctMeta > 100 ? '#D93232' : '#fff', letterSpacing: '-0.02em', marginBottom: 6, fontVariantNumeric: 'tabular-nums' as const }}>
                      {metaEfetiva > 0 ? formatMoney(metaEfetiva) : '—'}
                    </div>
                    <div style={{ fontSize: 12, color: '#fff' }}>
                      {metaEfetiva > 0 ? `${pctMeta.toFixed(1)}% utilizado` : 'Sem meta definida'}
                    </div>
                  </div>

                  {/* Dias restantes */}
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderLeft: '3px solid var(--section-accent, #F2811D)', borderRadius: 16, padding: '20px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--section-accent, #F2811D)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Clock size={17} color="#fff" />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.10em', color: '#fff' }}>Dias restantes</span>
                    </div>
                    <div style={{ fontSize: 40, fontWeight: 700, color: '#fff', lineHeight: 1, letterSpacing: '-0.035em', marginBottom: 6, fontVariantNumeric: 'tabular-nums' as const }}>
                      {ciclo.diasRestantes}
                    </div>
                    <div style={{ fontSize: 12, color: '#fff' }}>Fecha {formatDataBR(ciclo.fim)}</div>
                  </div>

                  {/* Posso gastar/dia */}
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderLeft: `3px solid ${gastoPorDia > 0 ? 'var(--section-accent, #F2811D)' : '#D93232'}`, borderRadius: 16, padding: '20px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: gastoPorDia > 0 ? 'var(--section-accent, #F2811D)' : '#D93232', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Wallet size={17} color="#fff" />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.10em', color: '#fff' }}>Posso gastar/dia</span>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: gastoPorDia > 0 ? 'var(--section-accent, #F2811D)' : '#D93232', letterSpacing: '-0.02em', marginBottom: 6, fontVariantNumeric: 'tabular-nums' as const }}>
                      {metaEfetiva > 0 ? formatMoney(Math.max(0, gastoPorDia)) : '—'}
                    </div>
                    <div style={{ fontSize: 12, color: '#fff' }}>
                      {metaEfetiva > 0 ? `${formatMoney(Math.max(0, restanteMeta))} ÷ ${ciclo.diasRestantes}d` : 'Sem meta definida'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Projeção e ritmo — full width */}
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, padding: '24px',
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginBottom: 20,
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.10em', color: '#fff', marginBottom: 10 }}>Ritmo atual/dia</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', marginBottom: 6 }}>{formatMoney(gastoMedioAtual)}</div>
                  <div style={{ fontSize: 12, color: '#fff' }}>{formatMoney(acompTotal)} em {ciclo.diasDecorridos} dia{ciclo.diasDecorridos !== 1 ? 's' : ''}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.10em', color: '#fff', marginBottom: 10 }}>Projeção fim do ciclo</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: projecaoEstoura ? '#D93232' : '#fff', letterSpacing: '-0.02em', marginBottom: 6 }}>
                    {formatMoney(projecaoCiclo)}
                  </div>
                  <div style={{ fontSize: 12, color: projecaoEstoura ? '#D93232' : '#fff', fontWeight: projecaoEstoura ? 600 : 400 }}>
                    {projecaoEstoura ? `⚠ Estoura meta em ${formatMoney(projecaoCiclo - metaEfetiva)}` : 'Mantendo ritmo atual'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.10em', color: '#fff', marginBottom: 10 }}>Proprietário</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{selectedCartao.proprietario ?? 'Principal'}</div>
                </div>
              </div>
            </>
          ) : null}

          {/* Upload area */}
          <div
            className="af-card"
            style={{
              borderStyle: 'dashed',
              borderColor: uploading ? 'var(--app-accent)' : 'var(--app-border)',
              cursor: 'pointer',
              textAlign: 'center',
              padding: '28px 24px',
              transition: 'border-color 0.15s',
            }}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const files = Array.from(e.dataTransfer.files)
              if (files.length > 0) openUploadModal(files)
            }}
          >
            {uploading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div className="spinner" />
                <p style={{ color: 'var(--app-text-muted)', fontSize: 14 }}>
                  Analisando {pendingFiles.length > 1 ? `arquivo ${uploadingIndex + 1} de ${pendingFiles.length}` : 'fatura'} com IA...{uploadElapsed > 0 ? ` ${uploadElapsed}s` : ''}
                </p>
                {uploadElapsed >= 30 && (
                  <p style={{ fontSize: 12, color: 'var(--app-text-faint)', maxWidth: 320, textAlign: 'center' }}>
                    Análise em andamento. PDFs longos podem levar até 2 min.
                  </p>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <Upload size={28} style={{ color: 'var(--app-accent)' }} />
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--app-text)', marginBottom: 4 }}>Upload da fatura PDF</p>
                  <p style={{ fontSize: 13, color: 'var(--app-text-muted)' }}>Clique ou arraste · IA extrai e categoriza automaticamente</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Tab: Histórico & Análise ───────────────────────────────────────── */}
      {tab === 'historico' && (
        <>
          {faturasCarregando ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--app-text-muted)' }}>Carregando faturas...</div>
          ) : faturas.length === 0 ? (
            <div className="af-card" style={{ padding: 0 }}>
              <EmptyState
                icon={FileSearch}
                title="Nenhuma fatura encontrada"
                subtitle="Faça upload de uma fatura PDF na aba Acompanhamento para começar."
              />
            </div>
          ) : (
            <>
              {/* Fatura selector + delete */}
              <div className="flex items-center gap-3 mb-5">
                <div style={{ flex: 1 }}>
                  <select
                    className="af-select"
                    value={selectedFaturaId ?? ''}
                    onChange={(e) => setSelectedFaturaId(parseInt(e.target.value))}
                  >
                    {faturas.map((f) => {
                      const cartaoNome = grupoCartoes.find((c) => c.id === f.cartaoId)?.nome ?? ''
                      return (
                        <option key={f.id} value={f.id}>
                          {f.banco ?? cartaoNome} — {formatMesRefBR(f.mesReferencia)}{isConsolidado ? ` (${cartaoNome})` : ''}
                        </option>
                      )
                    })}
                  </select>
                </div>
                {selectedFatura && (
                  <button
                    onClick={() => setDeleteConfirmOpen(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: '1px solid rgba(242,58,10,0.3)', borderRadius: 6, color: 'var(--app-danger)', fontSize: 12, padding: '7px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    <Trash2 size={12} /> Excluir
                  </button>
                )}
              </div>

              {selectedFatura && (
                <>
                  {/* KPI row */}
                  <div className="grid-3 mb-5">
                    <div className="gf-kpi">
                      <div className="t-label" style={{ marginBottom: 8 }}>Total fatura</div>
                      <div className="t-kpi mono text-danger">{formatMoney(selectedFatura.total ?? 0)}</div>
                      <div style={{ fontSize: 11, color: 'var(--app-text-faint)', marginTop: 5 }}>Venc. {formatDataBR(selectedFatura.vencimento)}</div>
                    </div>
                    <div className="gf-kpi">
                      <div className="t-label" style={{ marginBottom: 8 }}>Banco</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--app-text)' }}>{selectedFatura.banco ?? '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--app-text-faint)', marginTop: 5 }}>{formatMesRefBR(selectedFatura.mesReferencia)}</div>
                    </div>
                    <div className="gf-kpi">
                      <div className="t-label" style={{ marginBottom: 8 }}>Meta</div>
                      <div className="t-kpi mono" style={{ color: metaFaturaEfetiva > 0 && (selectedFatura.total ?? 0) > metaFaturaEfetiva ? 'var(--app-danger)' : 'var(--app-text)' }}>
                        {metaFaturaEfetiva > 0 ? formatMoney(metaFaturaEfetiva) : '—'}
                      </div>
                      {metaFaturaEfetiva > 0 && selectedFatura.total != null && (
                        <div style={{ fontSize: 11, color: 'var(--app-text-faint)', marginTop: 5 }}>
                          {((selectedFatura.total / metaFaturaEfetiva) * 100).toFixed(1)}% utilizado
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comentário executivo */}
                  {selectedFatura.comentarioExecutivo && (
                    <div
                      className="af-exec mb-5"
                      dangerouslySetInnerHTML={{
                        __html: selectedFatura.comentarioExecutivo.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
                      }}
                    />
                  )}

                  {/* Alertas */}
                  {alertas.length > 0 && (
                    <div className="af-card mb-5" style={{ borderColor: 'rgba(244,162,97,0.3)', background: 'rgba(244,162,97,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontWeight: 700, color: '#F4A261' }}>
                        <AlertCircle size={15} /> Alertas de parcelamento
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {alertas.map((a, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--app-text-muted)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: a.tipo === 'termina' ? 'rgba(52,211,153,0.15)' : 'rgba(244,162,97,0.15)', color: a.tipo === 'termina' ? '#34D399' : '#F4A261', fontWeight: 600 }}>
                                {a.tipo === 'termina' ? 'TERMINA' : 'INÍCIO'}
                              </span>
                              {a.msg}
                            </div>
                            <span className="mono" style={{ fontWeight: 700, color: 'var(--app-text)' }}>{formatMoney(a.valor)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category + Top estabelecimentos */}
                  <div className="grid-2 mb-5">
                    <Card title="Por categoria">
                      {transacoesCarregando ? (
                        <div style={{ textAlign: 'center', padding: 20, color: 'var(--app-text-muted)', fontSize: 13 }}>Carregando...</div>
                      ) : (
                        <>
                          <ResponsiveContainer width="100%" height={160}>
                            <PieChart>
                              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                                {pieData.map((entry, i) => (
                                  <Cell key={i} fill={CAT_COLORS[entry.name] ?? '#5A6273'} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(v) => typeof v === 'number' ? formatMoney(v) : String(v ?? '')}
                                contentStyle={{ background: '#10141C', border: '1px solid #1F2530', borderRadius: 8 }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          {catSummary.map((r) => (
                            <div key={r.categoria} className="af-prog-row">
                              <div style={{ flex: 1 }}>
                                <div className="flex items-center justify-between" style={{ marginBottom: 5 }}>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--app-text)' }}>{r.categoria}</span>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: CAT_COLORS[r.categoria] ?? '#5A6273' }}>{r.percentual.toFixed(1)}%</span>
                                </div>
                                <div className="progress-track" style={{ height: 4 }}>
                                  <div className="progress-fill" style={{ width: `${r.percentual}%`, background: CAT_COLORS[r.categoria] ?? '#5A6273' }} />
                                </div>
                              </div>
                              <div style={{ textAlign: 'right', marginLeft: 12 }}>
                                <div className="mono" style={{ fontSize: 12, fontWeight: 700 }}>{formatMoney(r.valor)}</div>
                                <div style={{ fontSize: 10, color: 'var(--app-text-faint)' }}>{r.qtd_transacoes} trans.</div>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </Card>
                    <Card title="Top estabelecimentos">
                      {transacoesCarregando ? (
                        <div style={{ textAlign: 'center', padding: 20, color: 'var(--app-text-muted)', fontSize: 13 }}>Carregando...</div>
                      ) : topEstabs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 20, color: 'var(--app-text-faint)', fontSize: 13 }}>Sem dados</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {topEstabs.map((e, i) => {
                            const maxVal = topEstabs[0]?.total ?? 1
                            return (
                              <div key={i}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                  <span style={{ fontSize: 12, color: 'var(--app-text)' }}>{e.nome}</span>
                                  <span className="mono" style={{ fontSize: 12, fontWeight: 700 }}>{formatMoney(e.total)}</span>
                                </div>
                                <div className="progress-track" style={{ height: 4 }}>
                                  <div className="progress-fill" style={{ width: `${(e.total / maxVal) * 100}%`, background: LINHA_COLORS[i % LINHA_COLORS.length] }} />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </Card>
                  </div>

                  {/* Transações */}
                  <div className="af-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--app-text-2)', letterSpacing: 0.2 }}>
                        Transações ({transacoesFiltradas.length})
                      </span>
                      {!modoEdicao ? (
                        <button
                          onClick={() => setModoEdicao(true)}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: '1px solid var(--app-border)', borderRadius: 6, cursor: 'pointer', color: 'var(--app-text-muted)', fontSize: 11, padding: '4px 10px' }}
                        >
                          <Pencil size={11} /> Editar lançamentos
                        </button>
                      ) : (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Button variant="secondary" onClick={handleCancelarEdicao} style={{ fontSize: 12, padding: '4px 12px' }}>Cancelar</Button>
                          <Button onClick={handleSalvarEdicoes} style={{ fontSize: 12, padding: '4px 12px' }}>
                            Salvar {Object.keys(edicoesPendentes).length > 0 ? `(${Object.keys(edicoesPendentes).length})` : ''}
                          </Button>
                        </div>
                      )}
                    </div>
                    {transacoesCarregando ? (
                      <div style={{ textAlign: 'center', padding: 20, color: 'var(--app-text-muted)' }}>Carregando...</div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table className="af-table">
                          <thead>
                            <tr>
                              <th>Data</th>
                              <th>Estabelecimento</th>
                              <th>Categoria</th>
                              <th>Parcela</th>
                              <th style={{ textAlign: 'right' }}>Valor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {transacoesFiltradas.map((t) => (
                              <tr key={t.id}>
                                <td className="mono" style={{ fontSize: 12 }}>{formatDataBR(t.data)}</td>
                                <td>
                                  <div style={{ fontSize: 13 }}>{t.estabelecimento ?? '—'}</div>
                                  {t.descricao && t.descricao !== t.estabelecimento && (
                                    <div style={{ fontSize: 11, color: 'var(--app-text-faint)' }}>{t.descricao}</div>
                                  )}
                                </td>
                                <td>
                                  {modoEdicao ? (
                                    <select
                                      className="af-select"
                                      style={{ fontSize: 12, padding: '2px 6px', height: 28 }}
                                      value={edicoesPendentes[t.id] ?? t.categoria ?? 'Outros'}
                                      onChange={(e) => setEdicoesPendentes((prev) => ({ ...prev, [t.id]: e.target.value }))}
                                    >
                                      {categorias.map((c) => <option key={c}>{c}</option>)}
                                    </select>
                                  ) : (
                                    <span className="chip" style={{ borderColor: CAT_COLORS[t.categoria ?? ''] ? `${CAT_COLORS[t.categoria ?? '']}40` : undefined }}>
                                      {t.categoria ?? '—'}
                                    </span>
                                  )}
                                </td>
                                <td style={{ fontSize: 12, color: 'var(--app-text-faint)' }}>{t.parcela ?? '—'}</td>
                                <td style={{ textAlign: 'right' }}>
                                  <span className="mono text-danger" style={{ fontWeight: 700 }}>{formatMoney(t.valor ?? 0)}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}

      {/* ── Tab: Tendências ────────────────────────────────────────────────── */}
      {tab === 'tendencias' && (
        <>
          {/* Toggle consolidado/por-cartão (only for multi-cartão group) */}
          {isConsolidado && (
            <div className="flex items-center gap-2 mb-5">
              {(['consolidado', 'por-cartao'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setTendToggle(v)}
                  className="chip"
                  style={{
                    padding: '6px 14px', cursor: 'pointer',
                    borderColor: tendToggle === v ? 'var(--roxo)' : 'var(--app-border)',
                    color: tendToggle === v ? 'var(--roxo)' : 'var(--app-text-muted)',
                    background: tendToggle === v ? 'rgba(176,122,255,0.1)' : undefined,
                    fontWeight: tendToggle === v ? 700 : 400,
                    fontSize: 12,
                  }}
                >
                  {v === 'consolidado' ? 'Consolidado' : 'Por cartão'}
                </button>
              ))}
            </div>
          )}

          {faturasCarregando ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--app-text-muted)' }}>Carregando...</div>
          ) : faturas.length === 0 ? (
            <div className="af-card" style={{ padding: 0 }}>
              <EmptyState
                icon={TrendingUp}
                title="Sem histórico disponível"
                subtitle="Faça upload de faturas para visualizar tendências de gasto."
              />
            </div>
          ) : (
            <>
              {/* Área: evolução mensal */}
              <Card title="Evolução mensal">
                <ResponsiveContainer width="100%" height={240}>
                  {tendToggle === 'por-cartao' && isConsolidado ? (
                    <LineChart data={tendenciaData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--app-text-faint)' }} />
                      <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'var(--app-text-faint)' }} />
                      <Tooltip
                        formatter={(v) => typeof v === 'number' ? formatMoney(v) : String(v ?? '')}
                        contentStyle={{ background: '#10141C', border: '1px solid #1F2530', borderRadius: 8 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      {tendenciaCartaoKeys.map((key, i) => (
                        <Line key={key} type="monotone" dataKey={key} stroke={grupoCartoes.find((c) => c.nome === key)?.cor ?? LINHA_COLORS[i % LINHA_COLORS.length]} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                      ))}
                    </LineChart>
                  ) : (
                    <AreaChart data={tendenciaData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10F5A3" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10F5A3" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--app-text-faint)' }} />
                      <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'var(--app-text-faint)' }} />
                      <Tooltip
                        formatter={(v) => typeof v === 'number' ? formatMoney(v) : String(v ?? '')}
                        contentStyle={{ background: '#10141C', border: '1px solid #1F2530', borderRadius: 8 }}
                      />
                      <Area type="monotone" dataKey="total" stroke="#10F5A3" fill="url(#gradTotal)" strokeWidth={2} dot={{ r: 3 }} name="Total" isAnimationActive={false} />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </Card>

              {/* Stacked bar: por categoria */}
              {catTrendData.data.length > 0 && (
                <Card title="Por categoria (últimos 6 meses)" style={{ marginTop: 16 }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={catTrendData.data} margin={{ top: 5, right: 20, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--app-text-faint)' }} />
                      <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'var(--app-text-faint)' }} />
                      <Tooltip
                        formatter={(v) => typeof v === 'number' ? formatMoney(v) : String(v ?? '')}
                        contentStyle={{ background: '#10141C', border: '1px solid #1F2530', borderRadius: 8 }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        wrapperStyle={{ fontSize: 11, paddingTop: 16, color: 'var(--app-text-muted)' }}
                      />
                      {catTrendData.cats.map((cat) => (
                        <Bar key={cat} dataKey={cat} stackId="a" fill={CAT_COLORS[cat] ?? '#5A6273'} isAnimationActive={false} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}
            </>
          )}
        </>
      )}

      {/* ── Upload modal ───────────────────────────────────────────────────── */}
      <Modal
        open={uploadOpen}
        onClose={() => { if (!uploading) { setUploadOpen(false); setPendingFiles([]) } }}
        title="Importar fatura"
        maxWidth={460}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Lista de arquivos enfileirados */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {pendingFiles.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, fontSize: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', color: uploading && i === uploadingIndex ? 'var(--app-accent)' : 'var(--app-text)', wordBreak: 'break-all', fontWeight: uploading && i === uploadingIndex ? 700 : 400 }}>{f.name}</div>
                  <div style={{ color: 'var(--app-text-faint)', marginTop: 2 }}>{(f.size / 1024).toFixed(1)} KB{uploading && i === uploadingIndex ? ` · analisando... ${uploadElapsed}s` : ''}</div>
                </div>
                {!uploading && (
                  <button
                    onClick={() => setPendingFiles((prev) => prev.filter((_, j) => j !== i))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--app-danger)', padding: 2, flexShrink: 0 }}
                  >✕</button>
                )}
              </div>
            ))}
            {!uploading && (
              <button
                onClick={() => addFileRef.current?.click()}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'none', border: '1px dashed var(--app-border)', borderRadius: 8, cursor: 'pointer', color: 'var(--app-text-muted)', fontSize: 12 }}
              >
                + Adicionar arquivo
              </button>
            )}
          </div>
          <FormField label="Cartão" required>
            <select className="af-select" value={modalCartaoId ?? ''} onChange={(e) => setModalCartaoId(parseInt(e.target.value))}>
              {cartoes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}{c.finalDigitos ? ` ···${c.finalDigitos}` : ''}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Mês de referência" required>
            <input type="month" className="af-input" value={modalMesRef} onChange={(e) => setModalMesRef(e.target.value)} />
          </FormField>
          {pendingFiles.some((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')) && (
            <FormField label="Senha do PDF (se protegido)">
              <div style={{ position: 'relative' }}>
                <input
                  type={pdfSenhaVisivel ? 'text' : 'password'}
                  className="af-input"
                  placeholder="Senha do PDF"
                  value={pdfSenha}
                  onChange={(e) => setPdfSenha(e.target.value)}
                  autoComplete="off"
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setPdfSenhaVisivel((v) => !v)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--app-text-faint)', padding: 2,
                  }}
                  tabIndex={-1}
                >
                  {pdfSenhaVisivel ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </FormField>
          )}
          {uploadError && (
            <div style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(242,58,10,0.3)', background: 'rgba(242,58,10,0.06)', color: 'var(--app-danger)', fontSize: 12, lineHeight: 1.5 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Erro ao analisar</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{uploadError}</div>
              {uploadError.toLowerCase().includes('image input') && (
                <div style={{ marginTop: 6, color: 'var(--app-text-muted)' }}>
                  Modelo atual não aceita PDF. Em Gestão → IA, troque para anthropic/claude-sonnet-4-6.
                </div>
              )}
            </div>
          )}
          <div className="flex gap-3" style={{ justifyContent: 'flex-end', marginTop: 4 }}>
            <Button variant="secondary" onClick={() => { setUploadOpen(false); setPendingFiles([]) }} disabled={uploading}>Cancelar</Button>
            <Button onClick={handleConfirmUpload} disabled={uploading || pendingFiles.length === 0 || !modalCartaoId || !modalMesRef}>
              {uploading
                ? `Analisando ${uploadingIndex + 1} de ${pendingFiles.length}...`
                : `Analisar ${pendingFiles.length > 1 ? `${pendingFiles.length} arquivos` : 'fatura'}`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Delete modal ───────────────────────────────────────────────────── */}
      <Modal open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="Excluir fatura" maxWidth={400}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--app-text-muted)', lineHeight: 1.6 }}>
            Fatura <strong style={{ color: 'var(--app-text)' }}>{selectedFatura?.banco} {formatMesRefBR(selectedFatura?.mesReferencia)}</strong> e todas as transações serão removidas. A despesa de cartão gerada automaticamente não é excluída — remova em Despesas se necessário.
          </p>
          <div className="flex gap-3" style={{ justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setDeleteConfirmOpen(false)} disabled={deleting}>Cancelar</Button>
            <Button onClick={handleDeleteFatura} disabled={deleting} style={{ background: 'var(--app-danger)', borderColor: 'var(--app-danger)' }}>
              {deleting ? 'Excluindo...' : 'Excluir fatura'}
            </Button>
          </div>
        </div>
      </Modal>

    </>
  )
}

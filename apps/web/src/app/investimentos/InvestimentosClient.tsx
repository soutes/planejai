'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Plus, TrendingUp, Wallet, BarChart2, PieChart, Edit2, Trash2, Check, X,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatMoney } from '@/components/ui/MoneyValue'
import { MiniMesSelector } from '@/components/ui/MiniMesSelector'
import { apiFetch } from '@/shared/lib/api'
import { formatMesRefNum, formatMesRefBR } from '@/shared/lib/format'
import { useMesRef } from '@/shared/context/MesRefContext'
import type {
  PosicaoInvestimento,
  MovimentacaoInvestimento,
  EvolucaoPatrimonio,
} from '@/types/investimentos'
import { PosicaoForm } from './components/PosicaoForm'
import { MovimentacaoForm } from './components/MovimentacaoForm'
import { EvolucaoChart } from './components/EvolucaoChart'
import { DistribuicaoChart } from './components/DistribuicaoChart'

interface Pessoa {
  id: number
  nome: string
  cor: string
  ativo: boolean
  padrao?: boolean
  familiar?: boolean
}

function sortByPadrao<T extends { padrao?: boolean; nome: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (a.padrao && !b.padrao) return -1
    if (!a.padrao && b.padrao) return 1
    return a.nome.localeCompare(b.nome, 'pt-BR')
  })
}

type TabId = number | null | undefined

// Chips de tipo de movimentação
const TIPO_CHIP: Record<string, { bg: string; color: string; label: string }> = {
  APORTE:     { bg: '#10F5A3', color: '#0A1A12', label: 'Aporte' },
  RENDIMENTO: { bg: '#7B6EF5', color: '#fff',    label: 'Rendimento' },
  RESGATE:    { bg: '#F23A0A', color: '#fff',     label: 'Resgate' },
}

export function InvestimentosClient() {
  const { mesRef } = useMesRef()

  // ── Estado principal ──────────────────────────────────────────────────────
  const [posicoes, setPosicoes] = useState<PosicaoInvestimento[]>([])
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoInvestimento[]>([])
  const [evolucao, setEvolucao] = useState<EvolucaoPatrimonio[]>([])
  const [pessoas, setPessoas] = useState<Pessoa[]>([])
  const [grupoAbas, setGrupoAbas] = useState<{ id: number; nome: string; cor: string }[]>([])
  const [selectedTab, setSelectedTab] = useState<TabId>(undefined)

  // ── Modais ────────────────────────────────────────────────────────────────
  const [posicaoModalOpen, setPosicaoModalOpen] = useState(false)
  const [movModalOpen, setMovModalOpen] = useState(false)
  const [editPosicao, setEditPosicao] = useState<PosicaoInvestimento | null>(null)

  // ── Edição inline tabela movimentações ───────────────────────────────────
  type EditMovForm = { mesRef: string; tipo: 'APORTE' | 'RENDIMENTO' | 'RESGATE'; valor: string; notas: string }
  const [editMovMainId, setEditMovMainId] = useState<number | null>(null)
  const [editMovMainForm, setEditMovMainForm] = useState<EditMovForm | null>(null)
  const [movMainSaving, setMovMainSaving] = useState(false)

  // ── Carregamento inicial ──────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      apiFetch<Pessoa[]>('/api/pessoas'),
      apiFetch<{ id: number; nome: string; cor: string; pessoaId: number | null }[]>('/api/abas'),
    ])
      .then(([p, abas]) => {
        const ativos = sortByPadrao(p.filter((x) => x.ativo))
        setPessoas(ativos)
        setGrupoAbas(abas.filter((a) => a.pessoaId == null))
        if (ativos.length > 1 && selectedTab === undefined) {
          setSelectedTab(ativos[0].id)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const pessoaParam =
      selectedTab !== undefined && selectedTab !== null
        ? `&pessoaId=${selectedTab}`
        : ''

    apiFetch<PosicaoInvestimento[]>(`/api/investimentos/posicoes?ativo=true${pessoaParam}`)
      .then(setPosicoes)
      .catch(() => setPosicoes([]))

    // Sem filtro de mês — mostra todo o histórico. KPI cards filtram por mesRef no cliente.
    const movPessoaQ = selectedTab !== undefined && selectedTab !== null ? `?pessoaId=${selectedTab}` : ''
    apiFetch<MovimentacaoInvestimento[]>(`/api/investimentos/movimentacoes${movPessoaQ}`)
      .then(setMovimentacoes)
      .catch(() => setMovimentacoes([]))

    const evolucaoPessoaParam =
      selectedTab !== undefined && selectedTab !== null ? `&pessoaId=${selectedTab}` : ''
    apiFetch<EvolucaoPatrimonio[]>(`/api/investimentos/evolucao?meses=12${evolucaoPessoaParam}`)
      .then(setEvolucao)
      .catch(() => setEvolucao([]))
  }, [mesRef, selectedTab])

  // ── Derivações ────────────────────────────────────────────────────────────
  const showTabs = pessoas.length > 1

  const patrimonioTotal = posicoes.reduce((s, p) => s + p.saldo_atual, 0)
  const totalInvestido = posicoes.reduce((s, p) => s + p.total_investido, 0)
  const totalRendimentos = posicoes.reduce((s, p) => s + p.total_rendimentos, 0)
  const rentabilidadeGeral =
    totalInvestido > 0 ? (totalRendimentos / totalInvestido) * 100 : 0

  const aporteMes = movimentacoes
    .filter((m) => m.tipo === 'APORTE' && m.mesRef === mesRef)
    .reduce((s, m) => s + m.valor, 0)
  const rendimentoMes = movimentacoes
    .filter((m) => m.tipo === 'RENDIMENTO' && m.mesRef === mesRef)
    .reduce((s, m) => s + m.valor, 0)

  // Formatação hero (patrimônio total)
  const patrimonioNegativo = patrimonioTotal < 0
  const patrimonioAbs = Math.abs(patrimonioTotal)
  const patFormatted = patrimonioAbs.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const commaIdx = patFormatted.lastIndexOf(',')
  const patInt = (patrimonioNegativo ? '-' : '') + patFormatted.slice(0, commaIdx)
  const patDec = patFormatted.slice(commaIdx)

  // ── Ações de posição ──────────────────────────────────────────────────────
  async function handleCreatePosicao(data: {
    categoria: string
    instituicao: string
    pessoaId: number | null
    notas: string
    valorInicial: string
    mesRefAporte: string
  }) {
    const body: Record<string, unknown> = {
      categoria: data.categoria,
      instituicao: data.instituicao,
      notas: data.notas || null,
    }
    if (showTabs && data.pessoaId !== null) body.pessoaId = data.pessoaId
    const created = await apiFetch<PosicaoInvestimento>(
      '/api/investimentos/posicoes',
      { method: 'POST', body: JSON.stringify(body) },
    )

    // Se informou valor inicial → registra APORTE automático no mês escolhido
    const valorNum = parseFloat(data.valorInicial)
    const mesAporte = data.mesRefAporte || mesRef
    if (!isNaN(valorNum) && valorNum > 0) {
      await apiFetch<MovimentacaoInvestimento>('/api/investimentos/movimentacoes', {
        method: 'POST',
        body: JSON.stringify({
          investimentoId: created.id,
          mesRef: mesAporte,
          tipo: 'APORTE',
          valor: valorNum,
        }),
      })
      // Recarrega posições para refletir saldo_atual atualizado
      const pessoaParam =
        selectedTab !== undefined && selectedTab !== null ? `&pessoaId=${selectedTab}` : ''
      const posAtual = await apiFetch<PosicaoInvestimento[]>(
        `/api/investimentos/posicoes?ativo=true${pessoaParam}`,
      )
      setPosicoes(posAtual)
      // Recarrega movimentações do mês
      const movAtual = await apiFetch<MovimentacaoInvestimento[]>(
        `/api/investimentos/movimentacoes?mesRef=${mesRef}${pessoaParam}`,
      )
      setMovimentacoes(movAtual)
    } else {
      setPosicoes((prev) => [...prev, created])
    }
  }

  async function handleUpdatePosicao(data: {
    categoria: string
    instituicao: string
    pessoaId: number | null
    notas: string
  }) {
    if (!editPosicao) return
    const updated = await apiFetch<PosicaoInvestimento>(
      `/api/investimentos/posicoes/${editPosicao.id}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          categoria: data.categoria,
          instituicao: data.instituicao,
          notas: data.notas || null,
        }),
      },
    )
    setPosicoes((prev) => prev.map((p) => (p.id === editPosicao.id ? updated : p)))
  }

  async function handleDeactivatePosicao(id: number) {
    await apiFetch(`/api/investimentos/posicoes/${id}`, { method: 'DELETE' })
    setPosicoes((prev) => prev.filter((p) => p.id !== id))
    setMovimentacoes((prev) => prev.filter((m) => m.investimentoId !== id))
    recarregarMetricas()
  }

  // ── Ações de movimentação ─────────────────────────────────────────────────
  async function handleCreateMovimentacao(data: {
    investimentoId: number
    mesRef: string
    tipo: 'APORTE' | 'RENDIMENTO' | 'RESGATE'
    valor: number
    notas?: string | null
  }) {
    const created = await apiFetch<MovimentacaoInvestimento>(
      '/api/investimentos/movimentacoes',
      { method: 'POST', body: JSON.stringify(data) },
    )
    // Só adiciona na lista se for do mês selecionado
    if (created.mesRef === mesRef) {
      setMovimentacoes((prev) => [created, ...prev])
    }
    recarregarMetricas()
  }

  function startEditMovMain(m: MovimentacaoInvestimento) {
    setEditMovMainId(m.id)
    setEditMovMainForm({ mesRef: m.mesRef, tipo: m.tipo, valor: String(m.valor), notas: m.notas ?? '' })
  }

  async function saveEditMovMain() {
    if (!editMovMainForm || editMovMainId === null) return
    const v = parseFloat(editMovMainForm.valor)
    if (isNaN(v) || v <= 0) return
    setMovMainSaving(true)
    try {
      await handleUpdateMovimentacaoInline(editMovMainId, {
        mesRef: editMovMainForm.mesRef,
        tipo: editMovMainForm.tipo,
        valor: v,
        notas: editMovMainForm.notas.trim() || null,
      })
      setEditMovMainId(null)
      setEditMovMainForm(null)
    } finally { setMovMainSaving(false) }
  }

  async function handleDeleteMovimentacao(id: number) {
    await apiFetch(`/api/investimentos/movimentacoes/${id}`, { method: 'DELETE' })
    setMovimentacoes((prev) => prev.filter((m) => m.id !== id))
    recarregarMetricas()
  }

  async function handleUpdateMovimentacaoInline(
    id: number,
    data: { mesRef: string; tipo: 'APORTE' | 'RENDIMENTO' | 'RESGATE'; valor: number; notas: string | null },
  ) {
    const updated = await apiFetch<MovimentacaoInvestimento>(
      `/api/investimentos/movimentacoes/${id}`,
      { method: 'PUT', body: JSON.stringify(data) },
    )
    setMovimentacoes((prev) => prev.map((m) => (m.id === id ? { ...m, ...updated } : m)))
    recarregarMetricas()
  }

  async function handleDeleteMovimentacaoInline(id: number) {
    await apiFetch(`/api/investimentos/movimentacoes/${id}`, { method: 'DELETE' })
    setMovimentacoes((prev) => prev.filter((m) => m.id !== id))
    recarregarMetricas()
  }

  async function handleAddMovimentacaoInline(data: {
    mesRef: string; tipo: 'APORTE' | 'RENDIMENTO' | 'RESGATE'; valor: number; notas: string | null
  }) {
    if (!editPosicao) return
    const created = await apiFetch<MovimentacaoInvestimento>('/api/investimentos/movimentacoes', {
      method: 'POST',
      body: JSON.stringify({ investimentoId: editPosicao.id, ...data }),
    })
    if (created.mesRef === mesRef) {
      setMovimentacoes((prev) => [created, ...prev])
    }
    recarregarMetricas()
  }

  function recarregarMetricas() {
    const pessoaParam =
      selectedTab !== undefined && selectedTab !== null ? `&pessoaId=${selectedTab}` : ''
    apiFetch<PosicaoInvestimento[]>(`/api/investimentos/posicoes?ativo=true${pessoaParam}`)
      .then(setPosicoes).catch(() => {})
    apiFetch<EvolucaoPatrimonio[]>(`/api/investimentos/evolucao?meses=12${pessoaParam}`)
      .then(setEvolucao).catch(() => {})
  }

  function openNewPosicao() {
    setEditPosicao(null)
    setPosicaoModalOpen(true)
  }

  function openEditPosicao(p: PosicaoInvestimento) {
    setEditPosicao(p)
    setPosicaoModalOpen(true)
  }

  return (
    <>
      {/* Controls: tabs à esquerda + ações à direita (padrão Despesas) */}
      <div className="flex items-center justify-between mb-4" style={{ gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {showTabs && (<>
          {pessoas.map((p) => {
            const isSelected = selectedTab === p.id
            return (
              <button
                key={p.id}
                onClick={() => setSelectedTab(p.id)}
                style={{
                  padding: '6px 18px',
                  borderRadius: 20,
                  border: `1px solid ${isSelected ? p.cor : 'rgba(255,255,255,0.12)'}`,
                  background: isSelected ? `${p.cor}22` : 'transparent',
                  color: isSelected ? p.cor : 'var(--ink-400)',
                  fontSize: 13,
                  fontWeight: isSelected ? 700 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {p.nome}
              </button>
            )
          })}
          {grupoAbas.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedTab(null)}
              style={{
                padding: '6px 18px',
                borderRadius: 20,
                border: `1px solid ${selectedTab === null ? 'var(--verde)' : 'rgba(255,255,255,0.12)'}`,
                background: selectedTab === null ? 'rgba(16,245,163,0.13)' : 'transparent',
                color: selectedTab === null ? 'var(--verde)' : 'var(--ink-400)',
                fontSize: 13,
                fontWeight: selectedTab === null ? 700 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {g.nome}
            </button>
          ))}
          </>)}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Button Icon={Plus} onClick={openNewPosicao}>
            Nova posição
          </Button>
          <Button Icon={TrendingUp} variant="secondary" onClick={() => setMovModalOpen(true)}>
            Registrar movimentação
          </Button>
        </div>
      </div>

      {/* Hero + KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Hero: Patrimônio total */}
        <div
          style={{
            background: 'var(--section-hero-bg, #120E2A)',
            border: '1px solid var(--section-hero-border, rgba(123,110,245,0.28))',
            borderRadius: 16,
            padding: '28px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.10em',
              color: 'var(--section-accent, #7B6EF5)',
              marginBottom: 22,
            }}
          >
            Patrimônio total · {formatMesRefNum(mesRef)}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 14 }}>
            <span style={{ fontSize: 22, fontWeight: 500, color: patrimonioNegativo ? '#F23A0A' : '#fff' }}>R$</span>
            <span
              style={{
                fontSize: 64,
                fontWeight: 700,
                color: patrimonioNegativo ? '#F23A0A' : '#fff',
                lineHeight: 0.95,
                letterSpacing: '-0.035em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {patInt}
            </span>
            <span
              style={{
                fontSize: 24,
                fontWeight: 500,
                color: patrimonioNegativo ? '#F23A0A' : '#fff',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {patDec}
            </span>
          </div>
          <div style={{ fontSize: 13, color: '#fff' }}>
            {posicoes.length} posição{posicoes.length !== 1 ? 'es' : ''} ativa
            {posicoes.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Mini KPIs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Aporte do mês */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderLeft: '3px solid #10F5A3',
              borderRadius: 16,
              padding: '16px 20px',
              flex: 1,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Wallet size={15} color="#10F5A3" />
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.10em', color: '#10F5A3' }}>
                Aporte em {formatMesRefBR(mesRef)}
              </span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#10F5A3', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
              {formatMoney(aporteMes)}
            </div>
          </div>

          {/* Rendimentos do mês */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderLeft: '3px solid #7B6EF5',
              borderRadius: 16,
              padding: '16px 20px',
              flex: 1,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <BarChart2 size={15} color="#7B6EF5" />
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.10em', color: '#7B6EF5' }}>
                Rendimento em {formatMesRefBR(mesRef)}
              </span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#7B6EF5', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
              {formatMoney(rendimentoMes)}
            </div>
          </div>

          {/* Rentabilidade geral */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderLeft: '3px solid #6FA9D6',
              borderRadius: 16,
              padding: '16px 20px',
              flex: 1,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <PieChart size={15} color="#6FA9D6" />
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.10em', color: '#6FA9D6' }}>
                Rentabilidade acumulada
              </span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#6FA9D6', letterSpacing: '-0.02em' }}>
              {rentabilidadeGeral.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2 mb-6">
        <Card title="Evolução patrimonial (12 meses)">
          <EvolucaoChart data={evolucao} />
        </Card>
        <Card title="Distribuição por categoria">
          <DistribuicaoChart posicoes={posicoes} total={patrimonioTotal} />
        </Card>
      </div>

      {/* Tabela de posições */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--app-text)', margin: 0 }}>
            Posições
          </h3>
        </div>

        {posicoes.length === 0 ? (
          <div className="af-card" style={{ padding: 0 }}>
            <EmptyState
              icon={TrendingUp}
              title="Nenhuma posição cadastrada"
              subtitle="Cadastre suas posições de investimento para começar a acompanhar seu patrimônio."
              ctaLabel="Nova posição"
              ctaOnClick={openNewPosicao}
            />
          </div>
        ) : (
          <div className="af-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="af-table">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Instituição</th>
                  <th style={{ textAlign: 'right' }}>Investido</th>
                  <th style={{ textAlign: 'right' }}>Rendimentos</th>
                  <th style={{ textAlign: 'right' }}>Rentabilidade</th>
                  <th style={{ textAlign: 'right' }}>Saldo atual</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {posicoes.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span style={{ fontWeight: 500 }}>{p.categoria}</span>
                    </td>
                    <td style={{ color: 'var(--app-text-muted)' }}>{p.instituicao}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="mono" style={{ fontSize: 12 }}>
                        {formatMoney(p.total_investido)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span
                        className="mono"
                        style={{
                          fontSize: 12,
                          color: p.total_rendimentos > 0 ? '#10F5A3' : 'var(--app-text-muted)',
                        }}
                      >
                        {formatMoney(p.total_rendimentos)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: p.rentabilidade_pct > 0 ? '#10F5A3' : p.rentabilidade_pct < 0 ? '#F23A0A' : 'var(--app-text-muted)',
                        }}
                      >
                        {p.rentabilidade_pct.toFixed(2)}%
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="mono text-purple" style={{ fontWeight: 700 }}>
                        {formatMoney(p.saldo_atual)}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => openEditPosicao(p)}
                          title="Editar posição"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--app-text-faint)',
                            padding: 4,
                          }}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeactivatePosicao(p.id)}
                          title="Excluir posição"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#F23A0A',
                            padding: 4,
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Movimentações do mês */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--app-text)', margin: 0 }}>
            Histórico de movimentações
          </h3>
        </div>

        {movimentacoes.length === 0 ? (
          <div className="af-card" style={{ padding: 0 }}>
            <EmptyState
              icon={BarChart2}
              title="Nenhuma movimentação neste mês"
              subtitle="Registre aportes, rendimentos ou resgates para acompanhar sua carteira."
              ctaLabel="Registrar movimentação"
              ctaOnClick={() => setMovModalOpen(true)}
            />
          </div>
        ) : (
          <div className="af-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="af-table">
              <thead>
                <tr>
                  <th>Posição</th>
                  <th>Tipo</th>
                  <th>Mês</th>
                  <th style={{ textAlign: 'right' }}>Valor</th>
                  <th>Notas</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {movimentacoes.map((m) => {
                  const chip = TIPO_CHIP[m.tipo] ?? { bg: '#666', color: '#fff', label: m.tipo }
                  const isEditing = editMovMainId === m.id
                  return (
                    <tr key={m.id}>
                      {isEditing && editMovMainForm ? (
                        <>
                          <td>
                            <div style={{ fontWeight: 500, fontSize: 13 }}>{m.posicao.categoria}</div>
                            <div style={{ fontSize: 11, color: 'var(--app-text-faint)' }}>{m.posicao.instituicao}</div>
                          </td>
                          <td>
                            <select
                              className="af-select"
                              style={{ fontSize: 12 }}
                              value={editMovMainForm.tipo}
                              onChange={(e) => setEditMovMainForm({ ...editMovMainForm, tipo: e.target.value as 'APORTE' | 'RENDIMENTO' | 'RESGATE' })}
                            >
                              <option value="APORTE">Aporte</option>
                              <option value="RENDIMENTO">Rendimento</option>
                              <option value="RESGATE">Resgate</option>
                            </select>
                          </td>
                          <td>
                            <MiniMesSelector
                              value={editMovMainForm.mesRef}
                              onChange={(v) => setEditMovMainForm({ ...editMovMainForm, mesRef: v })}
                            />
                          </td>
                          <td>
                            <input
                              className="af-input mono"
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={editMovMainForm.valor}
                              onChange={(e) => setEditMovMainForm({ ...editMovMainForm, valor: e.target.value })}
                              style={{ fontSize: 12 }}
                            />
                          </td>
                          <td>
                            <input
                              className="af-input"
                              placeholder="Notas"
                              value={editMovMainForm.notas}
                              onChange={(e) => setEditMovMainForm({ ...editMovMainForm, notas: e.target.value })}
                              style={{ fontSize: 12 }}
                            />
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button
                                onClick={saveEditMovMain}
                                disabled={movMainSaving || !editMovMainForm.valor}
                                style={{ background: 'var(--verde)', border: 'none', borderRadius: 6, padding: '5px 7px', cursor: 'pointer' }}
                              >
                                <Check size={13} color="#000" />
                              </button>
                              <button
                                onClick={() => { setEditMovMainId(null); setEditMovMainForm(null) }}
                                style={{ background: 'none', border: '1px solid var(--app-border)', borderRadius: 6, padding: '5px 7px', cursor: 'pointer', color: 'var(--app-text-muted)' }}
                              >
                                <X size={13} />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>
                            <div>
                              <div style={{ fontWeight: 500, fontSize: 13 }}>{m.posicao.categoria}</div>
                              <div style={{ fontSize: 11, color: 'var(--app-text-faint)' }}>
                                {m.posicao.instituicao}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, background: chip.bg, color: chip.color, fontSize: 11, fontWeight: 700 }}>
                              {chip.label}
                            </span>
                          </td>
                          <td style={{ color: 'var(--app-text-muted)', fontSize: 12 }}>
                            {formatMesRefBR(m.mesRef)}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span className="mono" style={{ fontWeight: 700, fontSize: 13 }}>
                              {formatMoney(m.valor)}
                            </span>
                          </td>
                          <td style={{ color: 'var(--app-text-muted)', fontSize: 12 }}>
                            {m.notas ?? '—'}
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => startEditMovMain(m)}
                                title="Editar movimentação"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--app-text-faint)', padding: 4 }}
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteMovimentacao(m.id)}
                                title="Excluir movimentação"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--app-text-faint)', padding: 4 }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Nova/editar posição */}
      <PosicaoForm
        open={posicaoModalOpen}
        onClose={() => {
          setPosicaoModalOpen(false)
          setEditPosicao(null)
        }}
        onSave={editPosicao ? handleUpdatePosicao : handleCreatePosicao}
        editTarget={editPosicao}
        pessoas={pessoas}
        showPessoa={showTabs}
        defaultMesRef={mesRef}
        movimentacoes={
          editPosicao
            ? movimentacoes
                .filter((m) => m.investimentoId === editPosicao.id)
                .map((m) => ({ ...m, posicao: { categoria: editPosicao.categoria, instituicao: editPosicao.instituicao } }))
            : []
        }
        onUpdateMovimentacao={handleUpdateMovimentacaoInline}
        onDeleteMovimentacao={handleDeleteMovimentacaoInline}
        onAddMovimentacao={handleAddMovimentacaoInline}
      />

      {/* Modal: Registrar movimentação */}
      <MovimentacaoForm
        open={movModalOpen}
        onClose={() => setMovModalOpen(false)}
        onSave={handleCreateMovimentacao}
        posicoes={posicoes}
        defaultMesRef={mesRef}
      />
    </>
  )
}

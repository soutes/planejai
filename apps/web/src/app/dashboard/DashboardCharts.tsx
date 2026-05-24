'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { Card } from '@/components/ui/Card'
import { formatMoney } from '@/components/ui/MoneyValue'

interface Props {
  evolucao12meses: { mes: string; rendimentos: number; despesas: number }[]
}

function formatMesLabel(mes: string): string {
  const [, m] = mes.split('-')
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return months[Number(m) - 1]
}

export function DashboardCharts({ evolucao12meses }: Props) {
  const areaData = evolucao12meses.map((d) => ({
    mes: formatMesLabel(d.mes),
    Rendimentos: d.rendimentos,
    Despesas: d.despesas,
  }))

  return (
    <Card title="Receita vs Despesa — 12 meses">
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={areaData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradRend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#5B996A" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#5B996A" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gradDesp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#D93232" stopOpacity={0.30} />
              <stop offset="95%" stopColor="#D93232" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.30)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.30)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            formatter={(value) => typeof value === 'number' ? formatMoney(value) : String(value ?? '')}
            contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8 }}
            labelStyle={{ color: 'rgba(255,255,255,0.70)' }}
          />
          <Area type="monotone" dataKey="Rendimentos" stroke="#5B996A" fill="url(#gradRend)" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Area type="monotone" dataKey="Despesas" stroke="#D93232" fill="url(#gradDesp)" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.40)' }} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}

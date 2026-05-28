'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { EvolucaoPatrimonio } from '@/mocks/investimentos'
import { formatMesRefBR } from '@/shared/lib/format'
import { formatMoney } from '@/components/ui/MoneyValue'

interface Props {
  data: EvolucaoPatrimonio[]
}

export function EvolucaoChart({ data }: Props) {
  const chartData = data.map((d) => ({
    mes: formatMesRefBR(d.mesRef),
    Patrimônio: d.saldo,
    Aportes: d.aportes,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradPatrimonio" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#7B6EF5" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#7B6EF5" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="gradAportes" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10F5A3" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#10F5A3" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="mes"
          tick={{ fontSize: 11, fill: '#4E5768' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#4E5768' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={(value, name) =>
            typeof value === 'number'
              ? [formatMoney(value), String(name)]
              : [String(value ?? ''), String(name)]
          }
          contentStyle={{ background: '#10141C', border: '1px solid #1F2530', borderRadius: 8 }}
        />
        <Area
          type="monotone"
          dataKey="Patrimônio"
          stroke="#7B6EF5"
          fill="url(#gradPatrimonio)"
          strokeWidth={2}
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="Aportes"
          stroke="#10F5A3"
          fill="url(#gradAportes)"
          strokeWidth={1.5}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

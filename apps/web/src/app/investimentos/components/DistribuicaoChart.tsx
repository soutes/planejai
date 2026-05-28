'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { PosicaoInvestimento } from '@/mocks/investimentos'
import { formatMoney } from '@/components/ui/MoneyValue'

const CAT_COLORS: Record<string, string> = {
  'Reserva de Emergência': '#10F5A3',
  'Renda Fixa': '#6FA9D6',
  'Tesouro Direto': '#5EEAD4',
  'Ações': '#B07AFF',
  'FIIs': '#F4A261',
  'Previdência Privada': '#60A5FA',
  'Fundos': '#FFB347',
  'Cripto': '#FB7185',
  'Internacional': '#A78BFA',
}

interface Props {
  posicoes: PosicaoInvestimento[]
  total: number
}

export function DistribuicaoChart({ posicoes, total }: Props) {
  // Agrupar por categoria para o gráfico
  const porCategoria = posicoes.reduce<Record<string, number>>((acc, p) => {
    acc[p.categoria] = (acc[p.categoria] ?? 0) + p.saldo_atual
    return acc
  }, {})

  const pieData = Object.entries(porCategoria).map(([name, value]) => ({
    name,
    value,
    pct: total > 0 ? ((value / total) * 100).toFixed(1) : '0',
  }))

  return (
    <>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={3}
            dataKey="value"
          >
            {pieData.map((entry, i) => (
              <Cell key={i} fill={CAT_COLORS[entry.name] ?? '#5A6273'} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [
              typeof value === 'number' ? formatMoney(value) : String(value ?? ''),
              String(name),
            ]}
            contentStyle={{ background: '#10141C', border: '1px solid #1F2530', borderRadius: 8 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
        {pieData.map((d) => (
          <div
            key={d.name}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: CAT_COLORS[d.name] ?? '#5A6273',
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 12, color: 'var(--app-text-muted)' }}>{d.name}</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--app-text-faint)' }}>{d.pct}%</span>
          </div>
        ))}
      </div>
    </>
  )
}

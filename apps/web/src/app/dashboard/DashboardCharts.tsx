'use client'

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'
import { Card } from '@/components/ui/Card'
import { formatMoney } from '@/components/ui/MoneyValue'

const CAT_COLORS: Record<string, string> = {
  'Alimentação': '#FF4B6E',
  'Assinaturas': '#B07AFF',
  'Compras': '#FF8A5C',
  'Educação': '#5EEAD4',
  'Lazer': '#F4A261',
  'Outros': '#5A6273',
  'Transporte': '#6FA9D6',
  'Saúde': '#34D399',
  'Casa': '#60A5FA',
  'Vestuário': '#F472B6',
  'Pets': '#FBBF24',
  'Viagem': '#A78BFA',
  'Presente': '#FB7185',
  'Cartão': '#94A3B8',
}

const DEFAULT_COLOR = '#5A6273'

interface Props {
  porCategoria: { categoria: string; valor: number }[]
  evolucao12meses: { mes: string; rendimentos: number; despesas: number }[]
  evolucaoPatrimonio: { mes: string; total: number }[]
  porAba: { aba: string; valor: number }[]
  totalCiclo: number
}

function formatMesLabel(mes: string): string {
  const [, m] = mes.split('-')
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return months[Number(m) - 1]
}

export function DashboardCharts({ porCategoria, evolucao12meses, evolucaoPatrimonio }: Props) {
  const pieData = porCategoria.map((d) => ({ name: d.categoria, value: d.valor }))

  const areaData = evolucao12meses.map((d) => ({
    mes: formatMesLabel(d.mes),
    Rendimentos: d.rendimentos,
    Despesas: d.despesas,
  }))

  const patrimonioData = evolucaoPatrimonio.map((d) => ({
    mes: formatMesLabel(d.mes),
    Patrimônio: d.total,
  }))

  return (
    <div className="grid-2 gap-4">
      {/* Despesas por categoria — pie */}
      <Card title="Despesas por Categoria">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={3}
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={index} fill={CAT_COLORS[entry.name] ?? DEFAULT_COLOR} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => typeof value === 'number' ? formatMoney(value) : String(value ?? '')}
              contentStyle={{ background: '#10141C', border: '1px solid #1F2530', borderRadius: 8 }}
              labelStyle={{ color: '#E8ECF2' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 12 }}>
          {pieData.slice(0, 6).map((d) => (
            <div key={d.name} className="flex items-center gap-2">
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: CAT_COLORS[d.name] ?? DEFAULT_COLOR }} />
              <span style={{ fontSize: 11, color: 'var(--app-text-muted)' }}>{d.name}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Evolução mensal — area */}
      <Card title="Receita vs Despesa (12 meses)">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={areaData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradRend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10F5A3" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10F5A3" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradDesp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF6B7A" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#FF6B7A" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#4E5768' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#4E5768' }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(value) => typeof value === 'number' ? formatMoney(value) : String(value ?? '')}
              contentStyle={{ background: '#10141C', border: '1px solid #1F2530', borderRadius: 8 }}
            />
            <Area type="monotone" dataKey="Rendimentos" stroke="#10F5A3" fill="url(#gradRend)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="Despesas" stroke="#FF6B7A" fill="url(#gradDesp)" strokeWidth={2} dot={false} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#8B92A0' }} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Evolução do patrimônio */}
      <Card title="Evolução do Patrimônio" style={{ gridColumn: '1 / -1' }}>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={patrimonioData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradPat" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#B07AFF" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#B07AFF" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#4E5768' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#4E5768' }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(value) => typeof value === 'number' ? formatMoney(value) : String(value ?? '')}
              contentStyle={{ background: '#10141C', border: '1px solid #1F2530', borderRadius: 8 }}
            />
            <Area type="monotone" dataKey="Patrimônio" stroke="#B07AFF" fill="url(#gradPat)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}

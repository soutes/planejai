// Helpers de formatação PT-BR.
// Storage continua ISO (YYYY-MM-DD); estas funções são só para display.

export function formatDataBR(iso: string | null | undefined): string {
  if (!iso) return '—'
  const ymd = iso.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!ymd) return iso
  const [, y, m, d] = ymd
  return `${d}/${m}/${y}`
}

const MESES_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const MESES_PT_FULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export function formatMesRefFull(mesRef: string | null | undefined): string {
  if (!mesRef) return '—'
  const m = mesRef.match(/^(\d{4})-(\d{2})$/)
  if (!m) return mesRef
  const [, y, mm] = m
  return `${MESES_PT_FULL[parseInt(mm) - 1]} ${y}`
}

export function formatMesRefBR(mesRef: string | null | undefined): string {
  if (!mesRef) return '—'
  const m = mesRef.match(/^(\d{4})-(\d{2})$/)
  if (!m) return mesRef
  const [, y, mm] = m
  return `${MESES_PT[parseInt(mm) - 1]}/${y.slice(2)}`
}

export function formatMesRefNum(mesRef: string | null | undefined): string {
  if (!mesRef) return '—'
  const m = mesRef.match(/^(\d{4})-(\d{2})$/)
  if (!m) return mesRef
  const [, y, mm] = m
  return `${mm}/${y}`
}

export type MesRef = string

const MES_REF_REGEX = /^\d{4}-\d{2}$/

export function isMesRef(value: string): boolean {
  return MES_REF_REGEX.test(value)
}

export function assertMesRef(value: string): MesRef {
  if (!isMesRef(value)) {
    throw new Error(`Invalid mesRef format: "${value}". Expected YYYY-MM`)
  }
  return value
}

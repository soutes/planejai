'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/shared/lib/api'

const FALLBACK = [
  'Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer',
  'Casa', 'Vestuário', 'Assinaturas', 'Pets', 'Viagem', 'Presente', 'Cartão', 'Outros',
]

interface CategoriaApi { id: number; nome: string; ativa: boolean }

export function useCategorias(): string[] {
  const [categorias, setCategorias] = useState<string[]>(FALLBACK)

  useEffect(() => {
    apiFetch<CategoriaApi[]>('/api/categorias')
      .then((rows) => {
        const ativas = rows.filter((c) => c.ativa).map((c) => c.nome)
        if (ativas.length > 0) setCategorias(ativas)
      })
      .catch(() => {})
  }, [])

  return categorias
}

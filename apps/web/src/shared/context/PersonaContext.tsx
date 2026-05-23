'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

interface PersonaContextValue {
  pessoaId: number | null  // null = familiar, undefined = not yet loaded
  setPessoaId: (id: number | null) => void
}

const PersonaContext = createContext<PersonaContextValue>({
  pessoaId: undefined as unknown as null,
  setPessoaId: () => {},
})

export function PersonaProvider({ children }: { children: ReactNode }) {
  const [pessoaId, setPessoaId] = useState<number | null>(null)
  return (
    <PersonaContext.Provider value={{ pessoaId, setPessoaId }}>
      {children}
    </PersonaContext.Provider>
  )
}

export function usePersona() {
  return useContext(PersonaContext)
}

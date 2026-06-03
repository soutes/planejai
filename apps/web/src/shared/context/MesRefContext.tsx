'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { defaultMesRef } from '@/shared/lib/api'

interface MesRefContextValue {
  mesRef: string
  setMesRef: (mes: string) => void
}

const MesRefContext = createContext<MesRefContextValue>({
  mesRef: defaultMesRef(),
  setMesRef: () => {},
})

export function MesRefProvider({ children }: { children: ReactNode }) {
  const [mesRef, setMesRef] = useState(defaultMesRef())
  return (
    <MesRefContext.Provider value={{ mesRef, setMesRef }}>
      {children}
    </MesRefContext.Provider>
  )
}

export function useMesRef() {
  return useContext(MesRefContext)
}

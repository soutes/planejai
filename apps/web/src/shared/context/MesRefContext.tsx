'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { currentMesRef } from '@/shared/lib/api'

interface MesRefContextValue {
  mesRef: string
  setMesRef: (mes: string) => void
}

const MesRefContext = createContext<MesRefContextValue>({
  mesRef: currentMesRef(),
  setMesRef: () => {},
})

export function MesRefProvider({ children }: { children: ReactNode }) {
  const [mesRef, setMesRef] = useState(currentMesRef())
  return (
    <MesRefContext.Provider value={{ mesRef, setMesRef }}>
      {children}
    </MesRefContext.Provider>
  )
}

export function useMesRef() {
  return useContext(MesRefContext)
}

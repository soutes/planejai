import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/layout/Sidebar'
import { QueryProvider } from '@/shared/providers/QueryProvider'
import { MesRefProvider } from '@/shared/context/MesRefContext'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'planejAÍ',
  description: 'Planejamento financeiro pessoal',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <QueryProvider>
          <MesRefProvider>
            <div className="app-shell">
              <Sidebar />
              <main className="app-main">{children}</main>
            </div>
          </MesRefProvider>
        </QueryProvider>
      </body>
    </html>
  )
}

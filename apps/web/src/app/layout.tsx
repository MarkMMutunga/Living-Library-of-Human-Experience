import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Living Library of Human Experiences',
  description: 'A privacy-first platform for capturing and connecting human experiences',
  keywords: ['experiences', 'memories', 'privacy', 'fragments', 'connections'],
  authors: [{ name: 'LLHE Team' }],
  openGraph: {
    title: 'Living Library of Human Experiences',
    description: 'A privacy-first platform for capturing and connecting human experiences',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { NextAuthProvider } from './_components/providers'
import { Header } from './_components/layout/Header'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '恋愛診断デモ',
  description: '恋愛診断デモ',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <Script
          src="https://www.youtube.com/iframe_api"
          strategy="beforeInteractive"
        />
      </head>
      <body className={inter.className}>
        <NextAuthProvider>
          <Header />
          <main className="container mx-auto px-4 pt-20 pb-8">
            {children}
          </main>
        </NextAuthProvider>
      </body>
    </html>
  )
}

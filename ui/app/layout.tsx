import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Medical Paper Classification',
  description: 'Beautiful UI for classifying medical papers using PubMedBERT',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
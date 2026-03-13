import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Seysey Studios',
  description: 'Your all-in-one designer resource platform',
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

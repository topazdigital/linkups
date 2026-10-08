import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { SiteStructuredData } from '@/components/reviews-media'

export const metadata: Metadata = {
  title: 'LinkUps Adventures | Kenya, made personal',
  description: 'Book small-group safaris, beach escapes, camping, road trips and custom Kenya adventures with LinkUps Adventures.',
  keywords: ['Kenya safari', 'Maasai Mara tours', 'Kenya beach holidays', 'group travel Kenya', 'LinkUps Adventures'],
  openGraph: { title: 'LinkUps Adventures | Kenya, made personal', description: 'Thoughtful safaris, beach escapes and custom Kenya adventures made for real people.', type: 'website', locale: 'en_KE' },
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SiteStructuredData />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: '東大式管理塾',
  description: '効率的な学習管理システム',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#1e293b',
  manifest: '/manifest.json',
  appleWebApp: {
    statusBarStyle: 'black-translucent',
    title: '東大式管理塾'
  },
  other: {
    'mobile-web-app-capable': 'yes'
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
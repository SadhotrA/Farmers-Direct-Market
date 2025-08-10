import { Inter } from 'next/font/google'
import './globals.css'
import I18nProvider from '../components/I18nProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Farmers Direct Market - Connect Farmers with Buyers',
  description: 'A marketplace that connects small and medium farmers directly with restaurants, retailers and individual buyers.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <I18nProvider>
          <div className="min-h-screen bg-gray-50">
            {children}
          </div>
        </I18nProvider>
      </body>
    </html>
  )
}

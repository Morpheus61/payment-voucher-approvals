import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/components/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Payment Voucher Approvals',
  description: 'Streamline your payment voucher approval process',
  icons: {
    icon: '/icons/Relish Logo with Plate (4).png',
    shortcut: '/icons/Relish Logo with Plate (4).png',
    apple: '/icons/Relish Logo with Plate (4).png',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}

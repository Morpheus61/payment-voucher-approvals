import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/components/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Payment Voucher Approvals',
  description: 'Streamline your payment voucher approval process',
  icons: {
    icon: [
      {
        url: '/icons/Relish Logo with Plate (1).png',
        sizes: '16x16',
        type: 'image/png'
      },
      {
        url: '/icons/Relish Logo with Plate (2).png',
        sizes: '32x32',
        type: 'image/png'
      },
      {
        url: '/icons/Relish Logo with Plate (3).png',
        sizes: '48x48',
        type: 'image/png'
      },
      {
        url: '/icons/Relish Logo with Plate (4).png',
        sizes: '64x64',
        type: 'image/png'
      }
    ],
    shortcut: '/icons/Relish Logo with Plate (4).png', // Shortcut icon (highest quality)
    apple: '/icons/Relish Logo with Plate (4).png',    // Apple touch icon
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

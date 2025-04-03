import type { Metadata } from "next"
import { Inter, Grandstander } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })
const grandstander = Grandstander({ 
  subsets: ["latin"],
  variable: '--font-grandstander',
})

export const metadata: Metadata = {
  title: "AtoZ English",
  description: "Learn English the fun way",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${grandstander.variable}`}>{children}</body>
    </html>
  )
}
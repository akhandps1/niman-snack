import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NODE_ENV === "production" 
      ? "https://niman-snack.vercel.app" 
      : "http://localhost:3000"
  ),
  title: "Niman Snacks Bar - Crispy Delights Made with Love",
  description: "Authentic, homemade snacks made with fresh ingredients. Try our famous samosas!",
  icons: {
    icon: "/favicon.ico",
  },
  generator: 'v0.dev'
}

import { ScrollProgress } from "@/components/scroll-progress"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ScrollProgress />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
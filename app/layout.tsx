import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const viewport: Viewport = {
  themeColor: "#e87a1e",
}

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NODE_ENV === "production" 
      ? "https://niman-snack.vercel.app" 
      : "http://localhost:3000"
  ),
  title: "Niman Snacks Bar - Crispy Delights Made with Love",
  description: "Authentic, homemade snacks made with fresh ingredients. Try our famous samosas!",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
  generator: 'v0.dev'
}

import { ScrollProgress } from "@/components/scroll-progress"
import { InstallPrompt } from "@/components/install-prompt"
import { ServiceWorkerRegistry } from "@/components/sw-registry"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ServiceWorkerRegistry />
        <ScrollProgress />
        <InstallPrompt />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
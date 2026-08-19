"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const navItems = [
  { name: "Home", href: "/" },
  { name: "Menu", href: "#menu" },
  { name: "Delivery", href: "#delivery-policy" },
  { name: "FAQ", href: "#faq" },
  { name: "Location", href: "#location" },
  { name: "Our Story", href: "#our-story" },
]

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b shadow-sm">
      <div className="container flex h-16 items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-800/10">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/03b4a790-cba5-4c1f-b3ee-15b711bbae1b%20-%20Copy.jpg-YiztabVgfIKTPtMbLKFUSqT9llD4U6.jpeg"
                alt="Niman Snacks Bar Logo"
                fill
                className="object-cover hover:scale-110 transition-transform duration-300"
                priority
              />
            </div>
            <span className="font-bold text-xl text-orange-700 group-hover:text-orange-600 transition-colors duration-300">
              Niman Snacks Bar
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="relative text-gray-700 hover:text-orange-600 font-medium transition-all duration-300 group py-1"
            >
              {item.name}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
          ))}
          <Button
            className="bg-green-600 hover:bg-green-700 text-white transition-transform hover:scale-105 duration-300"
            asChild
          >
            <Link
              href="https://wa.me/1234567890?text=Hi!%20I'd%20like%20to%20order%20samosas%20from%20Niman%20Snacks%20Bar.%20Please%20share%20the%20details."
              target="_blank"
            >
              Order Now
            </Link>
          </Button>
        </nav>

        {/* Mobile Navigation */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Menu">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <nav className="flex flex-col gap-4 mt-8">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-lg font-medium px-2 py-2 hover:bg-orange-50 hover:text-orange-600 rounded-md transition-all duration-300"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <Button
                className="mt-4 bg-green-600 hover:bg-green-700 text-white transition-transform hover:scale-105 duration-300"
                asChild
              >
                <Link
                  href="https://wa.me/1234567890?text=Hi!%20I'd%20like%20to%20order%20samosas%20from%20Niman%20Snacks%20Bar.%20Please%20share%20the%20details."
                  target="_blank"
                  onClick={() => setIsOpen(false)}
                >
                  Order Now
                </Link>
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}


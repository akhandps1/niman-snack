import Link from "next/link"
import { PhoneIcon as WhatsappIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

interface WhatsAppButtonProps {
  number: string
  message: string
  size?: "default" | "sm" | "lg"
  variant?: "default" | "outline" | "secondary" | "ghost" | "link"
  className?: string
}

export default function WhatsAppButton({
  number,
  message,
  size = "default",
  variant = "default",
  className,
}: WhatsAppButtonProps) {
  const whatsappUrl = `https://wa.me/${number}?text=${encodeURIComponent(message)}`

  return (
    <Button asChild size={size} variant={variant} className={className || "bg-green-500 hover:bg-green-600 text-white"}>
      <Link href={whatsappUrl} target="_blank" rel="noopener noreferrer">
        <WhatsappIcon className="mr-2 h-4 w-4" />
        <span className="sr-only md:not-sr-only">Order via WhatsApp</span>
      </Link>
    </Button>
  )
}


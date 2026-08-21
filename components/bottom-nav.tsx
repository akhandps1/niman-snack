"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, ClipboardList, User } from "lucide-react";
import { useCart } from "@/lib/cart-context";

export function BottomNav() {
  const pathname = usePathname();
  const { totalItems, setIsOpen } = useCart();

  // Hide on Admin and Delivery routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/delivery")) {
    return null;
  }

  const navItems = [
    { label: "Home", href: "/", icon: Home, isAction: false },
    { label: "Menu", href: "/#menu", icon: ShoppingBag, isAction: false },
    { label: "Cart", href: "#", icon: ShoppingBag, isAction: true },
    { label: "Orders", href: "/orders", icon: ClipboardList, isAction: false },
    { label: "Profile", href: "/login", icon: User, isAction: false },
  ];

  return (
    <>
      {/* Spacer to prevent content from hiding behind the fixed nav */}
      <div className="h-16 md:hidden" />
      
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-2 pb-safe z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.04)] flex justify-between items-center">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === "/#menu" && pathname === "/");
          const Icon = item.icon;

          if (item.label === "Cart") {
            return (
              <button
                key="cart-bottom-nav"
                onClick={() => setIsOpen(true)}
                className="flex flex-col items-center justify-center space-y-1 w-14 relative"
              >
                <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-orange-50 text-orange-600' : 'text-gray-400 hover:text-orange-500'}`}>
                  <Icon className="w-5 h-5" />
                  {totalItems > 0 && (
                    <span className="absolute top-1 right-2 w-4 h-4 bg-orange-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                      {totalItems}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'text-orange-600' : 'text-gray-500'}`}>Cart</span>
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center justify-center space-y-1 w-14"
            >
              <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-orange-50 text-orange-600' : 'text-gray-400 hover:text-orange-500'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'text-orange-600' : 'text-gray-500'}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}

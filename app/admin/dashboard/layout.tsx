"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Home, Utensils, Menu as MenuIcon, ExternalLink } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { toast } from "sonner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
      router.push("/admin/login");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const navItems = [
    { label: "Hero Section", href: "/admin/dashboard", icon: Home },
    { label: "Food Menu", href: "/admin/dashboard/food", icon: Utensils },
  ];

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-gray-100 bg-white">
        <h2 className="text-2xl font-extrabold text-[#e87a1e] tracking-tight">Admin Panel</h2>
        <p className="text-sm font-medium text-gray-500 mt-1">Niman Snacks Bar</p>
      </div>
      <nav className="flex-1 p-4 space-y-2 bg-white">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                isActive 
                  ? "bg-[#e87a1e] text-white shadow-md font-bold" 
                  : "text-gray-600 hover:bg-[#fdf3eb] hover:text-[#e87a1e] font-medium"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-white" : ""}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-100 space-y-3 bg-white">
        <Link href="/" target="_blank" onClick={() => setIsMobileMenuOpen(false)}>
          <Button
            variant="outline"
            className="w-full justify-start text-[#1ba54f] border-[#1ba54f] bg-[#f0f9f4] hover:bg-[#1ba54f] hover:text-white rounded-xl h-11 transition-all duration-300 shadow-sm mb-2"
          >
            <ExternalLink className="w-5 h-5 mr-3" />
            View Website
          </Button>
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start text-[#da291c] hover:text-white hover:bg-[#da291c] rounded-xl h-11 transition-all duration-300"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#faf9f5] flex flex-col md:flex-row font-sans">
      
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-gray-100 p-4 sticky top-0 z-20 shadow-sm">
        <h2 className="text-xl font-extrabold text-[#e87a1e]">Admin Panel</h2>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-gray-600 hover:text-[#e87a1e]">
              <MenuIcon className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0 flex flex-col bg-white">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 bg-white border-r border-gray-100 shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex-col h-screen sticky top-0 z-10">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

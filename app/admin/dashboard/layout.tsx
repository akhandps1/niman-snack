"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Home, Utensils, ExternalLink, Users, Tag, ClipboardList } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import AuthGuard from "@/components/auth-guard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

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
    { label: "Orders", href: "/admin/dashboard", icon: ClipboardList },
    { label: "Hero Section", href: "/admin/dashboard/hero", icon: Home },
    { label: "Food Menu", href: "/admin/dashboard/food", icon: Utensils },
    { label: "Coupons", href: "/admin/dashboard/coupons", icon: Tag },
    { label: "Staff", href: "/admin/dashboard/staff", icon: Users },
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
        <Link href="/" target="_blank">
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
    <AuthGuard>
      <div className="min-h-screen bg-[#faf9f5] flex flex-col md:flex-row font-sans">
      
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-gray-100 p-4 sticky top-0 z-20 shadow-sm">
        <h2 className="text-xl font-extrabold text-[#e87a1e]">Admin Panel</h2>
        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}>
          <LogOut className="w-5 h-5" />
        </Button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 bg-white border-r border-gray-100 shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex-col h-screen sticky top-0 z-10">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 pb-24 md:pb-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 pb-safe z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.04)] flex justify-between items-center overflow-x-auto gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center space-y-1 min-w-[56px] flex-1"
            >
              <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-[#fdf3eb] text-[#e87a1e]' : 'text-gray-400 hover:text-[#e87a1e]'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-medium whitespace-nowrap ${isActive ? 'text-[#e87a1e]' : 'text-gray-500'}`}>{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </div>
    </div>
    </AuthGuard>
  );
}

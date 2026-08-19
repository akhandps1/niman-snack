"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Logged in successfully");
      router.push("/admin/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-slate-50">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-24 relative z-10">
        
        {/* Back to Home Link */}
        <div className="absolute top-8 left-8 sm:top-12 sm:left-12">
          <Link href="/" className="flex items-center text-sm font-medium text-slate-500 hover:text-orange-600 transition-colors">
            <ArrowRight className="w-4 h-4 mr-2 rotate-180" /> Back to Home
          </Link>
        </div>

        <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
          <div className="text-center space-y-2">
            <div className="mx-auto bg-orange-100/50 p-4 rounded-2xl w-fit mb-6 border border-orange-100 shadow-sm">
              <Lock className="w-8 h-8 text-orange-600" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Admin Portal</h1>
            <p className="text-slate-500">Secure access to manage Niman Snacks Bar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 mt-8">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@nimansnacks.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-slate-50 border-slate-200 focus:ring-orange-500 focus:border-orange-500 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 bg-slate-50 border-slate-200 focus:ring-orange-500 focus:border-orange-500 rounded-xl"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-base font-semibold shadow-lg shadow-orange-600/20 transition-all hover:scale-[1.02]" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Authenticating...
                </>
              ) : (
                "Sign In to Dashboard"
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Right side - Image Cover */}
      <div className="hidden lg:flex flex-1 relative bg-slate-900 overflow-hidden">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/03b4a790-cba5-4c1f-b3ee-15b711bbae1b%20%281%29.jpg-idkiDzKGfGh5KPHVNbe3S6F2GNpAjW.jpeg"
          alt="Niman Snacks Cover"
          fill
          className="object-cover opacity-60 mix-blend-overlay"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-orange-900/80 via-orange-900/20 to-transparent"></div>
        <div className="relative z-10 flex flex-col justify-end p-24 text-white w-full h-full">
          <h2 className="text-5xl font-bold mb-4 drop-shadow-md">Manage with Ease.</h2>
          <p className="text-xl text-orange-100 font-medium drop-shadow max-w-lg leading-relaxed">
            Update your menu, change hero banners, and oversee your signature dishes in real-time.
          </p>
        </div>
      </div>
    </div>
  );
}

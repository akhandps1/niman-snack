"use client";

import { useState } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Bike, ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function DeliveryLoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      
      try {
        const userDocRef = doc(db, "users", result.user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists() && userDoc.data().role === "delivery") {
          toast.success("Welcome back, Delivery Partner!");
          router.push("/delivery/dashboard");
        } else {
          // Check if they are pre-approved by the Admin
          const emailSafeId = result.user.email?.toLowerCase().replace(/[^a-z0-9]/g, '_') || "";
          const partnerDoc = await getDoc(doc(db, "delivery_partners", emailSafeId));
          
          if (partnerDoc.exists()) {
            // Upgrade them to delivery partner
            await setDoc(userDocRef, {
              email: result.user.email,
              displayName: result.user.displayName || partnerDoc.data().name,
              photoURL: result.user.photoURL,
              role: "delivery",
              createdAt: userDoc.exists() ? userDoc.data().createdAt : new Date().toISOString()
            }, { merge: true });
            
            toast.success("Account activated as Delivery Partner!");
            router.push("/delivery/dashboard");
          } else {
            await auth.signOut();
            toast.error("Unauthorized. Ask Admin to add you to the Staff list first.");
          }
        }
      } catch (firestoreError) {
        console.warn("Firestore access failed.", firestoreError);
        toast.error("Database connection error. Please try again.");
      }
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error("Google login was cancelled");
      } else {
        toast.error(error.message || "Failed to log in with Google");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-slate-50">
      <div className="flex-1 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-24 relative z-10">
        
        <div className="absolute top-8 left-8 sm:top-12 sm:left-12">
          <Link href="/" className="flex items-center text-sm font-medium text-slate-500 hover:text-green-600 transition-colors">
            <ArrowRight className="w-4 h-4 mr-2 rotate-180" /> Back to Home
          </Link>
        </div>

        <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
          <div className="text-center space-y-2">
            <div className="mx-auto bg-green-100/50 p-4 rounded-2xl w-fit mb-6 border border-green-100 shadow-sm">
              <Bike className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Delivery Portal</h1>
            <p className="text-slate-500">Sign in to manage your deliveries</p>
          </div>

          <Button 
            type="button"
            variant="outline"
            className="w-full h-12 rounded-xl bg-white border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all font-medium mt-8 shadow-sm"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google
          </Button>

        </div>
      </div>

      <div className="hidden lg:flex flex-1 relative bg-slate-900 overflow-hidden">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/03b4a790-cba5-4c1f-b3ee-15b711bbae1b%20%281%29.jpg-idkiDzKGfGh5KPHVNbe3S6F2GNpAjW.jpeg"
          alt="Niman Snacks Cover"
          fill
          className="object-cover opacity-60 mix-blend-overlay"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-green-900/80 via-green-900/20 to-transparent"></div>
        <div className="relative z-10 flex flex-col justify-end p-24 text-white w-full h-full">
          <h2 className="text-5xl font-bold mb-4 drop-shadow-md">On the Move.</h2>
          <p className="text-xl text-green-100 font-medium drop-shadow max-w-lg leading-relaxed">
            Deliver happiness and crispy snacks on time. Track and manage your assigned orders.
          </p>
        </div>
      </div>
    </div>
  );
}

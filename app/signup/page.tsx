"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserPlus, ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;

      await updateProfile(user, { displayName: name });

      try {
        // Create user profile in Firestore
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, {
          email: user.email,
          displayName: name,
          photoURL: user.photoURL,
          role: "user",
          createdAt: new Date().toISOString()
        });
      } catch (firestoreError) {
        console.warn("Firestore profile creation failed, but user is registered. Please deploy firestore rules.", firestoreError);
      }

      toast.success("Account created successfully!");
      router.push("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      try {
        // Check if user exists in Firestore
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          // Create user profile
          await setDoc(userRef, {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: "user",
            createdAt: new Date().toISOString()
          });
        }
      } catch (firestoreError) {
        console.warn("Firestore profile update failed, but user is logged in. Please deploy firestore rules.", firestoreError);
      }

      toast.success("Logged in with Google successfully");
      router.push("/");
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
          <Link href="/" className="flex items-center text-sm font-medium text-slate-500 hover:text-orange-600 transition-colors">
            <ArrowRight className="w-4 h-4 mr-2 rotate-180" /> Back to Home
          </Link>
        </div>

        <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
          <div className="text-center space-y-2">
            <div className="mx-auto bg-orange-100/50 p-4 rounded-2xl w-fit mb-6 border border-orange-100 shadow-sm">
              <UserPlus className="w-8 h-8 text-orange-600" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Create Account</h1>
            <p className="text-slate-500">Join us to start ordering delicious snacks</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-6 mt-8">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-12 bg-slate-50 border-slate-200 focus:ring-orange-500 focus:border-orange-500 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
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
                minLength={6}
                className="h-12 bg-slate-50 border-slate-200 focus:ring-orange-500 focus:border-orange-500 rounded-xl"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-base font-semibold shadow-lg shadow-orange-600/20 transition-all hover:scale-[1.02]" 
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creating Account...</>
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">Or continue with</span>
            </div>
          </div>

          <Button 
            type="button" 
            variant="outline"
            className="w-full h-12 rounded-xl text-base font-semibold transition-all hover:bg-slate-50" 
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

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account? <Link href="/login" className="text-orange-600 hover:underline font-medium">Log in</Link>
          </p>
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
        <div className="absolute inset-0 bg-gradient-to-t from-orange-900/80 via-orange-900/20 to-transparent"></div>
        <div className="relative z-10 flex flex-col justify-end p-24 text-white w-full h-full">
          <h2 className="text-5xl font-bold mb-4 drop-shadow-md">Join Niman Snacks Bar</h2>
          <p className="text-xl text-orange-100 font-medium drop-shadow max-w-lg leading-relaxed">
            Create an account to track your orders and enjoy seamless checkout experiences.
          </p>
        </div>
      </div>
    </div>
  );
}

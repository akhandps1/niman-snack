import { Loader2 } from "lucide-react";
import Image from "next/image";

interface GlobalLoaderProps {
  fullScreen?: boolean;
}

export default function GlobalLoader({ fullScreen = true }: GlobalLoaderProps) {
  const bgImage = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/03b4a790-cba5-4c1f-b3ee-15b711bbae1b%20%281%29.jpg-idkiDzKGfGh5KPHVNbe3S6F2GNpAjW.jpeg";
  
  if (!fullScreen) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-2xl">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600 mb-4" />
        <p className="text-sm font-medium text-slate-500">Loading Niman Snacks Bar...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900 overflow-hidden">
      {/* Background Image identical to Hero */}
      <Image
        src={bgImage}
        alt="Background"
        fill
        style={{ animationDuration: '10s' }}
        className="object-cover opacity-40 scale-105 animate-in zoom-in"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
      
      {/* Centered Content */}
      <div className="relative z-10 flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="relative w-28 h-28 md:w-32 md:h-32 bg-white/10 backdrop-blur-md rounded-full shadow-2xl flex items-center justify-center p-5 border border-white/20">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-orange-500 animate-spin" style={{ animationDuration: '3s' }}></div>
          <div className="absolute inset-2 rounded-full border-b-2 border-l-2 border-orange-300 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
          
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Niman_logo-5j7jY2j2f6uKxKj3v4zBqU5A1y1N0C.png"
            alt="Niman Snacks Bar Logo"
            width={80}
            height={80}
            className="object-contain drop-shadow-xl"
            priority
          />
        </div>
        
        <h2 className="mt-8 text-3xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-lg">
          Niman Snacks Bar
        </h2>
        <div className="flex items-center mt-4 text-orange-400 font-medium text-lg drop-shadow-md bg-slate-900/40 px-6 py-2 rounded-full backdrop-blur-sm border border-white/10">
          <Loader2 className="w-5 h-5 animate-spin mr-3" />
          Preparing authentic flavors...
        </div>
      </div>
    </div>
  );
}

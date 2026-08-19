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
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#f4f1e1] overflow-hidden">
      {/* Background Image identical to Hero */}
      <Image
        src={bgImage}
        alt="Background"
        fill
        style={{ animationDuration: '10s' }}
        className="object-cover opacity-10 scale-105 animate-in zoom-in"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#f4f1e1] via-[#f4f1e1]/80 to-transparent"></div>
      
      {/* Centered Content */}
      <div className="relative z-10 flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="relative w-28 h-28 md:w-32 md:h-32 bg-white shadow-2xl flex items-center justify-center p-1 rounded-full border border-orange-200 overflow-hidden">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 rounded-full border-t-4 border-r-4 border-orange-500 animate-spin" style={{ animationDuration: '3s' }}></div>
          <div className="absolute inset-2 rounded-full border-b-4 border-l-4 border-green-500 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
          
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/03b4a790-cba5-4c1f-b3ee-15b711bbae1b%20-%20Copy.jpg-YiztabVgfIKTPtMbLKFUSqT9llD4U6.jpeg"
            alt="Niman Snacks Bar Logo"
            fill
            className="object-cover rounded-full p-2"
            priority
          />
        </div>
        
        <h2 className="mt-8 text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight drop-shadow-sm">
          Niman Snacks Bar
        </h2>
        <div className="flex items-center mt-4 text-orange-700 font-bold text-lg drop-shadow-sm bg-white/80 px-6 py-2 rounded-full backdrop-blur-md border border-orange-100 shadow-sm">
          <Loader2 className="w-5 h-5 animate-spin mr-3 text-orange-600" />
          Preparing authentic flavors...
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Image from "next/image"
import Link from "next/link"
import { Instagram, Facebook, Phone, Mail, MapPin, Navigation, Loader2, Lock, Star, Quote, Leaf, Drumstick, Sparkles, Flame, ShieldCheck, Truck, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import Header from "@/components/header"
import GlobalLoader from "@/components/global-loader";
import { useCart } from "@/lib/cart-context";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface HeroData {
  title: string;
  promotionBadge: string;
  subtitle: string;
  imageUrl: string;
}

interface FoodItem {
  id: string;
  title: string;
  description: string;
  price: string;
  originalPrice?: string;
  imageUrl: string;
  badge?: string;
  isActive: boolean;
  category: "Veg" | "Non-Veg";
  isSignature: boolean;
  stockQuantity: number;
}

export default function Home() {
  const [heroData, setHeroData] = useState<HeroData | null>(null);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<"Veg" | "Non-Veg">("Veg");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const { addToCart } = useCart();

  // Default fallback values
  const defaultSubtitle = "Discover the rich, aromatic flavors of authentic Indian comfort food at Niman Snacks Bar & Restro.";
  const defaultPromotionBadge = "🔥 Free Delivery Above ₹500!";
  const defaultHeroImage = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/03b4a790-cba5-4c1f-b3ee-15b711bbae1b%20%281%29.jpg-idkiDzKGfGh5KPHVNbe3S6F2GNpAjW.jpeg";
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Hero Data
        const heroDoc = await getDoc(doc(db, "hero_section", "main"));
        if (heroDoc.exists()) {
          setHeroData(heroDoc.data() as HeroData);
        }

        // Fetch Food Items
        const foodSnapshot = await getDocs(collection(db, "food_items"));
        const items: FoodItem[] = [];
        foodSnapshot.forEach((doc) => {
          const data = doc.data();
          items.push({ 
            id: doc.id, 
            ...data,
            originalPrice: data.originalPrice || "",
            category: data.category || "Veg",
            isSignature: data.isSignature || false,
            stockQuantity: data.stockQuantity || 0
          } as FoodItem);
        });
        
        // Only show active items
        setFoodItems(items.filter(item => item.isActive));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Reset filter when category changes
  useEffect(() => {
    setActiveFilter(null);
  }, [activeCategory]);

  const promotionBadge = heroData?.promotionBadge || defaultPromotionBadge;
  const subtitle = heroData?.subtitle || defaultSubtitle;

  // Location details for the map
  const address = "Dream Home 4, sector 73, Noida 201304, Uttar Pradesh, India"
  const mapUrl =
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14013.918077598686!2d77.381358!3d28.585419!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjjCsDM1JzA3LjUiTiA3N8KwMjMnNDIuOSJF!5e0!3m2!1sen!2sin!4v1622000000000!5m2!1sen!2sin"
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`

  if (loading) {
    return <GlobalLoader />;
  }

  const signatureDishes = foodItems.filter(item => item.isSignature);
  
  // Get items for current category
  const categoryItems = foodItems.filter(item => item.category === activeCategory);
  
  // Extract unique badges for the current category
  const availableFilters = Array.from(new Set(
    categoryItems.flatMap(item => item.badge ? item.badge.split(',').map(b => b.trim()) : [])
  )).filter(Boolean);

  // Apply badge filter if selected
  const menuItems = activeFilter 
    ? categoryItems.filter(item => item.badge && item.badge.includes(activeFilter))
    : categoryItems;

  const isVeg = activeCategory === 'Veg';
  const themeColor = isVeg ? '#1ba54f' : '#da291c';
  const themeBgLight = isVeg ? 'bg-[#f0f9f4]' : 'bg-[#fcebea]';
  const themeText = isVeg ? 'text-[#1ba54f]' : 'text-[#da291c]';
  const themeBorder = isVeg ? 'border-[#1ba54f]' : 'border-[#da291c]';
  const themeBg = isVeg ? 'bg-[#1ba54f]' : 'bg-[#da291c]';
  const themeHover = isVeg ? 'hover:bg-[#158c42]' : 'hover:bg-[#b81d12]';

  const renderFoodCard = (item: FoodItem) => {
    const isItemVeg = item.category === 'Veg';
    const itemThemeText = isItemVeg ? 'text-[#1ba54f]' : 'text-[#da291c]';
    const itemThemeBg = isItemVeg ? 'bg-[#1ba54f]' : 'bg-[#da291c]';
    const itemThemeHover = isItemVeg ? 'hover:bg-[#158c42]' : 'hover:bg-[#b81d12]';
    const itemThemeBgLight = isItemVeg ? 'bg-[#f0f9f4]' : 'bg-[#fcebea]';

    const numericPrice = parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0;
    const numericOriginal = item.originalPrice ? parseFloat(item.originalPrice.replace(/[^0-9.]/g, '')) : 0;
    let discountPercent = 0;
    if (numericOriginal > numericPrice && numericPrice > 0) {
      discountPercent = Math.round(((numericOriginal - numericPrice) / numericOriginal) * 100);
    }

    return (
      <Card key={item.id} className="overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 rounded-xl bg-white flex flex-col h-full">
        {/* Image Area */}
        <div className="h-56 relative overflow-hidden shrink-0">
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            className="object-cover"
          />
          {/* Top Left Category Badge */}
          <div className={`absolute top-3 left-3 ${itemThemeBg} text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center`}>
            <span className="w-1.5 h-1.5 bg-white rounded-full mr-1.5"></span>
            {item.category}
          </div>
          {/* Out of Stock Overlay */}
          {item.stockQuantity <= 0 && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center z-10">
              <span className="bg-red-600 text-white font-extrabold px-4 py-2 rounded-lg rotate-12 shadow-lg tracking-widest uppercase border-2 border-red-200">
                Out of Stock
              </span>
            </div>
          )}
        </div>
        
        {/* Content Area */}
        <CardContent className="p-5 flex flex-col flex-grow bg-white">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-bold text-gray-900 pr-4">
              {item.title}
            </h3>
            <div className="flex flex-col items-end shrink-0">
              <span className={`text-xl font-bold ${itemThemeText}`}>
                ₹{numericPrice}
              </span>
              {discountPercent > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400 line-through">₹{numericOriginal}</span>
                  <span className="text-xs font-bold text-white bg-red-500 px-1.5 py-0.5 rounded">
                    {discountPercent}% OFF
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <p className="text-gray-500 text-sm leading-relaxed mb-4 flex-grow">
            {item.description}
          </p>

          {/* Badges Row */}
          {item.badge && (
            <div className="flex flex-wrap gap-2 mb-4">
              {item.badge.split(',').map((b, i) => (
                <span key={i} className={`px-2 py-0.5 ${itemThemeBgLight} ${itemThemeText} text-[10px] font-bold uppercase tracking-wider rounded-md`}>
                  {b.trim()}
                </span>
              ))}
            </div>
          )}
          
          {/* Footer Button */}
          <div className="mt-auto">
            <Button
              disabled={item.stockQuantity <= 0}
              onClick={() => addToCart({
                id: item.id,
                title: item.title,
                price: item.price,
                quantity: 1,
                imageUrl: item.imageUrl
              })}
              className={`w-full justify-center ${item.stockQuantity <= 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : `${itemThemeBg} ${itemThemeHover} text-white`} rounded-md h-10 shadow-sm transition-all text-sm font-medium`}
            >
              {item.stockQuantity <= 0 ? "Out of Stock" : "Add to Cart"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <main className="min-h-screen flex flex-col bg-slate-50">
      {/* Promotional Top Bar */}
      <div className="bg-[#da291c] text-white text-center py-2 px-4 text-sm font-bold flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4 text-yellow-300" />
        <span>Free Delivery on all orders above ₹500!</span>
        <Sparkles className="w-4 h-4 text-yellow-300" />
      </div>
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-[85vh] w-full flex items-center justify-center overflow-hidden bg-slate-900">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <Image
            src={heroData?.imageUrl || defaultHeroImage}
            alt="Niman Snacks Bar"
            fill
            className="object-cover opacity-50 scale-105 animate-[pulse_20s_ease-in-out_infinite]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-[#111]/40 mix-blend-multiply" />
        </div>

        {/* Floating Icons (Zomato-esque vibe) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden hidden md:block">
          <Flame className="absolute top-1/4 left-[10%] w-12 h-12 text-orange-500/30 animate-bounce delay-100" />
          <Drumstick className="absolute top-1/3 right-[15%] w-16 h-16 text-orange-400/20 animate-pulse delay-300 rotate-12" />
          <Leaf className="absolute bottom-1/4 left-[20%] w-10 h-10 text-green-500/30 animate-bounce delay-500 -rotate-12" />
          <Star className="absolute top-[15%] right-[30%] w-8 h-8 text-yellow-400/40 animate-pulse" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-in slide-in-from-bottom-10 fade-in duration-1000">
          
          {/* Promotion Badge */}
          <div className="inline-block mb-6 relative group cursor-pointer">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-500 animate-pulse"></div>
            <div className="relative bg-black text-white px-6 py-2 rounded-full font-extrabold text-sm tracking-wide border border-white/20 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
              </span>
              {promotionBadge}
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 drop-shadow-2xl tracking-tighter leading-tight">
            {heroData?.title || "Flavors That Feel Like Home"}
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto font-medium drop-shadow-lg leading-relaxed">
            {subtitle}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-[#da291c] hover:bg-[#b81d12] text-white text-xl px-10 py-7 rounded-2xl w-full sm:w-auto transition-all hover:scale-105 shadow-[0_0_40px_-10px_rgba(218,41,28,0.8)] font-bold" asChild>
              <Link href="#menu">
                Order Food Online <ArrowRight className="ml-2 w-6 h-6 animate-pulse" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-lg px-8 py-7 rounded-2xl w-full sm:w-auto backdrop-blur-md transition-transform hover:scale-105 font-bold" asChild>
              <Link href="#location">
                View Restaurant Info
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Signature Dishes Section */}
      {signatureDishes.length > 0 && (
        <section id="featured-dishes" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#f4f1e1]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 animate-in slide-in-from-bottom-10 fade-in duration-700">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Our Signature Dishes</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Discover our most beloved dishes at Niman Snacks Bar & Restro, crafted with authentic recipes and the finest ingredients to bring the true taste of Indian comfort food to your table.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {signatureDishes.map(renderFoodCard)}
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Niman Snacks Bar?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center p-6 bg-[#faf9f5] rounded-2xl hover:-translate-y-1 transition-transform shadow-sm border border-gray-50">
              <div className="w-16 h-16 bg-[#f0f9f4] rounded-full flex items-center justify-center mb-4 shadow-sm border border-green-100">
                <Leaf className="w-8 h-8 text-[#1ba54f]" />
              </div>
              <h3 className="font-bold text-xl mb-2 text-gray-900">100% Authentic Bihari Spices</h3>
              <p className="text-gray-600 text-sm leading-relaxed">We source our spices directly from Bihar to bring you the true, traditional flavor.</p>
            </div>
            <div className="flex flex-col items-center p-6 bg-[#faf9f5] rounded-2xl hover:-translate-y-1 transition-transform shadow-sm border border-gray-50">
              <div className="w-16 h-16 bg-[#fdf3eb] rounded-full flex items-center justify-center mb-4 shadow-sm border border-orange-100">
                <Flame className="w-8 h-8 text-[#e87a1e]" />
              </div>
              <h3 className="font-bold text-xl mb-2 text-gray-900">Freshly Prepared on Order</h3>
              <p className="text-gray-600 text-sm leading-relaxed">No frozen food. Every Litti, Chicken, and Samosa is made fresh the moment you order.</p>
            </div>
            <div className="flex flex-col items-center p-6 bg-[#faf9f5] rounded-2xl hover:-translate-y-1 transition-transform shadow-sm border border-gray-50">
              <div className="w-16 h-16 bg-[#fcebea] rounded-full flex items-center justify-center mb-4 shadow-sm border border-red-100">
                <ShieldCheck className="w-8 h-8 text-[#da291c]" />
              </div>
              <h3 className="font-bold text-xl mb-2 text-gray-900">No Preservatives</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Pure ingredients, zero artificial colors or preservatives. Just healthy, honest comfort food.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Menu Section */}
      <section id="menu" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#f4f1e1]">
        <div className="max-w-7xl mx-auto">
          {/* Top Category Toggle */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex items-center justify-center bg-[#f0f4f8] rounded-md shadow-sm overflow-hidden border border-gray-200">
              <button
                onClick={() => setActiveCategory("Veg")}
                className={`flex items-center gap-2 px-8 py-3 text-sm font-bold transition-all duration-300 ${
                  activeCategory === "Veg" 
                    ? "bg-[#1ba54f] text-white" 
                    : "text-gray-500 hover:text-gray-800 bg-transparent"
                }`}
              >
                <Leaf className="w-4 h-4" /> Veg
              </button>
              <button
                onClick={() => setActiveCategory("Non-Veg")}
                className={`flex items-center gap-2 px-8 py-3 text-sm font-bold transition-all duration-300 ${
                  activeCategory === "Non-Veg" 
                    ? "bg-[#da291c] text-white" 
                    : "text-gray-500 hover:text-gray-800 bg-transparent"
                }`}
              >
                <Drumstick className="w-4 h-4" /> Non-Veg
              </button>
            </div>
          </div>

          <div className="mb-8">
            <h3 className={`text-2xl font-extrabold ${themeText} mb-6 flex items-center gap-2`}>
              {isVeg ? <Leaf className="w-6 h-6" /> : <Drumstick className="w-6 h-6" />}
              {isVeg ? "Vegetarian Delights" : "Non-Vegetarian Adventures"}
            </h3>

            {/* Interactive Filters Row */}
            {availableFilters.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-8">
                {availableFilters.map((filter, i) => {
                  const isActive = activeFilter === filter;
                  return (
                    <button
                      key={i}
                      onClick={() => setActiveFilter(isActive ? null : filter)}
                      className={`px-4 py-1.5 rounded-full border-2 text-sm font-bold transition-all duration-200 ${
                        isActive 
                          ? `${themeBg} text-white ${themeBorder}` 
                          : `bg-white ${themeText} ${themeBorder} ${themeHover.replace('bg', 'bg').replace('hover:', 'hover:bg-opacity-10 ')} hover:${themeText}`
                      }`}
                    >
                      {filter}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {menuItems.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
              <p className="text-xl text-gray-500">Currently no {activeFilter ? `"${activeFilter}"` : ""} items available in {activeCategory}.</p>
              {activeFilter && (
                <Button variant="outline" className="mt-4" onClick={() => setActiveFilter(null)}>
                  Clear Filter
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {menuItems.map(renderFoodCard)}
            </div>
          )}
          
          {/* Special Notes Section */}
          <div className={`mt-12 p-6 rounded-xl ${themeBgLight} border ${themeBorder} border-opacity-20`}>
            <h4 className={`text-lg font-bold ${themeText} mb-4`}>Special Notes</h4>
            <ul className="space-y-3 text-sm text-gray-800">
              <li className="flex items-start gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${themeBg} mt-1.5 shrink-0`}></span>
                <span>Free delivery on all orders of Signature Dishes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${themeBg} mt-1.5 shrink-0`}></span>
                <span>Samosa requires minimum order of 6 pieces</span>
              </li>
              <li className="flex items-start gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${themeBg} mt-1.5 shrink-0`}></span>
                <span>All dishes are freshly prepared upon order</span>
              </li>
              <li className="flex items-start gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${themeBg} mt-1.5 shrink-0`}></span>
                <span>Contact us for bulk orders and special occasions</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Delivery Policy */}
      <section id="delivery-policy" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Delivery Policy</h2>
            <h3 className="text-xl font-semibold text-orange-600 mb-4">We Bring Flavor to Your Doorstep!</h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Know exactly how and when your Chicken Litti, Chicken Rice, or Veg delights from Niman Snacks Bar will arrive — with simple, transparent delivery charges.
            </p>
          </div>

          <div className="bg-orange-50 rounded-2xl p-8 md:p-12 shadow-sm border border-orange-100">
            <h4 className="text-2xl font-bold mb-8 text-center border-b border-orange-200 pb-4">Delivery Zones & Charges</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 max-w-3xl mx-auto">
              <div className="flex justify-between items-center py-3 border-b border-orange-200/50">
                <span className="font-medium text-gray-700 text-lg">Within 3 km</span>
                <span className="font-bold text-green-600 text-lg">₹0 (Free!)</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-orange-200/50">
                <span className="font-medium text-gray-700 text-lg">4–6 km</span>
                <span className="font-bold text-gray-900 text-lg">₹10 × extra km</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-orange-200/50">
                <span className="font-medium text-gray-700 text-lg">7–10 km</span>
                <span className="font-bold text-gray-900 text-lg">₹10 × extra km</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-orange-200/50">
                <span className="font-medium text-gray-700 text-lg">Beyond 10 km</span>
                <span className="font-bold text-orange-600 text-lg">Contact us</span>
              </div>
            </div>
            <div className="mt-8 bg-white p-4 rounded-lg text-center border border-orange-200">
              <p className="text-gray-700 font-medium">Example: If you're 5 km away → Only <strong className="text-gray-900">₹20 extra</strong> (₹10 × 2 extra km)</p>
            </div>

            <div className="mt-10 bg-white p-6 rounded-xl border border-orange-200 shadow-sm max-w-2xl mx-auto">
              <h4 className="text-xl font-bold text-gray-900 mb-3 text-center border-b border-orange-100 pb-2">Our Location</h4>
              <p className="text-gray-700 text-center font-medium leading-relaxed">
                <span className="text-orange-700 font-bold block mb-1">Niman Snacks Bar & Restro</span>
                Dream Home 4, Sector 73,<br/>
                Noida 201304<br/>
                Uttar Pradesh, India
              </p>
            </div>

            <p className="text-center text-sm text-gray-500 mt-8 max-w-2xl mx-auto">
              We deliver to all areas in and around Noida. For specific delivery time estimates to your location, please contact us. <br/><br/>
              <strong>Note:</strong> For bulk orders or catering services, please contact us directly for special arrangements.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#faf9f5]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-600">Got questions? We've got answers.</p>
          </div>
          
          <Accordion type="single" collapsible className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <AccordionItem value="item-1" className="border-b-gray-100">
              <AccordionTrigger className="text-lg font-bold text-gray-800 hover:text-[#e87a1e] text-left">Do you accept UPI or Cash on Delivery?</AccordionTrigger>
              <AccordionContent className="text-gray-600 text-base leading-relaxed">
                Yes! We accept all major UPI payments (Google Pay, PhonePe, Paytm) as well as exact Cash on Delivery. You can choose your preferred payment method when ordering via WhatsApp.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="border-b-gray-100">
              <AccordionTrigger className="text-lg font-bold text-gray-800 hover:text-[#e87a1e] text-left">How much time does delivery usually take?</AccordionTrigger>
              <AccordionContent className="text-gray-600 text-base leading-relaxed">
                Since we prepare everything fresh upon receiving your order, standard delivery takes between 40 to 60 minutes depending on your location in Noida.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="border-b-gray-100">
              <AccordionTrigger className="text-lg font-bold text-gray-800 hover:text-[#e87a1e] text-left">Do you take bulk orders for parties?</AccordionTrigger>
              <AccordionContent className="text-gray-600 text-base leading-relaxed">
                Absolutely! We cater to house parties, office gatherings, and special occasions. Please reach out to us at least 24 hours in advance for bulk orders to ensure the best quality and timely delivery.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4" className="border-none border-b-0">
              <AccordionTrigger className="text-lg font-bold text-gray-800 hover:text-[#e87a1e] text-left">Is your packaging spill-proof?</AccordionTrigger>
              <AccordionContent className="text-gray-600 text-base leading-relaxed">
                Yes, we use high-quality, food-grade, leak-proof containers for all our gravies and curries to ensure your food arrives hot, fresh, and mess-free.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Our Story */}
      <section id="our-story" className="py-20 px-4 sm:px-6 lg:px-8 bg-amber-900 text-amber-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-amber-800 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-orange-900 rounded-full blur-3xl opacity-50"></div>
        
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-8 text-white">Our Story</h2>
          <h3 className="text-2xl font-serif italic text-amber-300 mb-8">Roots in the Kitchen: A Story of Tradition, Taste & Togetherness</h3>
          
          <div className="space-y-6 text-lg md:text-xl text-amber-100/90 leading-relaxed font-light">
            <p>
              It all began in the rustic kitchens of Bihar—where smoke curled from earthen chulhas, and the air was thick with the scent of roasting spices. This is where Niman Snacks Bar & Restro found its soul.
            </p>
            <p>
              In the heart of Bihar, generations gathered around steaming clay ovens, passing down recipes that tasted like memory—like home. The smoky litti chokha, wrapped in mud and roasted to perfection, was more than just a meal; it was a ritual.
            </p>
            <p>
              When you bite into our warm litti, crackling on the outside and soft within, served with fiery chokha and ghee-soaked gur, you're not just eating—you're reliving afternoons spent under fans swaying lazily in Bihari homes.
            </p>
          </div>
          
          <div className="mt-12 py-8 border-y border-amber-800/50">
            <p className="text-2xl md:text-3xl font-serif text-amber-400 italic">
              "At Niman, every meal has roots. And every root tells a story."
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">What Our Customers Say</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Don't just take our word for it. Here's what food lovers have to say about our authentic dishes at Niman Snacks Bar.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <Card className="bg-white border-none shadow-md hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8">
                <Quote className="w-10 h-10 text-orange-300 mb-6" />
                <p className="text-gray-700 text-lg mb-8 italic">
                  "The Chicken Litti at Niman Snacks Bar brought back memories of my grandmother's kitchen. Absolutely authentic and delicious!"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-xl">
                    PS
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Priya Sharma</h4>
                    <p className="text-sm text-gray-500">Sector 73, Noida</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 2 */}
            <Card className="bg-white border-none shadow-md hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8">
                <Quote className="w-10 h-10 text-orange-300 mb-6" />
                <p className="text-gray-700 text-lg mb-8 italic">
                  "I've tried many versions of Chicken Rice, but the one at Niman Snacks Bar stands out with its perfect balance of spices."
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-xl">
                    RM
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Rahul Mehta</h4>
                    <p className="text-sm text-gray-500">Sector 73, Noida</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 3 */}
            <Card className="bg-white border-none shadow-md hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8">
                <Quote className="w-10 h-10 text-orange-300 mb-6" />
                <p className="text-gray-700 text-lg mb-8 italic">
                  "The Samosas are crispy on the outside and perfectly spiced inside. I order them for every family gathering from Niman Snacks Bar!"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-xl">
                    AP
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Aman Patel</h4>
                    <p className="text-sm text-gray-500">Sector 73, Noida</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Location / Ready to Experience */}
      <section id="location" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Ready to Experience Authentic Flavors?</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
              Whether you're craving our signature Chicken Litti, aromatic Chicken Curry, or crispy Samosas, Niman Snacks Bar is ready to deliver a taste of tradition right to your doorstep.
            </p>
            <div className="flex justify-center gap-4">
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-8" asChild>
                <Link href="#menu">Explore Our Menu</Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mt-12 bg-slate-50 p-6 md:p-10 rounded-3xl border border-gray-100">
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2"><MapPin className="text-orange-600" /> Find Us</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Visit us at our location in Noida to experience authentic Indian comfort food. We're conveniently located and ready to serve you.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h4 className="font-bold text-lg mb-2">Our Address</h4>
                <p className="text-gray-600 mb-6">
                  Dream Home 4, sector 73,<br/>
                  Noida 201304<br/>
                  Uttar Pradesh, India
                </p>
                <Button variant="outline" className="w-full sm:w-auto border-orange-600 text-orange-600 hover:bg-orange-50" asChild>
                  <Link href={directionsUrl} target="_blank" rel="noopener noreferrer">
                    <Navigation className="w-4 h-4 mr-2" />
                    Get Directions
                  </Link>
                </Button>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h4 className="font-bold text-lg mb-4">Opening Hours</h4>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium">Monday - Friday</span>
                    <span>11:00 AM - 11:00 PM</span>
                  </li>
                  <li className="flex justify-between items-center pt-1">
                    <span className="font-medium">Saturday - Sunday</span>
                    <span>11:00 AM - 12:00 AM</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="h-[500px] w-full rounded-3xl overflow-hidden shadow-lg border border-gray-200 relative group">
              <iframe
                src={mapUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Niman Snacks Bar Location"
                className="w-full h-full absolute inset-0 z-0"
              ></iframe>
              <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors pointer-events-none z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16 px-4 sm:px-6 lg:px-8 border-t-4 border-orange-600">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          <div className="space-y-4 lg:col-span-1">
            <h2 className="text-2xl font-bold text-white tracking-tight">Niman Snacks Bar & Restro</h2>
            <p className="text-gray-400 leading-relaxed text-sm">
              Bringing the authentic taste of Indian comfort food to your table since 2020.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider text-sm">Quick Links</h3>
            <ul className="space-y-3">
              <li><Link href="#menu" className="hover:text-orange-400 transition-colors">Menu</Link></li>
              <li><Link href="#our-story" className="hover:text-orange-400 transition-colors">Our Story</Link></li>
              <li><Link href="#delivery-policy" className="hover:text-orange-400 transition-colors">Delivery Policy</Link></li>
              <li><Link href="#faq" className="hover:text-orange-400 transition-colors">FAQs</Link></li>
              <li><Link href="#location" className="hover:text-orange-400 transition-colors">Location</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider text-sm">Address</h3>
            <address className="not-italic text-gray-400 leading-relaxed space-y-2">
              <p>Dream Home 4, sector 73,</p>
              <p>Noida 201304</p>
              <p>Uttar Pradesh, India</p>
              <div className="pt-4">
                <Link href={directionsUrl} target="_blank" className="text-orange-500 hover:text-orange-400 font-medium inline-flex items-center">
                  Get Directions <Navigation className="w-3 h-3 ml-1" />
                </Link>
              </div>
            </address>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider text-sm">Contact Us</h3>
            <ul className="space-y-4">
              <li>
                <a href={`https://wa.me/918800218121`} target="_blank" className="flex items-center hover:text-green-400 transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mr-3 group-hover:bg-green-900/50">
                    <Phone className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">WhatsApp / Phone</p>
                    <p className="text-white group-hover:text-green-400">+91 88002 18121</p>
                  </div>
                </a>
              </li>
              <li>
                <a href="mailto:hello@myniman.com" className="flex items-center hover:text-orange-400 transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mr-3 group-hover:bg-orange-900/50">
                    <Mail className="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-white group-hover:text-orange-400">hello@myniman.com</p>
                  </div>
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">© 2026 Niman Snacks Bar & Restro. All rights reserved.</p>
          
          <div className="flex items-center gap-6">
            <Link href="https://instagram.com" target="_blank" aria-label="Instagram">
              <Instagram className="w-5 h-5 text-gray-500 hover:text-white transition-colors" />
            </Link>
            <Link href="https://facebook.com" target="_blank" aria-label="Facebook">
              <Facebook className="w-5 h-5 text-gray-500 hover:text-white transition-colors" />
            </Link>
            <div className="w-px h-4 bg-gray-700 hidden sm:block"></div>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4 sm:mt-0">
              <Link href="/admin/login">
                <Button variant="outline" size="sm" className="h-8 text-xs bg-gray-900 border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 hover:border-gray-600 transition-colors">
                  <Lock className="w-3 h-3 mr-1.5" />
                  Admin
                </Button>
              </Link>
              <Link href="/delivery/login">
                <Button variant="outline" size="sm" className="h-8 text-xs bg-gray-900 border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 hover:border-gray-600 transition-colors">
                  <Truck className="w-3 h-3 mr-1.5" />
                  Delivery
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </footer>

    </main>
  )
}

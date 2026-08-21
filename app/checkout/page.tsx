"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/lib/cart-context";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MapPin, Loader2, Tag, CheckCircle2, Phone, LocateFixed, Bike, Store } from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";

// Shop coordinates — Niman Snacks Bar, Sector 73, Noida
const SHOP_LAT = 28.585419;
const SHOP_LNG = 77.381358;

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getDeliveryCharge(distanceKm: number): { charge: number; zone: string; blocked: boolean } {
  if (distanceKm <= 3) return { charge: 0, zone: "Within 3 km — Free Delivery 🎉", blocked: false };
  if (distanceKm <= 5) return { charge: 20, zone: "3–5 km zone", blocked: false };
  if (distanceKm <= 7) return { charge: 30, zone: "5–7 km zone", blocked: false };
  if (distanceKm <= 10) return { charge: 50, zone: "7–10 km zone", blocked: false };
  // DEV MODE: All India delivery enabled — remove blocked:true for production
  return { charge: 50, zone: "Beyond 10 km (Dev Mode — All India)", blocked: false };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const router = useRouter();

  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [deliveryInfo, setDeliveryInfo] = useState<{ charge: number; zone: string; blocked: boolean } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);

  const [deliveryType, setDeliveryType] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [paymentMethod, setPaymentMethod] = useState<"ONLINE" | "CASH">("ONLINE");

  useEffect(() => {
    if (deliveryType === "DELIVERY") {
      setPaymentMethod("ONLINE");
    }
  }, [deliveryType]);

  // Computed totals
  const subtotal = totalPrice;
  const deliveryCharge = deliveryType === "PICKUP" ? 0 : (deliveryInfo?.charge ?? 0);
  const finalTotal = Math.max(0, subtotal + deliveryCharge - discountAmount);

  const handleGetLocation = () => {
    setIsLocating(true);
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation is not supported by your browser");
      setIsLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoordinates({ lat, lng });
        const dist = getDistanceKm(SHOP_LAT, SHOP_LNG, lat, lng);
        setDistanceKm(dist);
        const info = getDeliveryCharge(dist);
        setDeliveryInfo(info);
        if (info.blocked) {
          toast.error(`You are ${dist.toFixed(1)} km away. Please contact us.`);
        } else {
          toast.success(`✓ Location verified! ${dist.toFixed(1)} km from shop.`);
        }
        setIsLocating(false);
      },
      () => {
        toast.error("Failed to get location. Please allow location access.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return toast.error("Please enter a coupon code.");
    setCouponLoading(true);
    try {
      const q = query(
        collection(db, "coupons"),
        where("code", "==", couponCode.trim().toUpperCase()),
        where("isActive", "==", true)
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        toast.error("Invalid or expired coupon code.");
        setAppliedCoupon(null);
        setDiscountAmount(0);
        setCouponLoading(false);
        return;
      }
      const coupon = { id: snap.docs[0].id, ...snap.docs[0].data() } as any;

      // Check expiry
      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        toast.error("This coupon has expired.");
        setAppliedCoupon(null);
        setDiscountAmount(0);
        setCouponLoading(false);
        return;
      }

      // Check minimum order
      if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
        toast.error(`Minimum order of ₹${coupon.minOrderValue} required for this coupon.`);
        setAppliedCoupon(null);
        setDiscountAmount(0);
        setCouponLoading(false);
        return;
      }

      // Calculate discount
      let discount = 0;
      if (coupon.discountType === "percentage") {
        discount = Math.floor((subtotal * coupon.discountValue) / 100);
        if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
      } else {
        discount = coupon.discountValue;
      }
      discount = Math.min(discount, subtotal); // can't discount more than subtotal

      setAppliedCoupon(coupon);
      setDiscountAmount(discount);
      toast.success(`Coupon applied! You save ₹${discount}`);
    } catch (e) {
      toast.error("Failed to apply coupon. Try again.");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCode("");
    toast.info("Coupon removed.");
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (deliveryType === "DELIVERY") {
      if (!coordinates) return toast.error("Please share your location for delivery.");
      if (deliveryInfo?.blocked) return toast.error("Delivery not available to your location. Contact us.");
      if (!address.trim()) return toast.error("Please provide your complete address.");
    }
    
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) return toast.error("Please enter a valid 10-digit Indian mobile number.");

    setIsValidating(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        toast.error("You must be logged in to checkout.");
        return;
      }

      const createRes = await fetch(`${API_URL}/api/orders/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items,
          address: deliveryType === "PICKUP" ? "Self Pickup from Shop" : address,
          phone,
          coordinates: deliveryType === "PICKUP" ? { lat: SHOP_LAT, lng: SHOP_LNG } : coordinates,
          amount: finalTotal,
          subtotal,
          deliveryCharge,
          couponCode: appliedCoupon?.code || null,
          discountAmount,
          deliveryType,
          paymentMethod,
        }),
      });
      const orderData = await createRes.json();
      if (!orderData.success) throw new Error(orderData.error || "Failed to create order");

      if (orderData.isCash) {
        clearCart();
        toast.success("🎉 Order placed successfully!");
        router.push("/orders");
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_key",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Niman Snacks Bar",
        description: "Fresh food order",
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch(`${API_URL}/api/orders/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                dbOrderId: orderData.dbOrderId,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              clearCart();
              toast.success("🎉 Order placed successfully!");
              router.push("/orders");
            } else {
              toast.error("Payment verification failed.");
            }
          } catch {
            toast.error("Payment verification error.");
          }
        },
        prefill: {
          name: auth.currentUser?.displayName || "Customer",
          email: auth.currentUser?.email || "",
          contact: phone,
        },
        theme: { color: "#e87a1e" },
        config: {
          display: {
            blocks: {
              upi: { name: "Pay via UPI (GPay, PhonePe, Paytm)", instruments: [{ method: "upi" }] },
              cards: { name: "Pay via Cards", instruments: [{ method: "card" }] },
              other: { name: "Other Payment Modes", instruments: [{ method: "netbanking" }, { method: "wallet" }, { method: "paylater" }] },
            },
            sequence: ["block.upi", "block.cards", "block.other"],
            preferences: { show_default_blocks: false },
          },
        },
      };

      if ((window as any).Razorpay) {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        toast.error("Payment gateway not loaded. Please refresh and try again.");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to checkout");
    } finally {
      setIsValidating(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 gap-4">
        <div className="text-6xl">🛒</div>
        <h2 className="text-2xl font-bold text-gray-800">Your cart is empty</h2>
        <Button onClick={() => router.push("/")} className="bg-orange-600 hover:bg-orange-700 rounded-xl">
          Return to Menu
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Checkout</h1>

        <form onSubmit={handleCheckout} className="space-y-6">
          {/* Delivery Details */}
          <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-6 space-y-5">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-500" /> Delivery Details
            </h2>

            {/* Delivery Type Toggle */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div
                onClick={() => setDeliveryType("DELIVERY")}
                className={`p-4 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-center gap-2 transition-all ${
                  deliveryType === "DELIVERY"
                    ? "border-orange-500 bg-orange-50 text-orange-700"
                    : "border-gray-200 bg-white text-gray-500 hover:border-orange-200"
                }`}
              >
                <Bike className={`w-6 h-6 ${deliveryType === "DELIVERY" ? "text-orange-600" : "text-gray-400"}`} />
                <span className="font-semibold text-sm">Home Delivery</span>
              </div>
              <div
                onClick={() => setDeliveryType("PICKUP")}
                className={`p-4 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-center gap-2 transition-all ${
                  deliveryType === "PICKUP"
                    ? "border-orange-500 bg-orange-50 text-orange-700"
                    : "border-gray-200 bg-white text-gray-500 hover:border-orange-200"
                }`}
              >
                <Store className={`w-6 h-6 ${deliveryType === "PICKUP" ? "text-orange-600" : "text-gray-400"}`} />
                <span className="font-semibold text-sm">Pickup from Shop</span>
              </div>
            </div>

            {/* Payment Method Toggle (Only for Pickup) */}
            {deliveryType === "PICKUP" && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div
                  onClick={() => setPaymentMethod("ONLINE")}
                  className={`p-4 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-center gap-2 transition-all ${
                    paymentMethod === "ONLINE"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 bg-white text-gray-500 hover:border-green-200"
                  }`}
                >
                  <span className="font-semibold text-sm">Pay Online Now</span>
                </div>
                <div
                  onClick={() => setPaymentMethod("CASH")}
                  className={`p-4 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-center gap-2 transition-all ${
                    paymentMethod === "CASH"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 bg-white text-gray-500 hover:border-green-200"
                  }`}
                >
                  <span className="font-semibold text-sm">Pay Cash at Shop</span>
                </div>
              </div>
            )}

            {/* Address */}
            {deliveryType === "DELIVERY" && (
              <div className="space-y-2">
                <Label className="font-semibold">Complete Address</Label>
                <Input
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Flat 201, XYZ Apartments, Sector 73..."
                  className="h-12 rounded-xl"
                />
              </div>
            )}

            {/* Phone */}
            <div className="space-y-2">
              <Label className="font-semibold flex items-center gap-2">
                <Phone className="w-4 h-4 text-orange-500" /> Mobile Number
              </Label>
              <Input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit mobile number"
                className="h-12 rounded-xl"
              />
            </div>

            {/* Location */}
            {deliveryType === "DELIVERY" && (
              <div className="space-y-2">
                <Label className="font-semibold flex items-center gap-2">
                  <LocateFixed className="w-4 h-4 text-orange-500" /> Verify Your Location
                </Label>
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="text-sm text-gray-700">
                    {coordinates && deliveryInfo ? (
                      deliveryInfo.blocked ? (
                        <span className="text-red-600 font-medium">⚠️ {deliveryInfo.zone}</span>
                      ) : (
                        <div>
                          <span className="text-green-700 font-semibold">✓ Location verified</span>
                          <p className="text-gray-500 text-xs mt-0.5">
                            📍 {distanceKm?.toFixed(1)} km from shop — {deliveryInfo.zone}
                          </p>
                        </div>
                      )
                    ) : (
                      <span>Share your location to calculate delivery charge.</span>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGetLocation}
                    disabled={isLocating}
                    className="border-orange-500 text-orange-600 hover:bg-orange-100 whitespace-nowrap rounded-xl"
                  >
                    {isLocating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LocateFixed className="w-4 h-4 mr-2" />}
                    {coordinates ? "Re-detect Location" : "Get My Location"}
                  </Button>
                </div>

                {/* Delivery Zone Reference */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                  {[
                    { zone: "≤ 3 km", charge: "Free 🎉", active: distanceKm !== null && distanceKm <= 3 },
                    { zone: "3–5 km", charge: "₹20", active: distanceKm !== null && distanceKm > 3 && distanceKm <= 5 },
                    { zone: "5–7 km", charge: "₹30", active: distanceKm !== null && distanceKm > 5 && distanceKm <= 7 },
                    { zone: "7–10 km", charge: "₹50", active: distanceKm !== null && distanceKm > 7 && distanceKm <= 10 },
                  ].map((z) => (
                    <div
                      key={z.zone}
                      className={`text-center p-2 rounded-lg text-xs border transition-all ${
                        z.active
                          ? "bg-orange-500 text-white border-orange-500 font-bold"
                          : "bg-gray-50 text-gray-600 border-gray-100"
                      }`}
                    >
                      <p className="font-semibold">{z.zone}</p>
                      <p>{z.charge}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Coupon Section */}
          <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Tag className="w-5 h-5 text-orange-500" /> Apply Coupon
            </h2>
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-green-800">{appliedCoupon.code}</p>
                    <p className="text-sm text-green-700">You save ₹{discountAmount}!</p>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={removeCoupon} className="text-red-500 hover:text-red-700">
                  Remove
                </Button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code (e.g. NIMAN20)"
                  className="h-12 rounded-xl flex-1"
                />
                <Button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                  className="bg-orange-600 hover:bg-orange-700 h-12 rounded-xl px-6"
                >
                  {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                </Button>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm text-gray-700">
                  <span>{item.title} × {item.quantity}</span>
                  <span>₹{Number(String(item.price).replace(/[^0-9.]/g, "")) * item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Bike className="w-4 h-4" /> Delivery Charge
                </span>
                <span className={deliveryCharge === 0 && coordinates ? "text-green-600 font-semibold" : ""}>
                  {coordinates ? (deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge}`) : "—"}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600 font-semibold">
                  <span>Coupon Discount ({appliedCoupon?.code})</span>
                  <span>− ₹{discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-extrabold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total Payable</span>
                <span>₹{finalTotal}</span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isValidating || couponLoading || (deliveryType === "DELIVERY" && (!coordinates || !!deliveryInfo?.blocked))}
              className="w-full h-14 text-lg bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-lg font-bold mt-4 transition-all hover:-translate-y-0.5"
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...
                </>
              ) : paymentMethod === "CASH" ? (
                "Place Order (Pay at Shop)"
              ) : (
                `Pay ₹${finalTotal} via Razorpay`
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

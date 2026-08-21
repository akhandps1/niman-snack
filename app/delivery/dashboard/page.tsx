"use client";

import { useEffect, useState, useRef, lazy, Suspense } from "react";
import { collection, onSnapshot, query, where, doc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, MapPin, Phone, Navigation, CheckCircle, Package, ChefHat, Bike } from "lucide-react";

const LiveMap = lazy(() => import("@/components/live-map"));

export default function DeliveryDashboardPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [otpInput, setOtpInput] = useState<{ [key: string]: string }>({});
  const watchIdRef = useRef<{ [key: string]: number }>({});

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const q = query(collection(db, "orders"), where("assignedDeliveryId", "==", user.uid));
        const unsubscribeOrders = onSnapshot(
          q,
          (snapshot) => {
            const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setOrders(data);
            setLoading(false);
          },
          () => setLoading(false)
        );
        return () => unsubscribeOrders();
      } else {
        setLoading(false);
      }
    });
    return () => {
      unsubscribeAuth();
      // Clear all GPS watches on unmount
      Object.values(watchIdRef.current).forEach((id) => navigator.geolocation.clearWatch(id));
    };
  }, []);

  const updateStatus = async (orderId: string, status: string, extra: any = {}) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status,
        updatedAt: new Date().toISOString(),
        ...extra,
      });
      toast.success(`Status: ${status}`);
    } catch {
      toast.error("Failed to update status.");
    }
  };

  const startRealGPSTracking = (orderId: string) => {
    if (!("geolocation" in navigator)) {
      toast.error("GPS not supported on this device.");
      return;
    }
    if (watchIdRef.current[orderId]) return; // Already tracking

    toast.info("📡 Live GPS tracking started!");
    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        try {
          await updateDoc(doc(db, "orders", orderId), {
            deliveryLocation: { lat, lng },
            updatedAt: new Date().toISOString(),
          });
        } catch {}
      },
      (err) => {
        toast.error("GPS error: " + err.message);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    watchIdRef.current[orderId] = watchId;
  };

  const stopGPSTracking = (orderId: string) => {
    if (watchIdRef.current[orderId] !== undefined) {
      navigator.geolocation.clearWatch(watchIdRef.current[orderId]);
      delete watchIdRef.current[orderId];
    }
  };

  const handleVerifyOtp = async (orderId: string, expectedOtp: string) => {
    if (otpInput[orderId] === expectedOtp) {
      stopGPSTracking(orderId);
      await updateStatus(orderId, "DELIVERED");
      toast.success("✅ OTP Verified! Order delivered successfully.");
    } else {
      toast.error("Wrong OTP. Try again.");
    }
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      ASSIGNED: "bg-blue-100 text-blue-800",
      PICKUP_REQUESTED: "bg-yellow-100 text-yellow-800",
      PICKUP_APPROVED: "bg-green-100 text-green-800",
      PICKED_UP: "bg-orange-100 text-orange-800",
      OUT_FOR_DELIVERY: "bg-purple-100 text-purple-800",
      ARRIVED: "bg-indigo-100 text-indigo-800",
      DELIVERED: "bg-green-100 text-green-800",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-orange-100 p-2 rounded-xl">
            <Bike className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Delivery Dashboard</h1>
            <p className="text-sm text-gray-500">Your assigned orders</p>
          </div>
        </div>

        {orders.map((order) => {
          const isTracking = watchIdRef.current[order.id] !== undefined;
          return (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start p-5 border-b border-gray-100 gap-3 sm:gap-0">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">Order #{order.id.slice(-6).toUpperCase()}</h3>
                  <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {order.address}
                  </p>
                  {order.phone && (
                    <a
                      href={`tel:${order.phone}`}
                      className="text-sm text-blue-600 font-medium mt-1 flex items-center gap-1 hover:underline"
                    >
                      <Phone className="w-3 h-3" /> {order.phone} (Call Customer)
                    </a>
                  )}
                </div>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${getStatusBadgeColor(order.status)}`}>
                  {order.status.replace(/_/g, " ")}
                </span>
              </div>

              {/* Items */}
              <div className="px-5 py-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Items</p>
                {order.items?.map((item: any, i: number) => (
                  <p key={i} className="text-sm text-gray-700">
                    {item.quantity}× {item.title}
                  </p>
                ))}
                <p className="text-sm font-bold text-gray-900 mt-2">₹{order.totalAmount}</p>
              </div>

              {/* Customer Location Map */}
              {order.coordinates && (
                <div className="px-5 py-3 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Customer Location</p>
                  <Suspense fallback={<div className="h-36 bg-gray-100 rounded-xl animate-pulse" />}>
                    <LiveMap
                      deliveryLat={order.deliveryLocation?.lat || order.coordinates.lat}
                      deliveryLng={order.deliveryLocation?.lng || order.coordinates.lng}
                      customerLat={order.coordinates.lat}
                      customerLng={order.coordinates.lng}
                      height="160px"
                    />
                  </Suspense>
                </div>
              )}

              {/* Actions */}
              <div className="p-5 space-y-3">
                {order.status === "ASSIGNED" && (
                  <Button
                    onClick={() => updateStatus(order.id, "PICKUP_REQUESTED")}
                    className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl h-12"
                  >
                    <Package className="w-4 h-4 mr-2" /> Request Pickup from Restaurant
                  </Button>
                )}

                {order.status === "PICKUP_APPROVED" && (
                  <Button
                    onClick={() => updateStatus(order.id, "PICKED_UP")}
                    className="w-full bg-orange-600 hover:bg-orange-700 rounded-xl h-12"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Confirm Pickup
                  </Button>
                )}

                {order.status === "PICKED_UP" && (
                  <Button
                    onClick={() => {
                      updateStatus(order.id, "OUT_FOR_DELIVERY");
                      startRealGPSTracking(order.id);
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-700 rounded-xl h-12"
                  >
                    <Navigation className="w-4 h-4 mr-2" /> Start Delivery (GPS On)
                  </Button>
                )}

                {order.status === "OUT_FOR_DELIVERY" && (
                  <>
                    <div className="flex items-center gap-2 bg-purple-50 rounded-xl p-3 border border-purple-100">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                      <p className="text-sm text-purple-700 font-medium">
                        📡 GPS tracking {isTracking ? "active" : "— tap Start GPS"}
                      </p>
                    </div>
                    {!isTracking && (
                      <Button
                        onClick={() => startRealGPSTracking(order.id)}
                        variant="outline"
                        className="w-full border-purple-500 text-purple-600 rounded-xl h-11"
                      >
                        <Navigation className="w-4 h-4 mr-2" /> Start GPS Tracking
                      </Button>
                    )}
                    <Button
                      onClick={() => updateStatus(order.id, "ARRIVED")}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-xl h-12"
                    >
                      <MapPin className="w-4 h-4 mr-2" /> Arrived at Customer Location
                    </Button>
                  </>
                )}

                {order.status === "ARRIVED" && (
                  <div className="space-y-3 bg-orange-50 rounded-xl p-4 border border-orange-100">
                    <p className="text-sm font-semibold text-orange-800">Enter Customer OTP to complete delivery</p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="4-digit OTP"
                        maxLength={4}
                        value={otpInput[order.id] || ""}
                        onChange={(e) => setOtpInput({ ...otpInput, [order.id]: e.target.value.replace(/\D/g, "") })}
                        className="h-12 text-center text-xl font-bold tracking-widest rounded-xl"
                      />
                      <Button
                        onClick={() => handleVerifyOtp(order.id, order.otp || "1234")}
                        className="bg-green-600 hover:bg-green-700 rounded-xl h-12 px-6 font-bold"
                      >
                        Verify & Deliver
                      </Button>
                    </div>
                  </div>
                )}

                {order.status === "DELIVERED" && (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-xl p-3 border border-green-100">
                    <CheckCircle className="w-5 h-5" />
                    <p className="font-semibold">Order Delivered Successfully!</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {orders.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <Bike className="w-16 h-16 mx-auto mb-4 text-gray-200" />
            <p className="text-gray-400 text-lg">No active orders assigned to you.</p>
          </div>
        )}
      </div>
    </div>
  );
}

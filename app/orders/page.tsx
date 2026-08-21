"use client";

import { useEffect, useState, lazy, Suspense, useRef } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Loader2, Package, MapPin, CheckCircle, Clock, ChefHat, Bike, Star, Tag, BellRing, ArrowLeft, History } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Header from "@/components/header";

const LiveMap = lazy(() => import("@/components/live-map"));

const STATUS_STEPS = [
  { key: "PLACED", label: "Order Placed", icon: Package },
  { key: "CONFIRMED", label: "Confirmed", icon: CheckCircle },
  { key: "PREPARING", label: "Preparing", icon: ChefHat },
  { key: "OUT_FOR_DELIVERY", label: "On the Way", icon: Bike },
  { key: "DELIVERED", label: "Delivered", icon: Star },
];

const STATUS_ORDER = [
  "PENDING_PAYMENT",
  "PLACED",
  "CONFIRMED",
  "PREPARING",
  "READY_FOR_DELIVERY",
  "SELF_DELIVERY_SELECTED",
  "ASSIGNED",
  "PICKUP_REQUESTED",
  "PICKUP_APPROVED",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
  "ARRIVED",
  "DELIVERED",
];

function getStepIndex(status: string) {
  if (["PENDING_PAYMENT"].includes(status)) return -1;
  if (status === "PLACED") return 0;
  if (status === "CONFIRMED") return 1;
  if (["PREPARING", "READY_FOR_DELIVERY", "SELF_DELIVERY_SELECTED"].includes(status)) return 2;
  if (["ASSIGNED", "PICKUP_REQUESTED", "PICKUP_APPROVED", "PICKED_UP", "OUT_FOR_DELIVERY", "ARRIVED"].includes(status)) return 3;
  if (status === "DELIVERED") return 4;
  return 0;
}

function getStatusMessage(status: string) {
  const messages: Record<string, string> = {
    PENDING_PAYMENT: "Awaiting Payment...",
    PLACED: "Order placed! Waiting for restaurant confirmation.",
    CONFIRMED: "Restaurant confirmed your order ✓",
    PREPARING: "Chef is preparing your food 🍳",
    READY_FOR_DELIVERY: "Food is ready! Waiting for delivery partner.",
    SELF_DELIVERY_SELECTED: "Restaurant will deliver your order.",
    ASSIGNED: "Delivery partner assigned.",
    PICKUP_REQUESTED: "Delivery partner is heading to pick up.",
    PICKUP_APPROVED: "Pickup approved by restaurant.",
    PICKED_UP: "Order picked up! On the way.",
    OUT_FOR_DELIVERY: "🛵 Your order is on the way!",
    ARRIVED: "Delivery partner has arrived! Share your OTP.",
    DELIVERED: "Order delivered! Enjoy your meal 🎉",
    PAYMENT_FAILED: "Payment failed. Please try again.",
  };
  return messages[status] || status;
}

function StatusTimeline({ status }: { status: string }) {
  const activeStep = getStepIndex(status);
  return (
    <div className="flex items-center gap-0 w-full mt-4">
      {STATUS_STEPS.map((step, i) => {
        const Icon = step.icon;
        const isDone = i <= activeStep;
        const isActive = i === activeStep;
        return (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                  isDone
                    ? "bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-200"
                    : "bg-white border-gray-200 text-gray-300"
                } ${isActive ? "scale-110 ring-4 ring-orange-100" : ""}`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-[10px] font-medium text-center leading-tight ${isDone ? "text-orange-600" : "text-gray-300"}`}>
                {step.label}
              </span>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mb-4 transition-all ${i < activeStep ? "bg-orange-400" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [arrivedOrder, setArrivedOrder] = useState<any>(null);
  const [userName, setUserName] = useState("Guest");
  const previousStatuses = useRef<Record<string, string>>({});

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserName(user.displayName || "Foodie");
        const q = query(collection(db, "orders"), where("userId", "==", user.uid));
        const unsubscribeOrders = onSnapshot(
          q,
          (snapshot) => {
            const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as any));
            data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            
            // Check for status changes to trigger notifications
            data.forEach((order) => {
              const prevStatus = previousStatuses.current[order.id];
              
              // If status changed
              if (prevStatus && prevStatus !== order.status) {
                if (order.status === "ARRIVED") {
                   toast.success("Delivery partner has arrived!");
                   setArrivedOrder(order);
                } else if (order.status === "DELIVERED") {
                   toast.success(`Order #${order.id.slice(-6).toUpperCase()} delivered successfully!`);
                   if (arrivedOrder?.id === order.id) setArrivedOrder(null);
                } else {
                   toast.info(`Order #${order.id.slice(-6).toUpperCase()}: ${getStatusMessage(order.status)}`);
                }
              }
              
              // Initial load logic: If we load and there's an active ARRIVED order that hasn't been dismissed, show the popup.
              if (!prevStatus && order.status === "ARRIVED" && !arrivedOrder) {
                  setArrivedOrder(order);
              }

              previousStatuses.current[order.id] = order.status;
            });

            setOrders(data);
            setLoading(false);
          },
          () => setLoading(false)
        );
        return () => unsubscribeOrders();
      } else {
        setOrders([]);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      
      {/* Dashboard Top Banner */}
      <div className="bg-gradient-to-r from-gray-900 to-black text-white pt-24 pb-16 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute w-96 h-96 bg-orange-500 rounded-full blur-[100px] -top-20 -left-20"></div>
          <div className="absolute w-96 h-96 bg-yellow-500 rounded-full blur-[100px] top-40 -right-20"></div>
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm border border-white/20">
            <History className="w-8 h-8 text-orange-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-2 tracking-tight">
            Hi, <span className="text-orange-500">{userName}!</span> 👋
          </h1>
          <p className="text-gray-400 text-lg md:text-xl font-medium max-w-lg">
            Track your active orders in real-time or review your past cravings.
          </p>
        </div>
      </div>
      {/* OTP Popup Notification */}
      <Dialog open={!!arrivedOrder} onOpenChange={(open) => !open && setArrivedOrder(null)}>
        <DialogContent className="sm:max-w-md text-center border-orange-200">
          <DialogHeader>
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
              <BellRing className="w-8 h-8 text-orange-600 animate-bounce" />
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900 text-center">Delivery Arrived!</DialogTitle>
            <DialogDescription className="text-center text-gray-600 mt-2">
              Your delivery partner is at your location. Please share this OTP to receive your order.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-orange-50 p-6 rounded-2xl border-2 border-dashed border-orange-300 my-4">
            <p className="text-sm font-semibold text-orange-800 uppercase tracking-wider mb-2">Your Secret OTP</p>
            <p className="text-5xl font-extrabold text-orange-600 tracking-[0.25em]">{arrivedOrder?.otp || "----"}</p>
          </div>
          
          <div className="flex flex-col gap-2">
             <Button onClick={() => setArrivedOrder(null)} className="w-full bg-orange-600 hover:bg-orange-700 h-12 text-lg font-semibold rounded-xl shadow-md">
               Got it
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 -mt-8 relative z-20">
        <div className="space-y-6">
          {orders.map((order) => {
            const isLive = ["OUT_FOR_DELIVERY", "ARRIVED"].includes(order.status);
            const showOTP = ["OUT_FOR_DELIVERY", "ARRIVED"].includes(order.status) && order.otp;
            const hasMap = isLive && order.deliveryLocation;

            return (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-start p-6 border-b border-gray-100">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">Order #{order.id.slice(-6).toUpperCase()}</h3>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {new Date(order.createdAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-extrabold text-gray-900">₹{order.totalAmount || order.subtotal}</p>
                    {order.deliveryCharge === 0 && order.coordinates && (
                      <p className="text-xs text-green-600 font-medium">Free Delivery 🎉</p>
                    )}
                  </div>
                </div>

                {/* Status + Timeline */}
                <div className="px-6 py-4">
                  <div
                    className={`flex items-start gap-3 rounded-xl p-4 ${
                      order.status === "DELIVERED"
                        ? "bg-green-50 border border-green-100"
                        : isLive
                        ? "bg-orange-50 border border-orange-100 animate-pulse"
                        : "bg-gray-50 border border-gray-100"
                    }`}
                  >
                    <div className="flex-1">
                      <p className={`font-bold ${order.status === "DELIVERED" ? "text-green-800" : "text-gray-800"}`}>
                        {getStatusMessage(order.status)}
                      </p>
                      {showOTP && (
                        <div className="mt-2 bg-white border border-orange-200 rounded-xl px-4 py-2 inline-block">
                          <p className="text-xs text-gray-500 font-medium mb-0.5">Share this OTP with delivery partner:</p>
                          <p className="font-extrabold text-3xl text-orange-600 tracking-[0.3em]">{order.otp}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Timeline */}
                  {order.status !== "PENDING_PAYMENT" && order.status !== "PAYMENT_FAILED" && (
                    <StatusTimeline status={order.status} />
                  )}
                </div>

                {/* Live Map */}
                {hasMap && (
                  <div className="px-6 pb-4">
                    <p className="text-xs font-semibold text-orange-600 mb-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3 animate-bounce" /> Live Delivery Tracking
                    </p>
                    <Suspense fallback={<div className="h-48 bg-gray-100 rounded-xl animate-pulse" />}>
                      <LiveMap
                        deliveryLat={order.deliveryLocation.lat}
                        deliveryLng={order.deliveryLocation.lng}
                        customerLat={order.coordinates?.lat}
                        customerLng={order.coordinates?.lng}
                        height="220px"
                      />
                    </Suspense>
                  </div>
                )}

                {/* Items */}
                <div className="px-6 pb-4 space-y-1">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Items</p>
                  {order.items?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm text-gray-600">
                      <span>{item.quantity}× {item.title}</span>
                      <span>₹{Number(String(item.price).replace(/[^0-9.]/g, "")) * item.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Amount Breakdown */}
                <div className="px-6 pb-5 border-t border-gray-100 pt-3 space-y-1">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal</span>
                    <span>₹{order.subtotal || order.totalAmount}</span>
                  </div>
                  {typeof order.deliveryCharge === "number" && (
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Delivery</span>
                      <span>{order.deliveryCharge === 0 ? "FREE" : `₹${order.deliveryCharge}`}</span>
                    </div>
                  )}
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 font-medium">
                      <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {order.couponCode}</span>
                      <span>− ₹{order.discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-100">
                    <span>Total Paid</span>
                    <span>₹{order.totalAmount}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {orders.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-200" />
              <p className="text-xl text-gray-400 mb-4">You haven't placed any orders yet.</p>
              <Link href="/">
                <Button className="bg-orange-600 hover:bg-orange-700 rounded-xl">Browse Menu</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

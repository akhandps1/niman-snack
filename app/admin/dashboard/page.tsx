"use client";

import { useEffect, useState, lazy, Suspense } from "react";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Phone, Tag, MapPin, ChefHat, Bike, CheckCircle2, Package, IndianRupee, ShoppingBag, Activity, CalendarDays } from "lucide-react";

const LiveMap = lazy(() => import("@/components/live-map"));

const STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: "bg-gray-100 text-gray-600",
  PLACED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-indigo-100 text-indigo-700",
  PREPARING: "bg-orange-100 text-orange-700",
  READY_FOR_DELIVERY: "bg-yellow-100 text-yellow-700",
  ASSIGNED: "bg-purple-100 text-purple-700",
  OUT_FOR_DELIVERY: "bg-violet-100 text-violet-700",
  ARRIVED: "bg-pink-100 text-pink-700",
  DELIVERED: "bg-green-100 text-green-700",
  PAYMENT_FAILED: "bg-red-100 text-red-700",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [deliveryPartners, setDeliveryPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      () => setLoading(false)
    );

    const fetchPartners = async () => {
      const qp = query(collection(db, "users"), where("role", "==", "delivery"));
      const snap = await getDocs(qp);
      setDeliveryPartners(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    fetchPartners();

    return () => unsub();
  }, []);

  const updateOrderStatus = async (orderId: string, status: string, extra: any = {}) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status,
        updatedAt: new Date().toISOString(),
        ...extra,
      });
      toast.success(`Order updated → ${status.replace(/_/g, " ")}`);
    } catch {
      toast.error("Failed to update order.");
    }
  };

  const assignDelivery = async (orderId: string, partnerId: string) => {
    const partner = deliveryPartners.find((p) => p.id === partnerId);
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: "ASSIGNED",
        assignedDeliveryId: partnerId,
        assignedDeliveryName: partner?.displayName || partner?.email || "Partner",
        updatedAt: new Date().toISOString(),
      });
      toast.success("Delivery partner assigned!");
    } catch {
      toast.error("Failed to assign partner.");
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;
  }

  // Analytics Calculations
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  
  const todayOrders = orders.filter(o => new Date(o.createdAt).getTime() >= startOfToday.getTime());
  const todaysRevenue = todayOrders.reduce((sum, o) => o.status !== "PAYMENT_FAILED" ? sum + Number(o.totalAmount || 0) : sum, 0);
  const activeOrdersCount = orders.filter(o => o.status !== "DELIVERED" && o.status !== "PAYMENT_FAILED").length;
  const totalRevenue = orders.reduce((sum, o) => o.status !== "PAYMENT_FAILED" ? sum + Number(o.totalAmount || 0) : sum, 0);

  return (
    <div className="space-y-8">
      {/* Welcome & Branding Section */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-br from-orange-50/50 to-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase shadow-sm">
              Niman Snacks Bar Admin
            </span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              <CalendarDays className="w-3.5 h-3.5" />
              {currentTime.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })} — {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
            {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">Partner!</span> 👋
          </h1>
          <p className="text-gray-500 mt-2 text-sm max-w-md">
            Here's what's happening with your business today. Monitor orders, assign deliveries, and track revenue.
          </p>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Revenue */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:border-orange-200 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <IndianRupee className="w-16 h-16 text-green-600" />
          </div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="bg-green-100 p-2.5 rounded-xl text-green-600 shadow-sm">
              <IndianRupee className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Today's Sales</h3>
          </div>
          <div className="relative z-10">
            <p className="text-3xl font-black text-gray-900">₹{todaysRevenue.toLocaleString('en-IN')}</p>
            <p className="text-xs font-medium text-green-600 mt-1">From {todayOrders.length} orders today</p>
          </div>
        </div>

        {/* Active Orders */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:border-blue-200 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="w-16 h-16 text-blue-600" />
          </div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600 shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Active Orders</h3>
          </div>
          <div className="relative z-10">
            <p className="text-3xl font-black text-gray-900">{activeOrdersCount}</p>
            <p className="text-xs font-medium text-blue-600 mt-1">Needs your attention</p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:border-purple-200 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShoppingBag className="w-16 h-16 text-purple-600" />
          </div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="bg-purple-100 p-2.5 rounded-xl text-purple-600 shadow-sm">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Orders</h3>
          </div>
          <div className="relative z-10">
            <p className="text-3xl font-black text-gray-900">{orders.length}</p>
            <p className="text-xs font-medium text-purple-600 mt-1">All-time record</p>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:border-orange-200 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <IndianRupee className="w-16 h-16 text-orange-600" />
          </div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="bg-orange-100 p-2.5 rounded-xl text-orange-600 shadow-sm">
              <IndianRupee className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Revenue</h3>
          </div>
          <div className="relative z-10">
            <p className="text-3xl font-black text-gray-900">₹{totalRevenue.toLocaleString('en-IN')}</p>
            <p className="text-xs font-medium text-orange-600 mt-1">Lifetime earnings</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-end mb-2 mt-8">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
          <p className="text-sm text-gray-500 mt-1">Manage all your active and past orders</p>
        </div>
      </div>

      <div className="space-y-5">
        {orders.map((order) => {
          const hasLiveMap = ["OUT_FOR_DELIVERY", "ARRIVED"].includes(order.status) && order.deliveryLocation;
          return (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start p-5 border-b border-gray-100 gap-4 sm:gap-0">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-lg text-gray-900">#{order.id.slice(-6).toUpperCase()}</h3>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>
                      {order.status?.replace(/_/g, " ")}
                    </span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${order.deliveryType === 'PICKUP' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                      {order.deliveryType === 'PICKUP' ? '🛒 Store Pickup' : '🛵 Home Delivery'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {new Date(order.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-gray-400" /> {order.address}
                  </p>
                  {order.phone && (
                    <a href={`tel:${order.phone}`} className="text-sm text-blue-600 font-medium mt-0.5 flex items-center gap-1 hover:underline">
                      <Phone className="w-3 h-3" /> {order.phone}
                    </a>
                  )}
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto mt-2 sm:mt-0">
                  <p className="text-2xl font-extrabold text-gray-900">₹{order.totalAmount}</p>
                  {order.deliveryCharge === 0 && order.coordinates && (
                    <p className="text-xs text-green-600">Free Delivery</p>
                  )}
                  {order.deliveryCharge > 0 && (
                    <p className="text-xs text-gray-400">+₹{order.deliveryCharge} delivery</p>
                  )}
                  {order.discountAmount > 0 && (
                    <p className="text-xs text-green-600 flex items-center gap-1 justify-start sm:justify-end mt-1">
                      <Tag className="w-3 h-3" /> −₹{order.discountAmount} ({order.couponCode})
                    </p>
                  )}
                  <div className="mt-2 flex justify-start sm:justify-end">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md border ${order.paymentMethod === 'CASH' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                      {order.paymentMethod === 'CASH' ? '🟠 To Pay (Cash)' : '🟢 Paid Online'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="px-5 py-3 border-b border-gray-100">
                <div className="flex flex-wrap gap-2">
                  {order.items?.map((item: any, i: number) => (
                    <span key={i} className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full font-medium">
                      {item.quantity}× {item.title}
                    </span>
                  ))}
                </div>
              </div>

              {/* Live Map for active deliveries */}
              {hasLiveMap && (
                <div className="px-5 py-3 border-b border-gray-100">
                  <p className="text-xs font-semibold text-orange-600 mb-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3 animate-bounce" /> Live Tracking
                  </p>
                  <Suspense fallback={<div className="h-36 bg-gray-100 rounded-xl animate-pulse" />}>
                    <LiveMap
                      deliveryLat={order.deliveryLocation.lat}
                      deliveryLng={order.deliveryLocation.lng}
                      customerLat={order.coordinates?.lat}
                      customerLng={order.coordinates?.lng}
                      height="160px"
                    />
                  </Suspense>
                </div>
              )}

              {/* Actions */}
              <div className="p-5 flex flex-wrap gap-3">
                {order.status === "PLACED" && (
                  <Button onClick={() => updateOrderStatus(order.id, "CONFIRMED")} className="bg-blue-600 hover:bg-blue-700 rounded-xl gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Confirm Order
                  </Button>
                )}

                {order.status === "CONFIRMED" && (
                  <Button onClick={() => updateOrderStatus(order.id, "PREPARING")} className="bg-orange-500 hover:bg-orange-600 rounded-xl gap-2">
                    <ChefHat className="w-4 h-4" /> Start Preparing
                  </Button>
                )}

                {order.status === "PREPARING" && (
                  <Button onClick={() => updateOrderStatus(order.id, "READY_FOR_DELIVERY")} className="bg-yellow-500 hover:bg-yellow-600 rounded-xl gap-2">
                    <Package className="w-4 h-4" /> Mark Ready
                  </Button>
                )}

                {order.status === "READY_FOR_DELIVERY" && (
                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <Button
                      onClick={() => updateOrderStatus(order.id, "DELIVERED")}
                      className={`${order.paymentMethod === 'CASH' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'} rounded-xl gap-2`}
                    >
                      <CheckCircle2 className="w-4 h-4" /> {order.paymentMethod === 'CASH' ? 'Collect Cash & Hand Over' : 'Hand Over (Customer Pickup)'}
                    </Button>
                    {order.deliveryType !== 'PICKUP' && (
                      <div className="flex-1">
                        <Select onValueChange={(val) => assignDelivery(order.id, val)}>
                          <SelectTrigger className="h-10 rounded-xl bg-white border-gray-200">
                            <SelectValue placeholder="Assign Delivery Partner" />
                          </SelectTrigger>
                          <SelectContent>
                            {deliveryPartners.length === 0 ? (
                              <SelectItem value="none" disabled>No partners available</SelectItem>
                            ) : (
                              deliveryPartners.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.displayName || p.email}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}


                {order.status === "PICKUP_REQUESTED" && (
                  <Button onClick={() => updateOrderStatus(order.id, "PICKUP_APPROVED")} className="bg-green-600 hover:bg-green-700 rounded-xl gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Approve Pickup
                  </Button>
                )}

                {order.status === "DELIVERED" && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-semibold">Delivered ✓</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {orders.length === 0 && (
          <div className="text-center text-gray-400 py-16 bg-white rounded-2xl border border-dashed border-gray-200">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p>No orders yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

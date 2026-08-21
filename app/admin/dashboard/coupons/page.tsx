"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, doc, setDoc, deleteDoc, addDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Tag, Plus, Trash2, Loader2, Copy, CheckCircle2, Clock } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  discountType: "flat" | "percentage";
  discountValue: number;
  maxDiscount?: number;
  minOrderValue: number;
  expiresAt: string;
  isActive: boolean;
  usageCount: number;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"flat" | "percentage">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("0");
  const [expiresAt, setExpiresAt] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "coupons"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setCoupons(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Coupon)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const resetForm = () => {
    setCode("");
    setDiscountType("percentage");
    setDiscountValue("");
    setMaxDiscount("");
    setMinOrderValue("0");
    setExpiresAt("");
    setIsActive(true);
  };

  const handleSave = async () => {
    if (!code.trim()) return toast.error("Coupon code is required.");
    if (!discountValue || Number(discountValue) <= 0) return toast.error("Discount value must be positive.");
    if (!expiresAt) return toast.error("Expiry date is required.");

    setSaving(true);
    try {
      const payload: any = {
        code: code.trim().toUpperCase(),
        discountType,
        discountValue: Number(discountValue),
        minOrderValue: Number(minOrderValue) || 0,
        expiresAt: new Date(expiresAt).toISOString(),
        isActive,
        usageCount: 0,
        createdAt: new Date().toISOString(),
      };
      if (discountType === "percentage" && maxDiscount) {
        payload.maxDiscount = Number(maxDiscount);
      }
      await addDoc(collection(db, "coupons"), payload);
      toast.success(`Coupon "${payload.code}" created!`);
      resetForm();
      setIsModalOpen(false);
    } catch {
      toast.error("Failed to create coupon.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    try {
      await doc(db, "coupons", coupon.id);
      const ref = doc(db, "coupons", coupon.id);
      await setDoc(ref, { isActive: !coupon.isActive }, { merge: true });
      toast.success(`Coupon ${coupon.isActive ? "deactivated" : "activated"}.`);
    } catch {
      toast.error("Failed to update coupon.");
    }
  };

  const deleteCoupon = async (id: string, code: string) => {
    if (!confirm(`Delete coupon "${code}"?`)) return;
    try {
      await deleteDoc(doc(db, "coupons", id));
      toast.success("Coupon deleted.");
    } catch {
      toast.error("Failed to delete coupon.");
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied "${code}"!`);
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Coupon Management</h1>
          <p className="text-gray-500 mt-1">Create and manage discount coupons for your customers.</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700 rounded-xl gap-2">
              <Plus className="w-4 h-4" /> Create Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Tag className="w-5 h-5 text-orange-500" /> New Coupon
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1">
                <Label>Coupon Code <span className="text-orange-500">*</span></Label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ""))}
                  placeholder="e.g. NIMAN20"
                  className="h-11 rounded-xl font-mono tracking-wider"
                />
              </div>

              <div className="space-y-1">
                <Label>Discount Type <span className="text-orange-500">*</span></Label>
                <Select value={discountType} onValueChange={(v: any) => setDiscountType(v)}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%) off</SelectItem>
                    <SelectItem value="flat">Flat (₹) off</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Discount Value <span className="text-orange-500">*</span></Label>
                  <Input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === "percentage" ? "e.g. 20" : "e.g. 50"}
                    className="h-11 rounded-xl"
                  />
                </div>
                {discountType === "percentage" && (
                  <div className="space-y-1">
                    <Label>Max Discount (₹)</Label>
                    <Input
                      type="number"
                      value={maxDiscount}
                      onChange={(e) => setMaxDiscount(e.target.value)}
                      placeholder="e.g. 100"
                      className="h-11 rounded-xl"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Min Order (₹)</Label>
                  <Input
                    type="number"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(e.target.value)}
                    placeholder="0"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Expiry Date <span className="text-orange-500">*</span></Label>
                  <Input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                <Label>Active</Label>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>

              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full h-12 bg-orange-600 hover:bg-orange-700 rounded-xl font-bold"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Create Coupon
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {coupons.map((coupon) => {
          const expired = isExpired(coupon.expiresAt);
          return (
            <div
              key={coupon.id}
              className={`bg-white rounded-2xl border p-5 space-y-4 transition-all ${
                !coupon.isActive || expired ? "opacity-60 border-gray-200" : "border-orange-100 shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-2 rounded-xl">
                    <Tag className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-xl text-gray-900 font-mono tracking-wider">{coupon.code}</h3>
                      <button onClick={() => copyCode(coupon.code)} className="text-gray-400 hover:text-orange-500 transition-colors">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {expired ? (
                        <span className="text-xs text-red-500 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Expired
                        </span>
                      ) : coupon.isActive ? (
                        <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">Inactive</span>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={() => deleteCoupon(coupon.id, coupon.code)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-orange-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 font-medium">Discount</p>
                  <p className="text-lg font-bold text-orange-600">
                    {coupon.discountType === "percentage"
                      ? `${coupon.discountValue}%`
                      : `₹${coupon.discountValue}`} OFF
                  </p>
                  {coupon.maxDiscount && (
                    <p className="text-xs text-gray-400">Max ₹{coupon.maxDiscount}</p>
                  )}
                </div>
                <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                  <p className="text-xs text-gray-500 font-medium">Min Order</p>
                  <p className="font-bold text-gray-700">₹{coupon.minOrderValue}</p>
                  <p className="text-xs text-gray-400">Used: {coupon.usageCount || 0}×</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Expires: {new Date(coupon.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
                <Switch
                  checked={coupon.isActive && !expired}
                  onCheckedChange={() => !expired && toggleActive(coupon)}
                  disabled={expired}
                />
              </div>
            </div>
          );
        })}
        {coupons.length === 0 && (
          <div className="col-span-2 text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
            <Tag className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400 text-lg">No coupons yet. Create your first one!</p>
          </div>
        )}
      </div>
    </div>
  );
}

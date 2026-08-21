"use client";

import { useState, useEffect } from "react";
import { collection, query, onSnapshot, setDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Mail, User as UserIcon } from "lucide-react";

interface DeliveryPartner {
  id: string;
  email: string;
  name: string;
  addedAt: string;
}

export default function ManageStaffPage() {
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  
  // New Partner Form
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");

  useEffect(() => {
    const q = query(collection(db, "delivery_partners"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DeliveryPartner[];
      setPartners(data);
      setLoading(false);
    }, (error) => {
      console.error("Failed to fetch staff:", error);
      toast.error("Failed to load staff list. Check permissions.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newName) return;
    setAdding(true);

    try {
      // Use the email as the document ID to prevent duplicates and make lookups fast
      const safeId = newEmail.toLowerCase().replace(/[^a-z0-9]/g, '_');
      await setDoc(doc(db, "delivery_partners", safeId), {
        email: newEmail.toLowerCase(),
        name: newName,
        addedAt: new Date().toISOString()
      });
      
      toast.success("Delivery partner added!");
      setNewEmail("");
      setNewName("");
    } catch (error: any) {
      toast.error(error.message || "Failed to add partner");
    } finally {
      setAdding(false);
    }
  };

  const handleRemovePartner = async (id: string) => {
    if (!confirm("Are you sure you want to remove this partner? They will no longer be able to log in as delivery.")) return;
    
    try {
      await deleteDoc(doc(db, "delivery_partners", id));
      toast.success("Partner removed");
    } catch (error) {
      toast.error("Failed to remove partner");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold text-[#e87a1e] tracking-tight">Manage Staff</h1>
        <p className="text-gray-500 mt-2">Add or remove approved Delivery Partners.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Plus className="w-5 h-5 text-[#e87a1e] mr-2" /> Add New Partner
        </h2>
        
        <form onSubmit={handleAddPartner} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="space-y-2 md:col-span-5">
            <Label htmlFor="name" className="text-gray-700">Full Name</Label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="name"
                placeholder="Rider Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="pl-10 h-11 bg-gray-50 border-gray-200 focus:ring-[#e87a1e] focus:border-[#e87a1e]"
                required
              />
            </div>
          </div>
          <div className="space-y-2 md:col-span-5">
            <Label htmlFor="email" className="text-gray-700">Email Address (Google Account)</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="rider@gmail.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="pl-10 h-11 bg-gray-50 border-gray-200 focus:ring-[#e87a1e] focus:border-[#e87a1e]"
                required
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <Button 
              type="submit" 
              disabled={adding}
              className="w-full h-11 bg-[#1ba54f] hover:bg-[#158740] text-white rounded-xl shadow-md transition-all duration-300"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Partner"}
            </Button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Approved Partners</h2>
        </div>
        
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 text-[#e87a1e] animate-spin" />
          </div>
        ) : partners.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No delivery partners added yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {partners.map((partner) => (
              <div key={partner.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-[#fdf3eb] flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-[#e87a1e]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{partner.name}</h3>
                    <p className="text-sm text-gray-500">{partner.email}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full"
                  onClick={() => handleRemovePartner(partner.id)}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

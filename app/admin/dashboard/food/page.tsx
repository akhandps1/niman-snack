"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Image from "next/image";
import { Loader2, Plus, Pencil, Trash2, Star } from "lucide-react";
import WhatsAppButton from "@/components/whatsapp-button";
import GlobalLoader from "@/components/global-loader";

interface FoodItem {
  id: string;
  title: string;
  description: string;
  price: string;
  imageUrl: string;
  badge?: string; // e.g. "Authentic, Traditional, Free Delivery"
  isActive: boolean;
  category: "Veg" | "Non-Veg";
  isSignature: boolean;
}

export default function FoodManager() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [badge, setBadge] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [category, setCategory] = useState<"Veg" | "Non-Veg">("Veg");
  const [isSignature, setIsSignature] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchFoods = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "food_items"));
      const items: FoodItem[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        items.push({ 
          id: doc.id, 
          ...data,
          // Handle old documents that might not have these fields
          category: data.category || "Veg",
          isSignature: data.isSignature || false
        } as FoodItem);
      });
      setFoods(items);
    } catch (error) {
      console.error("Error fetching foods:", error);
      toast.error("Failed to load food items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setPrice("");
    setBadge("");
    setIsActive(true);
    setCategory("Veg");
    setIsSignature(false);
    setImageUrl("");
    setFile(null);
  };

  const handleEdit = (item: FoodItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setDescription(item.description);
    setPrice(item.price);
    setBadge(item.badge || "");
    setIsActive(item.isActive ?? true);
    setCategory(item.category || "Veg");
    setIsSignature(item.isSignature || false);
    setImageUrl(item.imageUrl);
    setFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await deleteDoc(doc(db, "food_items", id));
      toast.success("Food item deleted");
      fetchFoods();
    } catch (error) {
      toast.error("Failed to delete item");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let finalImageUrl = imageUrl;
      if (file) {
        toast.info("Uploading image...");
        finalImageUrl = await uploadImageToCloudinary(file);
      }

      if (!finalImageUrl) {
        toast.error("An image is required");
        setSaving(false);
        return;
      }

      const itemId = editingId || Date.now().toString();
      const docRef = doc(db, "food_items", itemId);
      
      await setDoc(docRef, {
        title,
        description,
        price,
        badge,
        isActive,
        category,
        isSignature,
        imageUrl: finalImageUrl,
      }, { merge: true });

      toast.success(`Food item ${editingId ? "updated" : "added"} successfully!`);
      setIsModalOpen(false);
      resetForm();
      fetchFoods();
    } catch (error: any) {
      toast.error(error.message || "Failed to save food item");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <GlobalLoader fullScreen={false} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Food Menu Manager</h1>
          <p className="text-gray-500 font-medium mt-2">Manage the food items displayed on your website.</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-[#e87a1e] hover:bg-[#d66a15] text-white shadow-md font-bold transition-all hover:shadow-lg hover:-translate-y-0.5">
              <Plus className="w-4 h-4 mr-2" /> Add New Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{editingId ? "Edit Food Item" : "Add New Food Item"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold text-gray-700">Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Samosa" className="focus-visible:ring-[#e87a1e] rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-gray-700">Category</Label>
                  <Select value={category} onValueChange={(value: "Veg" | "Non-Veg") => setCategory(value)}>
                    <SelectTrigger className="focus:ring-[#e87a1e] rounded-xl">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Veg">Veg</SelectItem>
                      <SelectItem value="Non-Veg">Non-Veg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="font-bold text-gray-700">Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="Short description..." className="focus-visible:ring-[#e87a1e] rounded-xl" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold text-gray-700">Price Text</Label>
                  <Input value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="₹25" className="focus-visible:ring-[#e87a1e] rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-gray-700">Badges (Comma separated)</Label>
                  <Input value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="Authentic, Popular, Free Delivery" className="focus-visible:ring-[#e87a1e] rounded-xl" />
                </div>
              </div>

              <div className="flex flex-col gap-4 p-5 border border-gray-100 rounded-2xl bg-[#faf9f5]">
                <div className="flex items-center space-x-3">
                  <Switch checked={isActive} onCheckedChange={setIsActive} className="data-[state=checked]:bg-[#1ba54f]" />
                  <Label className="font-bold text-base text-gray-800">Visible on Website</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Switch checked={isSignature} onCheckedChange={setIsSignature} className="data-[state=checked]:bg-[#e87a1e]" />
                  <div>
                    <Label className="font-bold text-base text-gray-800">Signature Dish</Label>
                    <p className="text-xs font-medium text-gray-500">This item will be featured prominently at the top of the homepage.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label className="font-bold text-gray-700">Image</Label>
                {imageUrl && !file && (
                  <div className="relative w-full h-48 rounded-xl overflow-hidden border mb-2 shadow-sm">
                    <Image src={imageUrl} alt="Preview" fill className="object-cover" />
                  </div>
                )}
                {file && (
                  <div className="relative w-full h-48 rounded-xl overflow-hidden border mb-2 shadow-sm">
                    <Image src={URL.createObjectURL(file)} alt="Preview" fill className="object-cover" />
                  </div>
                )}
                <Input type="file" accept="image/*" className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-[#fdf3eb] file:text-[#e87a1e] hover:file:bg-[#e87a1e] hover:file:text-white rounded-xl h-12" onChange={(e) => {
                  if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
                }} required={!imageUrl} />
              </div>
              
              <Button type="submit" disabled={saving} className="w-full bg-[#e87a1e] hover:bg-[#d66a15] text-white shadow-md font-bold rounded-xl h-12 mt-4">
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Item"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {foods.length === 0 ? (
          <p className="text-gray-500 font-medium col-span-full bg-white p-8 rounded-2xl border border-dashed border-gray-200 text-center">No food items found. Create one to get started.</p>
        ) : (
          foods.map((item) => {
            const isItemVeg = item.category === 'Veg';
            const itemThemeText = isItemVeg ? 'text-[#1ba54f]' : 'text-[#da291c]';
            const itemThemeBg = isItemVeg ? 'bg-[#1ba54f]' : 'bg-[#da291c]';
            const itemThemeHover = isItemVeg ? 'hover:bg-[#158c42]' : 'hover:bg-[#b81d12]';
            const itemThemeBgLight = isItemVeg ? 'bg-[#f0f9f4]' : 'bg-[#fcebea]';

            return (
              <Card key={item.id} className={`overflow-hidden border-none shadow-md transition-all duration-300 rounded-xl bg-white flex flex-col h-full relative ${!item.isActive ? 'opacity-60 grayscale' : ''}`}>
                {!item.isActive && (
                  <div className="absolute inset-0 z-30 bg-black/5 flex items-center justify-center pointer-events-none">
                    <div className="bg-black/80 text-white px-4 py-2 rounded-full font-bold shadow-lg">Hidden on Website</div>
                  </div>
                )}
                {item.isSignature && (
                  <div className="absolute top-3 right-3 z-20 bg-[#e87a1e] text-white text-xs px-3 py-1 rounded-full font-bold shadow-md">
                    Signature
                  </div>
                )}
                
                {/* Image Area */}
                <div className="h-56 relative overflow-hidden shrink-0">
                  <Image src={item.imageUrl} alt={item.title} fill className="object-cover" />
                  {/* Top Left Category Badge */}
                  <div className={`absolute top-3 left-3 ${itemThemeBg} text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center z-10`}>
                    <span className="w-1.5 h-1.5 bg-white rounded-full mr-1.5"></span>
                    {item.category}
                  </div>
                </div>
                
                {/* Content Area */}
                <CardContent className="p-5 flex flex-col flex-grow bg-white z-10 relative">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-900 pr-4">
                      {item.title}
                    </h3>
                    <span className={`text-xl font-bold ${itemThemeText} shrink-0`}>
                      ₹{item.price.replace(/[^0-9]/g, '')}
                    </span>
                  </div>
                  
                  <p className="text-gray-500 text-sm leading-relaxed mb-4 flex-grow line-clamp-2">
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
                  
                  <div className="mt-auto">
                    <WhatsAppButton 
                      number="+918800218121" 
                      message={`Hi! I'd like to order ${item.title} from Niman Snacks Bar.`} 
                      className={`w-full justify-center ${itemThemeBg} ${itemThemeHover} text-white rounded-md h-10 shadow-sm transition-all text-sm font-medium`}
                    />
                  </div>

                  {/* Admin Actions */}
                  <div className="flex gap-3 mt-4 pt-4 border-t border-dashed border-gray-200">
                    <Button variant="outline" size="sm" className="flex-1 rounded-lg border-gray-200 hover:bg-[#faf9f5]" onClick={() => handleEdit(item)}>
                      <Pencil className="w-4 h-4 mr-2" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-none px-4 rounded-lg border-red-200 text-[#da291c] hover:bg-[#fcebea] hover:text-[#da291c]" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

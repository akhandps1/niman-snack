"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import GlobalLoader from "@/components/global-loader";
import { toast } from "sonner";
import Image from "next/image";
import { Loader2, Trash2, Save } from "lucide-react";

export default function HeroManager() {
  const [title, setTitle] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchHeroData = async () => {
    try {
      const docRef = doc(db, "hero_section", "main");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTitle(data.title || "");
        setWhatsappNumber(data.whatsappNumber || "");
        setWhatsappMessage(data.whatsappMessage || "");
        setImageUrl(data.imageUrl || "");
      } else {
        // Reset states if no data exists
        setTitle("");
        setWhatsappNumber("");
        setWhatsappMessage("");
        setImageUrl("");
      }
    } catch (error) {
      console.error("Error fetching hero data:", error);
      toast.error("Failed to load hero section data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeroData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let finalImageUrl = imageUrl;

      if (file) {
        toast.info("Uploading image to Cloudinary...");
        finalImageUrl = await uploadImageToCloudinary(file);
        setImageUrl(finalImageUrl);
      }

      if (!finalImageUrl && !title) {
        toast.error("Title or Image is required");
        setSaving(false);
        return;
      }

      const docRef = doc(db, "hero_section", "main");
      await setDoc(docRef, {
        title,
        whatsappNumber,
        whatsappMessage,
        imageUrl: finalImageUrl,
      }, { merge: true });

      toast.success("Hero section updated successfully!");
      setFile(null); // Reset file input
    } catch (error: any) {
      console.error("Error saving hero data:", error);
      toast.error(error.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to reset the hero section to default? This will delete your custom settings.")) {
      return;
    }
    
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "hero_section", "main"));
      toast.success("Hero section reset to defaults.");
      setFile(null);
      await fetchHeroData(); // Will reset local state to empty
    } catch (error: any) {
      console.error("Error deleting hero data:", error);
      toast.error(error.message || "Failed to reset hero section");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <GlobalLoader fullScreen={false} />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Hero Section Manager</h1>
        <p className="text-slate-500 mt-2 text-lg">
          Update the main banner of your website. These changes reflect instantly on the homepage.
        </p>
      </div>

      <Card className="border-none shadow-lg overflow-hidden rounded-3xl bg-white">
        <CardHeader className="bg-[#faf9f5] border-b border-gray-100 pb-6 px-6 sm:px-8 pt-8">
          <CardTitle className="text-2xl font-bold text-gray-900">Hero Content</CardTitle>
          <CardDescription className="text-base font-medium text-gray-500">Leave fields blank to use the default homepage values.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSave} className="space-y-8">
            <div className="space-y-3">
              <Label htmlFor="title" className="text-base font-bold text-gray-700">Main Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Flavors That Feel Like Home"
                className="h-14 text-lg rounded-xl bg-[#faf9f5] border-gray-200 focus-visible:ring-[#e87a1e] focus-visible:border-[#e87a1e] transition-colors"
              />
              <p className="text-sm font-medium text-gray-500">The big bold text at the center of the hero image.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#faf9f5] p-6 rounded-2xl border border-gray-100">
              <div className="space-y-3">
                <Label htmlFor="whatsappNumber" className="text-base font-bold text-gray-700">WhatsApp Number</Label>
                <Input
                  id="whatsappNumber"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="+918800218121"
                  className="h-12 rounded-xl bg-white border-gray-200 focus-visible:ring-[#e87a1e] focus-visible:border-[#e87a1e] transition-colors"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="whatsappMessage" className="text-base font-bold text-gray-700">Default WhatsApp Message</Label>
                <Input
                  id="whatsappMessage"
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  placeholder="Hi! I'd like to order..."
                  className="h-12 rounded-xl bg-white border-gray-200 focus-visible:ring-[#e87a1e] focus-visible:border-[#e87a1e] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-bold text-gray-700">Hero Background Image</Label>
              {imageUrl && !file && (
                <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden shadow-sm border border-gray-100 group">
                  <Image src={imageUrl} alt="Current Hero" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                </div>
              )}
              {file && (
                <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                  <Image src={URL.createObjectURL(file)} alt="Preview" fill className="object-cover" />
                </div>
              )}
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept="image/*"
                  className="cursor-pointer file:mr-4 file:py-2 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-[#fdf3eb] file:text-[#e87a1e] hover:file:bg-[#e87a1e] hover:file:text-white file:transition-colors h-14 bg-[#faf9f5] border-gray-200 rounded-xl"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0]);
                    }
                  }}
                />
              </div>
            </div>

            <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleDelete}
                disabled={deleting || saving || (!title && !imageUrl)}
                className="w-full sm:w-auto h-12 text-[#da291c] hover:text-white hover:bg-[#da291c] border-[#da291c] rounded-xl font-bold transition-colors"
              >
                {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Reset to Default
              </Button>
              
              <Button 
                type="submit" 
                disabled={saving || deleting} 
                className="w-full sm:w-auto h-12 bg-[#e87a1e] hover:bg-[#d66a15] text-white rounded-xl px-10 shadow-md font-bold transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {saving ? "Saving Changes..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

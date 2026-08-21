"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase";
import { toast } from "sonner";

export interface CartItem {
  id: string;
  title: string;
  price: string;
  quantity: number;
  imageUrl: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Load user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        // Clear local cart on logout (optional, but good for privacy)
        setItems([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync with Firestore if logged in
  useEffect(() => {
    if (!user) return;

    const cartRef = doc(db, "carts", user.uid);
    
    // Listen for cart changes in Firestore
    const unsubscribe = onSnapshot(cartRef, (docSnap) => {
      if (docSnap.exists()) {
        setItems(docSnap.data().items || []);
      } else {
        setItems([]);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Helper to save to Firestore
  const saveToFirestore = async (newItems: CartItem[]) => {
    if (!user) return;
    try {
      await setDoc(doc(db, "carts", user.uid), {
        items: newItems,
        updatedAt: new Date().toISOString()
      });
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        console.warn("Cart sync failed due to missing permissions. Please deploy firestore.rules", error);
      } else {
        console.error("Failed to sync cart:", error);
        toast.error("Failed to sync cart with server");
      }
    }
  };

  const addToCart = (newItem: CartItem) => {
    if (!user) {
      toast.error("Please login to add items to cart.");
      return;
    }

    setItems((currentItems) => {
      const existing = currentItems.find((item) => item.id === newItem.id);
      let updatedItems;
      if (existing) {
        updatedItems = currentItems.map((item) =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        );
      } else {
        updatedItems = [...currentItems, newItem];
      }
      saveToFirestore(updatedItems);
      return updatedItems;
    });
    // Toast outside setState to avoid double-fire in React StrictMode
    toast.success(`${newItem.title} added to cart!`, { id: `cart-${newItem.id}` });
  };

  const removeFromCart = (id: string) => {
    setItems((currentItems) => {
      const updatedItems = currentItems.filter((item) => item.id !== id);
      saveToFirestore(updatedItems);
      return updatedItems;
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setItems((currentItems) => {
      const updatedItems = currentItems.map((item) =>
        item.id === id ? { ...item, quantity } : item
      );
      saveToFirestore(updatedItems);
      return updatedItems;
    });
  };

  const clearCart = () => {
    setItems([]);
    saveToFirestore([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Convert "₹50" or similar string prices to numbers if needed, assuming numeric or parsable string
  const totalPrice = items.reduce((sum, item) => {
    const priceNum = Number(String(item.price).replace(/[^0-9.-]+/g,""));
    return sum + priceNum * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

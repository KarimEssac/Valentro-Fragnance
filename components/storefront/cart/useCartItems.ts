"use client";

import {useEffect, useState} from "react";
import {cartStorageKey, cartUpdatedEvent, readCartItems, type CartItem} from "@/lib/cart-items";

export function useCartItems() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    function syncCart() {
      setItems(readCartItems());
    }

    function syncStorage(event: StorageEvent) {
      if (event.key === cartStorageKey || event.key === null) syncCart();
    }

    syncCart();
    window.addEventListener("storage", syncStorage);
    window.addEventListener(cartUpdatedEvent, syncCart);

    return () => {
      window.removeEventListener("storage", syncStorage);
      window.removeEventListener(cartUpdatedEvent, syncCart);
    };
  }, []);

  return items;
}

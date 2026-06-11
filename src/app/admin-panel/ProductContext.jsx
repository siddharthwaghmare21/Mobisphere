"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { productData as initialStaticProducts } from '@/app/components/common/ProductCart';

const PRODUCT_STORAGE_KEY = 'mobisphereProducts';

const ProductContext = createContext(null);

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedProducts = JSON.parse(localStorage.getItem(PRODUCT_STORAGE_KEY));
      if (storedProducts && Array.isArray(storedProducts) && storedProducts.length > 0) {
        setProducts(storedProducts);
      } else {
        const staticProducts = Object.entries(initialStaticProducts).map(([id, p]) => ({ id, ...p }));
        setProducts(staticProducts);
      }
    } catch (e) {
      console.error("Failed to load products from storage", e);
      const staticProducts = Object.entries(initialStaticProducts).map(([id, p]) => ({ id, ...p }));
      setProducts(staticProducts);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(products));
    }
  }, [products, hydrated]);

  const value = { products, setProducts, hydrated };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProductContext() {
  const context = useContext(ProductContext);
  if (context === null) {
    throw new Error('useProductContext must be used within a ProductProvider');
  }
  return context;
}
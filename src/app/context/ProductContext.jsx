"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { productData } from '@/app/components/common/ProductCart'

export const PRODUCT_STORAGE_KEY = 'mobisphereProducts'

const defaultProducts = Object.entries(productData).map(([id, product]) => ({
  id: Number(id),
  ...product,
  brand: product.brand || 'Apple',
}))

function normalizeProduct(product) {
  const safeTitle = product?.title || 'Untitled Product'
  return {
    id: product?.id ?? Date.now().toString(),
    title: safeTitle,
    brand: product?.brand || 'Other Models',
    image: product?.image || '/images/IPhone 16 Pro Max.png',
    alt: product?.alt || safeTitle,
    description: product?.description || 'Premium smartphone available at Mobisphere.',
    price: Number(product?.price) || 0,
    specs: product?.specs || {},
  }
}

function readStoredProducts() {
  if (typeof window === 'undefined') return defaultProducts
  try {
    const stored = JSON.parse(localStorage.getItem(PRODUCT_STORAGE_KEY) || 'null')
    return Array.isArray(stored) && stored.length > 0 ? stored.map(normalizeProduct) : defaultProducts
  } catch {
    return defaultProducts
  }
}

function persistProducts(products) {
  if (typeof window === 'undefined') return
  localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(products.map(normalizeProduct)))
}

const ProductContext = createContext(null)

export function ProductProvider({ children }) {
  const [products, setProductsState] = useState(defaultProducts)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    queueMicrotask(() => {
      setProductsState(readStoredProducts())
      setHydrated(true)
    })
  }, [])

  const setProducts = useCallback((updater) => {
    setProductsState((prev) => {
      const rawNext = typeof updater === 'function' ? updater(prev) : updater
      const next = Array.isArray(rawNext) ? rawNext.map(normalizeProduct) : defaultProducts
      persistProducts(next)
      window.dispatchEvent(new Event('mobisphereProductsChanged'))
      return next
    })
  }, [])

  const resetProducts = useCallback(() => {
    persistProducts(defaultProducts)
    setProductsState(defaultProducts)
    window.dispatchEvent(new Event('mobisphereProductsChanged'))
  }, [])

  const value = useMemo(() => ({ products, setProducts, resetProducts, hydrated }), [products, setProducts, resetProducts, hydrated])

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
}

export function useProductContext() {
  const context = useContext(ProductContext)
  if (!context) {
    throw new Error('useProductContext must be used inside ProductProvider')
  }
  return context
}

"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { productData } from "@/app/components/common/ProductCart"
import { supabase } from "@/lib/supabase"

export const PRODUCT_STORAGE_KEY = "mobisphereProducts"
const PRODUCT_TABLE_NAME = "mobisphere_products"

function normalizeNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function normalizeProduct(product) {
  const safeTitle = product?.title || "Untitled Product"
  const stockQty = Math.max(
    normalizeNumber(
      product?.stockQty ?? product?.stock_quantity ?? product?.stock_qty ?? product?.stock ?? product?.quantity,
      0
    ),
    0
  )
  const minStockAlert = Math.max(
    normalizeNumber(
      product?.minStockAlert ??
        product?.minimumStockAlert ??
        product?.min_stock_alert ??
        product?.lowStockLimit,
      3
    ),
    1
  )

  return {
    id: String(product?.id ?? Date.now()),
    title: safeTitle,
    brand: product?.brand || "Other Models",
    image: product?.image || product?.image_url || "/images/IPhone 16 Pro Max.png",
    alt: product?.alt || safeTitle,
    description:
      product?.description || "Premium smartphone available at Mobisphere.",
    price: Math.max(normalizeNumber(product?.price, 0), 0),
    purchasePrice: Math.max(
      normalizeNumber(product?.purchasePrice ?? product?.purchase_price, 0),
      0
    ),
    stockQty,
    minStockAlert,
    supplierName: product?.supplierName || product?.supplier_name || "",
    specs: product?.specs && typeof product.specs === "object" ? product.specs : {},
    stockHistory: Array.isArray(product?.stockHistory)
      ? product.stockHistory
      : Array.isArray(product?.stock_history)
        ? product.stock_history
        : [],
    lastStockUpdatedAt:
      product?.lastStockUpdatedAt ||
      product?.last_stock_updated_at ||
      product?.stockUpdatedAt ||
      product?.updated_at ||
      "",
    createdAt: product?.createdAt || product?.created_at || "",
    updatedAt: product?.updatedAt || product?.updated_at || "",
  }
}

const defaultProducts = Object.entries(productData || {}).map(([id, product]) =>
  normalizeProduct({
    id,
    ...product,
    brand: product.brand || "Apple",
    stockQty: product.stockQty ?? product.stock ?? 0,
    minStockAlert: product.minStockAlert ?? 3,
  })
)

function fromSupabaseProduct(row) {
  return normalizeProduct({
    id: row.id,
    title: row.title,
    brand: row.brand,
    image: row.image,
    image_url: row.image_url,
    alt: row.alt,
    description: row.description,
    price: row.price,
    purchase_price: row.purchase_price,
    stock_quantity: row.stock_qty,
    min_stock_alert: row.min_stock_alert,
    supplier_name: row.supplier_name,
    specs: row.specs,
    stock_history: row.stock_history,
    last_stock_updated_at: row.last_stock_updated_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  })
}

function toSupabaseProduct(product) {
  const normalized = normalizeProduct(product)

  return {
    id: normalized.id,
    title: normalized.title,
    brand: normalized.brand,
    image: normalized.image,
    alt: normalized.alt,
    description: normalized.description,
    price: normalized.price,
    purchase_price: normalized.purchasePrice,
    stock_qty: normalized.stockQty,
    min_stock_alert: normalized.minStockAlert,
    supplier_name: normalized.supplierName,
    specs: normalized.specs,
    stock_history: normalized.stockHistory,
    last_stock_updated_at:
      normalized.lastStockUpdatedAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

function readLocalProducts() {
  if (typeof window === "undefined") return defaultProducts

  try {
    const stored = JSON.parse(localStorage.getItem(PRODUCT_STORAGE_KEY) || "null")
    return Array.isArray(stored) && stored.length > 0
      ? stored.map(normalizeProduct)
      : defaultProducts
  } catch {
    return defaultProducts
  }
}

function persistProductsLocally(products) {
  if (typeof window === "undefined") return
  localStorage.setItem(
    PRODUCT_STORAGE_KEY,
    JSON.stringify(products.map(normalizeProduct))
  )
  window.dispatchEvent(new Event("mobisphereProductsChanged"))
}

async function fetchProductsFromSupabase() {
  const { data, error } = await supabase
    .from(PRODUCT_TABLE_NAME)
    .select("*")
    .order("created_at", { ascending: true })

  if (error) throw error

  return Array.isArray(data) && data.length > 0
    ? data.map(fromSupabaseProduct)
    : []
}

async function persistProductsToSupabase(products) {
  const rows = products.map(toSupabaseProduct)

  if (rows.length === 0) return

  const { error } = await supabase
    .from(PRODUCT_TABLE_NAME)
    .upsert(rows, { onConflict: "id" })

  if (error) throw error
}

const ProductContext = createContext(null)

export function ProductProvider({ children }) {
  const [products, setProductsState] = useState(defaultProducts)
  const [hydrated, setHydrated] = useState(false)
  const [isSyncingProducts, setIsSyncingProducts] = useState(false)
  const [productSyncError, setProductSyncError] = useState("")

  const syncProductsFromSupabase = useCallback(async () => {
    setIsSyncingProducts(true)
    setProductSyncError("")

    try {
      const supabaseProducts = await fetchProductsFromSupabase()
      const nextProducts =
        supabaseProducts.length > 0 ? supabaseProducts : readLocalProducts()

      setProductsState(nextProducts)
      persistProductsLocally(nextProducts)
      return nextProducts
    } catch (error) {
      console.error("Supabase products fetch error:", error)
      const fallbackProducts = readLocalProducts()
      setProductsState(fallbackProducts)
      setProductSyncError(
        error?.message || "Could not sync products from Supabase."
      )
      return fallbackProducts
    } finally {
      setHydrated(true)
      setIsSyncingProducts(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      syncProductsFromSupabase()
    })
  }, [syncProductsFromSupabase])

  useEffect(() => {
    if (typeof window === "undefined") return undefined

    const handleFocus = () => {
      syncProductsFromSupabase()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncProductsFromSupabase()
      }
    }

    window.addEventListener("focus", handleFocus)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("focus", handleFocus)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [syncProductsFromSupabase])

  const setProducts = useCallback((updater) => {
    setProductsState((prev) => {
      const rawNext = typeof updater === "function" ? updater(prev) : updater
      const next = Array.isArray(rawNext)
        ? rawNext.map(normalizeProduct)
        : defaultProducts

      persistProductsLocally(next)

      queueMicrotask(async () => {
        try {
          await persistProductsToSupabase(next)
          setProductSyncError("")
        } catch (error) {
          console.error("Supabase products save error:", error)
          setProductSyncError(
            error?.message || "Could not save products to Supabase."
          )
        }
      })

      return next
    })
  }, [])

  const resetProducts = useCallback(() => {
    const next = defaultProducts
    setProductsState(next)
    persistProductsLocally(next)

    queueMicrotask(async () => {
      try {
        await persistProductsToSupabase(next)
        setProductSyncError("")
      } catch (error) {
        console.error("Supabase products reset error:", error)
        setProductSyncError(
          error?.message || "Could not reset products in Supabase."
        )
      }
    })
  }, [])

  const value = useMemo(
    () => ({
      products,
      setProducts,
      resetProducts,
      hydrated,
      isSyncingProducts,
      productSyncError,
      syncProductsFromSupabase,
    }),
    [
      products,
      setProducts,
      resetProducts,
      hydrated,
      isSyncingProducts,
      productSyncError,
      syncProductsFromSupabase,
    ]
  )

  return (
    <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
  )
}

export function useProductContext() {
  const context = useContext(ProductContext)

  if (!context) {
    throw new Error("useProductContext must be used inside ProductProvider")
  }

  return context
}

"use client"

import React from "react"
import { useRouter } from "next/navigation"

function saveCartItem(product) {
  if (typeof window === "undefined") return

  let currentCart = []

  try {
    currentCart = JSON.parse(localStorage.getItem("mobisphereCart") || "[]")
  } catch {
    currentCart = []
  }

  currentCart.push({
    cartItemId: Date.now().toString() + Math.random().toString(36).slice(2, 9),
    productId: product.id,
    title: product.title,
    image: product.image,
    description: product.description,
    price: Number(product.price) || 0,
    quantity: 1,
  })

  localStorage.setItem("mobisphereCart", JSON.stringify(currentCart))
}

export default function ProductDisplayCard({ product }) {
  const router = useRouter()

  if (!product) return null

  const goToDetails = () => {
    router.push(`/product/${product.id}`)
  }

  const handleAddToCart = (event) => {
    event.stopPropagation()
    saveCartItem(product)
    alert(`${product.title} has been added to your cart!`)
  }

  const handleBuyNow = (event) => {
    event.stopPropagation()
    router.push(`/payment?productId=${product.id}`)
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={goToDetails}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") goToDetails()
      }}
      className="group flex h-full min-w-0 cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-md transition hover:-translate-y-1 hover:shadow-xl sm:rounded-[2rem] sm:p-4 sm:shadow-lg"
    >
      <div className="aspect-square w-full overflow-hidden rounded-xl bg-slate-100 sm:rounded-[1.5rem]">
        <img
          src={product.image || "/images/IPhone 16 Pro Max.png"}
          alt={product.alt || product.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>

      <div className="mt-3 flex-1 sm:mt-5">
        <p className="line-clamp-1 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-600 sm:text-xs sm:tracking-[0.25em]">
          {product.brand || "Mobisphere"}
        </p>

        <h3 className="mt-1 line-clamp-2 min-h-[40px] text-[13px] font-black leading-5 text-slate-950 sm:mt-2 sm:min-h-0 sm:text-xl sm:leading-7">
          {product.title}
        </h3>

        <p className="hidden sm:mt-2 sm:line-clamp-2 sm:block sm:text-sm sm:leading-6 sm:text-slate-600">
          {product.description}
        </p>

        <p className="mt-2 text-sm font-black text-slate-900 sm:mt-4 sm:text-2xl">
          ₹{Number(product.price || 0).toLocaleString()}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:mt-5 sm:grid-cols-2 sm:gap-3">
        <button
          type="button"
          onClick={handleAddToCart}
          className="rounded-xl bg-slate-950 px-2 py-2 text-[10px] font-black text-white transition hover:bg-slate-800 sm:rounded-full sm:px-4 sm:py-3 sm:text-xs"
        >
          Add Cart
        </button>

        <button
          type="button"
          onClick={handleBuyNow}
          className="rounded-xl border border-emerald-600 bg-emerald-600 px-2 py-2 text-[10px] font-black text-slate-950 transition hover:bg-emerald-500 sm:rounded-full sm:px-4 sm:py-3 sm:text-xs"
        >
          Buy Now
        </button>
      </div>
    </article>
  )
}
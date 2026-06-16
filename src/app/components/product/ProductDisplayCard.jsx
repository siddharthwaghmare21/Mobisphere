"use client"

import React from 'react'
import { useRouter } from 'next/navigation'

function saveCartItem(product) {
  if (typeof window === 'undefined') return
  const currentCart = JSON.parse(localStorage.getItem('mobisphereCart') || '[]')
  currentCart.push({
    cartItemId: Date.now().toString() + Math.random().toString(36).slice(2, 9),
    productId: product.id,
    title: product.title,
    image: product.image,
    description: product.description,
    price: Number(product.price) || 0,
    quantity: 1,
  })
  localStorage.setItem('mobisphereCart', JSON.stringify(currentCart))
}

export default function ProductDisplayCard({ product }) {
  const router = useRouter()
  if (!product) return null

  const stockQty = Number(product.stockQty ?? product.stock ?? 8)
  const inStock = stockQty > 0
  const goToDetails = () => router.push(`/product/${product.id}`)

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
        if (event.key === 'Enter' || event.key === ' ') goToDetails()
      }}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1.5 hover:shadow-2xl"
    >
      <div className="relative bg-gradient-to-br from-slate-100 to-white p-4">
        <div className="absolute left-4 top-4 z-10 rounded-full bg-slate-950 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white">
          {product.brand || 'Mobisphere'}
        </div>
        <div className={`absolute right-4 top-4 z-10 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${inStock ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {inStock ? 'In stock' : 'Out of stock'}
        </div>
        <div className="overflow-hidden rounded-[1.6rem] bg-white p-5 shadow-inner">
          <img src={product.image || '/images/IPhone 16 Pro Max.png'} alt={product.alt || product.title} className="h-64 w-full object-contain transition duration-500 group-hover:scale-105" />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-xl font-black tracking-tight text-slate-950">{product.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-500">{product.description}</p>

        <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-500">
          <span className="rounded-full bg-slate-50 px-3 py-2">{product.specs?.Storage || 'Premium storage'}</span>
          <span className="rounded-full bg-slate-50 px-3 py-2">{product.specs?.Processor || 'Fast chipset'}</span>
        </div>

        <div className="mt-auto pt-5">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Price</p>
              <p className="text-2xl font-black text-slate-950">₹{Number(product.price || 0).toLocaleString()}</p>
            </div>
            <button type="button" onClick={goToDetails} className="text-xs font-black text-emerald-700 hover:underline">Details →</button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={handleAddToCart} className="rounded-full bg-slate-950 px-4 py-3 text-xs font-black text-white transition hover:bg-slate-800">
              Add cart
            </button>
            <button type="button" onClick={handleBuyNow} className="rounded-full bg-emerald-400 px-4 py-3 text-xs font-black text-slate-950 transition hover:bg-emerald-300">
              Buy now
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

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
      className="group flex h-full cursor-pointer flex-col justify-between rounded-[2rem] border border-slate-200 bg-white p-4 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
    >
      <div className="overflow-hidden rounded-[1.5rem] bg-slate-100">
        <img
          src={product.image || '/images/IPhone 16 Pro Max.png'}
          alt={product.alt || product.title}
          className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>

      <div className="mt-5 flex-1">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-600">{product.brand || 'Mobisphere'}</p>
        <h3 className="mt-2 text-xl font-black text-slate-950">{product.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{product.description}</p>
        <p className="mt-4 text-2xl font-black text-slate-900">₹{Number(product.price || 0).toLocaleString()}</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleAddToCart}
          className="rounded-full bg-slate-950 px-4 py-3 text-xs font-black text-white transition hover:bg-slate-800"
        >
          Add to cart
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          className="rounded-full border border-emerald-600 bg-emerald-600 px-4 py-3 text-xs font-black text-slate-950 transition hover:bg-emerald-500"
        >
          Buy now
        </button>
      </div>
    </article>
  )
}

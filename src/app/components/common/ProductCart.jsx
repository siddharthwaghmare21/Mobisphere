"use client"

import React from 'react'
import { useRouter } from 'next/navigation'

export const productData = {
    1: {
        image: "/images/IPhone 11 Pro Max.jpeg",
        alt: "iPhone 11 Pro Max",
        title: "iPhone 11 Pro Max",
        description:
            "Premium performance with a triple-camera system, long-lasting battery life, and a durable glass-and-stainless-steel design.",
        brand: 'Apple',
        specs: {
            RAM: '4GB',
            Storage: '64GB',
            Camera: '12MP Triple',
            Display: '6.5-inch OLED',
            Battery: '3969mAh',
            Processor: 'A13 Bionic',
        },
        price: 45000,
    },
    2: {
        image: "/images/IPhone 12 Pro Max.jpeg",
        alt: "iPhone 12 Pro Max",
        title: "iPhone 12 Pro Max",
        description:
            "A beautifully balanced flagship with OLED display, 5G connectivity, and industry-leading camera stabilization.",
        brand: 'Apple',
        specs: {
            RAM: '6GB',
            Storage: '128GB',
            Camera: '12MP Triple',
            Display: '6.7-inch OLED',
            Battery: '3687mAh',
            Processor: 'A14 Bionic',
        },
        price: 55000,
    },
    3: {
        image: "/images/IPhone 13 Pro Max.jpeg",
        alt: "iPhone 13 Pro Max",
        title: "iPhone 13 Pro Max",
        description:
            "Fast A15 Bionic power, brighter Super Retina XDR display, and Pro camera tools for stunning photos and video.",
        brand: 'Apple',
        specs: {
            RAM: '6GB',
            Storage: '128GB',
            Camera: '12MP Triple',
            Display: '6.7-inch OLED',
            Battery: '4352mAh',
            Processor: 'A15 Bionic',
        },
        price: 65000,
    },
    4: {
        image: "/images/IPhone 14 Pro Max.jpeg",
        alt: "iPhone 14 Pro Max",
        title: "iPhone 14 Pro Max",
        description:
            "Pro-level performance with the latest chipset, crash detection, and advanced camera systems for next-level mobile creativity.",
        brand: 'Apple',
        specs: {
            RAM: '6GB',
            Storage: '128GB',
            Camera: '12MP Triple',
            Display: '6.7-inch OLED',
            Battery: '4323mAh',
            Processor: 'A16 Bionic',
        },
        price: 75000,
    },
    5: {
        image: "/images/IPhone 15 Pro Max.jpeg",
        alt: "iPhone 15 Pro Max",
        title: "iPhone 15 Pro Max",
        description:
            "Ultra-smooth usage with a powerful processor, premium display, and enhanced photography features for modern everyday use.",
        brand: 'Apple',
        specs: {
            RAM: '8GB',
            Storage: '256GB',
            Camera: '48MP Triple',
            Display: '6.7-inch OLED',
            Battery: '4422mAh',
            Processor: 'A17 Pro',
        },
        price: 85000,
    },
    6: {
        image: "/images/IPhone 16 Pro Max.png",
        alt: "iPhone 16 Pro Max",
        title: "iPhone 16 Pro Max",
        description:
            "The latest flagship experience with cutting-edge speed, polished design, and intelligent features for productivity and entertainment.",
        brand: 'Apple',
        specs: {
            RAM: '8GB',
            Storage: '256GB',
            Camera: '50MP Triple',
            Display: '6.9-inch OLED',
            Battery: '4700mAh',
            Processor: 'A18 Bionic',
        },
        price: 95000,
    },
}

export default function ProductCart({ productId, image, alt, title, description, price, onBuyNow, onAdded }) {
  const router = useRouter()
  const product = productId ? productData[productId] : null
  const [showSkeleton, setShowSkeleton] = React.useState(true)

  React.useEffect(() => {
    const timer = window.setTimeout(() => setShowSkeleton(false), 350)
    return () => window.clearTimeout(timer)
  }, [])

  const cardImage = image || product?.image || '/images/IPhone 16 Pro Max.png'
  const cardAlt = alt || product?.alt || 'Product image'
  const cardTitle = title || product?.title || 'Featured product'
  const cardDescription = description || product?.description || 'Discover our premium mobile products.'
  const cardPrice = Number(price || product?.price || 50000)

  const handleAddToCart = () => {
    const currentCart = JSON.parse(localStorage.getItem('mobisphereCart') || '[]')
    currentCart.push({
      cartItemId: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      productId: productId || null,
      title: cardTitle,
      image: cardImage,
      description: cardDescription,
      price: cardPrice,
      quantity: 1,
    })
    localStorage.setItem('mobisphereCart', JSON.stringify(currentCart))
    alert(`${cardTitle} has been added to your cart!`)
  }

  const handleNavigateToDetail = () => {
    if (!productId) return
    router.push(`/product/${productId}`)
  }

  return (
    <article
      onClick={handleNavigateToDetail}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleNavigateToDetail()
      }}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1.5 hover:shadow-2xl"
    >
      <div className="relative bg-gradient-to-br from-slate-100 to-white p-4">
        <span className="absolute left-4 top-4 z-10 rounded-full bg-slate-950 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white">
          Mobisphere
        </span>
        <div className="overflow-hidden rounded-[1.6rem] bg-white p-5 shadow-inner">
          {showSkeleton ? (
            <div className="h-56 w-full animate-pulse rounded-3xl bg-slate-100" />
          ) : (
            <img src={cardImage} alt={cardAlt} className="h-56 w-full object-contain transition duration-500 group-hover:scale-105" />
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600">Featured device</p>
        <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">{cardTitle}</h3>
        <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-500">{cardDescription}</p>
        <p className="mt-5 text-2xl font-black text-slate-950">₹{cardPrice.toLocaleString()}</p>

        <div className="mt-auto grid grid-cols-2 gap-3 pt-5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleAddToCart()
              if (typeof onAdded === 'function') onAdded()
            }}
            className="rounded-full bg-slate-950 px-4 py-3 text-xs font-black text-white transition hover:bg-slate-800"
          >
            Add cart
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              if (typeof onBuyNow === 'function') onBuyNow()
              else if (productId) router.push(`/payment?productId=${productId}`)
              else router.push('/product')
            }}
            className="rounded-full bg-emerald-400 px-4 py-3 text-xs font-black text-slate-950 transition hover:bg-emerald-300"
          >
            Buy now
          </button>
        </div>
      </div>
    </article>
  )
}

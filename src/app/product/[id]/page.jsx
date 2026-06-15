"use client"

import React, { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ProductCart from '@/app/components/common/ProductCart'
import { useProductContext } from '@/app/context/ProductContext'

function formatINR(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return `₹${n.toLocaleString()}`
}

function addProductToCart(product) {
  const currentCart = JSON.parse(localStorage.getItem('mobisphereCart') || '[]')
  currentCart.push({
    cartItemId: Date.now().toString() + Math.random().toString(36).slice(2, 9),
    productId: product.id,
    title: product.title,
    image: product.image,
    description: product.description,
    price: product.price,
    quantity: 1,
  })
  localStorage.setItem('mobisphereCart', JSON.stringify(currentCart))
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { products, hydrated } = useProductContext()
  const productId = params?.id
  const [cartMessage, setCartMessage] = useState('')

  const product = useMemo(() => {
    return products.find((item) => String(item.id) === String(productId)) || null
  }, [products, productId])

  const specs = useMemo(() => {
    const s = product?.specs || {}
    return {
      RAM: s.RAM,
      Storage: s.Storage,
      Camera: s.Camera,
      Display: s.Display,
      Battery: s.Battery,
      Processor: s.Processor,
      Charger: s.Charger,
      Tools: s.Tools,
    }
  }, [product])

  const recommendedProducts = useMemo(() => {
    return products.filter((item) => String(item.id) !== String(productId)).slice(0, 3)
  }, [products, productId])

  const addToCart = () => {
    if (!product) return
    addProductToCart(product)
    setCartMessage(`${product.title} added to cart!`)
    window.setTimeout(() => setCartMessage(''), 1500)
  }

  if (!hydrated) {
    return <main className="px-4 py-20 text-center font-bold text-slate-500">Loading product...</main>
  }

  if (!product) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-950">Product not found</h1>
          <button
            type="button"
            onClick={() => router.push('/product')}
            className="mt-6 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Back to products
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 pt-28 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="w-full lg:w-1/2">
            <div className="overflow-hidden rounded-[2rem] bg-slate-100">
              <img src={product.image} alt={product.alt || product.title} className="h-[320px] w-full object-cover sm:h-[420px]" />
            </div>
          </div>

          <div className="w-full lg:w-1/2">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">Mobisphere Mobile Shop</p>
              <h1 className="text-3xl font-bold text-slate-950 sm:text-4xl">{product.title}</h1>
              <p className="text-sm leading-7 text-slate-600">{product.description}</p>

              <div className="rounded-[1.75rem] bg-slate-50 p-5">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Price</p>
                <p className="mt-2 text-3xl font-bold text-slate-950">{formatINR(product.price)}</p>
              </div>

              {cartMessage ? (
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  {cartMessage}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={addToCart}
                  className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
                >
                  Add to cart
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/payment?productId=${product.id}`)}
                  className="inline-flex w-full items-center justify-center rounded-full border border-emerald-600 bg-emerald-600 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-500 sm:w-auto"
                >
                  Buy now
                </button>
              </div>

              <div className="mt-2 rounded-[1.75rem] border border-slate-200 bg-white p-5">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Specifications</p>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {Object.entries(specs).filter(([, value]) => Boolean(value)).map(([key, value]) => (
                    <div key={key} className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{key}</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push('/product')}
                className="text-sm font-semibold text-slate-700 underline underline-offset-4 hover:text-slate-950"
              >
                Continue shopping
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="mb-4 text-2xl font-bold text-slate-950">Customers who bought this also viewed</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recommendedProducts.map((item) => (
            <div key={item.id} className="text-left">
              <ProductCart
                productId={item.id}
                image={item.image}
                alt={item.alt || item.title}
                title={item.title}
                description={item.description}
                price={item.price}
                onBuyNow={() => router.push(`/payment?productId=${item.id}`)}
              />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

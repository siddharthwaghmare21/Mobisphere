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

  const product = useMemo(() => products.find((item) => String(item.id) === String(productId)) || null, [products, productId])

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

  const recommendedProducts = useMemo(() => products.filter((item) => String(item.id) !== String(productId)).slice(0, 3), [products, productId])

  const addToCart = () => {
    if (!product) return
    addProductToCart(product)
    setCartMessage(`${product.title} added to cart!`)
    window.setTimeout(() => setCartMessage(''), 1800)
  }

  if (!hydrated) {
    return <main className="px-4 py-24 text-center font-black text-slate-500">Loading product...</main>
  }

  if (!product) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-100 bg-white p-8 text-center shadow-xl">
          <h1 className="text-2xl font-black text-slate-950">Product not found</h1>
          <button type="button" onClick={() => router.push('/product')} className="mt-6 rounded-full bg-slate-950 px-6 py-3 text-sm font-black text-white hover:bg-slate-800">
            Back to products
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2.3rem] border border-slate-100 bg-white shadow-2xl">
        <div className="grid gap-0 lg:grid-cols-[1fr_0.95fr]">
          <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 sm:p-10">
            <div className="absolute right-10 top-10 rounded-full bg-emerald-400/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">
              Premium device
            </div>
            <div className="flex min-h-[440px] items-center justify-center rounded-[2rem] border border-white/10 bg-white/10 p-8 backdrop-blur">
              <img src={product.image} alt={product.alt || product.title} className="max-h-[430px] w-full object-contain drop-shadow-2xl" />
            </div>
          </div>

          <div className="p-6 sm:p-10">
            <button type="button" onClick={() => router.push('/product')} className="mb-6 rounded-full bg-slate-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-slate-100">
              ← Back to products
            </button>

            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">{product.brand || 'Mobisphere Mobile Shop'}</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">{product.title}</h1>
            <p className="mt-4 text-sm font-semibold leading-7 text-slate-600">{product.description}</p>

            <div className="mt-7 rounded-[1.7rem] bg-slate-950 p-5 text-white">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Mobisphere price</p>
              <p className="mt-2 text-4xl font-black text-emerald-300">{formatINR(product.price)}</p>
              <p className="mt-2 text-xs font-semibold text-slate-400">Cash on delivery / store pickup support available.</p>
            </div>

            {cartMessage && <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">{cartMessage}</div>}

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={addToCart} className="rounded-full bg-slate-950 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-slate-800">
                Add to cart
              </button>
              <button type="button" onClick={() => router.push(`/payment?productId=${product.id}`)} className="rounded-full bg-emerald-400 px-6 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:bg-emerald-300">
                Buy now
              </button>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {['Genuine product', 'Fast pickup', 'Store support'].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center text-xs font-black text-slate-700">✓ {item}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-xl sm:p-8">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">Specifications</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">Key details</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {Object.entries(specs).filter(([, value]) => Boolean(value)).map(([key, value]) => (
              <div key={key} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{key}</p>
                <p className="mt-2 text-sm font-black text-slate-950">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-100 bg-slate-950 p-6 text-white shadow-xl sm:p-8">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">Need help?</p>
          <h2 className="mt-3 text-2xl font-black">Not sure this is right?</h2>
          <p className="mt-3 text-sm font-semibold leading-7 text-slate-400">Send us your budget, preferred brand, and usage. Mobisphere will guide you with a better choice.</p>
          <button type="button" onClick={() => router.push('/enquiry')} className="mt-6 w-full rounded-full bg-white px-6 py-3 text-xs font-black uppercase tracking-wider text-slate-950 transition hover:bg-emerald-200">
            Ask Mobisphere
          </button>
        </div>
      </section>

      {recommendedProducts.length > 0 && (
        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">Related products</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">Customers also viewed</h2>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recommendedProducts.map((item) => (
              <ProductCart key={item.id} productId={item.id} image={item.image} alt={item.alt || item.title} title={item.title} description={item.description} price={item.price} onBuyNow={() => router.push(`/payment?productId=${item.id}`)} />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}

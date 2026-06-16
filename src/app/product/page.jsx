"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { useProductContext } from '@/app/context/ProductContext'
import ProductDisplayCard from '@/app/components/product/ProductDisplayCard'

export default function ProductPage() {
  const { products, hydrated } = useProductContext()
  const [view, setView] = useState('brands')
  const [selectedBrand, setSelectedBrand] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortOrder, setSortOrder] = useState('none')

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchTerm), 350)
    return () => window.clearTimeout(timer)
  }, [searchTerm])

  const uniqueBrands = useMemo(() => {
    if (!products) return []
    return [...new Set(products.map((p) => p.brand || 'Other Models'))]
  }, [products])

  const filteredProducts = useMemo(() => {
    if (!products) return []
    const normalizedSearch = debouncedSearch.trim().toLowerCase()
    let result = []

    if (normalizedSearch) {
      result = products.filter((p) =>
        p.title?.toLowerCase().includes(normalizedSearch) ||
        p.brand?.toLowerCase().includes(normalizedSearch)
      )
    } else if (view === 'products' && selectedBrand) {
      result = products.filter((p) => (p.brand || 'Other Models') === selectedBrand)
    } else {
      return []
    }

    const sorted = [...result]
    if (sortOrder === 'asc') sorted.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0))
    if (sortOrder === 'desc') sorted.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0))
    if (sortOrder === 'name-asc') sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
    if (sortOrder === 'name-desc') sorted.sort((a, b) => (b.title || '').localeCompare(a.title || ''))
    return sorted
  }, [products, view, selectedBrand, debouncedSearch, sortOrder])

  const hasSearchTerm = searchTerm.trim().length > 0
  const isSearchingUI = searchTerm !== debouncedSearch
  const showNoResults = !isSearchingUI && hasSearchTerm && debouncedSearch.trim().length > 0 && filteredProducts.length === 0

  const handleBrandSelect = (brand) => {
    setSelectedBrand(brand)
    setView('products')
  }

  if (!hydrated) {
    return <main className="py-24 text-center font-black text-slate-500">Loading premium products...</main>
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="mb-8 overflow-hidden rounded-[2.2rem] bg-slate-950 p-6 text-white shadow-2xl sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_430px] lg:items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">Mobisphere product studio</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">
              {isSearchingUI && hasSearchTerm ? 'Searching...' : hasSearchTerm ? 'Search results' : view === 'brands' ? 'Browse premium brands' : `${selectedBrand} collection`}
            </h1>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-300">
              {hasSearchTerm ? `Showing products for ${debouncedSearch || searchTerm}.` : 'Choose a brand, compare models, and pick the phone that fits your style and budget.'}
            </p>
          </div>

          <div className="rounded-[1.7rem] border border-white/10 bg-white/10 p-3 backdrop-blur">
            <div className="flex h-14 items-center overflow-hidden rounded-2xl bg-white text-slate-950">
              <span className="grid h-full w-14 place-items-center text-slate-400">⌕</span>
              <input
                className="h-full flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-slate-400"
                type="text"
                placeholder="Search smartphones, brands..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {hasSearchTerm && (
                <button type="button" onClick={() => { setSearchTerm(''); setDebouncedSearch('') }} className="h-full px-4 text-xs font-black text-slate-500 hover:text-slate-950">Clear</button>
              )}
            </div>
          </div>
        </div>
      </section>

      {!showNoResults && (view === 'products' || hasSearchTerm) && (
        <div className="mb-6 flex flex-col gap-4 rounded-[1.7rem] border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-3">
            {view === 'products' && !hasSearchTerm && (
              <button type="button" onClick={() => setView('brands')} className="rounded-full bg-slate-950 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-slate-800">← All brands</button>
            )}
            <span className="rounded-full bg-slate-50 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-slate-500">{filteredProducts.length} products</span>
          </div>

          <div className="flex items-center gap-3">
            <label htmlFor="sort" className="text-[10px] font-black uppercase tracking-wider text-slate-400">Sort</label>
            <select id="sort" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-slate-900">
              <option value="none">Featured</option>
              <option value="asc">Price: Low to High</option>
              <option value="desc">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
            </select>
          </div>
        </div>
      )}

      {hasSearchTerm ? (
        showNoResults ? (
          <div className="rounded-[2rem] border border-rose-100 bg-rose-50 p-12 text-center shadow-sm">
            <p className="text-5xl">🔍</p>
            <h2 className="mt-4 text-2xl font-black text-rose-950">No products found</h2>
            <p className="mt-2 text-sm font-bold text-rose-700">Nothing matched {debouncedSearch}.</p>
          </div>
        ) : (
          <div className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 ${isSearchingUI ? 'opacity-60' : 'opacity-100'}`}>
            {filteredProducts.map((product) => <ProductDisplayCard key={product.id} product={product} />)}
          </div>
        )
      ) : view === 'brands' ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {uniqueBrands.map((brand) => (
            <button key={brand} type="button" onClick={() => handleBrandSelect(brand)} className="group rounded-[2rem] border border-slate-100 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1.5 hover:shadow-2xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-2xl text-white transition group-hover:bg-emerald-400 group-hover:text-slate-950">📱</div>
              <h3 className="mt-5 text-2xl font-black text-slate-950">{brand}</h3>
              <p className="mt-2 text-sm font-bold text-slate-500">{products.filter((p) => (p.brand || 'Other Models') === brand).length} models available</p>
              <p className="mt-5 text-xs font-black uppercase tracking-wider text-emerald-700">Explore collection →</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => <ProductDisplayCard key={product.id} product={product} />)}
        </div>
      )}
    </main>
  )
}

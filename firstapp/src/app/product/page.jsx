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
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 400)
    return () => window.clearTimeout(timer)
  }, [searchTerm])

  const uniqueBrands = useMemo(() => {
    if (!products) return []
    return [...new Set(products.map((p) => p.brand || 'Other Models'))]
  }, [products])

  const filteredProducts = useMemo(() => {
    if (!products) return []

    let result = []
    const normalizedSearch = debouncedSearch.trim().toLowerCase()

    if (normalizedSearch) {
      result = products.filter((p) =>
        p.title?.toLowerCase().includes(normalizedSearch) ||
        p.brand?.toLowerCase().includes(normalizedSearch),
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
    return (
      <div className="py-20 text-center font-bold text-slate-500">
        Loading Products...
      </div>
    )
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="mb-8 rounded-[2rem] border border-slate-100 bg-white p-8 shadow-xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-black text-slate-900">
              {isSearchingUI && hasSearchTerm ? 'Searching...' : hasSearchTerm ? 'Search Results' : view === 'brands' ? 'Browse by Brand' : `Mobiles from ${selectedBrand}`}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {isSearchingUI && hasSearchTerm
                ? `Looking up ${searchTerm}...`
                : hasSearchTerm
                  ? `Showing results for ${debouncedSearch}`
                  : view === 'brands'
                    ? 'Select a company to see all available models.'
                    : 'Explore our collection of the latest smartphones.'}
            </p>
          </div>

          <div className="w-full md:max-w-md">
            <div className="relative flex h-14 w-full items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 transition-all duration-300 focus-within:border-slate-400 focus-within:shadow-md">
              <div className="grid h-full w-14 place-items-center text-slate-400">
                {isSearchingUI && hasSearchTerm ? (
                  <svg className="h-5 w-5 animate-spin text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                )}
              </div>
              <input
                className="peer h-full w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder-slate-400"
                type="text"
                placeholder="Search smartphones, brands..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {hasSearchTerm && (
                <button type="button" onClick={() => { setSearchTerm(''); setDebouncedSearch('') }} className="grid h-full w-14 place-items-center text-slate-400 transition-colors hover:text-slate-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {(!showNoResults && (view === 'products' || hasSearchTerm)) && (
        <div className={`mb-6 flex flex-col gap-4 sm:flex-row ${view === 'products' && !hasSearchTerm ? 'items-start justify-between sm:items-center' : 'justify-end'}`}>
          {view === 'products' && !hasSearchTerm && (
            <button type="button" onClick={() => setView('brands')} className="flex items-center gap-2 rounded-full bg-slate-100 px-5 py-2 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-200">
              ← Back to All Brands
            </button>
          )}

          <div className="flex items-center gap-3">
            <label htmlFor="sort" className="text-[10px] font-black uppercase tracking-wider text-slate-400">Sort By</label>
            <select id="sort" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm outline-none transition-all focus:border-slate-900 focus:ring-1 focus:ring-slate-900">
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
          <div className="mt-8 rounded-[2rem] border border-rose-100 bg-rose-50 p-16 text-center shadow-sm">
            <div className="mb-5 text-5xl opacity-80">🔍</div>
            <p className="text-xl font-black text-rose-900">No products found</p>
            <p className="mt-2 text-sm font-medium text-rose-700">Nothing matched {debouncedSearch}.</p>
            <button type="button" onClick={() => { setSearchTerm(''); setDebouncedSearch('') }} className="mt-6 rounded-full bg-rose-600 px-6 py-2 text-xs font-bold text-white shadow-md transition hover:bg-rose-700">Clear Search</button>
          </div>
        ) : (
          <div className={`grid grid-cols-1 gap-8 transition-opacity duration-300 md:grid-cols-2 lg:grid-cols-3 ${isSearchingUI ? 'opacity-50' : 'opacity-100'}`}>
            {filteredProducts.map((product) => <ProductDisplayCard key={product.id} product={product} />)}
          </div>
        )
      ) : view === 'brands' ? (
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {uniqueBrands.map((brand) => (
            <button
              key={brand}
              type="button"
              onClick={() => handleBrandSelect(brand)}
              className="group rounded-3xl border border-slate-200 bg-white p-8 text-left shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl"
            >
              <div className="mb-4 text-4xl opacity-80 group-hover:opacity-100">📱</div>
              <h3 className="text-2xl font-black text-slate-900">{brand}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-500 group-hover:text-emerald-600">
                {products.filter((p) => (p.brand || 'Other Models') === brand).length} Models Available
              </p>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => <ProductDisplayCard key={product.id} product={product} />)}
        </div>
      )}
    </section>
  )
}

"use client"

import React, { useMemo, useState } from 'react'
import ProductCard, { productData } from '../components/common/ProductCard'

export default function Product() {
    const [searchTerm, setSearchTerm] = useState('')

    const filteredProducts = useMemo(() => {
        const normalized = searchTerm.trim().toLowerCase()
        if (!normalized) {
            return Object.entries(productData)
        }

        return Object.entries(productData).filter(([, product]) =>
            product.title.toLowerCase().includes(normalized)
        )
    }, [searchTerm])

    const searchTermTrimmed = searchTerm.trim()
    const isSearchTermValid = searchTermTrimmed.length === 0 || /^[a-z0-9\s]+$/i.test(searchTermTrimmed)
    const showNoResults = searchTermTrimmed.length > 0 && filteredProducts.length === 0 && isSearchTermValid
    const showInvalidSearch = searchTermTrimmed.length > 0 && !isSearchTermValid

    return (
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
                <p className="text-sm uppercase tracking-[0.3em] text-brand">Product Catalog</p>
                <h1 className="mt-4 text-3xl font-bold text-slate-950 sm:text-4xl">
                    Browse all available products
                </h1>
                <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
                    Search by product name, and see instant results across our full store inventory.
                </p>
            </div>

            <div className="mx-auto mt-10 max-w-3xl">
                <div className="grid gap-4 sm:grid-cols-2">
                    <label htmlFor="product-search" className="sr-only">Search products</label>
                    <div className="flex rounded-full border border-slate-300 bg-white px-4 shadow-sm focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 sm:col-span-2">
                        <input
                            id="product-search"
                            type="search"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Search products by name..."
                            className="w-full rounded-full border-0 py-4 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                        />
                    </div>
                </div>
            </div>


            {showInvalidSearch ? (
                <div className="mt-10 rounded-[2rem] border border-orange-200 bg-orange-50 p-8 text-center text-orange-800 shadow-sm">
                    <p className="text-lg font-semibold">Please type a valid product name.</p>
                    <p className="mt-2 text-sm text-orange-700">Avoid using special characters or empty search terms.</p>
                </div>
            ) : showNoResults ? (
                <div className="mt-10 rounded-[2rem] border border-red-200 bg-red-50 p-8 text-center text-red-800 shadow-sm">
                    <p className="text-lg font-semibold">Product not available.</p>
                    <p className="mt-2 text-sm text-red-700">No matching items were found in the shop.</p>
                </div>
            ) : (
                <section className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-6 lg:grid-cols-3">
                    {filteredProducts.map(([productId]) => (
                        <ProductCard
                            key={productId}
                            productId={Number(productId)}
                            onBuyNow={() => {
                                // navigate via card's internal handler is not available here; detail page handles Buy now
                                window.location.href = `/product/${productId}`
                            }}
                        />
                    ))}
                </section>
            )}
        </main>
    )
}

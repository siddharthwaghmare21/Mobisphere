"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CartPage() {
    const [cartItems, setCartItems] = useState([])
    const [isRemoveMode, setIsRemoveMode] = useState(false)
    const [selectedToRemove, setSelectedToRemove] = useState(new Set())
    const router = useRouter()

    useEffect(() => {
        const storedCart = JSON.parse(localStorage.getItem('mobisphereCart') || '[]')
        setCartItems(storedCart)
    }, [])

    const toggleRemoveMode = () => {
        setIsRemoveMode(!isRemoveMode)
        setSelectedToRemove(new Set()) // Reset selection whenever mode is toggled
    }

    const handleSelectItem = (cartItemId) => {
        if (!isRemoveMode) return
        const newSet = new Set(selectedToRemove)
        if (newSet.has(cartItemId)) {
            newSet.delete(cartItemId)
        } else {
            newSet.add(cartItemId)
        }
        setSelectedToRemove(newSet)
    }

    const handleRemoveSelected = () => {
        const updatedCart = cartItems.filter(item => !selectedToRemove.has(item.cartItemId))
        setCartItems(updatedCart)
        localStorage.setItem('mobisphereCart', JSON.stringify(updatedCart))
        setSelectedToRemove(new Set())
        setIsRemoveMode(false)
    }

    const totalPrice = cartItems.reduce((acc, item) => acc + (item.price || 0), 0)

    return (
        <main className="mx-auto max-w-7xl px-4 py-10 pt-28 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
                <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">Your Cart</p>
                <h1 className="mt-4 text-3xl font-bold text-slate-950 sm:text-4xl">Shopping Cart</h1>
                {cartItems.length > 0 && (
                    <p className="mt-4 text-xl font-medium text-slate-700">
                        Estimated Total: <span className="font-bold text-emerald-600">₹{totalPrice.toLocaleString()}</span>
                    </p>
                )}
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <button onClick={() => router.push('/product')} className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                    Add product
                </button>
                {cartItems.length > 0 && (
                    <button onClick={toggleRemoveMode} className={`rounded-full px-6 py-3 text-sm font-semibold transition ${isRemoveMode ? 'bg-rose-100 text-rose-800 hover:bg-rose-200' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'}`}>
                        {isRemoveMode ? 'Cancel remove' : 'Remove product'}
                    </button>
                )}
            </div>

            {isRemoveMode && (
                <div className="mt-8 flex flex-col items-center gap-4 rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center shadow-sm">
                    <p className="text-lg font-semibold text-rose-700">Select product to remove</p>
                    {selectedToRemove.size > 0 && (
                        <button onClick={handleRemoveSelected} className="rounded-full bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-rose-700">
                            Remove selected product
                        </button>
                    )}
                </div>
            )}

            {cartItems.length === 0 ? (
                <div className="mt-10 rounded-[2rem] border border-slate-200 bg-slate-50 p-8 text-center text-slate-600 shadow-sm">
                    <p className="text-lg font-semibold">Your cart is currently empty.</p>
                    <p className="mt-2 text-sm">Add some products to see them here.</p>
                </div>
            ) : (
                <section className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-6 lg:grid-cols-3">
                    {cartItems.map((item) => (
                        <div
                            key={item.cartItemId}
                            onClick={() => handleSelectItem(item.cartItemId)}
                            className={`relative overflow-hidden rounded-xl bg-white p-3 shadow-lg transition sm:rounded-[1.75rem] sm:p-5 ${isRemoveMode ? 'cursor-pointer' : ''} ${isRemoveMode && selectedToRemove.has(item.cartItemId) ? 'ring-4 ring-rose-500 opacity-90' : isRemoveMode ? 'hover:ring-2 hover:ring-rose-300' : 'hover:-translate-y-1 hover:shadow-2xl'}`}
                        >
                            <div className="mb-2 overflow-hidden rounded-xl bg-slate-100 sm:mb-4 sm:rounded-3xl">
                                <img src={item.image} alt={item.title} className="w-full object-cover min-h-[100px] sm:min-h-[160px] md:min-h-[200px]" />
                            </div>
                            <div>
                                <h3 className="mb-1 text-sm font-semibold text-slate-950 line-clamp-1 sm:mb-2 sm:text-xl sm:line-clamp-none">{item.title}</h3>
                                <p className="mb-2 text-[10px] leading-4 text-slate-600 line-clamp-2 sm:mb-4 sm:text-sm sm:leading-6 sm:line-clamp-none">{item.description}</p>
                                {item.price && <p className="text-xs font-bold text-slate-900 sm:text-base">₹{item.price.toLocaleString()}</p>}
                            </div>
                        </div>
                    ))}
                </section>
            )}
        </main>
    )
}
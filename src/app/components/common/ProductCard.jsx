"use client"

import React from 'react'

export const productData = {
    1: {
        image: "/images/IPhone 11 Pro Max.jpeg",
        alt: "iPhone 11 Pro Max",
        title: "iPhone 11 Pro Max",
        description:
            "Premium performance with a triple-camera system, long-lasting battery life, and a durable glass-and-stainless-steel design.",
        price: 45000,
    },
    2: {
        image: "/images/IPhone 12 Pro Max.jpeg",
        alt: "iPhone 12 Pro Max",
        title: "iPhone 12 Pro Max",
        description:
            "A beautifully balanced flagship with OLED display, 5G connectivity, and industry-leading camera stabilization.",
        price: 55000,
    },
    3: {
        image: "/images/IPhone 13 Pro Max.jpeg",
        alt: "iPhone 13 Pro Max",
        title: "iPhone 13 Pro Max",
        description:
            "Fast A15 Bionic power, brighter Super Retina XDR display, and Pro camera tools for stunning photos and video.",
        price: 65000,
    },
    4: {
        image: "/images/IPhone 14 Pro Max.jpeg",
        alt: "iPhone 14 Pro Max",
        title: "iPhone 14 Pro Max",
        description:
            "Pro-level performance with the latest chipset, crash detection, and advanced camera systems for next-level mobile creativity.",
        price: 75000,
    },
    5: {
        image: "/images/IPhone 15 Pro Max.jpeg",
        alt: "iPhone 15 Pro Max",
        title: "iPhone 15 Pro Max",
        description:
            "Ultra-smooth usage with a powerful processor, premium display, and enhanced photography features for modern everyday use.",
        price: 85000,
    },
    6: {
        image: "/images/IPhone 16 Pro Max.png",
        alt: "iPhone 16 Pro Max",
        title: "iPhone 16 Pro Max",
        description:
            "The latest flagship experience with cutting-edge speed, polished design, and intelligent features for productivity and entertainment.",
        price: 95000,
    },
}

export default function ProductCard({ productId, image, alt, title, description, price }) {
    const product = productId ? productData[productId] : null
    const cardImage = image || product?.image || "/images/IPhone 16 Pro Max.png"
    const cardAlt = alt || product?.alt || "Product image"
    const cardTitle = title || product?.title || "Featured product"
    const cardDescription = description || product?.description || "Discover our premium mobile products."
    const cardPrice = price || product?.price || 50000

    const handleAddToCart = () => {
        const currentCart = JSON.parse(localStorage.getItem('mobisphereCart') || '[]')
        currentCart.push({
            // Create a unique ID for this specific cart entry
            cartItemId: Date.now().toString() + Math.random().toString(36).substring(2, 9),
            productId: productId || null,
            title: cardTitle,
            image: cardImage,
            description: cardDescription,
            price: cardPrice
        })
        localStorage.setItem('mobisphereCart', JSON.stringify(currentCart))
        alert(`${cardTitle} has been added to your cart!`)
    }

    return (
        <figure className="flex h-full flex-col justify-between rounded-xl bg-white p-3 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl sm:rounded-[1.75rem] sm:p-5">
            <div className="mb-2 overflow-hidden rounded-xl bg-slate-100 sm:mb-4 sm:rounded-3xl">
                <img
                    src={cardImage}
                    alt={cardAlt}
                    className="w-full object-cover min-h-[100px] sm:min-h-[160px] md:min-h-[200px]"
                />
            </div>
            <div>
                <h3 className="mb-1 text-sm font-semibold text-slate-950 line-clamp-1 sm:mb-2 sm:text-xl sm:line-clamp-none">{cardTitle}</h3>
                <p className="mb-2 text-[10px] leading-4 text-slate-600 line-clamp-2 sm:mb-4 sm:text-sm sm:leading-6 sm:line-clamp-none">{cardDescription}</p>
                <p className="mb-2 text-sm font-bold text-slate-900 sm:text-lg">₹{cardPrice.toLocaleString()}</p>
            </div>
            <div className="mt-2 flex flex-col gap-1.5 sm:mt-4 sm:flex-row sm:justify-between sm:gap-3">
                <button onClick={handleAddToCart} className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-2 py-1.5 text-[10px] font-semibold text-white transition hover:bg-slate-800 sm:w-auto sm:px-4 sm:py-2 sm:text-sm">
                    Add to cart
                </button>
                <button className="inline-flex w-full items-center justify-center rounded-full border border-emerald-600 bg-emerald-600 px-2 py-1.5 text-[10px] font-semibold text-slate-950 transition hover:bg-emerald-500 sm:w-auto sm:px-4 sm:py-2 sm:text-sm">
                    Buy product
                </button>
            </div>
        </figure>
    )
}

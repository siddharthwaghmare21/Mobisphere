"use client";

import React, { useState } from 'react';

export default function ProductDisplayCard({ product }) {
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    if (quantity < 1) {
      alert("Please select at least one item.");
      return;
    }
    try {
      const cart = JSON.parse(localStorage.getItem('mobisphereCart') || '[]');
      const existingProductIndex = cart.findIndex(item => item.productId === product.id);

      if (existingProductIndex > -1) {
        // If product exists, update quantity
        cart[existingProductIndex].quantity = (cart[existingProductIndex].quantity || 1) + quantity;
      } else {
        // If new, add to cart with quantity
        cart.push({
          cartItemId: Date.now().toString() + Math.random().toString(36).substring(2, 9),
          productId: product.id,
          title: product.title,
          image: product.image,
          description: product.description,
          price: product.price,
          quantity: quantity,
        });
      }
      
      localStorage.setItem('mobisphereCart', JSON.stringify(cart));
      alert(`${quantity} x ${product.title} added to your cart!`);
    } catch (e) {
      console.error("Failed to add to cart", e);
      alert("Could not add item to cart.");
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
      <div className="h-56 bg-slate-100 flex items-center justify-center overflow-hidden">
        <img src={product.image || '/images/IPhone 16 Pro Max.png'} alt={product.title} className="w-full h-full object-cover" />
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-xl font-black text-slate-900">{product.title}</h3>
        <p className="text-sm font-bold text-emerald-600 mt-1">₹{Number(product.price || 0).toLocaleString()}</p>
        <p className="text-xs text-slate-500 mt-2 flex-1">{product.description}</p>
        
        <div className="mt-4 pt-4 border-t border-slate-100">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Specifications</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {Object.entries(product.specs || {}).map(([key, value]) => (
              value && <div key={key} className="flex justify-between">
                <span className="font-semibold text-slate-600">{key}:</span>
                <span className="font-bold text-slate-800">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="flex items-center justify-center gap-2">
            <label htmlFor={`quantity-${product.id}`} className="text-xs font-bold text-slate-500">QTY:</label>
            <input
              id={`quantity-${product.id}`}
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="w-16 text-center font-bold rounded-lg border border-slate-200 p-2 text-sm outline-none focus:ring-2 ring-slate-900"
            />
          </div>
          <button 
            onClick={handleAddToCart}
            className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-xl shadow-md hover:bg-slate-800 transition font-bold text-sm"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
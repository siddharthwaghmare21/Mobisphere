"use client";

import React, { useState, useMemo } from 'react';
import { useProductContext } from '@/app/context/ProductContext';
import ProductDisplayCard from '@/app/components/product/ProductDisplayCard';

export default function ProductPage() {
  const { products, hydrated } = useProductContext();
  const [view, setView] = useState('brands'); // 'brands' or 'products'
  const [selectedBrand, setSelectedBrand] = useState('');

  const uniqueBrands = useMemo(() => {
    if (!products) return [];
    return [...new Set(products.map(p => p.brand || 'Other Models'))];
  }, [products]);

  if (!hydrated) {
    return (
      <div className="text-center py-20">
        <p>Loading Products...</p>
      </div>
    );
  }

  const handleBrandSelect = (brand) => {
    setSelectedBrand(brand);
    setView('products');
  };

  const filteredProducts = useMemo(() => {
    if (view !== 'products' || !selectedBrand) return [];
    return products.filter(p => (p.brand || 'Other Models') === selectedBrand);
  }, [products, view, selectedBrand]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="mb-8 rounded-[2rem] bg-white p-8 shadow-xl border border-slate-100">
        <h1 className="text-4xl font-black text-slate-900">
          {view === 'brands' ? 'Browse by Brand' : `Mobiles from ${selectedBrand}`}
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          {view === 'brands' 
            ? 'Select a company to see all available models.' 
            : 'Explore our collection of the latest smartphones.'}
        </p>
      </header>

      {view === 'products' && (
        <button 
          onClick={() => setView('brands')}
          className="mb-6 px-5 py-2 bg-slate-100 text-slate-800 rounded-full text-sm font-bold hover:bg-slate-200 transition flex items-center gap-2"
        >
          ← Back to All Brands
        </button>
      )}

      {view === 'brands' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {uniqueBrands.map(brand => (
            <button 
              key={brand} 
              onClick={() => handleBrandSelect(brand)}
              className="p-8 bg-white border border-slate-200 rounded-3xl text-left shadow-lg hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 group"
            >
              <div className="text-4xl mb-4 opacity-80 group-hover:opacity-100">📱</div>
              <h3 className="text-2xl font-black text-slate-900">{brand}</h3>
              <p className="text-sm mt-1 text-slate-500 group-hover:text-emerald-600 font-semibold">
                {products.filter(p => (p.brand || 'Other Models') === brand).length} Models Available
              </p>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map(product => (
            <ProductDisplayCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
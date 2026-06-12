"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useProductContext } from '@/app/context/ProductContext';
import ProductDisplayCard from '@/app/components/product/ProductDisplayCard';

export default function ProductPage() {
  const { products, hydrated } = useProductContext();
  const [view, setView] = useState('brands'); // 'brands' or 'products'
  const [selectedBrand, setSelectedBrand] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearchingUI, setIsSearchingUI] = useState(false);
  const [sortOrder, setSortOrder] = useState('none'); // 'none', 'asc', 'desc'

  // ⏳ Debounce Effect: टाईप केल्यावर लगेच सर्च न करता लोडिंग ऍनिमेशन दाखवण्यासाठी
  useEffect(() => {
    setIsSearchingUI(true);
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setIsSearchingUI(false);
    }, 500); // 500ms चा लोडिंग वेळ दिला आहे
    return () => clearTimeout(timer);
  }, [searchTerm]);

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
    if (!products) return [];
    
    let result = [];
    const normalizedSearch = debouncedSearch.trim().toLowerCase();
    
    if (normalizedSearch) {
      result = products.filter(p => 
        p.title?.toLowerCase().includes(normalizedSearch) || 
        p.brand?.toLowerCase().includes(normalizedSearch)
      );
    } else if (view === 'products' && selectedBrand) {
      result = products.filter(p => (p.brand || 'Other Models') === selectedBrand);
    } else {
      return []; // Brands view without search
    }

    // 🔽 Price Sorting Logic
    if (sortOrder === 'asc') result.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    else if (sortOrder === 'desc') result.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    else if (sortOrder === 'name-asc') result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    else if (sortOrder === 'name-desc') result.sort((a, b) => (b.title || '').localeCompare(a.title || ''));

    return result;
  }, [products, view, selectedBrand, debouncedSearch, sortOrder]);

  const hasSearchTerm = searchTerm.trim().length > 0;
  const showNoResults = !isSearchingUI && hasSearchTerm && debouncedSearch.trim().length > 0 && filteredProducts.length === 0;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="mb-8 rounded-[2rem] bg-white p-8 shadow-xl border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900">
              {isSearchingUI && hasSearchTerm ? 'Searching...' : hasSearchTerm ? 'Search Results' : view === 'brands' ? 'Browse by Brand' : `Mobiles from ${selectedBrand}`}
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              {isSearchingUI && hasSearchTerm
                ? `Looking up for "${searchTerm}"...`
                : hasSearchTerm 
                ? `Showing results for "${debouncedSearch}"` 
                : view === 'brands' 
                ? 'Select a company to see all available models.' 
                : 'Explore our collection of the latest smartphones.'}
            </p>
          </div>

          {/* 🔍 Search Bar - Professional Design */}
          <div className="w-full md:max-w-md">
            <div className="relative flex items-center w-full h-14 rounded-2xl focus-within:shadow-md bg-slate-50 border border-slate-200 transition-all duration-300 focus-within:border-slate-400 overflow-hidden">
              <div className="grid place-items-center h-full w-14 text-slate-400">
                {/* 🔄 Spinning Animation Icon */}
                {isSearchingUI && hasSearchTerm ? (
                  <svg className="animate-spin h-5 w-5 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                )}
              </div>
              <input
                className="peer h-full w-full outline-none text-sm text-slate-800 bg-transparent placeholder-slate-400 font-semibold"
                type="text"
                placeholder="Search smartphones, brands..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {hasSearchTerm && (
                <button onClick={() => { setSearchTerm(''); setDebouncedSearch(''); }} className="grid place-items-center h-full w-14 text-slate-400 hover:text-slate-700 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 🛠️ Top Controls Row: Back Button & Sorting */}
      {(!showNoResults && (view === 'products' || hasSearchTerm)) && (
        <div className={`flex flex-col sm:flex-row gap-4 mb-6 ${view === 'products' && !hasSearchTerm ? 'justify-between items-start sm:items-center' : 'justify-end'}`}>
          {view === 'products' && !hasSearchTerm && (
            <button onClick={() => setView('brands')} className="px-5 py-2 bg-slate-100 text-slate-800 rounded-full text-sm font-bold hover:bg-slate-200 transition flex items-center gap-2 shadow-sm">
              ← Back to All Brands
            </button>
          )}
          
          {/* 📊 Sort By Price Dropdown */}
          <div className="flex items-center gap-3">
             <label htmlFor="sort" className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Sort By</label>
             <select id="sort" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-700 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all shadow-sm cursor-pointer">
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
            <div className="text-5xl mb-5 opacity-80">🔍</div>
            <p className="text-xl font-black text-rose-900">No products found</p>
            <p className="mt-2 text-sm font-medium text-rose-700">We couldn't find anything matching "{debouncedSearch}".</p>
            <button onClick={() => { setSearchTerm(''); setDebouncedSearch(''); }} className="mt-6 px-6 py-2 bg-rose-600 text-white rounded-full text-xs font-bold hover:bg-rose-700 transition shadow-md">Clear Search</button>
          </div>
        ) : (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 transition-opacity duration-300 ${isSearchingUI ? 'opacity-50' : 'opacity-100'}`}>
            {filteredProducts.map(product => (
              <ProductDisplayCard key={product.id} product={product} />
            ))}
          </div>
        )
      ) : view === 'brands' ? (
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
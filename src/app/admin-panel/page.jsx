"use client";
import React, { useState } from 'react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('Dashboard');

  const menuItems = [
    'Dashboard',
    'Product Inventory',
    'Order Management',
    'User Accounts',
    'Coupons & Offers',
    'Reports',
    'Enquiries'
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full">
        <div className="p-6 text-2xl font-bold border-b border-slate-800 tracking-wide">
          Admin Panel
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item}
              onClick={() => setActiveTab(item)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === item
                  ? 'bg-emerald-600 text-white font-semibold shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button className="w-full px-4 py-2 text-sm text-slate-400 hover:text-white transition">
            ← Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 ml-64">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">{activeTab}</h1>
          <p className="text-slate-500 mt-2">Manage your {activeTab.toLowerCase()} effectively.</p>
        </header>

        {/* Dashboard specific overview cards */}
        {activeTab === 'Dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Total Orders</h3>
              <p className="text-3xl font-bold text-slate-900 mt-2">1,284</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Total Revenue</h3>
              <p className="text-3xl font-bold text-slate-900 mt-2">₹84,300</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider">New Enquiries</h3>
              <p className="text-3xl font-bold text-slate-900 mt-2">24</p>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-[50vh] flex flex-col items-center justify-center text-center">
          <div className="text-4xl mb-4">🚧</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">{activeTab} Module</h2>
          <p className="text-slate-500">
            This section is ready for you to add the {activeTab.toLowerCase()} functionality.
          </p>
        </div>
      </main>
    </div>
  );
}
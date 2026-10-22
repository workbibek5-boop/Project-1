/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useWholesale } from '../../context/WholesaleContext';
import { useClothingWholesale } from '../../context/ClothingWholesaleContext';
import { formatNpr } from '../../i18n';
import { Search, Filter, ShoppingBag, Check } from 'lucide-react';
import { Product } from '../../types';

export const CatalogueSection: React.FC = () => {
  const { products, addToCart, t, currentCustomer } = useWholesale();
  const { settings } = useClothingWholesale();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [addedItemNotice, setAddedItemNotice] = useState<string | null>(null);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    if (!p.isActive) return false;
    // Category authorization check: If customer is logged in with C, B, or F, only show authorized items
    if (currentCustomer?.category && (p as any).authorizedCategories && Array.isArray((p as any).authorizedCategories)) {
      if (!(p as any).authorizedCategories.includes(currentCustomer.category)) {
        return false;
      }
    }
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.fabricComposition.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAdd = (prod: Product) => {
    addToCart(prod, prod.minOrderQuantity || 1);
    setAddedItemNotice(prod.id);
    setTimeout(() => setAddedItemNotice(null), 1800);
  };

  const configuredLimit = currentCustomer?.category
    ? settings.cbfAmounts?.[currentCustomer.category]
    : undefined;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header and Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Wholesale Apparel Inventory</span>
            <span aria-hidden="true">·</span>
            <span>Kathmandu Ready Stock</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Product Catalogue & Garment Lines
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Assorted size wholesale packs sold directly to authorized retail businesses.
          </p>
        </div>

        {/* Customer Category & Limit Reminder */}
        {currentCustomer && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
            <div>Logged in as: <strong>{currentCustomer.businessName}</strong></div>
            <div className="mt-0.5">
              Assigned Tier: <strong>Category {currentCustomer.category}</strong> (Limit:{' '}
              <span className="font-mono font-semibold">
                {configuredLimit !== undefined && configuredLimit !== null
                  ? formatNpr(configuredLimit)
                  : 'Not Configured'}
              </span>)
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by SKU, garment name, fabric..."
            className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
          />
        </div>

        {/* Category Pills/Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1 mr-1" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-xl">
          <p className="text-base font-semibold text-slate-700">No garments match your search criteria.</p>
          <p className="text-xs text-slate-500 mt-1">Try clearing filters or searching with a different term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                <img
                  src={prod.images[0]}
                  alt={prod.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-sm text-white text-[11px] font-mono px-2 py-0.5 rounded">
                  {prod.sku}
                </div>
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm text-slate-800 text-[11px] font-medium px-2 py-0.5 rounded shadow-sm">
                  MOQ: {prod.minOrderQuantity} {prod.minOrderQuantity === 1 ? 'pack' : 'packs'}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-xs text-slate-500 font-medium">{prod.category}</div>
                  <h3 className="mt-1 text-base font-semibold text-slate-900 leading-snug">
                    {prod.name}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {prod.description}
                  </p>

                  <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Fabric Composition:</span>
                      <span className="text-slate-800 font-medium text-right">{prod.fabricComposition}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Size Assortment:</span>
                      <span className="text-slate-800 font-medium text-right">{prod.sizeRun}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Color Options:</span>
                      <span className="text-slate-800 font-medium text-right">{prod.colorVariants.join(', ')}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="flex items-baseline justify-between mb-3">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Wholesale Rate per Pack</span>
                      <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                        {formatNpr(prod.wholesalePriceNpr)}
                      </span>
                    </div>
                    <div className="text-right text-xs">
                      <span className="text-slate-500">Stock: </span>
                      <span className="font-mono font-semibold text-emerald-700">
                        {prod.availableStock} packs
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAdd(prod)}
                    disabled={prod.availableStock === 0}
                    className={`w-full py-2.5 px-4 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors ${
                      addedItemNotice === prod.id
                        ? 'bg-emerald-700 text-white'
                        : prod.availableStock === 0
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {addedItemNotice === prod.id ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Added to Cart ({prod.minOrderQuantity} packs)</span>
                      </>
                    ) : prod.availableStock === 0 ? (
                      <span>Sold Out</span>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Add {prod.minOrderQuantity} Pack(s) to Cart</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

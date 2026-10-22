/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useClothingWholesale } from '../../context/ClothingWholesaleContext';
import { ClothingProduct, ProductVariant } from '../../db/indexedDb';
import {
  FASHION_DEPARTMENTS,
  FASHION_HIERARCHY,
  COMMON_FABRICS,
  FASHION_OCCASIONS,
  FashionDepartment,
} from '../../data/fashionCategories';
import { formatNpr } from '../../i18n';
import { useDebounce } from '../../hooks/useDebounce';
import {
  Sparkles,
  Search,
  Filter,
  Plus,
  CreditCard,
  Package,
  Layers,
  Crown,
  Scissors,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  Tag,
  ArrowRight,
  Eye,
} from 'lucide-react';

interface FashionCollectionShowcaseProps {
  onOpenPos: () => void;
  onOpenAddProduct?: (department?: string) => void;
}

export const FashionCollectionShowcase: React.FC<FashionCollectionShowcaseProps> = ({
  onOpenPos,
  onOpenAddProduct,
}) => {
  const { products, settings } = useClothingWholesale();

  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedFabric, setSelectedFabric] = useState<string>('All');
  const [selectedOccasion, setSelectedOccasion] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 160);

  // Selected product for quick inspection modal
  const [inspectProduct, setInspectProduct] = useState<ClothingProduct | null>(null);

  // Filtered subcategories based on department
  const availableSubcategories = useMemo(() => {
    if (selectedDept === 'All') {
      const allSubs = new Set<string>();
      Object.values(FASHION_HIERARCHY).forEach((list) => list.forEach((c) => allSubs.add(c)));
      return ['All', ...Array.from(allSubs)];
    }
    const list = FASHION_HIERARCHY[selectedDept as FashionDepartment] || [];
    return ['All', ...list];
  }, [selectedDept]);

  // Counts per department
  const deptCounts = useMemo(() => {
    const counts: Record<string, number> = { All: products.length };
    for (const d of FASHION_DEPARTMENTS) {
      counts[d] = 0;
    }
    for (const p of products) {
      if (p.department && counts[p.department] !== undefined) {
        counts[p.department]++;
      }
    }
    return counts;
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return products.filter((p) => {
      // Department match
      if (selectedDept !== 'All' && p.department !== selectedDept) {
        return false;
      }
      // Subcategory match
      if (selectedCategory !== 'All' && p.category !== selectedCategory) {
        return false;
      }
      // Fabric match
      if (selectedFabric !== 'All' && (!p.fabric || !p.fabric.toLowerCase().includes(selectedFabric.toLowerCase()))) {
        return false;
      }
      // Occasion match
      if (selectedOccasion !== 'All' && p.collectionOccasion !== selectedOccasion) {
        return false;
      }
      // Search match
      if (q) {
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesSku = p.sku.toLowerCase().includes(q);
        const matchesCategory = p.category.toLowerCase().includes(q);
        const matchesBrand = p.brand.toLowerCase().includes(q);
        const matchesDept = (p.department || '').toLowerCase().includes(q);
        const matchesFabric = (p.fabric || '').toLowerCase().includes(q);
        const matchesStyle = (p.designStyleCode || '').toLowerCase().includes(q);
        const matchesVariants = p.variants.some(
          (v) =>
            v.size.toLowerCase().includes(q) ||
            v.color.toLowerCase().includes(q) ||
            v.sku.toLowerCase().includes(q)
        );
        if (!matchesName && !matchesSku && !matchesCategory && !matchesBrand && !matchesDept && !matchesFabric && !matchesStyle && !matchesVariants) {
          return false;
        }
      }
      return true;
    });
  }, [products, selectedDept, selectedCategory, selectedFabric, selectedOccasion, debouncedSearch]);

  const departmentIcons: Record<string, string> = {
    'Formal & Western Wear': '👔',
    'Women’s Ethnic Wear': '🥻',
    'Dresses & Fashion': '👗',
    'Men’s Traditional Wear': '👳',
    'Textiles & Fabrics': '🧵',
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-500/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-amber-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Haute Couture · Bridal · Textiles & Mill Wholesale</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
              Garments, Textiles & Fashion Collection
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Explore Western executive tailoring, handcrafted bridal lehengas, Banarasi silk sarees, couture gowns, groom sherwanis, and fine textile fabrics sold by the piece or metre.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={onOpenPos}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Open Cash Billing POS</span>
            </button>
            {onOpenAddProduct && (
              <button
                onClick={() => onOpenAddProduct(selectedDept !== 'All' ? selectedDept : undefined)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-slate-700 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Add Fashion Item</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Department Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        <button
          onClick={() => {
            setSelectedDept('All');
            setSelectedCategory('All');
          }}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shadow-2xs ${
            selectedDept === 'All'
              ? 'bg-slate-950 text-white shadow-sm ring-2 ring-amber-500/30'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>🌟</span>
          <span>All Departments</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${selectedDept === 'All' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-100 text-slate-600'}`}>
            {deptCounts['All'] || 0}
          </span>
        </button>

        {FASHION_DEPARTMENTS.map((dept) => {
          const isSelected = selectedDept === dept;
          const count = deptCounts[dept] || 0;
          return (
            <button
              key={dept}
              onClick={() => {
                setSelectedDept(dept);
                setSelectedCategory('All');
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shadow-2xs ${
                isSelected
                  ? 'bg-slate-950 text-white shadow-sm ring-2 ring-amber-500/30'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{departmentIcons[dept] || '✨'}</span>
              <span>{dept}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${isSelected ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-100 text-slate-600'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Search and Secondary Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Live Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search style code, SKU, design name, fabric..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
            />
          </div>

          {/* Subcategory Dropdown */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 cursor-pointer focus:bg-white"
            >
              <option value="All">All Categories ({availableSubcategories.length - 1})</option>
              {availableSubcategories
                .filter((c) => c !== 'All')
                .map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
            </select>
          </div>

          {/* Fabric / Material Filter */}
          <div>
            <select
              value={selectedFabric}
              onChange={(e) => setSelectedFabric(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 cursor-pointer focus:bg-white"
            >
              <option value="All">All Fabrics & Materials</option>
              {COMMON_FABRICS.map((fab) => (
                <option key={fab} value={fab}>
                  {fab}
                </option>
              ))}
            </select>
          </div>

          {/* Occasion / Collection */}
          <div>
            <select
              value={selectedOccasion}
              onChange={(e) => setSelectedOccasion(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 cursor-pointer focus:bg-white"
            >
              <option value="All">All Occasions & Collections</option>
              {FASHION_OCCASIONS.map((occ) => (
                <option key={occ} value={occ}>
                  {occ}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filter Pills Indicator */}
        {(selectedDept !== 'All' || selectedCategory !== 'All' || selectedFabric !== 'All' || selectedOccasion !== 'All' || searchQuery.trim()) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-semibold">Active Filters:</span>
            {selectedDept !== 'All' && (
              <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-lg font-bold flex items-center gap-1">
                Dept: {selectedDept}
                <button onClick={() => setSelectedDept('All')} className="hover:text-amber-950 font-bold ml-1 cursor-pointer">&times;</button>
              </span>
            )}
            {selectedCategory !== 'All' && (
              <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg font-bold flex items-center gap-1">
                Cat: {selectedCategory}
                <button onClick={() => setSelectedCategory('All')} className="hover:text-slate-950 font-bold ml-1 cursor-pointer">&times;</button>
              </span>
            )}
            {selectedFabric !== 'All' && (
              <span className="px-2.5 py-1 bg-purple-100 text-purple-900 rounded-lg font-bold flex items-center gap-1">
                Fabric: {selectedFabric}
                <button onClick={() => setSelectedFabric('All')} className="hover:text-purple-950 font-bold ml-1 cursor-pointer">&times;</button>
              </span>
            )}
            {selectedOccasion !== 'All' && (
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-lg font-bold flex items-center gap-1">
                Occasion: {selectedOccasion}
                <button onClick={() => setSelectedOccasion('All')} className="hover:text-emerald-950 font-bold ml-1 cursor-pointer">&times;</button>
              </span>
            )}
            {searchQuery.trim() && (
              <span className="px-2.5 py-1 bg-sky-100 text-sky-900 rounded-lg font-bold flex items-center gap-1">
                Query: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:text-sky-950 font-bold ml-1 cursor-pointer">&times;</button>
              </span>
            )}
            <button
              onClick={() => {
                setSelectedDept('All');
                setSelectedCategory('All');
                setSelectedFabric('All');
                setSelectedOccasion('All');
                setSearchQuery('');
              }}
              className="text-slate-500 hover:text-rose-600 underline text-xs font-semibold ml-auto cursor-pointer"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* 4. Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white border border-slate-200 rounded-3xl p-8 space-y-3">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Fashion Pieces Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No products match your selected department, category, or search filter. Try clearing filters or add a new piece to this collection.
            </p>
            {onOpenAddProduct && (
              <button
                onClick={() => onOpenAddProduct(selectedDept !== 'All' ? selectedDept : undefined)}
                className="mt-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Add Product to {selectedDept === 'All' ? 'Collection' : selectedDept}</span>
              </button>
            )}
          </div>
        ) : (
          filteredProducts.map((p) => {
            const isTextile = p.unit === 'metres' || p.unit === 'rolls';
            const hasLowStock = p.variants.some(
              (v) => v.stock <= (v.lowStockAlert ?? settings.defaultLowStockThreshold)
            );

            return (
              <div
                key={p.id}
                className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Image & Badges */}
                  <div className="relative h-56 bg-slate-100 overflow-hidden">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                        <Package className="w-10 h-10 mb-1" />
                        <span className="text-[11px] font-mono">No Image</span>
                      </div>
                    )}

                    {/* Department Tag Overlay */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      {p.department && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide uppercase bg-slate-950/80 backdrop-blur-md text-amber-300 shadow-sm border border-amber-500/30">
                          {p.department}
                        </span>
                      )}
                      {p.collectionOccasion && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/90 backdrop-blur-md text-slate-800 shadow-xs">
                          {p.collectionOccasion}
                        </span>
                      )}
                    </div>

                    {/* Stock status indicator pill */}
                    <div className="absolute top-3 right-3">
                      {hasLowStock ? (
                        <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-500 text-slate-950 flex items-center gap-1 shadow-sm">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Low Variant</span>
                        </span>
                      ) : p.totalStock > 0 ? (
                        <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-600 text-white flex items-center gap-1 shadow-sm">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>In Stock</span>
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-600 text-white shadow-sm">
                          Out of Stock
                        </span>
                      )}
                    </div>

                    {/* Price banner overlay at bottom of image */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent p-3 pt-6 text-white flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] text-amber-300 block font-semibold uppercase tracking-wider">
                          Wholesale Price
                        </span>
                        <div className="text-lg font-black tracking-tight font-mono">
                          {formatNpr(p.sellingPrice)}
                          <span className="text-xs font-normal text-slate-300 ml-1">
                            /{p.unit}
                          </span>
                        </div>
                      </div>

                      {p.gstRate !== undefined && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800/90 text-slate-200 border border-slate-700">
                          {p.gstRate}% GST/VAT
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mb-0.5">
                        <span className="font-bold text-slate-700">{p.sku}</span>
                        {p.designStyleCode && (
                          <span className="text-amber-700 font-semibold">Style: {p.designStyleCode}</span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-1">
                        {p.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {p.brand} {p.manufacturer ? `· ${p.manufacturer}` : ''}
                      </p>
                    </div>

                    {/* Fabric and Material Tag */}
                    {p.fabric && (
                      <div className="px-2.5 py-1.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-amber-900 text-[11px] flex items-center gap-1.5">
                        <Scissors className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span className="truncate font-medium">{p.fabric}</span>
                      </div>
                    )}

                    {/* Variant Sizing & Color Chips */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
                        <span>Available Variants ({p.variants.length})</span>
                        <span className="font-mono text-slate-700">
                          Total: <strong>{p.totalStock}</strong> {p.unit}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-0.5">
                        {p.variants.map((v) => {
                          const isLow = v.stock <= (v.lowStockAlert ?? settings.defaultLowStockThreshold);
                          return (
                            <span
                              key={v.id}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                                v.stock === 0
                                  ? 'bg-rose-50 text-rose-800 border-rose-200 line-through'
                                  : isLow
                                  ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold'
                                  : 'bg-slate-50 text-slate-800 border-slate-200'
                              }`}
                              title={`${v.size} - ${v.color} | Stock: ${v.stock} ${p.unit}`}
                            >
                              {v.size}/{v.color}: <strong>{v.stock}</strong>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-4 pt-0 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => setInspectProduct(p)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-600" />
                    <span>Details & Specs</span>
                  </button>

                  <button
                    onClick={onOpenPos}
                    className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                    title="Open Cash Billing POS counter to bill this item"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                    <span>Bill at POS</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Product Inspection Modal */}
      {inspectProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
                  {inspectProduct.department || 'Garment Collection'} · {inspectProduct.category}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  {inspectProduct.name}
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  SKU: {inspectProduct.sku} {inspectProduct.designStyleCode ? `| Style: ${inspectProduct.designStyleCode}` : ''}
                </span>
              </div>
              <button
                onClick={() => setInspectProduct(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inspectProduct.imageUrl && (
              <div className="h-56 rounded-2xl overflow-hidden bg-slate-100">
                <img
                  src={inspectProduct.imageUrl}
                  alt={inspectProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-semibold">Wholesale Price</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {formatNpr(inspectProduct.sellingPrice)}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-semibold">Purchase Cost</span>
                <span className="font-mono text-slate-700 text-sm">
                  {formatNpr(inspectProduct.purchaseCost)}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-semibold">Unit of Measure</span>
                <span className="font-bold text-slate-900 capitalize text-sm">
                  {inspectProduct.unit}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-semibold">Brand / Label</span>
                <span className="font-semibold text-slate-800">{inspectProduct.brand || 'Unbranded'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-semibold">Manufacturer</span>
                <span className="font-semibold text-slate-800">{inspectProduct.manufacturer || inspectProduct.supplier || 'N/A'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-semibold">GST / VAT Rate</span>
                <span className="font-semibold text-slate-800">{inspectProduct.gstRate ?? settings.defaultVatPercent}%</span>
              </div>
            </div>

            {inspectProduct.fabric && (
              <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-950">
                <strong className="block text-[10px] uppercase text-amber-700 tracking-wider">Fabric & Material Composition</strong>
                <p className="mt-0.5">{inspectProduct.fabric}</p>
              </div>
            )}

            {/* Variant stock breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900">Variant Inventory Breakdown</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[11px] text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Size</th>
                      <th className="py-2 px-3">Color</th>
                      <th className="py-2 px-3">Variant SKU</th>
                      <th className="py-2 px-3 text-right">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inspectProduct.variants.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/60">
                        <td className="py-2 px-3 font-bold">{v.size}</td>
                        <td className="py-2 px-3">{v.color}</td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{v.sku}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold">
                          {v.stock} {inspectProduct.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setInspectProduct(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setInspectProduct(null);
                  onOpenPos();
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                <span>Go to POS Cash Billing</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

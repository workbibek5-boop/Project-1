/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useClothingWholesale } from '../../context/ClothingWholesaleContext';
import { ClothingProduct, ProductVariant, StockMovement } from '../../db/indexedDb';
import { formatNpr } from '../../i18n';
import { useDebounce } from '../../hooks/useDebounce';
import { Pagination } from '../common/Pagination';
import {
  Package,
  AlertTriangle,
  Search,
  Filter,
  History,
  ArrowUpDown,
  CheckCircle2,
  X,
  Sliders,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

interface FlatVariantRow {
  productId: string;
  variantId: string;
  productName: string;
  sku: string;
  category: string;
  size: string;
  color: string;
  stock: number;
  lowStockAlert: number;
  unit: string;
  purchaseCost: number;
  sellingPrice: number;
}

export const InventoryStockMatrix: React.FC = () => {
  const { products, stockMovements, settings, adjustVariantStock } = useClothingWholesale();

  const [activeTab, setActiveTab] = useState<'matrix' | 'movements'>('matrix');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);

  const [filterType, setFilterType] = useState<'all' | 'low_stock' | 'out_of_stock'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Pagination for Matrix
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Pagination for Movements
  const [movementPage, setMovementPage] = useState(1);
  const [movementsPerPage, setMovementsPerPage] = useState(25);

  // Quick Adjustment Modal State
  const [adjustmentTarget, setAdjustmentTarget] = useState<FlatVariantRow | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(0);
  const [adjustType, setAdjustType] = useState<'adjustment' | 'damaged' | 'purchase_return'>('adjustment');
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const threshold = settings.defaultLowStockThreshold || 15;

  // Flatten all products into individual variant rows
  const allVariants = useMemo<FlatVariantRow[]>(() => {
    const list: FlatVariantRow[] = [];
    for (const p of products) {
      if (!p.isActive) continue;
      for (const v of p.variants) {
        list.push({
          productId: p.id,
          variantId: v.id,
          productName: p.name,
          sku: v.sku,
          category: p.category,
          size: v.size,
          color: v.color,
          stock: v.stock,
          lowStockAlert: v.lowStockAlert !== undefined ? v.lowStockAlert : threshold,
          unit: p.unit,
          purchaseCost: p.purchaseCost,
          sellingPrice: p.sellingPrice,
        });
      }
    }
    return list;
  }, [products, threshold]);

  // Categories list
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (p.category) set.add(p.category);
    }
    return Array.from(set).sort();
  }, [products]);

  // Filtered variants
  const filteredVariants = useMemo(() => {
    let result = allVariants;

    // Filter by stock level
    if (filterType === 'low_stock') {
      result = result.filter((v) => v.stock <= v.lowStockAlert && v.stock > 0);
    } else if (filterType === 'out_of_stock') {
      result = result.filter((v) => v.stock <= 0);
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      result = result.filter((v) => v.category === categoryFilter);
    }

    // Filter by search query
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (v) =>
          v.productName.toLowerCase().includes(q) ||
          v.sku.toLowerCase().includes(q) ||
          v.size.toLowerCase().includes(q) ||
          v.color.toLowerCase().includes(q) ||
          v.category.toLowerCase().includes(q)
      );
    }

    return result;
  }, [allVariants, filterType, categoryFilter, debouncedSearch]);

  // Paginated variants
  const paginatedVariants = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredVariants.slice(start, start + itemsPerPage);
  }, [filteredVariants, currentPage, itemsPerPage]);

  // Filtered movements
  const filteredMovements = useMemo(() => {
    if (!debouncedSearch.trim()) return stockMovements;
    const q = debouncedSearch.toLowerCase();
    return stockMovements.filter(
      (m) =>
        m.productName.toLowerCase().includes(q) ||
        m.sku.toLowerCase().includes(q) ||
        m.reason.toLowerCase().includes(q) ||
        m.referenceId.toLowerCase().includes(q)
    );
  }, [stockMovements, debouncedSearch]);

  const paginatedMovements = useMemo(() => {
    const start = (movementPage - 1) * movementsPerPage;
    return filteredMovements.slice(start, start + movementsPerPage);
  }, [filteredMovements, movementPage, movementsPerPage]);

  const handleOpenAdjust = (row: FlatVariantRow) => {
    setAdjustmentTarget(row);
    setAdjustDelta(0);
    setAdjustType('adjustment');
    setAdjustReason('Physical inventory recount correction');
    setAdjustError(null);
  };

  const handleExecuteAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustmentTarget) return;

    if (adjustDelta === 0) {
      setAdjustError('Please specify a non-zero quantity delta.');
      return;
    }
    if (adjustmentTarget.stock + adjustDelta < 0 && !settings.allowNegativeStock) {
      setAdjustError(`Adjustment would result in negative stock (${adjustmentTarget.stock + adjustDelta}).`);
      return;
    }
    if (!adjustReason.trim()) {
      setAdjustError('Please provide a brief reason for audit records.');
      return;
    }

    setIsSubmitting(true);
    setAdjustError(null);

    const res = await adjustVariantStock(
      adjustmentTarget.productId,
      adjustmentTarget.variantId,
      adjustDelta,
      adjustType,
      adjustReason.trim()
    );

    setIsSubmitting(false);

    if (res.success) {
      setAdjustmentTarget(null);
    } else {
      setAdjustError(res.error || 'Failed to adjust stock');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Inventory Management</span>
            <span aria-hidden="true">·</span>
            <span>Variant Matrix & Audit Trail</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Warehouse Stock Matrix
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor granular size and color inventory, identify re-order priorities, and log manual stock corrections.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'matrix' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Variant Matrix ({allVariants.length})
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'movements' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Ledger ({stockMovements.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'matrix' ? (
        <div className="space-y-4">
          {/* Controls Bar: Search & Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            {/* Search */}
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by product name, SKU, size, or color..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
              />
            </div>

            {/* Stock Level Filter */}
            <div>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="all">All Stock Levels</option>
                <option value="low_stock">⚠️ Low Stock Alerts (≤ {threshold})</option>
                <option value="out_of_stock">❌ Zero / Out of Stock</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="all">All Garment Lines</option>
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3 px-4">SKU Code</th>
                    <th className="py-3 px-4">Garment Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">Size</th>
                    <th className="py-3 px-4 text-center">Color</th>
                    <th className="py-3 px-4 text-right">Wholesale Rate</th>
                    <th className="py-3 px-4 text-right">Stock</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedVariants.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-xs text-slate-500">
                        No inventory variants match your search and filter criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedVariants.map((v) => {
                      const isLow = v.stock <= v.lowStockAlert && v.stock > 0;
                      const isZero = v.stock <= 0;

                      return (
                        <tr key={v.variantId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-4 font-mono font-bold text-slate-900 text-[11px]">
                            {v.sku}
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-slate-900 max-w-xs truncate">
                            {v.productName}
                          </td>
                          <td className="py-2.5 px-4 text-slate-500 truncate max-w-[120px]">
                            {v.category}
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-800">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                              {v.size}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-center text-slate-700">
                            {v.color}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono text-slate-900">
                            {formatNpr(v.sellingPrice)}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                            {v.stock} <span className="text-[10px] text-slate-400 font-normal">{v.unit}</span>
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            {isZero ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                Out of Stock
                              </span>
                            ) : isLow ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                                Low (≤ {v.lowStockAlert})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Healthy
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <button
                              onClick={() => handleOpenAdjust(v)}
                              className="py-1 px-2 text-[11px] font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors inline-flex items-center gap-1"
                              title="Correct or adjust stock for this size/color"
                            >
                              <Sliders className="w-3 h-3 text-slate-600" />
                              <span>Adjust</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              totalItems={filteredVariants.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        </div>
      ) : (
        /* Movements Audit Ledger Tab */
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Garment SKU</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4 text-center">Size / Color</th>
                    <th className="py-3 px-4">Event Type</th>
                    <th className="py-3 px-4 text-right">Delta</th>
                    <th className="py-3 px-4 text-right">Balance</th>
                    <th className="py-3 px-4">Reason / Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedMovements.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-slate-500">
                        No stock movement records found.
                      </td>
                    </tr>
                  ) : (
                    paginatedMovements.map((m) => {
                      const isPositive = m.quantityDelta > 0;
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-4 font-mono text-slate-500 text-[11px]">
                            {m.timestamp.slice(0, 16).replace('T', ' ')}
                          </td>
                          <td className="py-2.5 px-4 font-mono font-bold text-slate-900 text-[11px]">
                            {m.sku}
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-slate-800 max-w-xs truncate">
                            {m.productName}
                          </td>
                          <td className="py-2.5 px-4 text-center text-[11px] text-slate-600">
                            {m.size} · {m.color}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="capitalize text-slate-700 font-semibold">
                              {m.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td
                            className={`py-2.5 px-4 text-right font-mono font-bold text-sm ${
                              isPositive ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {isPositive ? `+${m.quantityDelta}` : m.quantityDelta}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono text-slate-900 font-semibold">
                            {m.stockAfter} pcs
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 text-[11px] max-w-xs truncate">
                            <span className="font-semibold text-slate-900">{m.referenceId}:</span> {m.reason}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={movementPage}
              totalItems={filteredMovements.length}
              itemsPerPage={movementsPerPage}
              onPageChange={setMovementPage}
              onItemsPerPageChange={setMovementsPerPage}
            />
          </div>
        </div>
      )}

      {/* Manual Stock Adjustment Modal */}
      {adjustmentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in duration-150">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Manual Stock Adjustment</h3>
              </div>
              <button
                onClick={() => setAdjustmentTarget(null)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteAdjustment} className="p-5 space-y-4 text-xs">
              {/* Product Info */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <div className="font-bold text-slate-900 text-sm">{adjustmentTarget.productName}</div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                  <span>SKU: {adjustmentTarget.sku}</span>
                  <span>·</span>
                  <span>Size: {adjustmentTarget.size}</span>
                  <span>·</span>
                  <span>Color: {adjustmentTarget.color}</span>
                </div>
                <div className="pt-1 flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600">Current Stock in Warehouse:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {adjustmentTarget.stock} {adjustmentTarget.unit}
                  </span>
                </div>
              </div>

              {adjustError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
                  {adjustError}
                </div>
              )}

              {/* Adjustment Type */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Adjustment Nature</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-1 focus:ring-slate-900"
                >
                  <option value="adjustment">Stock Count Correction (+ / -)</option>
                  <option value="damaged">Damaged / Defective Garment Write-off (-)</option>
                  <option value="purchase_return">Return to Supplier / Mill (-)</option>
                </select>
              </div>

              {/* Delta Quantity */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Quantity Change (Delta) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step={1}
                    value={adjustDelta}
                    onChange={(e) => setAdjustDelta(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 text-sm font-mono font-bold focus:ring-1 focus:ring-slate-900"
                    placeholder="e.g. +5 or -2"
                  />
                  <div className="shrink-0 text-slate-500 font-mono text-xs">
                    New Stock: <strong>{adjustmentTarget.stock + adjustDelta}</strong>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Use positive numbers to add stock, negative to deduct.
                </p>
              </div>

              {/* Reason */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Audit Reason / Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Broken zipper write-off, found extra carton during audit, return to mill"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-1 focus:ring-slate-900"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdjustmentTarget(null)}
                  className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || adjustDelta === 0}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg font-bold transition-colors shadow-2xs"
                >
                  {isSubmitting ? 'Applying...' : 'Apply Stock Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useClothingWholesale } from '../../context/ClothingWholesaleContext';
import { ProductCatalogManager } from '../products/ProductCatalogManager';
import { InventoryStockMatrix } from './InventoryStockMatrix';
import { PurchasesAndStockManager } from '../purchases/PurchasesAndStockManager';
import { FashionCollectionShowcase } from '../fashion/FashionCollectionShowcase';
import {
  Package,
  Boxes,
  Truck,
  Sparkles,
  AlertTriangle,
  Layers,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';

interface InventoryWorkspaceProps {
  initialSubTab?: 'products' | 'matrix' | 'purchases' | 'fashion';
  onNavigateToTransactions?: () => void;
}

export const InventoryWorkspace: React.FC<InventoryWorkspaceProps> = ({
  initialSubTab = 'products',
  onNavigateToTransactions,
}) => {
  const { metrics, settings } = useClothingWholesale();
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'matrix' | 'purchases' | 'fashion'>(
    initialSubTab
  );

  const threshold = settings.defaultLowStockThreshold || 15;

  return (
    <div className="space-y-6">
      {/* Workspace Header & Sub-Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Core Source of Truth</span>
            <span aria-hidden="true">·</span>
            <span>Central Warehouse & Garment Lines</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
            Inventory & Stock Management
          </h1>
        </div>

        {/* Quick Stock Status Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs">
            <Boxes className="w-3.5 h-3.5 text-slate-500" />
            <span>Total Units:</span>
            <strong className="text-slate-900 font-mono">{metrics.totalInventoryPieces.toLocaleString()} pcs</strong>
          </div>

          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-2xs ${
              metrics.lowStockCount > 0
                ? 'bg-rose-50 border border-rose-200 text-rose-800'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock:</span>
            <strong className="font-mono">
              {metrics.lowStockCount} {metrics.lowStockCount === 1 ? 'variant' : 'variants'}
            </strong>
          </div>
        </div>
      </div>

      {/* Primary Sub-Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl text-xs font-bold w-full overflow-x-auto shadow-2xs">
        <button
          onClick={() => setActiveSubTab('products')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeSubTab === 'products'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Package className="w-4 h-4 text-slate-700" />
          <span>Products & Multi-Variant Catalog</span>
        </button>

        <button
          onClick={() => setActiveSubTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeSubTab === 'matrix'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Boxes className="w-4 h-4 text-slate-700" />
          <span>Stock Matrix & Adjustments</span>
          {metrics.lowStockCount > 0 && (
            <span className="px-1.5 py-0.2 bg-rose-600 text-white text-[10px] rounded-full">
              {metrics.lowStockCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('purchases')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeSubTab === 'purchases'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Truck className="w-4 h-4 text-slate-700" />
          <span>Purchases & Mill Stock Receiving</span>
        </button>

        <button
          onClick={() => setActiveSubTab('fashion')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeSubTab === 'fashion'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Fashion & Textiles Showcase</span>
        </button>
      </div>

      {/* Render Active Module */}
      <div>
        {activeSubTab === 'products' && <ProductCatalogManager />}
        {activeSubTab === 'matrix' && <InventoryStockMatrix />}
        {activeSubTab === 'purchases' && <PurchasesAndStockManager />}
        {activeSubTab === 'fashion' && (
          <FashionCollectionShowcase
            onOpenPos={() => {
              if (onNavigateToTransactions) {
                onNavigateToTransactions();
              }
            }}
            onOpenAddProduct={() => setActiveSubTab('products')}
          />
        )}
      </div>
    </div>
  );
};

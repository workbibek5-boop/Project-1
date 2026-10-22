/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useClothingWholesale } from '../../context/ClothingWholesaleContext';
import { ClothingProduct, ProductVariant, PurchaseItem, PurchaseRecord } from '../../db/indexedDb';
import { Pagination } from '../common/Pagination';
import {
  Truck,
  Plus,
  AlertCircle,
  FileText,
  History,
  CheckCircle2,
  Trash2,
  ArrowDownRight,
  TrendingDown,
  Building2,
} from 'lucide-react';

export const PurchasesAndStockManager: React.FC = () => {
  const {
    products,
    purchases,
    suppliers,
    stockMovements,
    settings,
    recordPurchase,
    adjustVariantStock,
  } = useClothingWholesale();

  const [activeTab, setActiveTab] = useState<'purchases' | 'adjustments' | 'ledger'>('purchases');

  // Pagination for purchases
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // New Purchase Form State
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [supplierName, setSupplierName] = useState('Himalayan Textile Mills');
  const [supplierBillNo, setSupplierBillNo] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('01-4351234');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [isSubmittingPurchase, setIsSubmittingPurchase] = useState(false);

  // Add Item to Purchase Temp Selection
  const [selectedProdId, setSelectedProdId] = useState(products[0]?.id || '');
  const [selectedVarId, setSelectedVarId] = useState('');
  const [inboundQty, setInboundQty] = useState(20);
  const [inboundCost, setInboundCost] = useState(550);

  // Stock Adjustment Form State
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustProdId, setAdjustProdId] = useState(products[0]?.id || '');
  const [adjustVarId, setAdjustVarId] = useState('');
  const [adjustType, setAdjustType] = useState<'adjustment' | 'damaged' | 'purchase_return'>('damaged');
  const [adjustDelta, setAdjustDelta] = useState(-5);
  const [adjustReason, setAdjustReason] = useState('Water damage during monsoon cargo transit');

  const selectedProd = products.find((p) => p.id === selectedProdId);
  const adjustProd = products.find((p) => p.id === adjustProdId);

  const handleAddItemToPurchase = () => {
    if (!selectedProd) return;
    const variant = selectedProd.variants.find((v) => v.id === selectedVarId) || selectedProd.variants[0];
    if (!variant) return;

    const lineTotal = inboundCost * inboundQty;
    const newItem: PurchaseItem = {
      productId: selectedProd.id,
      variantId: variant.id,
      productName: selectedProd.name,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      quantity: inboundQty,
      unitCost: inboundCost,
      lineTotal,
    };

    setPurchaseItems([...purchaseItems, newItem]);
  };

  const handleConfirmPurchase = async () => {
    if (purchaseItems.length === 0) {
      alert('Please add at least one item to the purchase receipt.');
      return;
    }
    if (isSubmittingPurchase) return; // Prevent duplicate clicks
    setIsSubmittingPurchase(true);

    const totalCost = purchaseItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const purchaseNumber = `PUR-2026-${String(purchases.length + 101).padStart(5, '0')}`;

    const res = await recordPurchase({
      purchaseNumber,
      supplierName: supplierName.trim(),
      supplierBillNo: supplierBillNo.trim() || undefined,
      supplierPhone: supplierPhone.trim() || undefined,
      purchaseDate,
      items: purchaseItems,
      totalCost,
      notes: purchaseNotes.trim() || undefined,
    });

    setIsSubmittingPurchase(false);

    if (res.success) {
      setShowPurchaseModal(false);
      setPurchaseItems([]);
      setPurchaseNotes('');
    } else {
      alert(`Purchase failed: ${res.error}`);
    }
  };

  const handleConfirmAdjustment = async () => {
    if (!adjustProd) return;
    const variant = adjustProd.variants.find((v) => v.id === adjustVarId) || adjustProd.variants[0];
    if (!variant) return;

    const res = await adjustVariantStock(
      adjustProd.id,
      variant.id,
      adjustDelta,
      adjustType,
      adjustReason
    );

    if (res.success) {
      setShowAdjustModal(false);
    } else {
      alert(`Adjustment failed: ${res.error}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Inbound Inventory & Mill Purchases</span>
            <span aria-hidden="true">·</span>
            <span>Accurate Stock Reconciliation</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Purchases, Inbound Stock & Adjustments
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log raw stock shipments from mills and record damaged items, returns, or audit corrections.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAdjustModal(true)}
            className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs"
          >
            <TrendingDown className="w-4 h-4 text-rose-600" />
            <span>Stock Adjustment / Damaged</span>
          </button>
          <button
            onClick={() => setShowPurchaseModal(true)}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Record New Purchase</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('purchases')}
          className={`pb-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'purchases' ? 'border-slate-900 text-slate-900 font-bold' : 'border-transparent text-slate-500'
          }`}
        >
          Purchase Records ({purchases.length})
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`pb-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'ledger' ? 'border-slate-900 text-slate-900 font-bold' : 'border-transparent text-slate-500'
          }`}
        >
          All Stock Movements Audit ({stockMovements.length})
        </button>
      </div>

      {/* Purchases View */}
      {activeTab === 'purchases' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                  <th className="py-3 px-4">Purchase No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Bill Ref</th>
                  <th className="py-3 px-4">Garments Received</th>
                  <th className="py-3 px-4 text-right">Total Cost</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No purchase entries recorded yet. Click "Record New Purchase" above.
                    </td>
                  </tr>
                ) : (
                  purchases.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.purchaseNumber}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{p.purchaseDate}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{p.supplierName}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{p.supplierBillNo || '—'}</td>
                      <td className="py-3 px-4 text-slate-700">
                        {p.items.map((i) => `${i.productName} (${i.size}/${i.color} ×${i.quantity})`).join(', ')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {settings.currency} {p.totalCost.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px] truncate max-w-xs">{p.notes || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={purchases.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </div>
      )}

      {/* Stock Movement Audit View */}
      {activeTab === 'ledger' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Garment Line</th>
                  <th className="py-3 px-4">Variant (Size/Color)</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Delta</th>
                  <th className="py-3 px-4 text-right">Stock Before</th>
                  <th className="py-3 px-4 text-right">Stock After</th>
                  <th className="py-3 px-4">Reference / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {stockMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                      {m.timestamp.slice(0, 16).replace('T', ' ')}
                    </td>
                    <td className="py-2.5 px-4 font-sans font-bold text-slate-900">{m.productName}</td>
                    <td className="py-2.5 px-4 text-slate-800 font-bold">{m.size} / {m.color}</td>
                    <td className="py-2.5 px-4 uppercase text-[10px]">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        m.quantityDelta > 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : m.type === 'damaged'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {m.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className={`py-2.5 px-4 text-right font-bold ${m.quantityDelta > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-500">{m.stockBefore}</td>
                    <td className="py-2.5 px-4 text-right text-slate-900 font-bold">{m.stockAfter}</td>
                    <td className="py-2.5 px-4 font-sans text-slate-600 text-[11px] truncate max-w-xs">{m.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RECORD NEW INCOMING PURCHASE */}
      {/* ========================================================================= */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Record Mill Stock Purchase</h3>
              <button onClick={() => setShowPurchaseModal(false)} className="text-slate-400 hover:text-slate-700 font-bold text-lg">
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {suppliers.length > 0 && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Select Supplier / Mill from Directory (Optional)</span>
                  </label>
                  <select
                    onChange={(e) => {
                      const s = suppliers.find((x) => x.id === e.target.value);
                      if (s) {
                        setSupplierName(s.name);
                        setSupplierPhone(s.phone);
                      }
                    }}
                    defaultValue=""
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:bg-white"
                  >
                    <option value="">-- Choose Existing Mill / Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.category}) · {s.city}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Supplier Name *</label>
                  <input
                    type="text"
                    required
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Supplier Bill / Invoice No</label>
                  <input
                    type="text"
                    value={supplierBillNo}
                    onChange={(e) => setSupplierBillNo(e.target.value)}
                    placeholder="e.g. MILL-INV-9901"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Purchase Date *</label>
                  <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              {/* Add item bar */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-bold text-slate-900 block text-[11px] uppercase">Add Inbound Garment Variant</span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-500">Garment</label>
                    <select
                      value={selectedProdId}
                      onChange={(e) => {
                        setSelectedProdId(e.target.value);
                        const p = products.find((x) => x.id === e.target.value);
                        if (p) setInboundCost(p.purchaseCost);
                      }}
                      className="w-full bg-white border border-slate-300 rounded p-1.5"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500">Variant (Size/Color)</label>
                    <select
                      value={selectedVarId}
                      onChange={(e) => setSelectedVarId(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded p-1.5 font-bold"
                    >
                      {selectedProd?.variants.map((v) => (
                        <option key={v.id} value={v.id}>{v.size} - {v.color}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500">Qty to Add</label>
                    <input
                      type="number"
                      min={1}
                      value={inboundQty}
                      onChange={(e) => setInboundQty(parseInt(e.target.value) || 1)}
                      className="w-full bg-white border border-slate-300 rounded p-1.5 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <div className="text-[11px] text-slate-500">
                    Unit Cost: <strong className="font-mono text-slate-900">{settings.currency} {inboundCost}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItemToPurchase}
                    className="px-3 py-1 bg-slate-900 text-white rounded font-bold text-[11px] hover:bg-slate-800"
                  >
                    + Add to Purchase List
                  </button>
                </div>
              </div>

              {/* Items on Purchase List */}
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {purchaseItems.map((item, idx) => (
                  <div key={idx} className="p-2 bg-slate-100 rounded flex justify-between items-center">
                    <div>
                      <span className="font-bold">{item.productName}</span> ({item.size}/{item.color}) × {item.quantity} pcs
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold">{settings.currency} {item.lineTotal.toLocaleString('en-IN')}</span>
                      <button
                        type="button"
                        onClick={() => setPurchaseItems(purchaseItems.filter((_, i) => i !== idx))}
                        className="text-rose-600 hover:text-rose-800"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-bold text-sm">
                <span>Total Inbound Cost:</span>
                <span className="font-mono">
                  {settings.currency} {purchaseItems.reduce((s, i) => s + i.lineTotal, 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmittingPurchase || purchaseItems.length === 0}
                  onClick={handleConfirmPurchase}
                  className="px-5 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50"
                >
                  {isSubmittingPurchase ? 'Recording & Incrementing Stock...' : 'Confirm Inbound Purchase'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: STOCK ADJUSTMENT / DAMAGED GOODS */}
      {/* ========================================================================= */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Stock Adjustment & Damaged Goods</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Garment</label>
                <select
                  value={adjustProdId}
                  onChange={(e) => setAdjustProdId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded p-2"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Variant (Size/Color)</label>
                <select
                  value={adjustVarId}
                  onChange={(e) => setAdjustVarId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded p-2 font-bold"
                >
                  {adjustProd?.variants.map((v) => (
                    <option key={v.id} value={v.id}>{v.size} - {v.color} (Current: {v.stock})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Adjustment Type</label>
                  <select
                    value={adjustType}
                    onChange={(e) => setAdjustType(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded p-2"
                  >
                    <option value="damaged">Damaged Goods</option>
                    <option value="adjustment">Count Correction</option>
                    <option value="purchase_return">Return to Supplier</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantity Delta (+/-)</label>
                  <input
                    type="number"
                    value={adjustDelta}
                    onChange={(e) => setAdjustDelta(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded p-2 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason / Notes *</label>
                <textarea
                  rows={2}
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAdjustment}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded font-bold hover:bg-slate-800"
                >
                  Save Adjustment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useId, useMemo } from 'react';
import { useClothingWholesale } from '../../context/ClothingWholesaleContext';
import { ClothingProduct, ProductVariant, SaleLineItem, CashSale } from '../../db/indexedDb';
import { useDebounce } from '../../hooks/useDebounce';
import {
  Search,
  Barcode,
  Plus,
  Trash2,
  Printer,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  FileText,
  DollarSign,
  ArrowRight,
  Sparkles,
  Users,
} from 'lucide-react';

export const CashBillingPos: React.FC = () => {
  const {
    products,
    sales,
    customers,
    settings,
    processCashSale,
    reverseSale,
  } = useClothingWholesale();

  // Search and Variant Picker State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ClothingProduct | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemDiscount, setItemDiscount] = useState<number>(0);

  // Cart / Bill Line Items
  const [billItems, setBillItems] = useState<SaleLineItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [billNotes, setBillNotes] = useState('');

  // Cash Payment Calculation
  const [cashReceivedInput, setCashReceivedInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [posError, setPosError] = useState<string | null>(null);

  // Active / Last Completed Sale for Printing
  const [activeReceiptSale, setActiveReceiptSale] = useState<CashSale | null>(null);
  const [receiptFormat, setReceiptFormat] = useState<'thermal' | 'a4'>('thermal');

  // Refund / Reversal Modal State
  const [refundTargetSale, setRefundTargetSale] = useState<CashSale | null>(null);
  const [refundReason, setRefundReason] = useState<string>('Customer returned goods in original packaging');

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Calculate bill totals
  const subtotal = billItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const taxRate = settings.taxEnabled ? settings.defaultVatPercent : 0;
  const taxAmount = (subtotal * taxRate) / 100;
  const grandTotal = Math.round(subtotal + taxAmount);

  const cashReceived = parseFloat(cashReceivedInput) || 0;
  const changeReturned = Math.max(0, cashReceived - grandTotal);
  const isCashSufficient = cashReceived >= grandTotal && grandTotal > 0;

  // Next invoice number preview
  const nextInvoiceNumber = `${settings.invoicePrefix}${String(sales.length + 1001).padStart(5, '0')}`;

  // Debounced search query to prevent lag on fast typing
  const debouncedSearch = useDebounce(searchQuery, 160);

  // Filter products by name, SKU, category, or barcode with memoization
  const searchResults = useMemo(() => {
    if (!debouncedSearch.trim()) {
      return products.slice(0, 10);
    }
    const q = debouncedSearch.toLowerCase();
    return products.filter((p) => {
      const matchesName = p.name.toLowerCase().includes(q);
      const matchesSku = p.sku.toLowerCase().includes(q);
      const matchesCategory = p.category.toLowerCase().includes(q);
      const matchesDept = !!p.department && p.department.toLowerCase().includes(q);
      const matchesFabric = !!p.fabric && p.fabric.toLowerCase().includes(q);
      const matchesStyle = !!p.designStyleCode && p.designStyleCode.toLowerCase().includes(q);
      const matchesBrand = !!p.brand && p.brand.toLowerCase().includes(q);
      const matchesBarcode = p.barcode?.toLowerCase().includes(q);
      const matchesVariant = p.variants.some(
        (v) =>
          v.size.toLowerCase().includes(q) ||
          v.color.toLowerCase().includes(q) ||
          v.sku.toLowerCase().includes(q) ||
          v.barcode?.toLowerCase().includes(q)
      );
      return (
        matchesName ||
        matchesSku ||
        matchesCategory ||
        matchesDept ||
        matchesFabric ||
        matchesStyle ||
        matchesBrand ||
        matchesBarcode ||
        matchesVariant
      );
    });
  }, [products, debouncedSearch]);

  // Handle direct Barcode Scan (e.g. handheld scanner typing code and pressing Enter)
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    // Look for exact variant barcode or SKU
    for (const prod of products) {
      for (const variant of prod.variants) {
        if (
          variant.barcode?.toLowerCase() === query ||
          variant.sku.toLowerCase() === query
        ) {
          addVariantToBill(prod, variant, 1);
          setSearchQuery('');
          return;
        }
      }
      if (prod.barcode?.toLowerCase() === query || prod.sku.toLowerCase() === query) {
        // Auto select first variant with stock
        const availVariant = prod.variants.find((v) => v.stock > 0) || prod.variants[0];
        if (availVariant) {
          addVariantToBill(prod, availVariant, 1);
          setSearchQuery('');
          return;
        }
      }
    }
  };

  const handleSelectProduct = (prod: ClothingProduct) => {
    setSelectedProduct(prod);
    const inStockVariant = prod.variants.find((v) => v.stock > 0) || prod.variants[0];
    setSelectedVariant(inStockVariant || null);
    setItemQuantity(1);
    setItemDiscount(0);
  };

  const addVariantToBill = (
    prod: ClothingProduct,
    variant: ProductVariant,
    qty: number,
    discountPerItem: number = 0
  ) => {
    setPosError(null);

    // Stock check
    if (!settings.allowNegativeStock && variant.stock < qty) {
      setPosError(
        `Insufficient stock for "${prod.name}" (${variant.size} / ${variant.color}). Available: ${variant.stock} pcs.`
      );
      return;
    }

    const unitPrice = prod.sellingPrice;
    const lineTotal = Math.max(0, (unitPrice - discountPerItem) * qty);

    setBillItems((prev) => {
      // Check if this exact variant is already on the bill
      const existingIdx = prev.findIndex((item) => item.variantId === variant.id);
      if (existingIdx !== -1) {
        const existing = prev[existingIdx];
        const newQty = existing.quantity + qty;

        if (!settings.allowNegativeStock && variant.stock < newQty) {
          setPosError(
            `Cannot add more. Total in bill (${newQty}) exceeds available stock (${variant.stock}) for ${variant.size}/${variant.color}.`
          );
          return prev;
        }

        const updated = [...prev];
        updated[existingIdx] = {
          ...existing,
          quantity: newQty,
          lineTotal: Math.max(0, (existing.unitPrice - existing.discount) * newQty),
        };
        return updated;
      }

      const newLine: SaleLineItem = {
        productId: prod.id,
        variantId: variant.id,
        productName: prod.name,
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        unit: prod.unit,
        unitPrice,
        quantity: qty,
        discount: discountPerItem,
        lineTotal,
        purchaseCostAtSale: prod.purchaseCost,
      };
      return [...prev, newLine];
    });

    // Reset picker
    setSelectedProduct(null);
    setSelectedVariant(null);
  };

  const updateBillItemQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeBillItem(index);
      return;
    }

    const item = billItems[index];
    const prod = products.find((p) => p.id === item.productId);
    const variant = prod?.variants.find((v) => v.id === item.variantId);

    if (!settings.allowNegativeStock && variant && variant.stock < newQty) {
      setPosError(
        `Insufficient stock! Max available for ${variant.size}/${variant.color} is ${variant.stock} pcs.`
      );
      return;
    }

    setBillItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...item,
        quantity: newQty,
        lineTotal: Math.max(0, (item.unitPrice - item.discount) * newQty),
      };
      return updated;
    });
  };

  const removeBillItem = (index: number) => {
    setBillItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCompleteCashSale = async () => {
    if (billItems.length === 0) {
      setPosError('No items in the bill.');
      return;
    }

    if (!isCashSufficient) {
      setPosError(`Cash received (${settings.currency} ${cashReceived}) is less than total (${settings.currency} ${grandTotal}).`);
      return;
    }

    if (isSubmitting) return; // Prevent duplicate clicks
    setIsSubmitting(true);
    setPosError(null);

    const salePayload = {
      invoiceNumber: nextInvoiceNumber,
      items: billItems,
      subtotal,
      discountTotal: billItems.reduce((sum, item) => sum + item.discount * item.quantity, 0),
      taxRatePercent: taxRate,
      taxAmount,
      grandTotal,
      cashReceived,
      changeReturned,
      paymentMethod: 'cash' as const,
      customerName: customerName.trim() || 'Walk-in Buyer',
      customerPhone: customerPhone.trim() || undefined,
      notes: billNotes.trim() || undefined,
    };

    const res = await processCashSale(salePayload);
    setIsSubmitting(false);

    if (res.success && res.sale) {
      setActiveReceiptSale(res.sale);
      // Clear bill
      setBillItems([]);
      setCashReceivedInput('');
      setCustomerName('');
      setCustomerPhone('');
      setBillNotes('');
    } else {
      setPosError(res.error || 'Failed to complete cash sale.');
    }
  };

  const handleConfirmRefund = async () => {
    if (!refundTargetSale) return;
    const res = await reverseSale(refundTargetSale.id, refundReason);
    if (res.success) {
      setRefundTargetSale(null);
    } else {
      alert(`Refund failed: ${res.error}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* POS Top Header & Quick Numbers */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
            <span>OFFLINE CASH BILLING POINT OF SALE</span>
            <span aria-hidden="true">·</span>
            <span>CLOTHING WHOLESALE DESK</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mt-1 tracking-tight">
            Fast Point-of-Sale Billing
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Next Invoice: <strong className="font-mono text-white">{nextInvoiceNumber}</strong> · Terms: Cash Only · Stock auto-deducts per variant
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-lg font-mono">
            <span>Today's Cash Bills: </span>
            <strong className="text-amber-400 font-bold">
              {sales.filter((s) => s.status === 'completed' && s.timestamp.startsWith(new Date().toISOString().slice(0, 10))).length}
            </strong>
          </div>
        </div>
      </div>

      {posError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1 font-medium">{posError}</div>
          <button onClick={() => setPosError(null)} className="text-rose-500 hover:text-rose-800 font-bold">
            &times;
          </button>
        </div>
      )}

      {/* Main POS Split Layout: Products Selection (Left) and Bill Workspace (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Product & Variant Catalog Selection (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Barcode & Search Bar */}
          <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={barcodeInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search garment name, SKU, or scan barcode..."
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 flex items-center gap-1.5 shrink-0"
            >
              <Barcode className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Scan / Enter</span>
            </button>
          </form>

          {/* Product Grid / Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[560px] overflow-y-auto pr-1">
            {searchResults.map((prod) => (
              <div
                key={prod.id}
                onClick={() => handleSelectProduct(prod)}
                className={`p-3.5 bg-white border rounded-xl cursor-pointer transition-all hover:border-slate-400 flex flex-col justify-between ${
                  selectedProduct?.id === prod.id
                    ? 'border-slate-900 ring-2 ring-slate-900/10 shadow-sm'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start text-[11px] text-slate-500 mb-1">
                    <span className="font-mono font-bold text-slate-700">{prod.sku}</span>
                    <span className="text-slate-600">{prod.category}</span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{prod.name}</h3>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Available: <strong className="font-mono text-emerald-700">{prod.totalStock} {prod.unit}</strong>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-bold font-mono text-slate-900">
                    {settings.currency} {prod.sellingPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {prod.variants.length} variant(s)
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Active Variant Picker Sub-Panel */}
          {selectedProduct && (
            <div className="p-4 bg-slate-100/90 border border-slate-300 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Selected Garment</span>
                  <div className="text-xs font-bold text-slate-900">{selectedProduct.name}</div>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Cancel
                </button>
              </div>

              {/* Variant Buttons (Size & Color) */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                  Choose Size & Colour Variant:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProduct.variants.map((v) => {
                    const isSelected = selectedVariant?.id === v.id;
                    const isOutOfStock = v.stock <= 0;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        disabled={isOutOfStock && !settings.allowNegativeStock}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900'
                            : isOutOfStock
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                            : 'bg-white text-slate-800 border-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <span className="font-bold">{v.size}</span>
                        <span className="text-[11px] opacity-80">({v.color})</span>
                        <span className="text-[10px] font-mono px-1 rounded bg-black/10">
                          {v.stock}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity Stepper & Add to Bill Button */}
              {selectedVariant && (
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                      className="w-7 h-7 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 rounded"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-12 text-center text-xs font-mono font-bold text-slate-900 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setItemQuantity(itemQuantity + 1)}
                      className="w-7 h-7 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 rounded"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex-1 text-xs">
                    <span className="text-slate-500">Unit Price: </span>
                    <strong className="font-mono text-slate-900">
                      {settings.currency} {selectedProduct.sellingPrice}
                    </strong>
                    <span className="text-slate-400 block text-[10px]">
                      Variant Stock: {selectedVariant.stock} pcs
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => addVariantToBill(selectedProduct, selectedVariant, itemQuantity, itemDiscount)}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add to Bill</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Active Bill Workspace (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Current Cash Bill</h2>
              <span className="text-[11px] text-slate-500 font-mono">Invoice #{nextInvoiceNumber}</span>
            </div>
            {billItems.length > 0 && (
              <button
                onClick={() => setBillItems([])}
                className="text-xs text-rose-600 hover:text-rose-700 underline font-semibold"
              >
                Clear Bill
              </button>
            )}
          </div>

          {/* Customer Selection & Details */}
          <div className="space-y-2 text-xs">
            {customers.length > 0 && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Users className="w-3 h-3 text-slate-400" />
                  <span>Select Wholesale Client (Optional)</span>
                </label>
                <select
                  onChange={(e) => {
                    const cust = customers.find((c) => c.id === e.target.value);
                    if (cust) {
                      setCustomerName(cust.businessName ? `${cust.name} (${cust.businessName})` : cust.name);
                      setCustomerPhone(cust.phone || '');
                    }
                  }}
                  defaultValue=""
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="">-- Choose from Customer Directory --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.businessName ? `(${c.businessName})` : ''} · {c.phone}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Customer / Store Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Walk-in Buyer"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Phone / WhatsApp</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+977-98XXXXXXXX"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Line Items List */}
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {billItems.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                No items on this bill. Select garments and variants on the left to add.
              </div>
            ) : (
              billItems.map((item, idx) => (
                <div
                  key={`${item.variantId}-${idx}`}
                  className="p-2.5 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-900 truncate">{item.productName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {item.size} · {item.color} · {settings.currency} {item.unitPrice}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Stepper */}
                    <div className="flex items-center border border-slate-300 rounded bg-white">
                      <button
                        type="button"
                        onClick={() => updateBillItemQuantity(idx, item.quantity - 1)}
                        className="px-2 py-0.5 text-slate-600 hover:bg-slate-100"
                      >
                        -
                      </button>
                      <span className="px-2 py-0.5 font-mono font-bold text-slate-900">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateBillItemQuantity(idx, item.quantity + 1)}
                        className="px-2 py-0.5 text-slate-600 hover:bg-slate-100"
                      >
                        +
                      </button>
                    </div>

                    <div className="font-mono font-bold text-slate-900 w-18 text-right tabular-nums">
                      {settings.currency} {item.lineTotal.toLocaleString('en-IN')}
                    </div>

                    <button
                      onClick={() => removeBillItem(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totals Breakdown */}
          <div className="p-3.5 bg-slate-100/80 rounded-xl space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {settings.currency} {subtotal.toLocaleString('en-IN')}
              </span>
            </div>
            {settings.taxEnabled && (
              <div className="flex justify-between text-slate-600">
                <span>VAT ({settings.defaultVatPercent}%):</span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {settings.currency} {taxAmount.toLocaleString('en-IN')}
                </span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
              <span>Grand Total Payable:</span>
              <span className="font-mono text-base tabular-nums">
                {settings.currency} {grandTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Cash Payment Calculation Block */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-amber-700" />
                <span>Cash Payment Calculator</span>
              </span>
              <span className="text-[10px] font-bold uppercase text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded">
                Cash Sales Only
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Cash Received ({settings.currency}) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={cashReceivedInput}
                  onChange={(e) => setCashReceivedInput(e.target.value)}
                  placeholder="Enter cash amount received..."
                  className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {[grandTotal, Math.ceil(grandTotal / 500) * 500, Math.ceil(grandTotal / 1000) * 1000]
                  .filter((v, i, arr) => v > 0 && arr.indexOf(v) === i)
                  .map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCashReceivedInput(String(amt))}
                      className="px-2 py-0.5 bg-white border border-amber-300 hover:bg-amber-100 rounded text-[11px] font-mono text-slate-800 font-semibold"
                    >
                      Exact {settings.currency} {amt.toLocaleString('en-IN')}
                    </button>
                  ))}
              </div>
            </div>

            <div className="flex justify-between items-center text-xs pt-2 border-t border-amber-200/60">
              <span className="text-slate-700 font-semibold">Change to Return:</span>
              <span className={`text-base font-mono font-bold tabular-nums ${
                changeReturned > 0 ? 'text-emerald-700' : 'text-slate-800'
              }`}>
                {settings.currency} {changeReturned.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Complete Cash Sale Button */}
          <button
            type="button"
            onClick={handleCompleteCashSale}
            disabled={!isCashSufficient || billItems.length === 0 || isSubmitting}
            className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
              !isCashSufficient || billItems.length === 0 || isSubmitting
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-md'
            }`}
          >
            {isSubmitting ? (
              <span>Recording Cash Sale & Deducting Stock...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Confirm Cash Sale ({settings.currency} {grandTotal.toLocaleString('en-IN')})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recent Cash Sales & Controlled Refund Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Completed Cash Sales Ledger</h3>
            <p className="text-xs text-slate-500">
              Controlled cancellations & refunds: Reversals automatically restore exact variant inventory and record audit reason.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                <th className="py-2.5 px-3">Invoice No</th>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Items Sold</th>
                <th className="py-2.5 px-3 text-right">Total (NPR)</th>
                <th className="py-2.5 px-3 text-right">Cash Received</th>
                <th className="py-2.5 px-3 text-right">Change</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.slice(0, 8).map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{sale.invoiceNumber}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-500">
                    {sale.timestamp.slice(0, 16).replace('T', ' ')}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">{sale.customerName}</td>
                  <td className="py-2.5 px-3 text-slate-600">
                    {sale.items.map((i) => `${i.productName} (${i.size}/${i.color} ×${i.quantity})`).join(', ')}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                    {settings.currency} {sale.grandTotal.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                    {settings.currency} {sale.cashReceived.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                    {settings.currency} {sale.changeReturned.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      sale.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {sale.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right space-x-1.5">
                    <button
                      onClick={() => setActiveReceiptSale(sale)}
                      className="px-2 py-1 bg-slate-900 text-white rounded text-[11px] font-medium hover:bg-slate-800"
                    >
                      Print Receipt
                    </button>
                    {sale.status === 'completed' && (
                      <button
                        onClick={() => {
                          setRefundTargetSale(sale);
                          setRefundReason('Customer returned garments in unworn condition');
                        }}
                        className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[11px] font-medium hover:bg-rose-100"
                      >
                        Refund / Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: PRINTABLE RECEIPT & INVOICE (A4 AND THERMAL 80mm/58mm) */}
      {/* ========================================================================= */}
      {activeReceiptSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-slate-900" />
                <h3 className="text-sm font-bold text-slate-900">Wholesale Cash Invoice Receipt</h3>
              </div>
              <div className="flex items-center gap-2">
                {/* Format switcher */}
                <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
                  <button
                    onClick={() => setReceiptFormat('thermal')}
                    className={`px-2 py-1 rounded ${receiptFormat === 'thermal' ? 'bg-white shadow-xs font-bold text-slate-900' : 'text-slate-600'}`}
                  >
                    Thermal (80mm)
                  </button>
                  <button
                    onClick={() => setReceiptFormat('a4')}
                    className={`px-2 py-1 rounded ${receiptFormat === 'a4' ? 'bg-white shadow-xs font-bold text-slate-900' : 'text-slate-600'}`}
                  >
                    A4 Invoice
                  </button>
                </div>
                <button
                  onClick={() => setActiveReceiptSale(null)}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Receipt Preview Container */}
            <div
              id="printable-receipt-area"
              className={`mx-auto bg-white p-5 border border-slate-200 rounded-xl text-slate-900 font-mono ${
                receiptFormat === 'thermal' ? 'max-w-[340px] text-xs' : 'w-full text-xs'
              }`}
            >
              {/* Header */}
              <div className="text-center pb-3 border-b border-dashed border-slate-300 space-y-0.5">
                <h2 className="font-bold text-base font-sans tracking-tight">{settings.businessName}</h2>
                <div className="text-[11px] text-slate-600 font-sans">{settings.tradingName}</div>
                <div className="text-[10px] text-slate-500 font-sans">{settings.address}</div>
                <div className="text-[10px] text-slate-500">Tel: {settings.phone}</div>
                <div className="text-[10px] text-slate-700 font-bold">PAN / VAT: {settings.panVatNumber}</div>
                <div className="text-[11px] font-bold mt-1 uppercase tracking-wider text-slate-900">
                  CASH SALE RECEIPT / नगद बिल
                </div>
              </div>

              {/* Invoice Meta */}
              <div className="py-2 border-b border-dashed border-slate-300 text-[11px] space-y-0.5">
                <div className="flex justify-between">
                  <span>Bill No:</span>
                  <span className="font-bold">{activeReceiptSale.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date/Time:</span>
                  <span>{activeReceiptSale.timestamp.slice(0, 16).replace('T', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Buyer:</span>
                  <span className="font-bold truncate max-w-[180px]">{activeReceiptSale.customerName}</span>
                </div>
                {activeReceiptSale.customerPhone && (
                  <div className="flex justify-between">
                    <span>Phone:</span>
                    <span>{activeReceiptSale.customerPhone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Terms:</span>
                  <span className="font-bold">CASH ONLY</span>
                </div>
              </div>

              {/* Itemized Lines */}
              <div className="py-2 border-b border-dashed border-slate-300">
                <table className="w-full text-[11px] text-left">
                  <thead>
                    <tr className="border-b border-slate-300 text-slate-600 uppercase font-bold text-[10px]">
                      <th className="py-1">Item</th>
                      <th className="py-1 text-center">Qty</th>
                      <th className="py-1 text-right">Rate</th>
                      <th className="py-1 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeReceiptSale.items.map((item, idx) => (
                      <tr key={idx} className="py-1">
                        <td className="py-1 pr-1 font-sans">
                          <div className="font-bold text-slate-900 leading-tight">{item.productName}</div>
                          <div className="text-[10px] text-slate-500">({item.size} / {item.color})</div>
                        </td>
                        <td className="py-1 text-center font-bold">{item.quantity}</td>
                        <td className="py-1 text-right">{item.unitPrice}</td>
                        <td className="py-1 text-right font-bold">{item.lineTotal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals */}
              <div className="py-2 space-y-1 text-[11px] border-b border-dashed border-slate-300">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{settings.currency} {activeReceiptSale.subtotal.toLocaleString('en-IN')}</span>
                </div>
                {activeReceiptSale.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span>VAT ({activeReceiptSale.taxRatePercent}%):</span>
                    <span>{settings.currency} {activeReceiptSale.taxAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-300">
                  <span>Total Amount:</span>
                  <span>{settings.currency} {activeReceiptSale.grandTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Cash Received:</span>
                  <span>{settings.currency} {activeReceiptSale.cashReceived.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-800">
                  <span>Change Returned:</span>
                  <span>{settings.currency} {activeReceiptSale.changeReturned.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-center pt-3 text-[10px] text-slate-500 font-sans space-y-0.5">
                <p>{settings.invoiceFooterNote}</p>
                <p className="font-mono text-[9px] text-slate-400">Offline-first local billing system</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Invoice / Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveReceiptSale(null)}
                className="px-4 py-2 border border-slate-300 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SALE REFUND / CANCELLATION */}
      {/* ========================================================================= */}
      {refundTargetSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
              <RotateCcw className="w-5 h-5" />
              <span>Controlled Cash Sale Reversal & Refund</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Cancelling Invoice <strong>#{refundTargetSale.invoiceNumber}</strong> will atomically restore stock for:
            </p>

            <ul className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1 font-mono">
              {refundTargetSale.items.map((i, idx) => (
                <li key={idx} className="flex justify-between">
                  <span>{i.productName} ({i.size}/{i.color})</span>
                  <span className="text-emerald-700 font-bold">+{i.quantity} pcs restored</span>
                </li>
              ))}
            </ul>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mandatory Reason for Cancellation / Refund *
              </label>
              <textarea
                required
                rows={2}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRefundTargetSale(null)}
                className="px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRefund}
                className="px-4 py-1.5 bg-rose-600 text-white rounded text-xs font-bold hover:bg-rose-700"
              >
                Confirm Refund & Restore Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

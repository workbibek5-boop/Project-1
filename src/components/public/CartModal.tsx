/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useWholesale } from '../../context/WholesaleContext';
import { formatNpr } from '../../i18n';
import { X, Trash2, AlertTriangle, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose, onOpenAuth }) => {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    getCartSubtotal,
    getCartVatAmount,
    getCartTotal,
    companySettings,
    currentCustomer,
    submitOrder,
  } = useWholesale();

  const [shippingAddress, setShippingAddress] = useState(
    currentCustomer?.businessAddress || 'Asan Bazaar, Kathmandu'
  );
  const [contactPhone, setContactPhone] = useState(
    currentCustomer?.phone || '+977-9841234567'
  );
  const [orderNotes, setOrderNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [orderSuccessId, setOrderSuccessId] = useState<string | null>(null);

  if (!isOpen) return null;

  const subtotal = getCartSubtotal();
  const vat = getCartVatAmount();
  const total = getCartTotal();

  const customerCategory = currentCustomer?.category || 'F';
  const categoryLimit = companySettings.categoryLimits[customerCategory] || 35000;

  // Evaluation amount based on companySettings.applyLimitBeforeTax
  const evaluationAmount = companySettings.applyLimitBeforeTax ? subtotal : total;
  const isLimitExceeded = evaluationAmount > categoryLimit;
  const remainingLimit = Math.max(0, categoryLimit - evaluationAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!currentCustomer) {
      onOpenAuth();
      return;
    }

    const res = submitOrder(shippingAddress, contactPhone, orderNotes);
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to submit order');
    } else {
      setOrderSuccessId(res.orderId || 'SUCCESS');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Wholesale Garment Cart</h2>
            <p className="text-xs text-slate-500">
              Bulk orders in standardized 10–12 pc master garment packs
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {orderSuccessId ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Wholesale Order Submitted!</h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Your bulk order has been securely registered in the system under order ID: 
              <strong className="block text-slate-900 font-mono mt-1">{orderSuccessId}</strong>
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Our Sales Desk will review inventory and invoice details. You can track this order in your customer portal.
            </p>
            <div className="pt-4">
              <button
                onClick={() => {
                  setOrderSuccessId(null);
                  onClose();
                }}
                className="px-6 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
              >
                Close & Return to Products
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Customer Tier & Limit Banner */}
            <div
              className={`p-4 rounded-xl border text-xs ${
                isLimitExceeded
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-700" />
                  <span>
                    Wholesale Category: <strong>Tier {customerCategory}</strong>
                  </span>
                </div>
                <div>
                  Authorized Maximum Cap:{' '}
                  <strong className="font-mono">{formatNpr(categoryLimit)}</strong>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2">
                <div>
                  Current Cart Order Value:{' '}
                  <strong className="font-mono text-slate-950 font-bold">{formatNpr(evaluationAmount)}</strong>
                </div>
                <div>
                  Remaining Margin:{' '}
                  <strong className={`font-mono ${isLimitExceeded ? 'text-rose-600 font-bold' : 'text-emerald-700'}`}>
                    {isLimitExceeded ? 'EXCEEDED' : formatNpr(remainingLimit)}
                  </strong>
                </div>
              </div>

              {isLimitExceeded && (
                <div className="mt-2 text-rose-700 flex items-center gap-1.5 font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    Order exceeds your Tier {customerCategory} limit of {formatNpr(categoryLimit)}. Reduce pack quantities before submission.
                  </span>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                Your wholesale cart is empty. Add garment packs from the catalogue.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-100">
                  <span>Selected Garments</span>
                  <button
                    onClick={clearCart}
                    className="text-rose-600 hover:text-rose-700 text-xs font-normal underline"
                  >
                    Clear All
                  </button>
                </div>

                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200/60"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-12 h-12 object-cover rounded-md bg-white shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 truncate">
                          {item.product.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          SKU: {item.product.sku} · {formatNpr(item.product.wholesalePriceNpr)} / pack
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {/* Pack quantity stepper */}
                      <div className="flex items-center border border-slate-300 rounded bg-white">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.product.id, item.quantityPacks - 1)}
                          className="px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100"
                        >
                          -
                        </button>
                        <span className="px-2 py-0.5 text-xs font-mono font-semibold text-slate-900">
                          {item.quantityPacks}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.product.id, item.quantityPacks + 1)}
                          className="px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right w-24">
                        <div className="text-xs font-mono font-bold text-slate-900">
                          {formatNpr(item.product.wholesalePriceNpr * item.quantityPacks)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          ({item.quantityPacks * 10} pcs)
                        </div>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Subtotal & VAT Breakdown */}
                <div className="p-4 bg-slate-100/70 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Wholesale Subtotal (Taxable)</span>
                    <span className="font-mono font-semibold text-slate-900">{formatNpr(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Nepal VAT ({companySettings.defaultVatPercent}%)</span>
                    <span className="font-mono font-semibold text-slate-900">{formatNpr(vat)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                    <span>Grand Total Payable</span>
                    <span className="font-mono text-base">{formatNpr(total)}</span>
                  </div>
                </div>

                {/* Shipping & Delivery Form */}
                <form onSubmit={handleSubmit} className="pt-4 border-t border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Dispatch Delivery Address & Transport Details
                  </h4>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Store Address / Cargo Destination Counter *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="e.g. Asan Bazaar, Kathmandu OR Mahendrapool, Pokhara (Sundar Cargo Counter)"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Contact Phone for Cargo Bilty *
                      </label>
                      <input
                        type="tel"
                        required
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+977-98XXXXXXXX"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Packaging / Transport Instruction
                      </label>
                      <input
                        type="text"
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        placeholder="e.g. Gunny bag packing, Sundar Yatayat Cargo"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                  </div>

                  {/* Submission Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLimitExceeded || cart.length === 0}
                      className={`w-full py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                        isLimitExceeded || cart.length === 0
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-slate-900 hover:bg-slate-800 text-white shadow-md'
                      }`}
                    >
                      <span>Submit Wholesale Order ({formatNpr(total)})</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    {isLimitExceeded && (
                      <p className="text-[11px] text-rose-600 text-center mt-1.5 font-medium">
                        Submission blocked: Total exceeds your Tier {customerCategory} maximum cap of {formatNpr(categoryLimit)}.
                      </p>
                    )}
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

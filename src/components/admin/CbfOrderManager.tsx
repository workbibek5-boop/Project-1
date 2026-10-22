/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { clothingDb, ClothingProduct } from '../../db/indexedDb';
import { CentralOrder, CentralOrderStatus, CustomerCategory } from '../../types';
import { useDebounce } from '../../hooks/useDebounce';
import { formatNpr } from '../../i18n';
import {
  ClipboardCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Receipt,
  Printer,
  Truck,
  RotateCcw,
  Calendar,
  Building,
  User,
  ShieldCheck,
  Boxes,
  ArrowRight,
  Sparkles,
  FileText,
  DollarSign,
  Lock,
} from 'lucide-react';

export const CbfOrderManager: React.FC = () => {
  const [orders, setOrders] = useState<CentralOrder[]>([]);
  const [productsMap, setProductsMap] = useState<Map<string, ClothingProduct>>(new Map());

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 160);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'All' | CustomerCategory>('All');

  // Selected Order for Review & Actions Drawer
  const [activeOrder, setActiveOrder] = useState<CentralOrder | null>(null);

  // Billing Counter and Staff config
  const [billingCounterId, setBillingCounterId] = useState<string>('COUNTER-01');
  const [staffOperatorName, setStaffOperatorName] = useState<string>('Admin / Sales Desk');

  // Order Action Modals
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [transporterInput, setTransporterInput] = useState('Sundar Yatayat Cargo');
  const [trackingNumberInput, setTrackingNumberInput] = useState('');

  // Editable item quantities during review
  const [editableQtys, setEditableQtys] = useState<Record<string, number>>({});
  const [editablePrices, setEditablePrices] = useState<Record<string, number>>({});

  // Operational notification
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    const [allOrders, allProds] = await Promise.all([
      clothingDb.getAllCentralOrders(),
      clothingDb.getAllProducts(),
    ]);
    setOrders(allOrders);

    const map = new Map<string, ClothingProduct>();
    allProds.forEach((p) => map.set(p.id, p));
    setProductsMap(map);

    if (activeOrder) {
      const refreshed = allOrders.find((o) => o.id === activeOrder.id);
      if (refreshed) setActiveOrder(refreshed);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeOrder) {
      const qMap: Record<string, number> = {};
      const pMap: Record<string, number> = {};
      activeOrder.items.forEach((it) => {
        qMap[it.id] = it.approvedQuantity || it.requestedQuantity;
        pMap[it.id] = it.unitPrice || 0;
      });
      setEditableQtys(qMap);
      setEditablePrices(pMap);
    }
  }, [activeOrder]);

  const filteredOrders = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return orders.filter((o) => {
      if (selectedStatusFilter !== 'All' && o.status !== selectedStatusFilter) return false;
      if (selectedCategoryFilter !== 'All' && o.customerCategory !== selectedCategoryFilter) return false;
      if (q) {
        const matchOrderNo = o.orderNumber.toLowerCase().includes(q);
        const matchUserNo = o.userNumber.toLowerCase().includes(q);
        const matchCustomer = o.customerName.toLowerCase().includes(q);
        const matchBusiness = o.businessName.toLowerCase().includes(q);
        const matchInvoice = (o.invoiceNumber || '').toLowerCase().includes(q);
        const matchItems = o.items.some(
          (it) => it.productName.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q)
        );
        return matchOrderNo || matchUserNo || matchCustomer || matchBusiness || matchInvoice || matchItems;
      }
      return true;
    });
  }, [orders, debouncedSearch, selectedStatusFilter, selectedCategoryFilter]);

  // Handle Order Approval
  const handleApproveOrder = async () => {
    if (!activeOrder) return;

    // Apply edited approved quantities and unit prices
    const updatedItems = activeOrder.items.map((it) => {
      const approvedQty = editableQtys[it.id] !== undefined ? editableQtys[it.id] : it.requestedQuantity;
      const unitPrice = editablePrices[it.id] !== undefined ? editablePrices[it.id] : it.unitPrice;
      return {
        ...it,
        approvedQuantity: approvedQty,
        unitPrice,
        lineTotal: approvedQty * unitPrice,
      };
    });

    const subtotal = updatedItems.reduce((sum, it) => sum + it.lineTotal, 0);
    const gstAmount = Math.round((subtotal * activeOrder.gstPercent) / 100);
    const grandTotal = subtotal + gstAmount;

    const updatedOrder: CentralOrder = {
      ...activeOrder,
      items: updatedItems,
      subtotal,
      gstAmount,
      grandTotal,
      status: 'Approved',
      approvedByStaff: staffOperatorName,
      approvedDate: new Date().toISOString(),
      auditTrail: [
        ...(activeOrder.auditTrail || []),
        {
          timestamp: new Date().toISOString(),
          action: 'Order Approved',
          performedBy: staffOperatorName,
          counterId: billingCounterId,
          details: `Approved order quantities. Ready for inventory billing.`,
        },
      ],
    };

    await clothingDb.saveCentralOrder(updatedOrder);
    await loadData();
    setActiveOrder(updatedOrder);
    setActionAlert({
      type: 'success',
      message: `Order #${updatedOrder.orderNumber} successfully Approved! You may now finalize billing.`,
    });
    setTimeout(() => setActionAlert(null), 3500);
  };

  // Handle Order Rejection
  const handleRejectOrder = async () => {
    if (!activeOrder) return;
    const reason = rejectionReasonInput.trim() || 'Order rejected by Wholesale Operations Desk.';

    const updatedOrder: CentralOrder = {
      ...activeOrder,
      status: 'Rejected',
      rejectionReason: reason,
      auditTrail: [
        ...(activeOrder.auditTrail || []),
        {
          timestamp: new Date().toISOString(),
          action: 'Order Rejected',
          performedBy: staffOperatorName,
          counterId: billingCounterId,
          details: `Rejection reason: ${reason}`,
        },
      ],
    };

    await clothingDb.saveCentralOrder(updatedOrder);
    await loadData();
    setActiveOrder(updatedOrder);
    setIsRejectionModalOpen(false);
    setRejectionReasonInput('');
    setActionAlert({
      type: 'error',
      message: `Order #${updatedOrder.orderNumber} has been Rejected.`,
    });
    setTimeout(() => setActionAlert(null), 3500);
  };

  // Handle Step 8: ATOMIC INVENTORY BILLING
  const handleFinalizeBilling = async () => {
    if (!activeOrder) return;

    const res = await clothingDb.atomicBillCentralOrder(activeOrder.id, {
      staffName: staffOperatorName,
      counterId: billingCounterId,
      gstPercent: activeOrder.gstPercent,
    });

    if (res.success) {
      await loadData();
      setIsBillingModalOpen(false);
      setActionAlert({
        type: 'success',
        message: `Inventory atomically deducted! Invoice generated and consolidated into Sales ledger.`,
      });
      setTimeout(() => setActionAlert(null), 4000);
    } else {
      alert(`Billing Error: ${res.error}`);
    }
  };

  // Handle Dispatch
  const handleMarkDispatched = async () => {
    if (!activeOrder) return;

    const updatedOrder: CentralOrder = {
      ...activeOrder,
      status: 'Dispatched',
      transporterName: transporterInput,
      trackingNumber: trackingNumberInput,
      dispatchedDate: new Date().toISOString(),
      auditTrail: [
        ...(activeOrder.auditTrail || []),
        {
          timestamp: new Date().toISOString(),
          action: 'Marked Dispatched',
          performedBy: staffOperatorName,
          counterId: billingCounterId,
          details: `Cargo dispatched via ${transporterInput}. Bilty/Tracking: ${trackingNumberInput || 'N/A'}.`,
        },
      ],
    };

    await clothingDb.saveCentralOrder(updatedOrder);
    await loadData();
    setActiveOrder(updatedOrder);
    setIsDispatchModalOpen(false);
    setActionAlert({
      type: 'success',
      message: `Order #${updatedOrder.orderNumber} marked as Dispatched!`,
    });
    setTimeout(() => setActionAlert(null), 3500);
  };

  // Handle Cancellation & Stock Reversal
  const handleCancelAndReverse = async () => {
    if (!activeOrder) return;
    const reason = prompt('Please enter cancellation & stock restoration reason:') || 'Order cancelled by Admin';

    const res = await clothingDb.atomicReverseCentralOrder(
      activeOrder.id,
      reason,
      staffOperatorName,
      billingCounterId
    );

    if (res.success) {
      await loadData();
      setActionAlert({
        type: 'success',
        message: `Order #${activeOrder.orderNumber} cancelled. Any deducted variant stock has been restored to inventory!`,
      });
      setTimeout(() => setActionAlert(null), 4000);
    } else {
      alert(`Cancellation failed: ${res.error}`);
    }
  };

  const getStatusBadge = (status: CentralOrderStatus) => {
    switch (status) {
      case 'Submitted':
      case 'Pending Approval':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Pending Review</span>;
      case 'Approved':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">Approved</span>;
      case 'Billed':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Billed & Deducted</span>;
      case 'Ready for Dispatch':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">Ready for Dispatch</span>;
      case 'Dispatched':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">Dispatched</span>;
      case 'Completed':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">Completed</span>;
      case 'Rejected':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">Rejected</span>;
      case 'Cancelled':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Wholesale Order Approval & Invoicing Engine</span>
            <span aria-hidden="true">·</span>
            <span>Central Multi-Counter Backend</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
            C/B/F Order Management & Billing Desk
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Inspect customer orders by User Number, verify variant stock, adjust approved quantities, and trigger automatic inventory deductions.
          </p>
        </div>

        {/* Counter & Staff Stamp Badge */}
        <div className="flex items-center gap-2 bg-slate-900 text-white px-3.5 py-2 rounded-2xl text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Active Billing Terminal</span>
            <span className="font-mono font-bold text-amber-400">{billingCounterId}</span>
          </div>
          <span className="text-slate-600">|</span>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Authorized Operator</span>
            <span className="font-semibold text-slate-200">{staffOperatorName}</span>
          </div>
        </div>
      </div>

      {actionAlert && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
            actionAlert.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {actionAlert.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-semibold">{actionAlert.message}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search user # (e.g. C-10023), order #, buyer..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto text-xs">
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-[10px] font-bold uppercase mr-1">Category:</span>
            {['All', 'C', 'B', 'F'].map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategoryFilter(c as any)}
                className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                  selectedCategoryFilter === c
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 ml-2">
            <span className="text-slate-400 text-[10px] font-bold uppercase mr-1">Status:</span>
            {['All', 'Pending Approval', 'Approved', 'Billed', 'Dispatched', 'Cancelled'].map((s) => (
              <button
                key={s}
                onClick={() => setSelectedStatusFilter(s)}
                className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  selectedStatusFilter === s
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Order Workspace: List (Left) & Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Orders Table (Left 5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Orders ({filteredOrders.length})</span>
            <span className="text-[11px] text-slate-400 font-mono">Real-time sync</span>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[650px]">
            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No orders match your filter criteria.
              </div>
            ) : (
              filteredOrders.map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => setActiveOrder(ord)}
                  className={`p-4 transition-colors cursor-pointer text-xs space-y-2 ${
                    activeOrder?.id === ord.id
                      ? 'bg-amber-50/80 border-l-4 border-l-amber-500'
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-sm">{ord.orderNumber}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white">
                        {ord.customerCategory}
                      </span>
                    </div>
                    {getStatusBadge(ord.status)}
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="font-semibold text-slate-800">{ord.businessName}</span>
                    <span className="font-mono text-slate-500 text-[11px] font-bold">
                      User: {ord.userNumber}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100/70">
                    <span>{ord.submissionDate.slice(0, 10)}</span>
                    <span className="font-mono font-bold text-slate-900">
                      NPR {ord.grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Order Review & Billing Inspector (Right 7 Cols) */}
        <div className="lg:col-span-7">
          {activeOrder ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-xs">
              {/* Order Header Summary */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-slate-900 font-mono">
                      {activeOrder.orderNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-900 text-white">
                      Tier {activeOrder.customerCategory}
                    </span>
                    {getStatusBadge(activeOrder.status)}
                  </div>
                  <div className="mt-1 text-xs text-slate-600 flex flex-wrap items-center gap-3">
                    <span>Client: <strong>{activeOrder.businessName}</strong> ({activeOrder.customerName})</span>
                    <span>·</span>
                    <span className="font-mono text-amber-800 font-bold">User Code: {activeOrder.userNumber}</span>
                    <span>·</span>
                    <span className="font-mono text-slate-500">Tel: {activeOrder.contactPhone}</span>
                  </div>
                </div>

                {activeOrder.invoiceNumber && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">Final Tax Invoice</span>
                    <span className="font-mono font-bold text-emerald-950 text-sm">#{activeOrder.invoiceNumber}</span>
                    <span className="text-[10px] text-emerald-800 block mt-0.5">Billed by {activeOrder.billedByStaff || 'Sales Desk'}</span>
                  </div>
                )}
              </div>

              {/* Variant Stock Verification & Adjustment Matrix */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Item Variants & Central Inventory Check
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Live verification of variant inventory before confirming bill.
                    </p>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase">
                      <tr>
                        <th className="px-4 py-2.5">Product & SKU</th>
                        <th className="px-3 py-2.5">Variant (Size / Color)</th>
                        <th className="px-3 py-2.5 text-center">Central Stock</th>
                        <th className="px-3 py-2.5 text-center">Req. Qty</th>
                        <th className="px-3 py-2.5 text-center">Approved Qty</th>
                        <th className="px-3 py-2.5 text-right">Unit Price</th>
                        <th className="px-4 py-2.5 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeOrder.items.map((it) => {
                        const prod = productsMap.get(it.productId);
                        let variant = prod?.variants.find((v) => v.id === it.variantId);
                        if (!variant && prod) {
                          variant = prod.variants.find(
                            (v) =>
                              v.size.toLowerCase() === it.size.toLowerCase() &&
                              v.color.toLowerCase() === it.color.toLowerCase()
                          );
                        }
                        const currentStock = variant?.stock ?? 0;
                        const isUnderStock = currentStock < (editableQtys[it.id] || it.requestedQuantity);

                        return (
                          <tr key={it.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-900">{it.productName}</div>
                              <div className="text-[10px] font-mono text-slate-400">{it.sku}</div>
                            </td>
                            <td className="px-3 py-3">
                              <span className="font-semibold text-slate-800">
                                {it.size} / {it.color}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                                  isUnderStock
                                    ? 'bg-rose-100 text-rose-800 ring-1 ring-rose-300'
                                    : 'bg-emerald-50 text-emerald-800'
                                }`}
                              >
                                {currentStock} in stock
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center font-bold text-slate-900">
                              {it.requestedQuantity}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {activeOrder.status === 'Submitted' || activeOrder.status === 'Pending Approval' ? (
                                <input
                                  type="number"
                                  min={0}
                                  value={editableQtys[it.id] !== undefined ? editableQtys[it.id] : it.requestedQuantity}
                                  onChange={(e) =>
                                    setEditableQtys({
                                      ...editableQtys,
                                      [it.id]: Math.max(0, parseInt(e.target.value) || 0),
                                    })
                                  }
                                  className="w-16 bg-white border border-slate-300 rounded px-1.5 py-1 text-center font-bold font-mono text-xs"
                                />
                              ) : (
                                <span className="font-mono font-bold text-blue-700">
                                  {it.approvedQuantity || it.requestedQuantity}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-right font-mono font-bold text-slate-900">
                              NPR {(it.unitPrice || 0).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                              NPR {((editableQtys[it.id] || it.requestedQuantity) * (it.unitPrice || 0)).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Calculation Summary (Private Admin Display) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Shipping Destination</span>
                  <p className="text-slate-800 font-semibold">{activeOrder.shippingAddress}</p>
                  {activeOrder.customerNotes && (
                    <p className="text-[11px] text-slate-500 mt-0.5">Note: {activeOrder.customerNotes}</p>
                  )}
                </div>

                <div className="space-y-1 text-right min-w-[200px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-bold">NPR {activeOrder.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST ({activeOrder.gstPercent}%):</span>
                    <span className="font-mono font-bold">NPR {activeOrder.gstAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 text-sm font-bold pt-1 border-t border-slate-200">
                    <span>Grand Total:</span>
                    <span className="font-mono text-amber-900">NPR {activeOrder.grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Panel */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  {/* Approve button */}
                  {(activeOrder.status === 'Submitted' || activeOrder.status === 'Pending Approval') && (
                    <button
                      onClick={handleApproveOrder}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve Order Quantities</span>
                    </button>
                  )}

                  {/* Reject button */}
                  {(activeOrder.status === 'Submitted' || activeOrder.status === 'Pending Approval') && (
                    <button
                      onClick={() => setIsRejectionModalOpen(true)}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Reject Order
                    </button>
                  )}

                  {/* Finalize Billing button */}
                  {activeOrder.status === 'Approved' && (
                    <button
                      onClick={() => setIsBillingModalOpen(true)}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
                    >
                      <Receipt className="w-4 h-4" />
                      <span>Finalize Billing & Deduct Inventory</span>
                    </button>
                  )}

                  {/* Dispatch trigger */}
                  {(activeOrder.status === 'Billed' || activeOrder.status === 'Ready for Dispatch') && (
                    <button
                      onClick={() => setIsDispatchModalOpen(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Truck className="w-4 h-4" />
                      <span>Dispatch Consignment</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Print Invoice */}
                  {activeOrder.invoiceNumber && (
                    <button
                      onClick={() => window.print()}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Tax Invoice</span>
                    </button>
                  )}

                  {/* Cancel & Reverse stock */}
                  {activeOrder.status !== 'Cancelled' && activeOrder.status !== 'Rejected' && (
                    <button
                      onClick={handleCancelAndReverse}
                      className="px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1"
                      title="Controlled stock reversal & cancellation"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Cancel & Reverse</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center bg-white border border-slate-200 rounded-3xl text-slate-400 text-xs">
              Select an order from the list on the left to review items, verify central stock, or finalize billing.
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Finalize Billing Confirmation */}
      {isBillingModalOpen && activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 text-xs">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <Receipt className="w-5 h-5 text-emerald-600" />
              <span>Confirm Final Billing & Inventory Deduction</span>
            </div>

            <p className="text-slate-700 leading-relaxed">
              You are finalizing billing for order <strong>#{activeOrder.orderNumber}</strong> issued to{' '}
              <strong>User {activeOrder.userNumber}</strong> ({activeOrder.businessName}).
            </p>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-1.5 text-amber-900">
              <span className="font-bold block">Automatic Inventory Action:</span>
              <p className="text-[11px] leading-relaxed">
                Approving this billing will immediately decrement exact size and color variant quantities from central stock.
                An official tax invoice will be generated and stamped with terminal <strong>{billingCounterId}</strong>.
              </p>
            </div>

            <div className="flex justify-between items-center pt-2 text-slate-700 font-bold">
              <span>Billed Amount:</span>
              <span className="text-base text-slate-900 font-mono">NPR {activeOrder.grandTotal.toLocaleString()}</span>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setIsBillingModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalizeBilling}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Yes, Deduct Stock & Generate Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Order Rejection */}
      {isRejectionModalOpen && activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 text-xs">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
              <XCircle className="w-5 h-5 text-rose-600" />
              <span>Reject Order #{activeOrder.orderNumber}</span>
            </div>

            <p className="text-slate-600">
              Please enter the rejection reason for User {activeOrder.userNumber} ({activeOrder.businessName}):
            </p>

            <textarea
              rows={3}
              required
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
              placeholder="e.g. Insufficient mill yardage / exceeded monthly category credit ceiling."
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs"
            />

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setIsRejectionModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectOrder}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Mark Dispatched */}
      {isDispatchModalOpen && activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 text-xs">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
              <Truck className="w-5 h-5 text-indigo-600" />
              <span>Dispatch Consignment #{activeOrder.orderNumber}</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Transporter / Cargo Line *</label>
                <input
                  type="text"
                  required
                  value={transporterInput}
                  onChange={(e) => setTransporterInput(e.target.value)}
                  placeholder="e.g. Sundar Yatayat Cargo"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Cargo Bilty / Consignment Number *</label>
                <input
                  type="text"
                  required
                  value={trackingNumberInput}
                  onChange={(e) => setTrackingNumberInput(e.target.value)}
                  placeholder="e.g. BLT-KTM-9921"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono text-xs uppercase"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setIsDispatchModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkDispatched}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer"
              >
                Mark Dispatched & Notify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

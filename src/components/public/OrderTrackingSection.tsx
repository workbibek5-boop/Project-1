/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { clothingDb } from '../../db/indexedDb';
import { CentralOrder, CentralOrderStatus, SerialUserAccount } from '../../types';
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Truck,
  Receipt,
  Search,
  ArrowRight,
  ShieldCheck,
  FileText,
  Calendar,
} from 'lucide-react';

interface OrderTrackingSectionProps {
  currentUser: SerialUserAccount | null;
  onOpenAuth: () => void;
  onExploreCatalogue: () => void;
}

export const OrderTrackingSection: React.FC<OrderTrackingSectionProps> = ({
  currentUser,
  onOpenAuth,
  onExploreCatalogue,
}) => {
  const [orders, setOrders] = useState<CentralOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<CentralOrder | null>(null);

  const loadOrders = async () => {
    if (!currentUser) {
      setOrders([]);
      return;
    }
    const userOrders = await clothingDb.getCentralOrdersByUser(currentUser.userNumber);
    setOrders(userOrders);
    if (userOrders.length > 0 && !selectedOrder) {
      setSelectedOrder(userOrders[0]);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <Package className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Track Your Wholesale Orders</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Please log in with your issued User Number (e.g. C-10023, B-20045) to view your submitted orders, approval stages, billing status, and cargo dispatch bilty numbers.
        </p>
        <div className="pt-2">
          <button
            onClick={onOpenAuth}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
          >
            Log In with User Number
          </button>
        </div>
      </div>
    );
  }

  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.status.toLowerCase().includes(q) ||
      (o.invoiceNumber && o.invoiceNumber.toLowerCase().includes(q)) ||
      o.items.some((it) => it.productName.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q))
    );
  });

  const getStatusBadge = (status: CentralOrderStatus) => {
    switch (status) {
      case 'Submitted':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">Submitted</span>;
      case 'Pending Approval':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 animate-pulse">Pending Approval</span>;
      case 'Approved':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">Approved by Admin</span>;
      case 'Billed':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">Billed & Invoiced</span>;
      case 'Ready for Dispatch':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800">Ready for Dispatch</span>;
      case 'Dispatched':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800">Dispatched (Cargo In Transit)</span>;
      case 'Completed':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-600 text-white">Delivered & Completed</span>;
      case 'Rejected':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">Rejected</span>;
      case 'Cancelled':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-200 text-slate-600">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const steps: CentralOrderStatus[] = [
    'Submitted',
    'Pending Approval',
    'Approved',
    'Billed',
    'Ready for Dispatch',
    'Dispatched',
    'Completed',
  ];

  const getStepIndex = (status: CentralOrderStatus) => {
    return steps.indexOf(status);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Authorized Customer Order Tracker</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-amber-700 font-bold">User {currentUser.userNumber}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Order History for {currentUser.businessName}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time status updates from our central wholesale sales desk and dispatch dock.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order or invoice #..."
              className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs w-48 sm:w-64"
            />
          </div>
          <button
            onClick={onExploreCatalogue}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            + New Order
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-8 space-y-4">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Orders Submitted Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            You haven't submitted any bulk orders under User Number <strong>{currentUser.userNumber}</strong>. Browse our catalog and submit an order when ready.
          </p>
          <div className="pt-2">
            <button
              onClick={onExploreCatalogue}
              className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 cursor-pointer"
            >
              Browse Garment Catalogue &rarr;
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders List (Left) */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Submitted Orders ({filteredOrders.length})
            </h3>
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {filteredOrders.map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => setSelectedOrder(ord)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer text-xs space-y-2 ${
                    selectedOrder?.id === ord.id
                      ? 'bg-amber-50/80 border-amber-300 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {ord.orderNumber}
                    </span>
                    {getStatusBadge(ord.status)}
                  </div>

                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{ord.submissionDate.slice(0, 10)}</span>
                    </span>
                    <span>
                      {ord.items.length} {ord.items.length === 1 ? 'Garment Line' : 'Garment Lines'}
                    </span>
                  </div>

                  {ord.invoiceNumber && (
                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-emerald-700">
                      <span>Invoice #{ord.invoiceNumber}</span>
                      <span className="font-bold">Billed</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Selected Order Details (Right) */}
          <div className="lg:col-span-2">
            {selectedOrder ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-xs">
                {/* Detail Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900 font-mono">
                        {selectedOrder.orderNumber}
                      </h2>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 font-mono">
                        Category {selectedOrder.customerCategory}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Submitted on {selectedOrder.submissionDate.replace('T', ' ').slice(0, 16)} by User {selectedOrder.userNumber}
                    </p>
                  </div>
                  <div>{getStatusBadge(selectedOrder.status)}</div>
                </div>

                {/* Status Progression Bar */}
                {selectedOrder.status !== 'Rejected' && selectedOrder.status !== 'Cancelled' && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-3">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Order Fulfillment Progress:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                      {steps.map((st, i) => {
                        const currentIdx = getStepIndex(selectedOrder.status);
                        const isDone = currentIdx >= i;
                        const isCurrent = currentIdx === i;

                        return (
                          <div
                            key={st}
                            className={`p-2 rounded-xl text-center border text-[10px] font-bold transition-all ${
                              isCurrent
                                ? 'bg-amber-500 text-slate-950 border-amber-600 ring-2 ring-amber-400/40 shadow-xs'
                                : isDone
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-white text-slate-400 border-slate-200 opacity-60'
                            }`}
                          >
                            <div className="truncate">{st}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Rejection / Cancellation warning */}
                {(selectedOrder.status === 'Rejected' || selectedOrder.status === 'Cancelled') && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-rose-800">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span>Order {selectedOrder.status} Notice</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Reason: {selectedOrder.rejectionReason || 'Order was flagged or cancelled by Wholesale Desk.'}
                    </p>
                  </div>
                )}

                {/* Items Table */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Requested Garment Lines & Variants
                  </h3>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                        <tr>
                          <th className="px-4 py-2.5">Garment & SKU</th>
                          <th className="px-3 py-2.5">Size / Color</th>
                          <th className="px-3 py-2.5 text-center">Req. Qty</th>
                          <th className="px-3 py-2.5 text-center">Approved</th>
                          <th className="px-3 py-2.5 text-center">Billed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedOrder.items.map((it) => (
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
                            <td className="px-3 py-3 text-center font-bold text-slate-900">
                              {it.requestedQuantity} {it.unit}
                            </td>
                            <td className="px-3 py-3 text-center font-bold text-blue-700">
                              {it.approvedQuantity || it.requestedQuantity} {it.unit}
                            </td>
                            <td className="px-3 py-3 text-center font-mono font-bold text-emerald-700">
                              {it.billedQuantity > 0 ? `${it.billedQuantity} ${it.unit}` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Audit & Dispatch Information */}
                {selectedOrder.trackingNumber && (
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs space-y-1">
                    <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-indigo-700" />
                      <span>Cargo Bilty & Transporter Details</span>
                    </span>
                    <p className="text-indigo-800">
                      Transporter: <strong>{selectedOrder.transporterName || 'Cargo Express'}</strong> · Bilty / Tracking No:{' '}
                      <strong className="font-mono font-bold">{selectedOrder.trackingNumber}</strong>
                    </p>
                  </div>
                )}

                {/* Audit Trail List */}
                {selectedOrder.auditTrail && selectedOrder.auditTrail.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Activity & Verification Audit History:
                    </span>
                    <div className="space-y-1.5">
                      {selectedOrder.auditTrail.map((log, idx) => (
                        <div
                          key={idx}
                          className="text-[11px] text-slate-600 flex items-start gap-2 bg-slate-50 p-2 rounded-xl"
                        >
                          <span className="font-mono text-slate-400 text-[10px] shrink-0 mt-0.5">
                            {log.timestamp.slice(11, 16)}
                          </span>
                          <span className="font-semibold text-slate-800">{log.action}:</span>
                          <span className="flex-1">{log.details}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center bg-white border border-slate-200 rounded-3xl text-slate-400 text-xs">
                Select an order on the left to view detailed variant quantities and live status.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

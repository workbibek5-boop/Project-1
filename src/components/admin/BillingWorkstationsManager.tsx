/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { clothingDb } from '../../db/indexedDb';
import { BillingCounter } from '../../types';
import {
  MonitorCheck,
  Plus,
  Server,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw,
  Sliders,
  Laptop,
  Layers,
  Database,
  Lock,
} from 'lucide-react';

export const BillingWorkstationsManager: React.FC = () => {
  const [counters, setCounters] = useState<BillingCounter[]>([]);
  const [currentCounterCode, setCurrentCounterCode] = useState<string>(() => {
    return localStorage.getItem('ACTIVE_BILLING_COUNTER') || 'COUNTER-01';
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const loadCounters = async () => {
    const list = await clothingDb.getAllBillingCounters();
    setCounters(list);
  };

  useEffect(() => {
    loadCounters();
  }, []);

  const handleSelectCurrentCounter = (code: string) => {
    setCurrentCounterCode(code);
    localStorage.setItem('ACTIVE_BILLING_COUNTER', code);
    setNotice(`This terminal is now operating as Workstation: ${code}`);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleCreateCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) return;

    const formattedCode = newCode.trim().toUpperCase();
    const newCounter: BillingCounter = {
      id: `cnt-${Date.now()}`,
      code: formattedCode,
      name: newName.trim(),
      location: newLocation.trim() || 'Showroom Floor',
      isOnline: true,
      lastActive: new Date().toISOString(),
    };

    await clothingDb.saveBillingCounter(newCounter);
    await loadCounters();
    setIsAddModalOpen(false);
    setNewCode('');
    setNewName('');
    setNewLocation('');
    setNotice(`Workstation ${formattedCode} successfully registered.`);
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Central Operations Infrastructure</span>
            <span aria-hidden="true">·</span>
            <span>Shared Database & Terminals</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Billing Workstations & Central Backend Architecture
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage multi-counter billing stations, unique audit identifiers, and central synchronization configuration.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Register Workstation</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Central Architecture Advisory Box */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
          <Server className="w-5 h-5" />
          <span>Central Backend Synchronization Model</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          To operate multiple cash desks and order processing counters concurrently without race conditions,
          every billing counter and operator attaches a unique terminal ID (e.g.{' '}
          <code className="text-amber-300 bg-slate-800 px-1.5 py-0.5 rounded font-mono">COUNTER-01</code>)
          to all generated invoices, audit trails, and stock movements.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
              <Database className="w-4 h-4" />
              <span>1. Single Central Database</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              One unified repository for inventory stock levels, customer ledgers, and order records. Disconnected per-terminal stores are prohibited.
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-300 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>2. Atomic Stock Allocation</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Finalizing an invoice locks variant stock and validates quantity availability atomically before committing, preventing double-billing.
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-sky-300 font-semibold text-xs">
              <Lock className="w-4 h-4" />
              <span>3. Role-Based Permissions</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Admin maintains full authority over user serial codes and settings; billing desk staff are restricted to authorized sales and dispatch tasks.
            </p>
          </div>
        </div>
      </div>

      {/* Active Workstations List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Registered Billing Workstations</h2>
          <span className="text-xs text-slate-500 font-medium">
            Active on this device: <strong className="text-amber-600 font-mono">{currentCounterCode}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {counters.map((cnt) => {
            const isCurrent = currentCounterCode === cnt.code;
            return (
              <div
                key={cnt.id}
                className={`bg-white rounded-2xl p-5 border transition-all ${
                  isCurrent
                    ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                } flex flex-col justify-between space-y-4`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isCurrent ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 text-slate-700'
                      }`}>
                        <Laptop className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-mono font-bold text-xs text-slate-900 block">{cnt.code}</span>
                        <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                        </span>
                      </div>
                    </div>

                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300">
                        This Terminal
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{cnt.name}</h3>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{cnt.location}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Updated: {new Date(cnt.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  {!isCurrent ? (
                    <button
                      onClick={() => handleSelectCurrentCounter(cnt.code)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Set as Active
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Role-Based Permissions Matrix */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Workstation Role & Permissions Matrix</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Permissions enforced by central backend rules to ensure tamper-resistant operations.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                <th className="py-2.5 px-4 font-bold">Operation / Module</th>
                <th className="py-2.5 px-4 font-bold text-center">Admin</th>
                <th className="py-2.5 px-4 font-bold text-center">Billing Counter Staff</th>
                <th className="py-2.5 px-4 font-bold text-center">Logistics / Dispatch</th>
                <th className="py-2.5 px-4 font-bold text-center">Storefront Buyer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
              <tr>
                <td className="py-2 px-4 font-semibold text-slate-800">Generate & Revoke Serial User Numbers</td>
                <td className="py-2 px-4 text-center text-emerald-600 font-bold">Full</td>
                <td className="py-2 px-4 text-center text-slate-300">No</td>
                <td className="py-2 px-4 text-center text-slate-300">No</td>
                <td className="py-2 px-4 text-center text-slate-300">No</td>
              </tr>
              <tr>
                <td className="py-2 px-4 font-semibold text-slate-800">C/B/F Customer Order Review & Approval</td>
                <td className="py-2 px-4 text-center text-emerald-600 font-bold">Full</td>
                <td className="py-2 px-4 text-center text-amber-600 font-semibold">Review Only</td>
                <td className="py-2 px-4 text-center text-slate-300">No</td>
                <td className="py-2 px-4 text-center text-slate-300">Submit Only</td>
              </tr>
              <tr>
                <td className="py-2 px-4 font-semibold text-slate-800">Finalize Invoices & Deduct Variant Stock</td>
                <td className="py-2 px-4 text-center text-emerald-600 font-bold">Full</td>
                <td className="py-2 px-4 text-center text-emerald-600 font-bold">Authorized</td>
                <td className="py-2 px-4 text-center text-slate-300">No</td>
                <td className="py-2 px-4 text-center text-slate-300">No</td>
              </tr>
              <tr>
                <td className="py-2 px-4 font-semibold text-slate-800">Dispatch Order & Add Tracking Bilty</td>
                <td className="py-2 px-4 text-center text-emerald-600 font-bold">Full</td>
                <td className="py-2 px-4 text-center text-slate-300">No</td>
                <td className="py-2 px-4 text-center text-emerald-600 font-bold">Authorized</td>
                <td className="py-2 px-4 text-center text-slate-300">View Tracking</td>
              </tr>
              <tr>
                <td className="py-2 px-4 font-semibold text-slate-800">Private Wishlist & Saved Products</td>
                <td className="py-2 px-4 text-center text-slate-300">N/A</td>
                <td className="py-2 px-4 text-center text-slate-300">N/A</td>
                <td className="py-2 px-4 text-center text-slate-300">N/A</td>
                <td className="py-2 px-4 text-center text-emerald-600 font-bold">Private to Serial User</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New Workstation */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Laptop className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">Register Billing Workstation</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCounter} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Workstation / Terminal Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. COUNTER-04"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase font-mono font-bold focus:ring-1 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Workstation Name / Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2nd Floor Bridal Sales Counter"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Location / Floor</label>
                <input
                  type="text"
                  placeholder="e.g. Asan Showroom Second Floor"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer"
                >
                  Register Station
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

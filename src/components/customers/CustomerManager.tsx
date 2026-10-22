/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useClothingWholesale } from '../../context/ClothingWholesaleContext';
import { WholesaleCustomer, CustomerCategory, CashSale, CentralOrder } from '../../db/indexedDb';
import { formatNpr } from '../../i18n';
import { useDebounce } from '../../hooks/useDebounce';
import { Pagination } from '../common/Pagination';
import {
  Users,
  Plus,
  Search,
  Phone,
  CreditCard,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  Building,
  KeyRound,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  Eye,
  FileText,
  Calendar,
  Receipt,
  ShoppingBag,
  ExternalLink,
  Filter,
} from 'lucide-react';

interface CustomerManagerProps {
  onStartSaleForCustomer?: (customerName: string, customerPhone?: string) => void;
}

export const CustomerManager: React.FC<CustomerManagerProps> = ({ onStartSaleForCustomer }) => {
  const {
    customers,
    sales,
    centralOrders,
    saveCustomer,
    deleteCustomer,
    createCustomerWithSerial,
    setCustomerAccessStatus,
  } = useClothingWholesale();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);

  // Filters
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'ALL' | CustomerCategory>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'active' | 'inactive'>('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Fast Registration Modal State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [regData, setRegData] = useState<{
    name: string;
    category: CustomerCategory;
    shortCode: string;
    phone: string;
    notes: string;
  }>({
    name: '',
    category: 'C',
    shortCode: '',
    phone: '',
    notes: '',
  });
  const [regError, setRegError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Serial Generated Result Modal State
  const [generatedSerialResult, setGeneratedSerialResult] = useState<{
    customer: WholesaleCustomer;
    serialNumber: string;
  } | null>(null);
  const [copiedSerial, setCopiedSerial] = useState(false);

  // Customer Profile Modal State
  const [profileCustomer, setProfileCustomer] = useState<WholesaleCustomer | null>(null);
  const [profileActiveTab, setProfileActiveTab] = useState<'overview' | 'billing' | 'orders' | 'statement'>(
    'overview'
  );

  // Edit Existing Customer Modal State
  const [editingCustomer, setEditingCustomer] = useState<WholesaleCustomer | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    category: 'C' as CustomerCategory,
    shortCode: '',
    phone: '',
    businessName: '',
    city: '',
    address: '',
    notes: '',
  });

  // Calculate sales stats per customer
  const customerSalesStats = useMemo(() => {
    const stats: Record<string, { totalOrders: number; totalSpent: number; lastDate: string }> = {};

    for (const s of sales) {
      if (s.status !== 'completed' || !s.customerName) continue;
      const key = s.customerId || s.customerSerial || s.customerName.trim().toLowerCase();
      if (!stats[key]) {
        stats[key] = { totalOrders: 0, totalSpent: 0, lastDate: s.timestamp };
      }
      stats[key].totalOrders += 1;
      stats[key].totalSpent += s.grandTotal;
      if (s.timestamp > stats[key].lastDate) {
        stats[key].lastDate = s.timestamp;
      }
    }

    return stats;
  }, [sales]);

  // Filtered customer records
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // Category filter
      if (selectedCategoryFilter !== 'ALL' && c.category !== selectedCategoryFilter) {
        return false;
      }
      // Status filter
      if (selectedStatusFilter !== 'ALL' && (c.status || 'active') !== selectedStatusFilter) {
        return false;
      }
      // Search query
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesSerial = c.serialNumber?.toLowerCase().includes(q) || false;
        const matchesCode = c.shortCode?.toLowerCase().includes(q) || false;
        const matchesPhone = c.phone?.includes(q) || false;
        const matchesBusiness = c.businessName?.toLowerCase().includes(q) || false;
        if (!matchesName && !matchesSerial && !matchesCode && !matchesPhone && !matchesBusiness) {
          return false;
        }
      }
      return true;
    });
  }, [customers, selectedCategoryFilter, selectedStatusFilter, debouncedSearch]);

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  // Fast registration submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regData.name.trim()) {
      setRegError('Customer name or short identifying name is required.');
      return;
    }

    setIsRegistering(true);
    setRegError(null);

    try {
      const result = await createCustomerWithSerial({
        name: regData.name.trim(),
        category: regData.category,
        shortCode: regData.shortCode.trim() || undefined,
        phone: regData.phone.trim() || undefined,
        notes: regData.notes.trim() || undefined,
      });

      setIsRegisterModalOpen(false);
      setRegData({
        name: '',
        category: 'C',
        shortCode: '',
        phone: '',
        notes: '',
      });
      setGeneratedSerialResult(result);
    } catch (err: any) {
      setRegError(err?.message || 'Failed to register customer');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCopySerial = (serial: string) => {
    navigator.clipboard.writeText(serial);
    setCopiedSerial(true);
    setTimeout(() => setCopiedSerial(false), 2000);
  };

  // Toggle active/inactive status
  const handleToggleStatus = async (customer: WholesaleCustomer) => {
    const nextStatus = customer.status === 'inactive' ? 'active' : 'inactive';
    await setCustomerAccessStatus(customer.id, nextStatus);
    if (profileCustomer && profileCustomer.id === customer.id) {
      setProfileCustomer({ ...profileCustomer, status: nextStatus });
    }
  };

  // Open Edit modal
  const handleOpenEdit = (c: WholesaleCustomer) => {
    setEditingCustomer(c);
    setEditFormData({
      name: c.name,
      category: c.category || 'C',
      shortCode: c.shortCode || '',
      phone: c.phone || '',
      businessName: c.businessName || '',
      city: c.city || '',
      address: c.address || '',
      notes: c.notes || '',
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    await saveCustomer({
      ...editingCustomer,
      name: editFormData.name.trim(),
      category: editFormData.category,
      shortCode: editFormData.shortCode.trim() || undefined,
      phone: editFormData.phone.trim() || undefined,
      businessName: editFormData.businessName.trim() || undefined,
      city: editFormData.city.trim() || undefined,
      address: editFormData.address.trim() || undefined,
      notes: editFormData.notes.trim() || undefined,
      updatedAt: new Date().toISOString(),
    });

    if (profileCustomer && profileCustomer.id === editingCustomer.id) {
      setProfileCustomer({
        ...profileCustomer,
        name: editFormData.name.trim(),
        category: editFormData.category,
        shortCode: editFormData.shortCode.trim() || undefined,
        phone: editFormData.phone.trim() || undefined,
        businessName: editFormData.businessName.trim() || undefined,
        city: editFormData.city.trim() || undefined,
        address: editFormData.address.trim() || undefined,
        notes: editFormData.notes.trim() || undefined,
      });
    }

    setEditingCustomer(null);
  };

  // Profile data computed values
  const profileSales = useMemo(() => {
    if (!profileCustomer) return [];
    const custId = profileCustomer.id;
    const serial = profileCustomer.serialNumber?.toUpperCase();
    const name = profileCustomer.name.trim().toLowerCase();

    return sales.filter((s) => {
      if (s.customerId && s.customerId === custId) return true;
      if (s.customerSerial && serial && s.customerSerial.toUpperCase() === serial) return true;
      if (s.customerName && s.customerName.trim().toLowerCase() === name) return true;
      return false;
    });
  }, [profileCustomer, sales]);

  const profileOrders = useMemo(() => {
    if (!profileCustomer) return [];
    const serial = profileCustomer.serialNumber?.toUpperCase();
    const custId = profileCustomer.id;

    return centralOrders.filter((o) => {
      if (o.customerId === custId) return true;
      if (serial && o.userNumber.toUpperCase() === serial) return true;
      return false;
    });
  }, [profileCustomer, centralOrders]);

  const profileStatement = useMemo(() => {
    const totalSpent = profileSales.reduce((acc, s) => acc + (s.status === 'completed' ? s.grandTotal : 0), 0);
    const completedCount = profileSales.filter((s) => s.status === 'completed').length;
    const avgBill = completedCount > 0 ? Math.round(totalSpent / completedCount) : 0;
    const dates = profileSales.map((s) => s.timestamp).sort();

    return {
      totalSpent,
      completedCount,
      avgBill,
      firstDate: dates[0] || null,
      lastDate: dates[dates.length - 1] || null,
    };
  }, [profileSales]);

  return (
    <div className="space-y-6">
      {/* Top Banner and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Customer Accounts & Serial Access</span>
            <span aria-hidden="true">·</span>
            <span>Independent C / B / F Counters</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Wholesale Customer Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Permanent buyer records, isolated category sequential serial numbers, and order histories.
          </p>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={() => {
            setRegError(null);
            setIsRegisterModalOpen(true);
          }}
          className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Add Customer & Generate Serial</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-2xl shadow-2xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by customer name, serial number (e.g. C-0001), phone, or admin code..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Category:</span>
          {(['ALL', 'C', 'B', 'F'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategoryFilter(cat);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                selectedCategoryFilter === cat
                  ? cat === 'C'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : cat === 'B'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : cat === 'F'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'All Tiers' : `Category ${cat}`}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
          {(['ALL', 'active', 'inactive'] as const).map((st) => (
            <button
              key={st}
              onClick={() => {
                setSelectedStatusFilter(st);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-colors cursor-pointer ${
                selectedStatusFilter === st
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Records Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Serial Number</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4 text-center">Category</th>
                <th className="py-3 px-4">Admin Code</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4 text-center">Access Status</th>
                <th className="py-3 px-4 text-right">Total Billed</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No customers found.</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Click "Add Customer & Generate Serial" to create a new buyer account.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((c) => {
                  const statsKey = c.id || c.serialNumber || c.name.trim().toLowerCase();
                  const stats = customerSalesStats[statsKey];
                  const isActive = (c.status || 'active') === 'active';

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Serial Number */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-xs">
                            {c.serialNumber || '—'}
                          </span>
                          {c.serialNumber && (
                            <button
                              onClick={() => handleCopySerial(c.serialNumber!)}
                              title="Copy serial number"
                              className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Customer Name */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            setProfileCustomer(c);
                            setProfileActiveTab('overview');
                          }}
                          className="font-bold text-slate-900 hover:text-indigo-600 hover:underline text-left cursor-pointer"
                        >
                          {c.name}
                        </button>
                        {c.businessName && (
                          <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                            {c.businessName}
                          </div>
                        )}
                      </td>

                      {/* Category Badge */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            c.category === 'C'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : c.category === 'B'
                              ? 'bg-blue-100 text-blue-900 border border-blue-300'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}
                        >
                          Tier {c.category}
                        </span>
                      </td>

                      {/* Short Word / Admin Code */}
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {c.shortCode ? (
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                            {c.shortCode}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {c.phone || <span className="text-slate-300">—</span>}
                      </td>

                      {/* Access Status Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(c)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          }`}
                          title={`Click to ${isActive ? 'deactivate' : 'activate'} storefront access`}
                        >
                          {isActive ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                          <span className="capitalize">{isActive ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      {/* Total Billed */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {stats ? formatNpr(stats.totalSpent) : 'रू 0'}
                        {stats && (
                          <div className="text-[10px] font-normal text-slate-400">
                            {stats.totalOrders} {stats.totalOrders === 1 ? 'sale' : 'sales'}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setProfileCustomer(c);
                              setProfileActiveTab('overview');
                            }}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                            title="View Customer Profile & Ledger"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                            title="Edit customer details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {onStartSaleForCustomer && (
                            <button
                              onClick={() => onStartSaleForCustomer(c.name, c.phone)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg cursor-pointer"
                              title="Start POS sale for this customer"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredCustomers.length > 0 && (
          <div className="border-t border-slate-100 px-4 py-3">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredCustomers.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        )}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 1. FAST REGISTRATION MODAL ("Save Customer & Generate Serial")       */}
      {/* --------------------------------------------------------------------- */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Fast Customer Registration</h3>
                  <p className="text-[11px] text-slate-500">Atomic sequential serial number generation</p>
                </div>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            {regError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              {/* Required: Customer Name */}
              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  Customer Name or Short Identifier <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g., Rajesh Shrestha or New Road Boutique"
                  value={regData.name}
                  onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Required: Category C, B, or F */}
              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  Category Tier <span className="text-rose-600">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['C', 'B', 'F'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setRegData({ ...regData, category: cat })}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        regData.category === cat
                          ? cat === 'C'
                            ? 'bg-amber-50 border-amber-500 text-amber-950 font-black shadow-xs ring-1 ring-amber-500'
                            : cat === 'B'
                            ? 'bg-blue-50 border-blue-500 text-blue-950 font-black shadow-xs ring-1 ring-blue-500'
                            : 'bg-emerald-50 border-emerald-500 text-emerald-950 font-black shadow-xs ring-1 ring-emerald-500'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-sm font-black">Category {cat}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {cat === 'C' ? 'Tier C' : cat === 'B' ? 'Tier B' : 'Tier F'}
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  The system will atomically increment the next serial for Category {regData.category} (e.g. {regData.category}-0001).
                </p>
              </div>

              {/* Optional: Short Admin Word / Code */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Short Word or Code <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., KFP, ASAN, POKHARA"
                  value={regData.shortCode}
                  onChange={(e) => setRegData({ ...regData, shortCode: e.target.value.toUpperCase() })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono uppercase text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {/* Optional: Phone Number */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., 9841234567"
                  value={regData.phone}
                  onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {/* Optional: Short Note */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Short Note <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g., Wholesale denim buyer, prompt payment via cash"
                  value={regData.notes}
                  onChange={(e) => setRegData({ ...regData, notes: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {/* Form Action Button */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>{isRegistering ? 'Generating Serial...' : 'Save Customer & Generate Serial'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 2. SERIAL GENERATED SUCCESS RESULT MODAL                              */}
      {/* --------------------------------------------------------------------- */}
      {generatedSerialResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Serial Code Generated!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Customer <strong className="text-slate-800">{generatedSerialResult.customer.name}</strong> registered under Category {generatedSerialResult.customer.category}.
              </p>
            </div>

            {/* Generated Serial Highlight Box */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-2 border border-slate-800 shadow-inner">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest block">
                ISSUED USER SERIAL NUMBER
              </span>
              <div className="text-3xl font-mono font-black tracking-wider text-white">
                {generatedSerialResult.serialNumber}
              </div>
              <p className="text-[11px] text-slate-400">
                Default customer password: <span className="font-mono text-amber-300">Wholesale2026!</span>
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                onClick={() => handleCopySerial(generatedSerialResult.serialNumber)}
                className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                {copiedSerial ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSerial ? 'Copied to Clipboard!' : 'Copy Serial'}</span>
              </button>

              <button
                onClick={() => {
                  const cust = generatedSerialResult.customer;
                  setGeneratedSerialResult(null);
                  setProfileCustomer(cust);
                  setProfileActiveTab('overview');
                }}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer"
              >
                View Customer Profile
              </button>
            </div>

            <button
              onClick={() => setGeneratedSerialResult(null)}
              className="text-xs text-slate-400 hover:text-slate-600 block mx-auto underline cursor-pointer"
            >
              Done & Close
            </button>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 3. CUSTOMER PROFILE MODAL (4 TABS: OVERVIEW, BILLING, ORDERS, STATEMENT)*/}
      {/* --------------------------------------------------------------------- */}
      {profileCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-base">
                  {profileCustomer.category}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{profileCustomer.name}</h3>
                    <span className="font-mono text-xs font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                      {profileCustomer.serialNumber || 'No Serial'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        profileCustomer.status === 'inactive'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {profileCustomer.status || 'active'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Category {profileCustomer.category} Wholesale Buyer · Registered{' '}
                    {profileCustomer.registrationDate
                      ? new Date(profileCustomer.registrationDate).toLocaleDateString('en-GB')
                      : '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleStatus(profileCustomer)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border cursor-pointer transition-colors ${
                    profileCustomer.status === 'inactive'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                      : 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100'
                  }`}
                >
                  {profileCustomer.status === 'inactive' ? 'Activate Access' : 'Deactivate Access'}
                </button>
                <button
                  onClick={() => setProfileCustomer(null)}
                  className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1 cursor-pointer"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* 4 Tabs Bar */}
            <div className="flex border-b border-slate-200 bg-white px-5 gap-4 text-xs font-bold">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'billing', label: `Billing History (${profileSales.length})` },
                { id: 'orders', label: `Storefront Orders (${profileOrders.length})` },
                { id: 'statement', label: 'Account Statement' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setProfileActiveTab(tab.id as any)}
                  className={`py-3 border-b-2 transition-colors cursor-pointer ${
                    profileActiveTab === tab.id
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* Tab 1: Overview */}
              {profileActiveTab === 'overview' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
                    <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider block">
                      Account & Access Details
                    </span>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Serial Code:</span>
                      <strong className="font-mono text-slate-900">{profileCustomer.serialNumber || '—'}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Assigned Category:</span>
                      <strong className="text-slate-900">Category {profileCustomer.category}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Admin Short Code:</span>
                      <strong className="font-mono text-slate-900">{profileCustomer.shortCode || '—'}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Access Status:</span>
                      <strong className={profileCustomer.status === 'inactive' ? 'text-rose-600' : 'text-emerald-700'}>
                        {profileCustomer.status === 'inactive' ? 'Inactive / Suspended' : 'Active & Authorized'}
                      </strong>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
                    <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider block">
                      Contact & Business Info
                    </span>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Business Name:</span>
                      <strong className="text-slate-900">{profileCustomer.businessName || '—'}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Phone Number:</span>
                      <strong className="font-mono text-slate-900">{profileCustomer.phone || '—'}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">PAN / VAT:</span>
                      <strong className="font-mono text-slate-900">{profileCustomer.panVat || '—'}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Location:</span>
                      <strong className="text-slate-900">
                        {[profileCustomer.city, profileCustomer.address].filter(Boolean).join(', ') || '—'}
                      </strong>
                    </div>
                  </div>

                  {profileCustomer.notes && (
                    <div className="sm:col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Administrator Notes:
                      </span>
                      <p className="text-slate-700 italic">{profileCustomer.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Billing History */}
              {profileActiveTab === 'billing' && (
                <div className="space-y-3">
                  {profileSales.length === 0 ? (
                    <div className="py-8 text-center text-slate-400">
                      No billing invoices recorded for this customer yet.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                          <th className="pb-2">Invoice #</th>
                          <th className="pb-2">Date</th>
                          <th className="pb-2 text-right">Items</th>
                          <th className="pb-2 text-right">Amount</th>
                          <th className="pb-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {profileSales.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50">
                            <td className="py-2.5 font-mono font-bold text-slate-900">{s.invoiceNumber}</td>
                            <td className="py-2.5 text-slate-600">
                              {new Date(s.timestamp).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="py-2.5 text-right font-mono text-slate-700">
                              {s.items.reduce((acc, it) => acc + it.quantity, 0)} pcs
                            </td>
                            <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                              {formatNpr(s.grandTotal)}
                            </td>
                            <td className="py-2.5 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  s.status === 'completed'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {s.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Tab 3: Storefront Orders */}
              {profileActiveTab === 'orders' && (
                <div className="space-y-3">
                  {profileOrders.length === 0 ? (
                    <div className="py-8 text-center text-slate-400">
                      No storefront orders placed under serial code {profileCustomer.serialNumber}.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                          <th className="pb-2">Order #</th>
                          <th className="pb-2">Submitted</th>
                          <th className="pb-2 text-right">Items</th>
                          <th className="pb-2 text-right">Order Total</th>
                          <th className="pb-2 text-center">Workflow Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {profileOrders.map((o) => (
                          <tr key={o.id} className="hover:bg-slate-50">
                            <td className="py-2.5 font-mono font-bold text-slate-900">{o.orderNumber}</td>
                            <td className="py-2.5 text-slate-600">
                              {new Date(o.submissionDate).toLocaleDateString('en-GB')}
                            </td>
                            <td className="py-2.5 text-right font-mono text-slate-700">
                              {o.items.reduce((acc: number, it: any) => acc + (it.requestedQuantity || 0), 0)} pcs
                            </td>
                            <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                              {formatNpr(o.grandTotal)}
                            </td>
                            <td className="py-2.5 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  o.status === 'Billed'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : o.status === 'Approved'
                                    ? 'bg-blue-100 text-blue-800'
                                    : o.status === 'Pending Approval'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {o.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Tab 4: Account Statement */}
              {profileActiveTab === 'statement' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                      <span className="text-[11px] text-slate-500 block">Total Lifetime Purchases</span>
                      <strong className="text-base font-mono font-black text-slate-900 mt-1 block">
                        {formatNpr(profileStatement.totalSpent)}
                      </strong>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                      <span className="text-[11px] text-slate-500 block">Completed Sales</span>
                      <strong className="text-base font-mono font-black text-slate-900 mt-1 block">
                        {profileStatement.completedCount}
                      </strong>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                      <span className="text-[11px] text-slate-500 block">Average Bill Value</span>
                      <strong className="text-base font-mono font-black text-slate-900 mt-1 block">
                        {formatNpr(profileStatement.avgBill)}
                      </strong>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                      <span className="text-[11px] text-slate-500 block">Last Active</span>
                      <strong className="text-xs font-mono font-bold text-slate-900 mt-1 block">
                        {profileStatement.lastDate
                          ? new Date(profileStatement.lastDate).toLocaleDateString('en-GB')
                          : 'No sales yet'}
                      </strong>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                    <strong>Wholesale Terms:</strong> Customer records, billing invoices, and order logs remain permanently preserved in local IndexedDB storage even if storefront access is deactivated.
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setProfileCustomer(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 4. EDIT EXISTING CUSTOMER MODAL                                      */}
      {/* --------------------------------------------------------------------- */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Edit Customer Information</h3>
              <button
                onClick={() => setEditingCustomer(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-900 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category Tier</label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value as any })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                  >
                    <option value="C">Category C</option>
                    <option value="B">Category B</option>
                    <option value="F">Category F</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Admin Code</label>
                  <input
                    type="text"
                    value={editFormData.shortCode}
                    onChange={(e) => setEditFormData({ ...editFormData, shortCode: e.target.value.toUpperCase() })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Business Name</label>
                <input
                  type="text"
                  value={editFormData.businessName}
                  onChange={(e) => setEditFormData({ ...editFormData, businessName: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useClothingWholesale } from '../../context/ClothingWholesaleContext';
import { WholesaleExpense } from '../../db/indexedDb';
import { formatNpr } from '../../i18n';
import { useDebounce } from '../../hooks/useDebounce';
import { Pagination } from '../common/Pagination';
import {
  Wallet,
  Plus,
  Search,
  Calendar,
  Receipt,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  PieChart,
} from 'lucide-react';

const EXPENSE_CATEGORIES = [
  'Shop Rent',
  'Cargo / Freight',
  'Packaging Materials',
  'Staff Tea & Meals',
  'Electricity & Utilities',
  'Warehouse Maintenance',
  'Miscellaneous',
];

export const ExpenseManager: React.FC = () => {
  const { expenses, saveExpense, deleteExpense } = useClothingWholesale();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'month'>('month');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<WholesaleExpense | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: 'Cargo / Freight',
    amount: '',
    description: '',
    voucherNumber: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    let result = expenses;
    const todayStr = new Date().toISOString().slice(0, 10);
    const thisMonthStr = todayStr.slice(0, 7);

    if (dateFilter === 'today') {
      result = result.filter((e) => e.date === todayStr);
    } else if (dateFilter === 'month') {
      result = result.filter((e) => e.date.startsWith(thisMonthStr));
    }

    if (categoryFilter !== 'all') {
      result = result.filter((e) => e.category === categoryFilter);
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          (e.voucherNumber && e.voucherNumber.toLowerCase().includes(q))
      );
    }

    return result;
  }, [expenses, dateFilter, categoryFilter, debouncedSearch]);

  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredExpenses.slice(start, start + itemsPerPage);
  }, [filteredExpenses, currentPage, itemsPerPage]);

  // Statistics
  const stats = useMemo(() => {
    let totalAmount = 0;
    const catTotals: Record<string, number> = {};

    for (const e of filteredExpenses) {
      totalAmount += e.amount;
      catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
    }

    let topCat = '—';
    let topCatVal = 0;
    for (const [cat, val] of Object.entries(catTotals)) {
      if (val > topCatVal) {
        topCatVal = val;
        topCat = cat;
      }
    }

    return { totalAmount, count: filteredExpenses.length, topCat, topCatVal };
  }, [filteredExpenses]);

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setFormData({
      date: new Date().toISOString().slice(0, 10),
      category: 'Cargo / Freight',
      amount: '',
      description: '',
      voucherNumber: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exp: WholesaleExpense) => {
    setEditingExpense(exp);
    setFormData({
      date: exp.date,
      category: exp.category,
      amount: String(exp.amount),
      description: exp.description,
      voucherNumber: exp.voucherNumber || '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(formData.amount);
    if (!formData.description.trim()) {
      setFormError('Expense description is required.');
      return;
    }
    if (!numAmount || numAmount <= 0) {
      setFormError('Valid positive amount in NPR is required.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const expenseToSave: WholesaleExpense = {
      id: editingExpense ? editingExpense.id : `exp-${Date.now()}`,
      date: formData.date,
      category: formData.category,
      amount: numAmount,
      description: formData.description.trim(),
      voucherNumber: formData.voucherNumber.trim() || undefined,
      paymentMethod: 'cash',
      createdAt: editingExpense ? editingExpense.createdAt : new Date().toISOString(),
    };

    const res = await saveExpense(expenseToSave);
    setIsSubmitting(false);

    if (res.success) {
      setIsModalOpen(false);
    } else {
      setFormError(res.error || 'Failed to save expense');
    }
  };

  const handleDelete = async (exp: WholesaleExpense) => {
    if (!confirm(`Delete expense "${exp.description}" (${formatNpr(exp.amount)})?`)) return;
    await deleteExpense(exp.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Shop Operations & Cash Outflow</span>
            <span aria-hidden="true">·</span>
            <span>Business Expenses Ledger</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Cash Expenses
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Record counter tea, warehouse rent, transport freight, and utility payments to maintain accurate net profit figures.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Record New Expense</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Expenses in Selection</span>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
            {formatNpr(stats.totalAmount)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{stats.count} transaction voucher(s)</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Largest Cost Head</span>
          <div className="text-lg font-bold text-slate-900 mt-1 truncate">
            {stats.topCat}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
            {stats.topCatVal > 0 ? formatNpr(stats.topCatVal) : 'No entries'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Cash Payment Term</span>
          <div className="text-lg font-bold text-slate-900 mt-1">
            100% Cash / Petty
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Deducted from gross cash margins</div>
        </div>
      </div>

      {/* Controls Bar: Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search expenses by description, voucher #, category..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
          />
        </div>

        <div>
          <select
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="w-full py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="today">Today Only</option>
            <option value="month">This Month</option>
            <option value="all">All Historical Dates</option>
          </select>
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">All Cost Categories</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Voucher #</th>
                <th className="py-3 px-4 text-right">Amount (NPR)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                    No cash expenses found matching your query.
                  </td>
                </tr>
              ) : (
                paginatedExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                      {exp.date}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-semibold">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {exp.description}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {exp.voucherNumber || '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                      {formatNpr(exp.amount)}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEdit(exp)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors inline-block"
                        title="Edit Expense"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(exp)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors inline-block"
                        title="Delete Expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalItems={filteredExpenses.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </div>

      {/* Add / Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in duration-150">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">
                  {editingExpense ? 'Edit Expense Record' : 'Record Cash Expense'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expense Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 text-xs font-mono focus:ring-1 focus:ring-slate-900 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-1 focus:ring-slate-900"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Amount in NPR <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  placeholder="e.g. 3500"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 text-sm font-mono font-bold focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Description & Vendor <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Biratnagar parcel freight at Sundar Yatayat counter"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Receipt / Voucher Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. VCH-0045, Bilty # 891"
                  value={formData.voucherNumber}
                  onChange={(e) => setFormData({ ...formData, voucherNumber: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 text-xs font-mono focus:ring-1 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg font-bold transition-colors shadow-2xs"
                >
                  {isSubmitting ? 'Saving...' : editingExpense ? 'Update Expense' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

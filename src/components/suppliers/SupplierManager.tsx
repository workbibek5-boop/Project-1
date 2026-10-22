/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useClothingWholesale } from '../../context/ClothingWholesaleContext';
import { WholesaleSupplier } from '../../db/indexedDb';
import { formatNpr } from '../../i18n';
import { useDebounce } from '../../hooks/useDebounce';
import { Pagination } from '../common/Pagination';
import {
  Truck,
  Plus,
  Search,
  Phone,
  Building,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  PackageCheck,
} from 'lucide-react';

interface SupplierManagerProps {
  onStartPurchaseForSupplier?: (supplierName: string) => void;
}

export const SupplierManager: React.FC<SupplierManagerProps> = ({ onStartPurchaseForSupplier }) => {
  const { suppliers, purchases, saveSupplier, deleteSupplier } = useClothingWholesale();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<WholesaleSupplier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    city: '',
    address: '',
    category: 'Fabric & Mill Direct',
    notes: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Supplier purchase statistics
  const supplierStats = useMemo(() => {
    const stats: Record<string, { totalPurchases: number; totalCost: number }> = {};
    for (const p of purchases) {
      if (!p.supplierName) continue;
      const key = p.supplierName.trim().toLowerCase();
      if (!stats[key]) {
        stats[key] = { totalPurchases: 0, totalCost: 0 };
      }
      stats[key].totalPurchases += 1;
      stats[key].totalCost += p.totalCost;
    }
    return stats;
  }, [purchases]);

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    if (!debouncedSearch.trim()) return suppliers;
    const q = debouncedSearch.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.contactPerson.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
    );
  }, [suppliers, debouncedSearch]);

  const paginatedSuppliers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSuppliers.slice(start, start + itemsPerPage);
  }, [filteredSuppliers, currentPage, itemsPerPage]);

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      city: 'Kathmandu',
      address: '',
      category: 'Fabric & Mill Direct',
      notes: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: WholesaleSupplier) => {
    setEditingSupplier(s);
    setFormData({
      name: s.name,
      contactPerson: s.contactPerson,
      phone: s.phone,
      email: s.email || '',
      city: s.city,
      address: s.address,
      category: s.category,
      notes: s.notes || '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Supplier / Mill name is required.');
      return;
    }
    if (!formData.phone.trim()) {
      setFormError('Supplier contact phone is required.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const supplierToSave: WholesaleSupplier = {
      id: editingSupplier ? editingSupplier.id : `supp-${Date.now()}`,
      name: formData.name.trim(),
      contactPerson: formData.contactPerson.trim() || formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || undefined,
      city: formData.city.trim() || 'Kathmandu',
      address: formData.address.trim(),
      category: formData.category,
      notes: formData.notes.trim() || undefined,
      createdAt: editingSupplier ? editingSupplier.createdAt : new Date().toISOString(),
    };

    const res = await saveSupplier(supplierToSave);
    setIsSubmitting(false);

    if (res.success) {
      setIsModalOpen(false);
    } else {
      setFormError(res.error || 'Failed to save supplier');
    }
  };

  const handleDelete = async (s: WholesaleSupplier) => {
    if (!confirm(`Delete supplier profile "${s.name}"? Previous recorded purchases will not be affected.`)) {
      return;
    }
    await deleteSupplier(s.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Procurement & Supply Chain</span>
            <span aria-hidden="true">·</span>
            <span>Textile Mills & Manufacturers</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Supplier Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage fabric mills, apparel manufacturers, and distributors supplying stock to your warehouse.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Add New Supplier</span>
        </button>
      </div>

      {/* Search & Info Bar */}
      <div className="flex items-center justify-between gap-4 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by mill name, contact, phone, city..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
          />
        </div>
        <div className="text-xs text-slate-500 font-mono">
          <strong>{filteredSuppliers.length}</strong> supplier(s) recorded
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Supplier / Mill</th>
                <th className="py-3 px-4">Contact Representative</th>
                <th className="py-3 px-4">Supply Category</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-center">Purchases</th>
                <th className="py-3 px-4 text-right">Total Inbound Value</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-500">
                    No suppliers found matching your search.
                  </td>
                </tr>
              ) : (
                paginatedSuppliers.map((s) => {
                  const stat = supplierStats[s.name.trim().toLowerCase()] || {
                    totalPurchases: 0,
                    totalCost: 0,
                  };
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">{s.name}</div>
                        {s.notes && (
                          <div className="text-[10px] text-slate-400 italic max-w-xs truncate">
                            {s.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{s.contactPerson}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{s.phone}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-medium">
                          {s.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="font-medium text-slate-800">{s.city}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{s.address}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                        {stat.totalPurchases}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {stat.totalCost > 0 ? formatNpr(stat.totalCost) : '—'}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {onStartPurchaseForSupplier && (
                          <button
                            onClick={() => onStartPurchaseForSupplier(s.name)}
                            className="py-1 px-2.5 rounded bg-sky-50 hover:bg-sky-100 text-sky-900 font-bold transition-colors inline-flex items-center gap-1 text-[11px]"
                            title="Record incoming stock from this supplier"
                          >
                            <PackageCheck className="w-3 h-3 text-sky-700" />
                            <span>Stock In</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors inline-block"
                          title="Edit Supplier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(s)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors inline-block"
                          title="Delete Supplier"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalItems={filteredSuppliers.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </div>

      {/* Add / Edit Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in duration-150">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">
                  {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Supplier / Mill Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Himalayan Textile Mills"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contact Representative
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Suresh Agrawal"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phone / Mobile <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 01-4351234 / 9851000000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 text-xs font-mono focus:ring-1 focus:ring-slate-900 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Supply Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="Fabric & Mill Direct">Fabric & Mill Direct</option>
                    <option value="Ready-made Garments">Ready-made Garments</option>
                    <option value="Denim Manufacturing">Denim Manufacturing</option>
                    <option value="Trims, Zippers & Buttons">Trims, Zippers & Buttons</option>
                    <option value="Packaging Materials">Packaging Materials</option>
                    <option value="Importer / Distributor">Importer / Distributor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City / Region</label>
                  <input
                    type="text"
                    placeholder="e.g. Biratnagar, Kathmandu, Surat"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Physical Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Industrial Area, Ward 4"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Specialties & Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Lead times, minimum shipment dozens, transport preference..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
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
                  {isSubmitting ? 'Saving...' : editingSupplier ? 'Update Supplier' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

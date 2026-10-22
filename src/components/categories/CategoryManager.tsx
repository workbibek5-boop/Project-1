/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useClothingWholesale } from '../../context/ClothingWholesaleContext';
import { WholesaleCategory } from '../../db/indexedDb';
import { formatNpr } from '../../i18n';
import { useDebounce } from '../../hooks/useDebounce';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
} from 'lucide-react';

interface CategoryManagerProps {
  onSelectCategoryFilter?: (catName: string) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ onSelectCategoryFilter }) => {
  const { categories, products, saveCategory, deleteCategory } = useClothingWholesale();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<WholesaleCategory | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute product counts and total stock per category
  const categoryStats = useMemo(() => {
    const stats: Record<string, { count: number; totalPieces: number; valuation: number }> = {};
    for (const p of products) {
      if (!stats[p.category]) {
        stats[p.category] = { count: 0, totalPieces: 0, valuation: 0 };
      }
      stats[p.category].count += 1;
      stats[p.category].totalPieces += p.totalStock;
      stats[p.category].valuation += p.totalStock * p.sellingPrice;
    }
    return stats;
  }, [products]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    if (!debouncedSearch.trim()) return categories;
    const q = debouncedSearch.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, debouncedSearch]);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({ name: '', code: '', description: '' });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: WholesaleCategory) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      code: cat.code,
      description: cat.description || '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Category name is required.');
      return;
    }
    if (!formData.code.trim()) {
      setFormError('Category short code (e.g. SHT, JNS) is required.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const categoryToSave: WholesaleCategory = {
      id: editingCategory ? editingCategory.id : `cat-${Date.now()}`,
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      description: formData.description.trim() || undefined,
      createdAt: editingCategory ? editingCategory.createdAt : new Date().toISOString(),
    };

    const res = await saveCategory(categoryToSave);
    setIsSubmitting(false);

    if (res.success) {
      setIsModalOpen(false);
    } else {
      setFormError(res.error || 'Failed to save category');
    }
  };

  const handleDelete = async (cat: WholesaleCategory) => {
    const stats = categoryStats[cat.name];
    if (stats && stats.count > 0) {
      if (!confirm(`Warning: ${stats.count} product(s) are currently categorized as "${cat.name}". Are you sure you want to delete this category?`)) {
        return;
      }
    } else {
      if (!confirm(`Delete category "${cat.name}"?`)) return;
    }

    await deleteCategory(cat.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Catalog Organization</span>
            <span aria-hidden="true">·</span>
            <span>Clothing Lines & Segments</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Garment Categories
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize wholesale clothing by apparel line, view stock piece counts, and set standardized SKU prefixes.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search categories by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
          />
        </div>
        <div className="text-xs text-slate-500 font-mono">
          <strong>{filteredCategories.length}</strong> categories configured
        </div>
      </div>

      {/* Categories Grid / Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Category Name</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-center">SKUs</th>
                <th className="py-3 px-4 text-right">In-Stock Pieces</th>
                <th className="py-3 px-4 text-right">Wholesale Value</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-xs text-slate-500">
                    No categories found matching your query.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => {
                  const stats = categoryStats[cat.name] || { count: 0, totalPieces: 0, valuation: 0 };
                  return (
                    <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 text-[11px]">
                          {cat.code}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>{cat.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                        {cat.description || '—'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700">
                        {stats.count}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                        {stats.totalPieces.toLocaleString()} pcs
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatNpr(stats.valuation)}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        {onSelectCategoryFilter && stats.count > 0 && (
                          <button
                            onClick={() => onSelectCategoryFilter(cat.name)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors inline-block"
                            title="Filter Products"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(cat)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors inline-block"
                          title="Edit Category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors inline-block"
                          title="Delete Category"
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
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in duration-150">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">
                  {editingCategory ? 'Edit Clothing Category' : 'Add Clothing Category'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Formal Shirts, Denim Jeans, Hoodies"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Short Code (SKU Prefix) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. SHT, JNS, TEE, HOD"
                  maxLength={6}
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 text-xs font-mono uppercase focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Used as the prefix when generating variant SKUs (e.g. SHT-OXF-BLK-M).
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Optional notes regarding fabrics, fits, or seasons..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
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
                  {isSubmitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

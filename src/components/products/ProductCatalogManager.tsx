/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useClothingWholesale } from '../../context/ClothingWholesaleContext';
import { ClothingProduct, ProductVariant, StockMovement } from '../../db/indexedDb';
import { useDebounce } from '../../hooks/useDebounce';
import { Pagination } from '../common/Pagination';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  History,
  FileSpreadsheet,
  Trash2,
  Edit2,
  Check,
  X,
  Layers,
  ArrowUpDown,
  Sparkles,
  Scissors,
} from 'lucide-react';
import {
  FASHION_DEPARTMENTS,
  FASHION_HIERARCHY,
  COMMON_FABRICS,
  FASHION_OCCASIONS,
  FashionDepartment,
} from '../../data/fashionCategories';

export const ProductCatalogManager: React.FC = () => {
  const {
    products,
    stockMovements,
    settings,
    saveProduct,
    deleteProduct,
    exportProductsCsv,
    exportInventoryCsv,
  } = useClothingWholesale();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 180);

  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedFabric, setSelectedFabric] = useState<string>('All');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Modal: Add or Edit Product
  const [editingProduct, setEditingProduct] = useState<ClothingProduct | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Product History Viewer Modal
  const [historyProduct, setHistoryProduct] = useState<ClothingProduct | null>(null);

  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(products.map((p) => p.category)))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesDept = selectedDepartment === 'All' || p.department === selectedDepartment;
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesFabric = selectedFabric === 'All' || (p.fabric && p.fabric.toLowerCase().includes(selectedFabric.toLowerCase()));
      const q = debouncedSearch.toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.department && p.department.toLowerCase().includes(q)) ||
        (p.fabric && p.fabric.toLowerCase().includes(q)) ||
        (p.designStyleCode && p.designStyleCode.toLowerCase().includes(q)) ||
        (p.manufacturer && p.manufacturer.toLowerCase().includes(q)) ||
        (p.collectionOccasion && p.collectionOccasion.toLowerCase().includes(q)) ||
        p.variants.some(
          (v) =>
            v.size.toLowerCase().includes(q) ||
            v.color.toLowerCase().includes(q) ||
            v.sku.toLowerCase().includes(q)
        );

      const isLowStock = p.variants.some(
        (v) => v.stock <= (v.lowStockAlert ?? settings.defaultLowStockThreshold)
      );
      const matchesLowStock = filterLowStockOnly ? isLowStock : true;

      return matchesDept && matchesCategory && matchesFabric && matchesSearch && matchesLowStock;
    });
  }, [products, selectedDepartment, selectedCategory, selectedFabric, debouncedSearch, filterLowStockOnly, settings.defaultLowStockThreshold]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const handleOpenCreate = () => {
    const newProd: ClothingProduct = {
      id: `prod-${Date.now()}`,
      name: '',
      sku: '',
      barcode: '',
      department: selectedDepartment !== 'All' ? selectedDepartment : 'Women’s Ethnic Wear',
      category: 'Bridal Lehenga',
      brand: settings.businessName,
      supplier: 'Primary Textile Mill',
      manufacturer: '',
      designStyleCode: '',
      collectionOccasion: 'Bridal & Trousseau',
      unit: 'pcs',
      purchaseCost: 2500,
      sellingPrice: 4200,
      gstRate: settings.defaultVatPercent || 13,
      fabric: 'Pure Mulberry Silk',
      variants: [
        { id: `v-${Date.now()}-1`, size: 'M', color: 'Crimson Red', sku: '', stock: 10, lowStockAlert: 2 },
        { id: `v-${Date.now()}-2`, size: 'L', color: 'Crimson Red', sku: '', stock: 10, lowStockAlert: 2 },
      ],
      totalStock: 20,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingProduct(newProd);
    setIsCreatingNew(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!editingProduct.name.trim() || !editingProduct.sku.trim()) {
      alert('Product name and SKU are required.');
      return;
    }

    if (editingProduct.variants.length === 0) {
      alert('At least one size/colour variant is required.');
      return;
    }

    // Auto-generate variant SKUs if left empty
    const normalizedVariants = editingProduct.variants.map((v) => ({
      ...v,
      sku: v.sku.trim() || `${editingProduct.sku}-${v.color.slice(0, 3).toUpperCase()}-${v.size.toUpperCase()}`,
      stock: Number(v.stock) || 0,
      lowStockAlert: Number(v.lowStockAlert) || settings.defaultLowStockThreshold,
    }));

    const res = await saveProduct({
      ...editingProduct,
      variants: normalizedVariants,
    });

    if (res.success) {
      setEditingProduct(null);
      setIsCreatingNew(false);
    } else {
      alert(`Failed to save: ${res.error}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Clothing Inventory System</span>
            <span aria-hidden="true">·</span>
            <span>Variant Tracking</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Garment Product Catalog & Variant Stock
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track sizes (XS to XXL), colours, units, purchase costs, and wholesale selling prices.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportProductsCsv}
            className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Products CSV</span>
          </button>
          <button
            onClick={exportInventoryCsv}
            className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-sky-600" />
            <span>Export Size/Color CSV</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Add New Garment</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by garment name, SKU, brand, category, or size..."
            className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {/* Department Filter */}
          <select
            value={selectedDepartment}
            onChange={(e) => {
              setSelectedDepartment(e.target.value);
              setSelectedCategory('All');
            }}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 cursor-pointer"
          >
            <option value="All">All Departments</option>
            {FASHION_DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 cursor-pointer"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'All Categories' : c}
              </option>
            ))}
          </select>

          {/* Fabric Filter */}
          <select
            value={selectedFabric}
            onChange={(e) => setSelectedFabric(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 cursor-pointer hidden md:block"
          >
            <option value="All">All Fabrics</option>
            {COMMON_FABRICS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>

          <button
            onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              filterLowStockOnly
                ? 'bg-amber-600 text-white'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock Alerts</span>
          </button>
        </div>
      </div>

      {/* Products Table with Expanded Variant Rows */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                <th className="py-3 px-4">Garment Line</th>
                <th className="py-3 px-4">SKU / Barcode</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Size & Colour Breakdown</th>
                <th className="py-3 px-4 text-right">Purchase Cost</th>
                <th className="py-3 px-4 text-right">Wholesale Price</th>
                <th className="py-3 px-4 text-right">Total Stock</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No clothing products found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const hasLowStock = p.variants.some(
                    (v) => v.stock <= (v.lowStockAlert ?? settings.defaultLowStockThreshold)
                  );

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-[11px] text-slate-500">{p.brand} · {p.fabric || 'Fabric: Standard'}</div>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <div className="font-bold text-slate-800">{p.sku}</div>
                        <div className="text-[10px] text-slate-400">{p.barcode || 'No Barcode'}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{p.category}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-sm">
                          {p.variants.map((v) => {
                            const isVariantLow = v.stock <= (v.lowStockAlert ?? settings.defaultLowStockThreshold);
                            return (
                              <span
                                key={v.id}
                                className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                                  v.stock === 0
                                    ? 'bg-rose-50 text-rose-800 border-rose-300 line-through'
                                    : isVariantLow
                                    ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                                    : 'bg-slate-100 text-slate-800 border-slate-200'
                                }`}
                                title={`SKU: ${v.sku} | Barcode: ${v.barcode || 'N/A'}`}
                              >
                                {v.size}/{v.color}: <strong>{v.stock}</strong>
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                        {settings.currency} {p.purchaseCost.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {settings.currency} {p.sellingPrice.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                        <span className={hasLowStock ? 'text-amber-700' : 'text-emerald-700'}>
                          {p.totalStock} {p.unit}
                        </span>
                        {hasLowStock && (
                          <span className="block text-[10px] text-amber-700 font-sans">
                            Low Variant Stock
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => setHistoryProduct(p)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                          title="View Stock Movement History"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingProduct({ ...p, variants: [...p.variants] });
                            setIsCreatingNew(false);
                          }}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                          title="Edit Product & Variants"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm(`Are you sure you want to delete "${p.name}"?`)) {
                              await deleteProduct(p.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded"
                          title="Delete Product"
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
          totalItems={filteredProducts.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </div>

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT PRODUCT & MULTI-VARIANTS */}
      {/* ========================================================================= */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {isCreatingNew ? 'Add New Clothing Product' : `Edit: ${editingProduct.name}`}
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    placeholder="e.g. Super 140s Italian Wool Tailored Blazer"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Product Code / SKU *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.sku}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    placeholder="e.g. BLZ-ITL-01"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono uppercase focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* Department & Fashion Category Hierarchy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={editingProduct.department || 'Formal & Western Wear'}
                    onChange={(e) => {
                      const newDept = e.target.value;
                      const subcats = FASHION_HIERARCHY[newDept as FashionDepartment] || [];
                      setEditingProduct({
                        ...editingProduct,
                        department: newDept,
                        category: subcats[0] || editingProduct.category,
                      });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 cursor-pointer"
                  >
                    {FASHION_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category / Subcategory</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer"
                  >
                    {(FASHION_HIERARCHY[(editingProduct.department as FashionDepartment) || 'Formal & Western Wear'] || []).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Design Code, Brand & Manufacturer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Design / Style Code</label>
                  <input
                    type="text"
                    value={editingProduct.designStyleCode || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, designStyleCode: e.target.value })}
                    placeholder="e.g. MNR-BLZ-701"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Brand or Label</label>
                  <input
                    type="text"
                    value={editingProduct.brand}
                    onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                    placeholder="e.g. Monarch Bespoke"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Manufacturer / Production House</label>
                  <input
                    type="text"
                    value={editingProduct.manufacturer || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, manufacturer: e.target.value })}
                    placeholder="e.g. Kathmandu Atelier"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>

              {/* Fabric, Collection Occasion & Supplier */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fabric & Material</label>
                  <input
                    type="text"
                    list="fabric-datalist"
                    value={editingProduct.fabric || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, fabric: e.target.value })}
                    placeholder="e.g. Pure Mulberry Silk"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                  <datalist id="fabric-datalist">
                    {COMMON_FABRICS.map((fab) => (
                      <option key={fab} value={fab} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Collection / Occasion</label>
                  <input
                    type="text"
                    list="occasion-datalist"
                    value={editingProduct.collectionOccasion || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, collectionOccasion: e.target.value })}
                    placeholder="e.g. Bridal & Trousseau"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                  <datalist id="occasion-datalist">
                    {FASHION_OCCASIONS.map((occ) => (
                      <option key={occ} value={occ} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Supplier</label>
                  <input
                    type="text"
                    value={editingProduct.supplier}
                    onChange={(e) => setEditingProduct({ ...editingProduct, supplier: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>

              {/* Pricing, Unit & GST */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Purchase Cost ({settings.currency}) *</label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    required
                    value={editingProduct.purchaseCost}
                    onChange={(e) => setEditingProduct({ ...editingProduct, purchaseCost: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Wholesale Selling Price ({settings.currency}) *</label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    required
                    value={editingProduct.sellingPrice}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Clothing / Textile Unit</label>
                  <select
                    value={editingProduct.unit}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value as any })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs cursor-pointer font-semibold"
                  >
                    <option value="pcs">Pieces (Pcs)</option>
                    <option value="metres">Metres (Fabrics)</option>
                    <option value="packs">Packs (e.g. 10 pcs)</option>
                    <option value="cartons">Cartons (Bulk)</option>
                    <option value="rolls">Rolls / Thaans</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GST / VAT Rate (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="any"
                    value={editingProduct.gstRate ?? settings.defaultVatPercent}
                    onChange={(e) => setEditingProduct({ ...editingProduct, gstRate: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* Product Image URL */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Image URL (Optional)</label>
                <input
                  type="url"
                  value={editingProduct.imageUrl || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/... or paste image URL"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800"
                />
              </div>

              {/* Variants Section */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h4 className="font-bold text-slate-900">Sizes, Colours & Stock Quantities</h4>
                    <span className="text-[11px] text-slate-500">Each variant tracks its own individual stock.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newVar: ProductVariant = {
                        id: `v-${Date.now()}-${editingProduct.variants.length + 1}`,
                        size: 'L',
                        color: 'Black',
                        sku: '',
                        stock: 10,
                        lowStockAlert: 5,
                      };
                      setEditingProduct({
                        ...editingProduct,
                        variants: [...editingProduct.variants, newVar],
                      });
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-[11px] flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Variant</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {editingProduct.variants.map((v, idx) => (
                    <div
                      key={v.id}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center gap-2"
                    >
                      <div className="w-20">
                        <label className="block text-[10px] text-slate-500">Size</label>
                        <input
                          type="text"
                          required
                          value={v.size}
                          onChange={(e) => {
                            const updated = [...editingProduct.variants];
                            updated[idx] = { ...v, size: e.target.value };
                            setEditingProduct({ ...editingProduct, variants: updated });
                          }}
                          placeholder="M, 32..."
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold"
                        />
                      </div>

                      <div className="w-28">
                        <label className="block text-[10px] text-slate-500">Colour</label>
                        <input
                          type="text"
                          required
                          value={v.color}
                          onChange={(e) => {
                            const updated = [...editingProduct.variants];
                            updated[idx] = { ...v, color: e.target.value };
                            setEditingProduct({ ...editingProduct, variants: updated });
                          }}
                          placeholder="White, Navy..."
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                        />
                      </div>

                      <div className="w-20">
                        <label className="block text-[10px] text-slate-500">
                          Stock ({editingProduct.unit})
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          required
                          value={v.stock}
                          onChange={(e) => {
                            const updated = [...editingProduct.variants];
                            updated[idx] = { ...v, stock: parseFloat(e.target.value) || 0 };
                            setEditingProduct({ ...editingProduct, variants: updated });
                          }}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold"
                        />
                      </div>

                      <div className="w-20">
                        <label className="block text-[10px] text-slate-500">Min Alert</label>
                        <input
                          type="number"
                          min={0}
                          value={v.lowStockAlert ?? 5}
                          onChange={(e) => {
                            const updated = [...editingProduct.variants];
                            updated[idx] = { ...v, lowStockAlert: parseInt(e.target.value) || 0 };
                            setEditingProduct({ ...editingProduct, variants: updated });
                          }}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono"
                        />
                      </div>

                      <div className="flex-1 min-w-[120px]">
                        <label className="block text-[10px] text-slate-500">Variant SKU (Optional)</label>
                        <input
                          type="text"
                          value={v.sku}
                          onChange={(e) => {
                            const updated = [...editingProduct.variants];
                            updated[idx] = { ...v, sku: e.target.value };
                            setEditingProduct({ ...editingProduct, variants: updated });
                          }}
                          placeholder="Auto-generated if empty"
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[11px] font-mono"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (editingProduct.variants.length <= 1) {
                            alert('Product must have at least one variant.');
                            return;
                          }
                          setEditingProduct({
                            ...editingProduct,
                            variants: editingProduct.variants.filter((_, i) => i !== idx),
                          });
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 self-end mb-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800"
                >
                  Save Garment Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: STOCK MOVEMENT AUDIT TRAIL */}
      {/* ========================================================================= */}
      {historyProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Stock Movement History</h3>
                <span className="text-xs text-slate-500">{historyProduct.name} ({historyProduct.sku})</span>
              </div>
              <button
                onClick={() => setHistoryProduct(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                    <th className="py-2 px-3">Date/Time</th>
                    <th className="py-2 px-3">Variant</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3 text-right">Change</th>
                    <th className="py-2 px-3 text-right">After</th>
                    <th className="py-2 px-3">Reason / Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {stockMovements
                    .filter((m) => m.productId === historyProduct.id)
                    .map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/70">
                        <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                          {m.timestamp.slice(0, 16).replace('T', ' ')}
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-900">
                          {m.size} / {m.color}
                        </td>
                        <td className="py-2 px-3 uppercase text-[10px]">
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            m.quantityDelta > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {m.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className={`py-2 px-3 text-right font-bold ${m.quantityDelta > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-900">{m.stockAfter}</td>
                        <td className="py-2 px-3 font-sans text-slate-600 text-[11px] truncate max-w-xs">
                          {m.reason}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setHistoryProduct(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

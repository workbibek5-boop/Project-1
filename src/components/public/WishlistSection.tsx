/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { clothingDb, ClothingProduct, ProductVariant } from '../../db/indexedDb';
import { StorefrontWishlistItem, SerialUserAccount } from '../../types';
import { formatNpr } from '../../i18n';
import {
  Heart,
  Trash2,
  ShoppingCart,
  Sparkles,
  ArrowRight,
  Layers,
  AlertCircle,
  PackageOpen,
  Check,
} from 'lucide-react';

interface WishlistSectionProps {
  currentUser: SerialUserAccount | null;
  onOpenAuth: () => void;
  onAddToCart: (product: ClothingProduct, variant: ProductVariant, quantity: number, notes?: string) => void;
  onExploreCatalogue: () => void;
}

export const WishlistSection: React.FC<WishlistSectionProps> = ({
  currentUser,
  onOpenAuth,
  onAddToCart,
  onExploreCatalogue,
}) => {
  const [wishlistItems, setWishlistItems] = useState<StorefrontWishlistItem[]>([]);
  const [productsMap, setProductsMap] = useState<Map<string, ClothingProduct>>(new Map());
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [selectedQtys, setSelectedQtys] = useState<Record<string, number>>({});
  const [addedItemNotice, setAddedItemNotice] = useState<string | null>(null);

  const loadWishlist = async () => {
    if (!currentUser) {
      setWishlistItems([]);
      return;
    }
    const items = await clothingDb.getWishlist(currentUser.userNumber);
    setWishlistItems(items);

    const allProds = await clothingDb.getAllProducts();
    const map = new Map<string, ClothingProduct>();
    allProds.forEach((p) => map.set(p.id, p));
    setProductsMap(map);
  };

  useEffect(() => {
    loadWishlist();
  }, [currentUser]);

  const handleRemove = async (id: string) => {
    await clothingDb.removeFromWishlist(id);
    setWishlistItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleMoveToCart = (item: StorefrontWishlistItem) => {
    const prod = productsMap.get(item.productId);
    if (!prod) return;

    const variantId = selectedVariants[item.id] || item.selectedVariantId || prod.variants[0]?.id;
    const variant = prod.variants.find((v) => v.id === variantId) || prod.variants[0];
    const qty = selectedQtys[item.id] || 1;

    if (variant) {
      onAddToCart(prod, variant, qty, item.notes);
      setAddedItemNotice(item.id);
      setTimeout(() => setAddedItemNotice(null), 1800);
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <Heart className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Your Private Wholesale Wishlist</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Log in with your issued User Number (e.g. C-10023) to view and manage your saved clothing designs, fabrics, and sample collections.
        </p>
        <div className="pt-2">
          <button
            onClick={onOpenAuth}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
          >
            Sign In with Serial Code
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 uppercase tracking-wider">
            <Heart className="w-4 h-4 fill-rose-600" />
            <span>Saved Collections & Sample Selections</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Wholesale Wishlist for User {currentUser.userNumber}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Private saved garments for <strong>{currentUser.businessName}</strong>. Wishlisting saves items without reserving stock.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-800 rounded-xl">
            {wishlistItems.length} {wishlistItems.length === 1 ? 'Design Saved' : 'Designs Saved'}
          </span>
          <button
            onClick={onExploreCatalogue}
            className="px-3.5 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 cursor-pointer"
          >
            + Browse Catalogue
          </button>
        </div>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-8 space-y-4">
          <PackageOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Your Wishlist is Empty</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Browse our garments, bridal lehengas, suits, or textile fabrics and click the heart icon on any design to save it here.
          </p>
          <div className="pt-2">
            <button
              onClick={onExploreCatalogue}
              className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 cursor-pointer"
            >
              Explore Clothing Collection &rarr;
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((item) => {
            const prod = productsMap.get(item.productId);
            const activeVariantId = selectedVariants[item.id] || item.selectedVariantId || prod?.variants[0]?.id;
            const currentVariant = prod?.variants.find((v) => v.id === activeVariantId) || prod?.variants[0];
            const qty = selectedQtys[item.id] || 1;

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Image banner */}
                  <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                    <img
                      src={item.imageUrl || prod?.imageUrl || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80'}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-xl shadow-xs transition-colors cursor-pointer"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="absolute top-3 left-3 px-2 py-0.5 bg-slate-900/85 text-white font-mono text-[11px] rounded font-bold">
                      {item.sku}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        {item.category}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 mt-1.5 leading-snug">
                        {item.productName}
                      </h3>
                      {item.fabric && (
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Fabric: <span className="font-semibold text-slate-700">{item.fabric}</span>
                        </p>
                      )}
                    </div>

                    {/* Variant Selector */}
                    {prod && prod.variants.length > 0 && (
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Choose Size & Color Variant:
                          </label>
                          <select
                            value={activeVariantId}
                            onChange={(e) =>
                              setSelectedVariants({ ...selectedVariants, [item.id]: e.target.value })
                            }
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 cursor-pointer"
                          >
                            {prod.variants.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.size} / {v.color} ({v.stock > 0 ? `${v.stock} in stock` : 'Out of stock'})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <label className="text-[11px] font-medium text-slate-600">Order Quantity ({prod.unit}):</label>
                          <input
                            type="number"
                            min={1}
                            value={qty}
                            onChange={(e) =>
                              setSelectedQtys({
                                ...selectedQtys,
                                [item.id]: Math.max(1, parseInt(e.target.value) || 1),
                              })
                            }
                            className="w-20 bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold text-center"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 pt-0">
                  <button
                    onClick={() => handleMoveToCart(item)}
                    className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    {addedItemNotice === item.id ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Added to Cart!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 text-amber-400" />
                        <span>Add Variant to Cart</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

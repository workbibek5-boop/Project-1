/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useWholesale } from '../../context/WholesaleContext';
import { formatNpr } from '../../i18n';
import { Package, Shield, Truck, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';

interface HeroAndFeaturesProps {
  onExploreCatalogue: () => void;
  onOpenRegister: () => void;
}

export const HeroAndFeatures: React.FC<HeroAndFeaturesProps> = ({
  onExploreCatalogue,
  onOpenRegister,
}) => {
  const { companySettings, t, products, currentCustomer } = useWholesale();

  return (
    <div className="space-y-16 py-6">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 text-white rounded-2xl mx-4 sm:mx-6 lg:mx-8">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-900/80 z-10" />
        
        {/* Subtle background image */}
        <div
          className="absolute inset-0 opacity-20 bg-cover bg-center"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80)',
          }}
        />

        <div className="relative z-20 max-w-5xl mx-auto px-6 py-16 sm:py-24 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-md mb-6">
            <span>B2B GARMENT & APPAREL WHOLESALE HUB</span>
            <span aria-hidden="true">·</span>
            <span>KATHMANDU, NEPAL</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white max-w-3xl leading-tight">
            Direct-from-Mill Wholesale Garments for Retailers Across Nepal
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
            Standardized wholesale packs, transparent GSM fabric specifications, and structured credit limits for registered clothing retailers in Kathmandu, Pokhara, Butwal, Biratnagar, and all 77 districts.
          </p>

          {/* Key Wholesale Specs Row */}
          <div className="mt-8 flex flex-wrap gap-4 text-xs font-medium text-slate-300">
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 px-3 py-2 rounded-lg">
              <Package className="w-4 h-4 text-amber-400" />
              <span>Standard Packs (10–12 pcs)</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 px-3 py-2 rounded-lg">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Tiered Limits (C: NPR 200k · B: 75k · F: 35k)</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 px-3 py-2 rounded-lg">
              <Truck className="w-4 h-4 text-sky-400" />
              <span>Inter-District Bilty Freight</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={onExploreCatalogue}
              className="px-6 py-3 text-sm font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <span>Browse Garment Catalogue</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {!currentCustomer && (
              <button
                onClick={onOpenRegister}
                className="px-6 py-3 text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
              >
                Register Retail Business
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Tiered Order Limits Explainer Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Configurable Category-Based Order Limits
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Every customer account is assigned a verified wholesale category based on PAN/VAT registration and trade history. Orders exceeding the maximum allowable threshold are securely rejected on the backend.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Category C */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Tier C Wholesale</span>
              <span className="text-xs text-slate-500">Established Wholesalers</span>
            </div>
            <div className="mt-4">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tabular-nums">
                {formatNpr(companySettings.categoryLimits.C)}
              </span>
              <span className="text-xs text-slate-500 block mt-1">Maximum Order Cap per Submission</span>
            </div>
            <ul className="mt-6 space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Verified VAT Registration & Business License</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Priority warehouse carton allocation</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Expedited cargo dispatch via partner bilty</span>
              </li>
            </ul>
          </div>

          {/* Category B */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">Tier B Wholesale</span>
              <span className="text-xs text-slate-500">Regional Retail Showrooms</span>
            </div>
            <div className="mt-4">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tabular-nums">
                {formatNpr(companySettings.categoryLimits.B)}
              </span>
              <span className="text-xs text-slate-500 block mt-1">Maximum Order Cap per Submission</span>
            </div>
            <ul className="mt-6 space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>PAN or Municipal Trade Registration required</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Bulk carton wholesale unit pricing</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Standard verification within 1–2 business hours</span>
              </li>
            </ul>
          </div>

          {/* Category F */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tier F Wholesale</span>
              <span className="text-xs text-slate-500">Trial & New Outlets</span>
            </div>
            <div className="mt-4">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tabular-nums">
                {formatNpr(companySettings.categoryLimits.F)}
              </span>
              <span className="text-xs text-slate-500 block mt-1">Maximum Order Cap per Submission</span>
            </div>
            <ul className="mt-6 space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Default onboarding category for new accounts</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Full access to active catalogue stock</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Upgradable by staff review after prompt payments</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Featured Bulk Apparel Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Featured Wholesale Garments
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Assorted size packs ready for dispatch from Kathmandu central warehouse.
            </p>
          </div>
          <button
            onClick={onExploreCatalogue}
            className="text-xs font-semibold text-slate-900 hover:text-amber-600 flex items-center gap-1 transition-colors self-start sm:self-auto"
          >
            <span>View All {products.length} Garment Lines</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.slice(0, 3).map((prod) => (
            <div
              key={prod.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between"
            >
              <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                <img
                  src={prod.images[0]}
                  alt={prod.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-[11px] font-mono px-2 py-0.5 rounded">
                  {prod.sku}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-xs text-slate-500 font-medium">{prod.category}</div>
                  <h3 className="mt-1 text-base font-semibold text-slate-900 leading-snug line-clamp-1">
                    {prod.name}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {prod.description}
                  </p>
                  
                  <div className="mt-3 text-xs text-slate-500 space-y-1">
                    <div>Fabric: <span className="text-slate-800 font-medium">{prod.fabricComposition}</span></div>
                    <div>Sizes: <span className="text-slate-800 font-medium">{prod.sizeRun}</span></div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 block">Wholesale Price (Pack)</span>
                    <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                      {formatNpr(prod.wholesalePriceNpr)}
                    </span>
                  </div>
                  <div className="text-right text-xs text-slate-500 font-mono">
                    Stock: <strong className="text-emerald-700">{prod.availableStock} packs</strong>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Transparent Payment & Reconciliation Workflow Notice */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Payment Verification & Security Policy
              </h3>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                As per wholesale trade regulations, company payment QR codes and bank account credentials are provided for invoice settlement. Uploading a proof or transaction reference does <strong>not</strong> automatically mark an order as paid. Every transaction undergoes human reconciliation by our Accounts Department before release of goods and cargo bilty.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

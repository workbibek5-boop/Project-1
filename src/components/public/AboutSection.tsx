/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useWholesale } from '../../context/WholesaleContext';
import { Building2, ShieldCheck, MapPin, Truck } from 'lucide-react';

export const AboutSection: React.FC = () => {
  const { companySettings } = useWholesale();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Company Overview & Compliance
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mt-1">
          About Himalayan Garment Distribution
        </h1>
        <p className="mt-2 text-base text-slate-600 leading-relaxed">
          Operating from Kathmandu's garment trading district, we supply verified wholesale apparel to regional showrooms, boutiques, and multi-brand department stores across Nepal.
        </p>
      </div>

      {/* Operational Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900 mb-4">
            <Building2 className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Direct Mill Sourcing</h3>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            We partner directly with spinning and weaving mills in Biratnagar, Bhairahawa, and verified regional textile exporters to supply consistent GSM quality, pre-shrunk fabrics, and industrial color fastness.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900 mb-4">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">IRD Tax & Legal Compliance</h3>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Registered with the Inland Revenue Department (IRD), Nepal. Official VAT Tax Invoices are issued with every bulk dispatch, ensuring retail partners maintain clean bookkeeping and tax compliance.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900 mb-4">
            <MapPin className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Central Kathmandu Warehouse</h3>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Our 12,000 sq. ft. central stocking facility in New Road allows same-day cargo dispatch for orders received before 2:00 PM, servicing transport counters along Ring Road and Kalanki.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900 mb-4">
            <Truck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Reliable Inter-District Bilty Freight</h3>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Formal logistics arrangements with Sundar Yatayat, City Cargo, and Narayani Freight ensure insured, tamper-sealed delivery to Pokhara, Narayangarh, Butwal, Dang, and Biratnagar.
          </p>
        </div>
      </div>

      {/* Business Details Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Official Registered Entity Information</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <dt className="text-slate-500">Legal Business Name:</dt>
            <dd className="font-semibold text-slate-900 mt-0.5">{companySettings.legalEntityName}</dd>
          </div>
          <div>
            <dt className="text-slate-500">PAN / VAT Registration Number:</dt>
            <dd className="font-mono font-semibold text-slate-900 mt-0.5">{companySettings.panVatNumber}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Registered Office:</dt>
            <dd className="font-semibold text-slate-900 mt-0.5">{companySettings.registeredAddress}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Official Contact Desk:</dt>
            <dd className="font-semibold text-slate-900 mt-0.5">{companySettings.primaryPhone} · {companySettings.supportEmail}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

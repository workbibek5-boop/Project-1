/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useWholesale } from '../../context/WholesaleContext';
import { Phone, Mail, MapPin, Send, CheckCircle2 } from 'lucide-react';

export const ContactSection: React.FC = () => {
  const { companySettings } = useWholesale();
  const [formData, setFormData] = useState({
    businessName: '',
    contactPerson: '',
    phone: '',
    city: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Wholesale Inquiries & Dispatch Desk
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mt-1">
          Contact Our Wholesale Distribution Office
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Reach our Kathmandu sales and logistics desk for bulk carton inquiries, inter-district freight coordination, or new retailer onboarding.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Coordinates */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Registered Office & Logistics Hub
            </h2>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-slate-900">Address</div>
                <div className="text-xs text-slate-600 mt-0.5">{companySettings.registeredAddress}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-slate-900">Phone & Dispatch Desk</div>
                <div className="text-xs text-slate-600 mt-0.5">{companySettings.primaryPhone} (10:00 AM – 6:00 PM, Sun–Fri)</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-slate-900">Email & Invoicing</div>
                <div className="text-xs text-slate-600 mt-0.5">{companySettings.supportEmail}</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs text-slate-600 leading-relaxed">
            <h3 className="font-bold text-slate-900 mb-1">Inter-District Transport Terminals</h3>
            <p>
              Cartons for Pokhara, Butwal, and Western Nepal depart daily via Sundar Yatayat from Kalanki cargo terminal. Eastern sector dispatches route through Koteshwor / Balkumari transport counters.
            </p>
          </div>
        </div>

        {/* Trade Inquiry Form */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
          <h2 className="text-base font-bold text-slate-900 mb-1">Send a Trade Inquiry</h2>
          <p className="text-xs text-slate-500 mb-6">Our sales representative will get back within 1 business day.</p>

          {submitted ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">Inquiry Received</h3>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                Thank you. Our sales team has logged your wholesale inquiry and will contact your business directly.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ businessName: '', contactPerson: '', phone: '', city: '', message: '' });
                }}
                className="mt-4 text-xs font-semibold text-slate-900 underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Business / Store Name *</label>
                <input
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="e.g. Pokhara Readymade Garments"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="Full Name"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Mobile / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+977-98XXXXXXXX"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">City / District *</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. Butwal / Pokhara / Narayangarh"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Inquiry Details *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Specify garments of interest, expected monthly volume, or delivery requirements..."
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Trade Inquiry</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useClothingWholesale } from '../../context/ClothingWholesaleContext';
import { AppSettings } from '../../db/indexedDb';
import { Settings, Lock, Check, ShieldCheck, Printer } from 'lucide-react';

interface OwnerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OwnerSettingsModal: React.FC<OwnerSettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, setOwnerPin, removeOwnerPin } = useClothingWholesale();

  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [pinInput, setPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinMsg, setPinMsg] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinMsg(null);

    if (pinInput.length < 4) {
      setPinMsg('PIN must be at least 4 digits.');
      return;
    }

    if (pinInput !== confirmPinInput) {
      setPinMsg('PIN confirmation does not match.');
      return;
    }

    await setOwnerPin(pinInput);
    setPinInput('');
    setConfirmPinInput('');
    setPinMsg('Owner PIN lock enabled successfully!');
  };

  const handleRemovePin = async () => {
    if (confirm('Disable owner PIN lock?')) {
      await removeOwnerPin();
      setPinMsg('PIN lock disabled.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-800" />
            <h3 className="text-base font-bold text-slate-900">Wholesale Business & App Settings</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 font-bold text-lg">
            &times;
          </button>
        </div>

        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>Settings saved successfully to local IndexedDB!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Business Identity */}
          <div className="space-y-3">
            <span className="font-bold text-slate-900 uppercase text-[11px] block border-b border-slate-100 pb-1">
              Business Identity (Appears on Invoices & Receipts)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company Display Name *</label>
                <input
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trading Name</label>
                <input
                  type="text"
                  value={formData.tradingName}
                  onChange={(e) => setFormData({ ...formData, tradingName: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">PAN / VAT Registration No. *</label>
                <input
                  type="text"
                  required
                  value={formData.panVatNumber}
                  onChange={(e) => setFormData({ ...formData, panVatNumber: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone *</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Store / Warehouse Address *</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg p-2"
              />
            </div>
          </div>

          {/* Billing & Receipts Configuration */}
          <div className="space-y-3 pt-2">
            <span className="font-bold text-slate-900 uppercase text-[11px] block border-b border-slate-100 pb-1">
              Billing, Currency & Invoice Settings
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Default Currency Code</label>
                <input
                  type="text"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  placeholder="NPR"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Currency Symbol</label>
                <input
                  type="text"
                  value={formData.currencySymbol}
                  onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                  placeholder="रू"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Invoice Prefix</label>
                <input
                  type="text"
                  value={formData.invoicePrefix}
                  onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                  placeholder="INV-2026-"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <input
                  type="checkbox"
                  id="taxEnabledCheck"
                  checked={formData.taxEnabled}
                  onChange={(e) => setFormData({ ...formData, taxEnabled: e.target.checked })}
                  className="w-4 h-4 rounded text-slate-900 cursor-pointer"
                />
                <label htmlFor="taxEnabledCheck" className="cursor-pointer">
                  <span className="font-bold text-slate-900 block">Enable VAT on Cash Bills</span>
                  <span className="text-[10px] text-slate-500">Default rate: {formData.defaultVatPercent}%</span>
                </label>
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <input
                  type="checkbox"
                  id="allowNegativeStockCheck"
                  checked={formData.allowNegativeStock}
                  onChange={(e) => setFormData({ ...formData, allowNegativeStock: e.target.checked })}
                  className="w-4 h-4 rounded text-slate-900 cursor-pointer"
                />
                <label htmlFor="allowNegativeStockCheck" className="cursor-pointer">
                  <span className="font-bold text-slate-900 block">Allow Negative Stock</span>
                  <span className="text-[10px] text-slate-500">Override stock barrier during rush sales</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Low-Stock Alert Level (Pieces)</label>
                <input
                  type="number"
                  min={1}
                  value={formData.defaultLowStockThreshold}
                  onChange={(e) => setFormData({ ...formData, defaultLowStockThreshold: parseInt(e.target.value) || 10 })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Thermal Receipt Width</label>
                <select
                  value={formData.thermalPrinterWidth}
                  onChange={(e) => setFormData({ ...formData, thermalPrinterWidth: e.target.value as any })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 cursor-pointer font-bold"
                >
                  <option value="80mm">Standard 80mm POS Thermal Paper</option>
                  <option value="58mm">Compact 58mm POS Thermal Paper</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Receipt Footer Note</label>
              <input
                type="text"
                value={formData.invoiceFooterNote}
                onChange={(e) => setFormData({ ...formData, invoiceFooterNote: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg p-2"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-200">
            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800"
            >
              Save Configuration
            </button>
          </div>
        </form>

        {/* Optional Owner PIN Lock Section */}
        <div className="pt-4 border-t border-slate-200 space-y-3 text-xs">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-800" />
            <span className="font-bold text-slate-900">Optional Local App PIN Lock</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Lock POS terminal with an offline 4-digit PIN using SHA-256 Web Crypto hashing. No passwords sent over internet.
          </p>

          {pinMsg && (
            <div className="p-2.5 bg-slate-100 rounded text-slate-800 font-medium">
              {pinMsg}
            </div>
          )}

          {settings.ownerPinHash ? (
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Owner PIN is active.</span>
              </span>
              <button
                type="button"
                onClick={handleRemovePin}
                className="text-rose-600 hover:text-rose-800 font-semibold underline text-xs"
              >
                Disable PIN Lock
              </button>
            </div>
          ) : (
            <form onSubmit={handleUpdatePin} className="flex flex-wrap items-end gap-2">
              <div>
                <label className="block text-[10px] text-slate-600 mb-1">4-Digit PIN</label>
                <input
                  type="password"
                  maxLength={8}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="••••"
                  className="bg-white border border-slate-300 rounded p-1.5 text-center font-mono font-bold w-24"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-600 mb-1">Confirm PIN</label>
                <input
                  type="password"
                  maxLength={8}
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value)}
                  placeholder="••••"
                  className="bg-white border border-slate-300 rounded p-1.5 text-center font-mono font-bold w-24"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-900 text-white rounded font-bold hover:bg-slate-800"
              >
                Set PIN
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

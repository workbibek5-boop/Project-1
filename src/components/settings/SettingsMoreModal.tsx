/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useClothingWholesale } from '../../context/ClothingWholesaleContext';
import { AppSettings } from '../../db/indexedDb';
import { BackupRestoreManager } from '../backup/BackupRestoreManager';
import { BillingWorkstationsManager } from '../admin/BillingWorkstationsManager';
import { OfflineTestSuite } from '../tests/OfflineTestSuite';
import { formatNpr } from '../../i18n';
import {
  Settings,
  Lock,
  Check,
  ShieldCheck,
  Printer,
  HardDriveDownload,
  MonitorCheck,
  CheckCircle,
  KeyRound,
  Building,
  Sliders,
  X,
  AlertCircle,
} from 'lucide-react';

interface SettingsMoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'business' | 'cbf' | 'backup' | 'workstations' | 'tests' | 'security';
}

export const SettingsMoreModal: React.FC<SettingsMoreModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'business',
}) => {
  const {
    settings,
    updateSettings,
    updateCbfAmounts,
    setOwnerPin,
    removeOwnerPin,
  } = useClothingWholesale();

  const [activeTab, setActiveTab] = useState<
    'business' | 'cbf' | 'backup' | 'workstations' | 'tests' | 'security'
  >(initialTab);

  // Business settings form state
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // C/B/F amounts form state
  const [cbfInputs, setCbfInputs] = useState({
    C: settings.cbfAmounts?.C !== undefined && settings.cbfAmounts?.C !== null ? String(settings.cbfAmounts.C) : '200000',
    B: settings.cbfAmounts?.B !== undefined && settings.cbfAmounts?.B !== null ? String(settings.cbfAmounts.B) : '75000',
    F: settings.cbfAmounts?.F !== undefined && settings.cbfAmounts?.F !== null ? String(settings.cbfAmounts.F) : '35000',
  });
  const [cbfMsg, setCbfMsg] = useState<string | null>(null);

  // PIN security form state
  const [pinInput, setPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinMsg, setPinMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveBusinessSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 1500);
  };

  const handleSaveCbf = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const numC = cbfInputs.C.trim() === '' ? null : Number(cbfInputs.C);
      const numB = cbfInputs.B.trim() === '' ? null : Number(cbfInputs.B);
      const numF = cbfInputs.F.trim() === '' ? null : Number(cbfInputs.F);

      await updateCbfAmounts({
        C: numC !== null && !isNaN(numC) ? numC : null,
        B: numB !== null && !isNaN(numB) ? numB : null,
        F: numF !== null && !isNaN(numF) ? numF : null,
      });

      setCbfMsg('C/B/F amounts saved successfully!');
      setTimeout(() => setCbfMsg(null), 1500);
    } catch (err: any) {
      setCbfMsg(err?.message || 'Failed to update amounts');
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Application Settings & Secondary Operations
              </h3>
              <p className="text-[11px] text-slate-500">
                Preferences, C/B/F limits, offline backups, workstations and integrity tests
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1 cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-4 sm:px-5 gap-2 text-xs font-bold overflow-x-auto">
          {[
            { id: 'business', label: 'Business Profile', icon: Building },
            { id: 'cbf', label: 'C/B/F Configuration', icon: Sliders },
            { id: 'backup', label: 'Backup & Restore', icon: HardDriveDownload },
            { id: 'workstations', label: 'Workstations / Sync', icon: MonitorCheck },
            { id: 'tests', label: 'System Integrity Tests', icon: CheckCircle },
            { id: 'security', label: 'PIN Security', icon: Lock },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-2 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* TAB 1: BUSINESS PROFILE */}
          {activeTab === 'business' && (
            <form onSubmit={handleSaveBusinessSettings} className="space-y-4 max-w-2xl">
              {saveSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Business settings saved successfully!</span>
                </div>
              )}

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
                  <label className="block font-semibold text-slate-700 mb-1">Trading Name (Sub-Header)</label>
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
                  <label className="block font-semibold text-slate-700 mb-1">PAN / VAT Number</label>
                  <input
                    type="text"
                    value={formData.panVatNumber}
                    onChange={(e) => setFormData({ ...formData, panVatNumber: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Default Low-Stock Alert (pcs)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.defaultLowStockThreshold}
                    onChange={(e) =>
                      setFormData({ ...formData, defaultLowStockThreshold: Number(e.target.value) })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address & Garment Hub Location</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Thermal Receipt Width</label>
                <select
                  value={formData.thermalPrinterWidth}
                  onChange={(e) => setFormData({ ...formData, thermalPrinterWidth: e.target.value as any })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2"
                >
                  <option value="80mm">80mm (Standard POS Thermal Roll)</option>
                  <option value="58mm">58mm (Compact Mobile Thermal)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Invoice Footer Note</label>
                <textarea
                  rows={2}
                  value={formData.invoiceFooterNote}
                  onChange={(e) => setFormData({ ...formData, invoiceFooterNote: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer shadow-xs"
              >
                Save Business Profile
              </button>
            </form>
          )}

          {/* TAB 2: C/B/F CONFIGURATION */}
          {activeTab === 'cbf' && (
            <form onSubmit={handleSaveCbf} className="space-y-4 max-w-xl">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900">
                <strong>Confidential Limits:</strong> Configure C, B, and F credit & order allocation amounts. If an amount is removed or left empty, the system properly falls back to displaying "Not Configured" rather than 0.
              </div>

              {cbfMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{cbfMsg}</span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-amber-900 mb-1">Category C Limit (NPR)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Leave blank for Not Configured"
                    value={cbfInputs.C}
                    onChange={(e) => setCbfInputs({ ...cbfInputs, C: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-blue-900 mb-1">Category B Limit (NPR)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Leave blank for Not Configured"
                    value={cbfInputs.B}
                    onChange={(e) => setCbfInputs({ ...cbfInputs, B: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-emerald-900 mb-1">Category F Limit (NPR)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Leave blank for Not Configured"
                    value={cbfInputs.F}
                    onChange={(e) => setCbfInputs({ ...cbfInputs, F: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer shadow-xs"
              >
                Save C/B/F Configuration
              </button>
            </form>
          )}

          {/* TAB 3: BACKUP & RESTORE */}
          {activeTab === 'backup' && <BackupRestoreManager />}

          {/* TAB 4: WORKSTATIONS */}
          {activeTab === 'workstations' && <BillingWorkstationsManager />}

          {/* TAB 5: TESTS */}
          {activeTab === 'tests' && <OfflineTestSuite />}

          {/* TAB 6: SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-4 max-w-md">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700">
                Set a 4+ digit owner PIN to lock this terminal during staff shift changes or unattended moments.
              </div>

              {pinMsg && (
                <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{pinMsg}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePin} className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">New Terminal PIN (4+ digits)</label>
                  <input
                    type="password"
                    maxLength={8}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-mono text-base"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Confirm PIN</label>
                  <input
                    type="password"
                    maxLength={8}
                    value={confirmPinInput}
                    onChange={(e) => setConfirmPinInput(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-mono text-base"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer"
                  >
                    Save PIN
                  </button>
                  {settings.ownerPinHash && (
                    <button
                      type="button"
                      onClick={handleRemovePin}
                      className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded-xl border border-rose-200 cursor-pointer"
                    >
                      Disable PIN
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs cursor-pointer"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
};

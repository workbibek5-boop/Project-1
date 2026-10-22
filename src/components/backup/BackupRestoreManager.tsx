/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useClothingWholesale } from '../../context/ClothingWholesaleContext';
import {
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  HardDrive,
  ShieldAlert,
  Calendar,
} from 'lucide-react';

export const BackupRestoreManager: React.FC = () => {
  const {
    settings,
    exportJsonBackup,
    restoreJsonBackup,
    exportProductsCsv,
    exportInventoryCsv,
    exportSalesCsv,
  } = useClothingWholesale();

  const [restoreStatus, setRestoreStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isConfirmingRestore, setIsConfirmingRestore] = useState(false);
  const [pendingBackupContent, setPendingBackupContent] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        const parsed = JSON.parse(content);
        if (!parsed.products || !parsed.sales) {
          setRestoreStatus({
            success: false,
            message: 'Validation Error: File does not contain valid Clothing Wholesale backup collections.',
          });
          return;
        }

        setPendingBackupContent(content);
        setIsConfirmingRestore(true);
        setRestoreStatus(null);
      } catch (err: any) {
        setRestoreStatus({
          success: false,
          message: 'Syntax Error: File is not a valid JSON document.',
        });
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
  };

  const handleExecuteRestore = async () => {
    if (!pendingBackupContent) return;

    const res = await restoreJsonBackup(pendingBackupContent);
    setIsConfirmingRestore(false);
    setPendingBackupContent(null);

    if (res.success) {
      setRestoreStatus({
        success: true,
        message: 'Database successfully restored from backup file!',
      });
    } else {
      setRestoreStatus({
        success: false,
        message: `Restore Failed: ${res.error}`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <span>Data Durability & Disaster Recovery</span>
          <span aria-hidden="true">·</span>
          <span>Offline Independent Storage</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
          Backup, Restore & Data Portability
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Safeguard your wholesale business records. Export full versioned JSON backups or spreadsheets.
        </p>
      </div>

      {/* Critical Storage Warning Box */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="block font-bold">Important Browser Storage Advisory:</strong>
          <p className="leading-relaxed text-amber-800">
            This application operates 100% locally using your browser's IndexedDB engine. While persistent, 
            <strong> browser storage can be cleared</strong> if you manually wipe browser cache, reset your device, or if your operating system performs emergency disk cleanup.
            Always download regular JSON backups and save them to a secure external USB drive or computer.
          </p>
          {settings.lastBackupDate && (
            <div className="pt-1 font-mono text-[11px] text-amber-900 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Last successful backup created: <strong>{settings.lastBackupDate.slice(0, 16).replace('T', ' ')}</strong></span>
            </div>
          )}
        </div>
      </div>

      {restoreStatus && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
            restoreStatus.success
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {restoreStatus.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-semibold">{restoreStatus.message}</span>
        </div>
      )}

      {/* Main Operations: JSON Backup & Restore Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full JSON Backup Export */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900">
              <Download className="w-5 h-5 text-slate-800" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Export JSON Database</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Full snapshot of all products, variants, stock quantities, cash sales invoices, mill purchases, and audit movement logs.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={exportJsonBackup}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Download JSON Data (.json)</span>
            </button>
          </div>
        </div>

        {/* Restore from JSON File */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900">
              <Upload className="w-5 h-5 text-slate-800" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Restore from JSON File</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Upload a previously downloaded JSON backup file to restore all clothing inventory and sales records. Validates data structure before replacement.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-900 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-slate-700" />
              <span>Select File to Restore</span>
            </button>
          </div>
        </div>
      </div>

      {/* CSV Exports Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-900">Spreadsheet CSV Exports</h3>
          <p className="text-xs text-slate-500 mt-1">
            Export data into standard comma-separated values (CSV) for opening in Excel or Google Sheets.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <button
            onClick={exportProductsCsv}
            className="p-3.5 bg-slate-50 border border-slate-200 hover:border-slate-400 rounded-xl text-left transition-colors text-xs space-y-1"
          >
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Products & Prices</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Complete catalog with wholesale selling and purchase cost prices.
            </p>
          </button>

          <button
            onClick={exportInventoryCsv}
            className="p-3.5 bg-slate-50 border border-slate-200 hover:border-slate-400 rounded-xl text-left transition-colors text-xs space-y-1"
          >
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <FileSpreadsheet className="w-4 h-4 text-sky-600" />
              <span>Inventory by Size & Color</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Detailed stock quantities, variant SKUs, and stock valuations.
            </p>
          </button>

          <button
            onClick={exportSalesCsv}
            className="p-3.5 bg-slate-50 border border-slate-200 hover:border-slate-400 rounded-xl text-left transition-colors text-xs space-y-1"
          >
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <FileSpreadsheet className="w-4 h-4 text-amber-600" />
              <span>Cash Sales Ledger</span>
            </div>
            <p className="text-[11px] text-slate-500">
              All cash invoices with subtotal, VAT, cash received, and change returned.
            </p>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Restore */}
      {isConfirmingRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>Confirm Database Restore</span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              <strong>Warning:</strong> Restoring this backup will replace current local database records with the contents of the uploaded backup file.
            </p>

            <p className="text-xs text-slate-500 leading-relaxed">
              Any unsaved sales or stock changes made on this device that are not in the backup will be overwritten.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setIsConfirmingRestore(false);
                  setPendingBackupContent(null);
                }}
                className="px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteRestore}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
              >
                Yes, Overwrite & Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

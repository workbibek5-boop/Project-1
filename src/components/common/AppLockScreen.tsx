/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useClothingWholesale } from '../../context/ClothingWholesaleContext';
import { Lock, Unlock, AlertCircle } from 'lucide-react';

export const AppLockScreen: React.FC = () => {
  const { settings, unlockWithPin } = useClothingWholesale();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await unlockWithPin(pin);
    if (!success) {
      setError(true);
      setPin('');
    } else {
      setError(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center space-y-6">
        <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>

        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">{settings.businessName}</h1>
          <p className="text-xs text-slate-400 mt-1">
            Terminal locked. Enter your owner PIN to access wholesale POS.
          </p>
        </div>

        {error && (
          <div className="p-2.5 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center justify-center gap-1.5 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Incorrect PIN. Please try again.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            maxLength={8}
            autoFocus
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError(false);
            }}
            placeholder="••••"
            className="w-full bg-slate-950 border border-slate-700 text-center text-2xl font-mono tracking-widest text-white rounded-xl py-3 focus:outline-none focus:border-amber-400"
          />

          <button
            type="submit"
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-md"
          >
            <Unlock className="w-4 h-4" />
            <span>Unlock Wholesale Terminal</span>
          </button>
        </form>

        <p className="text-[10px] text-slate-500 font-mono">
          Offline secure encryption · SHA-256 Web Crypto
        </p>
      </div>
    </div>
  );
};

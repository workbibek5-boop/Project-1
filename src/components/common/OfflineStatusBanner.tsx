/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Wifi, WifiOff, Download, HelpCircle, HardDrive } from 'lucide-react';

export const OfflineStatusBanner: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  return (
    <>
      <div className="bg-slate-900 border-b border-slate-800 text-xs py-1.5 px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 text-slate-300">
        {/* Left: Offline-first IndexedDB status */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-semibold">
            {isOnline ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <Wifi className="w-3.5 h-3.5" />
                <span>Online</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400 bg-amber-950/70 border border-amber-500/40 px-2 py-0.5 rounded">
                <WifiOff className="w-3.5 h-3.5" />
                <span className="font-bold">Offline Mode Active</span>
              </span>
            )}
          </span>

          <span aria-hidden="true" className="text-slate-700">·</span>

          <span className="flex items-center gap-1 text-slate-400">
            <HardDrive className="w-3.5 h-3.5 text-sky-400" />
            <span>Local IndexedDB Database (100% Offline Capable)</span>
          </span>
        </div>

        {/* Right: In-App PWA Install prompt */}
        <div className="flex items-center gap-3">
          {isInstallable && !isInstalled && (
            <button
              onClick={install}
              className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-2.5 py-0.5 rounded flex items-center gap-1 transition-colors text-[11px] shadow-xs"
            >
              <Download className="w-3 h-3" />
              <span>Install Desktop/Mobile App</span>
            </button>
          )}

          {isIOS && !isInstalled && (
            <button
              onClick={() => setShowIOSGuide(true)}
              className="text-amber-400 hover:text-amber-300 underline flex items-center gap-1 text-[11px]"
            >
              <HelpCircle className="w-3 h-3" />
              <span>Install on iPhone/iPad</span>
            </button>
          )}

          {isInstalled && (
            <span className="text-emerald-400 font-mono text-[11px]">
              Installed PWA
            </span>
          )}
        </div>
      </div>

      {/* iOS Safari Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-xl max-w-sm w-full p-5 space-y-4">
            <h3 className="text-sm font-bold text-amber-400">Install on iPhone / iPad</h3>
            <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
              <li>Open this page in <strong>Safari</strong>.</li>
              <li>Tap the <strong>Share</strong> icon (box with upward arrow at bottom).</li>
              <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
              <li>Open from your home screen for full offline fullscreen access.</li>
            </ol>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

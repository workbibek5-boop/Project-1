/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useWholesale } from '../../context/WholesaleContext';
import { TrendingUp, Sparkles, Clock } from 'lucide-react';

export const FuturePlansSection: React.FC = () => {
  const { companySettings } = useWholesale();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Strategic Roadmap & Factory Expansions
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mt-1">
          Upcoming Business Plans & Offers
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Transparent preview of planned garment production runs, manufacturing alliances, and technological upgrades for our wholesale distributor network.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {companySettings.upcomingPlans.map((plan) => (
          <div
            key={plan.id}
            className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                <span className="font-semibold text-slate-900 bg-slate-100 px-2.5 py-1 rounded">
                  {plan.season}
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Target: {plan.expectedDate}
                </span>
              </div>

              <h2 className="text-lg font-bold text-slate-900 mt-2">
                {plan.title}
              </h2>

              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                {plan.description}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Advance allocation open for Tier C & B partners</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

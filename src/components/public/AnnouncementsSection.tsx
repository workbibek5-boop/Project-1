/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useWholesale } from '../../context/WholesaleContext';
import { Bell, Calendar, Tag } from 'lucide-react';

export const AnnouncementsSection: React.FC = () => {
  const { companySettings } = useWholesale();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Company Notices & Operational Updates
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mt-1">
          Wholesale News & Announcements
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Official supply notifications, holiday cargo dispatch timetables, and seasonal fabric arrivals.
        </p>
      </div>

      <div className="space-y-4">
        {companySettings.announcements.map((ann) => (
          <article
            key={ann.id}
            className={`bg-white border rounded-xl p-6 transition-colors ${
              ann.isImportant ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-2">
                {ann.isImportant && (
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                    Important Notice
                  </span>
                )}
                <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {ann.date}
                </span>
              </div>
              <div className="text-xs text-slate-400">Kathmandu Operations</div>
            </div>

            <h2 className="text-lg font-bold text-slate-900">
              {ann.title}
            </h2>

            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              {ann.content}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useClothingWholesale } from '../../context/ClothingWholesaleContext';
import {
  LayoutDashboard,
  Users,
  Boxes,
  CreditCard,
  TrendingUp,
  Settings,
  Globe,
  ChevronLeft,
  ChevronRight,
  X,
  Sliders,
} from 'lucide-react';

interface AppSidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenSettings: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface PrimaryNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | undefined;
  badgeAlert?: boolean;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenSettings,
  isMobileOpen,
  onCloseMobile,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
}) => {
  const { settings, metrics, isOnline } = useClothingWholesale();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const handleToggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed(!internalCollapsed);
    }
  };

  // STRICT REQUIREMENT: Only five primary navigation sections
  const primaryNavItems: PrimaryNavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: Users,
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Boxes,
      badge: metrics.lowStockCount > 0 ? `${metrics.lowStockCount} low` : undefined,
      badgeAlert: true,
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: CreditCard,
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: TrendingUp,
    },
  ];

  const handleItemClick = (id: string) => {
    onSelectTab(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-all duration-200 select-none ${
          isMobileOpen
            ? 'translate-x-0 w-64'
            : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-18' : 'md:w-60'}`}
      >
        {/* Brand & Wordmark */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 shrink-0">
          <div
            onClick={() => handleItemClick('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer overflow-hidden"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-base shrink-0 shadow-sm">
              W
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <span className="font-bold text-sm tracking-tight text-white block truncate leading-tight">
                  {settings.businessName}
                </span>
                <span className="text-[10px] text-slate-400 block truncate font-mono">
                  Wholesale ERP · v4
                </span>
              </div>
            )}
          </div>

          {/* Close button on mobile */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg md:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5 Primary Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-1.5 text-xs font-semibold scrollbar-thin">
          {!isCollapsed && (
            <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Main Operations
            </div>
          )}

          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors relative group cursor-pointer text-left ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-2xs'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {!isCollapsed && <span className="truncate flex-1 text-[13px]">{item.label}</span>}

                {!isCollapsed && item.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                      isActive
                        ? 'bg-slate-950 text-amber-400'
                        : item.badgeAlert
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Utility Bar: Settings / More & Storefront Portal */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 space-y-2 shrink-0">
          {/* Storefront View Link */}
          <button
            onClick={() => handleItemClick('public_storefront')}
            className={`w-full py-2 px-2.5 rounded-xl transition-colors flex items-center gap-2.5 text-xs font-semibold cursor-pointer ${
              activeTab === 'public_storefront'
                ? 'bg-slate-800 text-amber-300 border border-amber-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            } ${isCollapsed ? 'justify-center' : ''}`}
            title="Open Customer Storefront Portal"
          >
            <Globe className="w-4 h-4 text-amber-400 shrink-0" />
            {!isCollapsed && <span className="truncate">Storefront Portal</span>}
          </button>

          {/* Settings / More Trigger */}
          <button
            onClick={() => {
              onOpenSettings();
              onCloseMobile();
            }}
            className={`w-full py-2 px-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2.5 text-xs font-semibold cursor-pointer ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title="Settings / More (Backup, Workstations, Tests, PIN)"
          >
            <Sliders className="w-4 h-4 text-slate-400 shrink-0" />
            {!isCollapsed && <span className="truncate">Settings / More</span>}
          </button>

          {/* Desktop Collapse / Expand Toggle */}
          <div className="hidden md:flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px] text-slate-400">
            {!isCollapsed && (
              <span className="font-mono text-[10px]">
                {isOnline ? '🟢 Ready' : '🟠 Offline'}
              </span>
            )}
            <button
              onClick={handleToggleCollapse}
              className="p-1 hover:text-white rounded hover:bg-slate-800 transition-colors ml-auto cursor-pointer"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label="Toggle sidebar collapse"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

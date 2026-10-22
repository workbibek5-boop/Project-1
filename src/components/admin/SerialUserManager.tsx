/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { clothingDb, hashPassword, generateUserNumber } from '../../db/indexedDb';
import { SerialUserAccount, CustomerCategory } from '../../types';
import { useDebounce } from '../../hooks/useDebounce';
import {
  KeyRound,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Building,
  User,
  Phone,
  Mail,
  Copy,
  Check,
  Lock,
  Layers,
} from 'lucide-react';

export const SerialUserManager: React.FC = () => {
  const [users, setUsers] = useState<SerialUserAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 160);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'All' | CustomerCategory>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');

  // Modal: Generate / Create Serial User
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createCategory, setCreateCategory] = useState<CustomerCategory>('C');
  const [createCustomerName, setCreateCustomerName] = useState('');
  const [createBusinessName, setCreateBusinessName] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createCustomCode, setCreateCustomCode] = useState('');
  const [createInitialPassword, setCreateInitialPassword] = useState('Wholesale2026!');
  const [createRequireActivation, setCreateRequireActivation] = useState(false);

  // Modal: Reset Password
  const [resetTargetUser, setResetTargetUser] = useState<SerialUserAccount | null>(null);
  const [newAdminPassword, setNewAdminPassword] = useState('Wholesale2026!');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadUsers = async () => {
    const list = await clothingDb.getAllSerialUsers();
    setUsers(list);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return users.filter((u) => {
      if (selectedCategoryFilter !== 'All' && u.category !== selectedCategoryFilter) return false;
      if (selectedStatusFilter !== 'All' && u.status !== selectedStatusFilter) return false;
      if (q) {
        const matchNumber = u.userNumber.toLowerCase().includes(q);
        const matchName = u.customerName.toLowerCase().includes(q);
        const matchBusiness = u.businessName.toLowerCase().includes(q);
        const matchPhone = u.phone.toLowerCase().includes(q);
        const matchEmail = u.email.toLowerCase().includes(q);
        return matchNumber || matchName || matchBusiness || matchPhone || matchEmail;
      }
      return true;
    });
  }, [users, debouncedSearch, selectedCategoryFilter, selectedStatusFilter]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createBusinessName.trim() || !createCustomerName.trim() || !createPhone.trim()) {
      alert('Business name, customer contact name, and phone are required.');
      return;
    }

    const assignedNumber = createCustomCode.trim()
      ? createCustomCode.trim().toUpperCase()
      : generateUserNumber(createCategory);

    // Check duplicate
    const existing = await clothingDb.getSerialUserByNumber(assignedNumber);
    if (existing) {
      alert(`User Number "${assignedNumber}" is already in use. Please generate a unique number.`);
      return;
    }

    const salt = `salt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const passHash = await hashPassword(createInitialPassword, salt);
    const actCode = createRequireActivation ? `ACT-${Math.floor(1000 + Math.random() * 9000)}` : undefined;

    const newUser: SerialUserAccount = {
      id: `usr-${Date.now()}`,
      userNumber: assignedNumber,
      customerId: `cust-${Date.now()}`,
      customerName: createCustomerName.trim(),
      businessName: createBusinessName.trim(),
      phone: createPhone.trim(),
      email: createEmail.trim() || `${assignedNumber.toLowerCase()}@wholesale.portal`,
      category: createCategory,
      status: createRequireActivation ? 'pending_activation' : 'active',
      activationCode: actCode,
      passwordHash: passHash,
      salt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await clothingDb.saveSerialUser(newUser);
    await loadUsers();
    setIsCreateModalOpen(false);

    // Reset inputs
    setCreateCustomerName('');
    setCreateBusinessName('');
    setCreatePhone('');
    setCreateEmail('');
    setCreateCustomCode('');

    setNoticeMessage({
      type: 'success',
      text: `Successfully generated User Number ${newUser.userNumber} for ${newUser.businessName} (Category ${newUser.category}).`,
    });
    setTimeout(() => setNoticeMessage(null), 4000);
  };

  const handleUpdateStatus = async (user: SerialUserAccount, newStatus: SerialUserAccount['status']) => {
    await clothingDb.saveSerialUser({
      ...user,
      status: newStatus,
    });
    await loadUsers();
    setNoticeMessage({
      type: 'success',
      text: `Updated account ${user.userNumber} status to ${newStatus.toUpperCase()}.`,
    });
    setTimeout(() => setNoticeMessage(null), 3000);
  };

  const handleExecuteResetPassword = async () => {
    if (!resetTargetUser) return;
    const newSalt = `salt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newHash = await hashPassword(newAdminPassword, newSalt);

    await clothingDb.saveSerialUser({
      ...resetTargetUser,
      passwordHash: newHash,
      salt: newSalt,
      status: 'active',
      tempResetToken: undefined,
    });

    await loadUsers();
    setResetTargetUser(null);
    setNoticeMessage({
      type: 'success',
      text: `Password successfully reset for User ${resetTargetUser.userNumber} (${resetTargetUser.businessName}).`,
    });
    setTimeout(() => setNoticeMessage(null), 4000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Client Authentication & Account Provisioning</span>
            <span aria-hidden="true">·</span>
            <span>C / B / F Strict Logical Separation</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Serial Codes & Client Accounts Generator
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Issue unique user serial numbers, assign C/B/F tier permissions, configure passwords, and manage activation access.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Generate Serial User Code</span>
        </button>
      </div>

      {noticeMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
            noticeMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {noticeMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-semibold">{noticeMessage.text}</span>
        </div>
      )}

      {/* Category Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(['C', 'B', 'F'] as CustomerCategory[]).map((cat) => {
          const catUsers = users.filter((u) => u.category === cat);
          const activeCount = catUsers.filter((u) => u.status === 'active').length;

          return (
            <div
              key={cat}
              onClick={() => setSelectedCategoryFilter(cat === selectedCategoryFilter ? 'All' : cat)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                selectedCategoryFilter === cat
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                  : 'bg-white hover:bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                  Category {cat} Accounts
                </span>
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    selectedCategoryFilter === cat ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {cat}
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold font-mono">{catUsers.length}</div>
              <div className="mt-1 text-[11px] opacity-75">
                {activeCount} active · {catUsers.length - activeCount} pending/inactive
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search serial number, customer, phone..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 text-[11px] uppercase font-bold mr-1">Category:</span>
            {['All', 'C', 'B', 'F'].map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategoryFilter(c as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  selectedCategoryFilter === c
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 text-xs ml-2">
            <span className="text-slate-400 text-[11px] uppercase font-bold mr-1">Status:</span>
            {['All', 'active', 'pending_activation', 'revoked'].map((s) => (
              <button
                key={s}
                onClick={() => setSelectedStatusFilter(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize cursor-pointer transition-colors ${
                  selectedStatusFilter === s
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-5 py-3.5">User Number / Serial</th>
              <th className="px-4 py-3.5">Category Tier</th>
              <th className="px-4 py-3.5">Customer & Business</th>
              <th className="px-4 py-3.5">Contact Details</th>
              <th className="px-4 py-3.5">Access Status</th>
              <th className="px-4 py-3.5">Last Login</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-slate-400 text-xs">
                  No serial user accounts match your search filters.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                        {u.userNumber}
                      </span>
                      <button
                        onClick={() => copyToClipboard(u.userNumber)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                        title="Copy User Number"
                      >
                        {copiedCode === u.userNumber ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded font-bold text-xs bg-slate-900 text-white">
                      Category {u.category}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-slate-900">{u.businessName}</div>
                    <div className="text-[11px] text-slate-500">{u.customerName}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="text-slate-800 font-mono">{u.phone}</div>
                    <div className="text-[11px] text-slate-400">{u.email}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    {u.status === 'active' && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        Active
                      </span>
                    )}
                    {u.status === 'pending_activation' && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                        Pending Set-Password {u.activationCode ? `(${u.activationCode})` : ''}
                      </span>
                    )}
                    {u.status === 'revoked' && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                        Revoked
                      </span>
                    )}
                    {u.status === 'suspended' && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-700">
                        Suspended
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                    {u.lastLogin ? u.lastLogin.slice(0, 16).replace('T', ' ') : 'Never'}
                  </td>
                  <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => setResetTargetUser(u)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] cursor-pointer"
                      title="Set or reset client password"
                    >
                      Reset Password
                    </button>
                    {u.status === 'active' ? (
                      <button
                        onClick={() => handleUpdateStatus(u, 'revoked')}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[11px] cursor-pointer"
                        title="Revoke client access"
                      >
                        Revoke
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(u, 'active')}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[11px] cursor-pointer"
                        title="Activate client access"
                      >
                        Activate
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: Generate / Create Serial User */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <KeyRound className="w-5 h-5 text-amber-500" />
                <span>Generate Client Serial User Code</span>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  1. Select Internal Account Category (C, B, or F) *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['C', 'B', 'F'] as CustomerCategory[]).map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setCreateCategory(cat)}
                      className={`py-2 px-3 rounded-xl border text-center font-bold cursor-pointer transition-colors ${
                        createCategory === cat
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Tier {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Business / Store Name *</label>
                  <input
                    type="text"
                    required
                    value={createBusinessName}
                    onChange={(e) => setCreateBusinessName(e.target.value)}
                    placeholder="e.g. Royal Bespoke Suits"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Person Name *</label>
                  <input
                    type="text"
                    required
                    value={createCustomerName}
                    onChange={(e) => setCreateCustomerName(e.target.value)}
                    placeholder="e.g. Bibek Shrestha"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={createPhone}
                    onChange={(e) => setCreatePhone(e.target.value)}
                    placeholder="e.g. 9841234567"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    placeholder="e.g. store@example.com"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Custom Serial Number (Leave blank to auto-generate)
                </label>
                <input
                  type="text"
                  value={createCustomCode}
                  onChange={(e) => setCreateCustomCode(e.target.value.toUpperCase())}
                  placeholder={`Leave blank to auto-create ${createCategory}-XXXXX`}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono uppercase"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="req-act"
                    checked={createRequireActivation}
                    onChange={(e) => setCreateRequireActivation(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 cursor-pointer"
                  />
                  <label htmlFor="req-act" className="font-semibold text-slate-700 cursor-pointer">
                    Require client to set their own password upon first login (Generates Activation Code)
                  </label>
                </div>

                {!createRequireActivation && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Initial Password (Securely Hashed with Salt)
                    </label>
                    <input
                      type="text"
                      required
                      value={createInitialPassword}
                      onChange={(e) => setCreateInitialPassword(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Create & Issue User Number
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Reset Password */}
      {resetTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Lock className="w-4 h-4 text-amber-500" />
                <span>Reset Password for User {resetTargetUser.userNumber}</span>
              </div>
              <button
                onClick={() => setResetTargetUser(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-600">
              Business: <strong>{resetTargetUser.businessName}</strong> ({resetTargetUser.customerName})
            </p>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Set New Password</label>
              <input
                type="text"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono text-xs"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                The password will be immediately re-salted and hashed with SHA-256 in the central database.
              </span>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setResetTargetUser(null)}
                className="px-3.5 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteResetPassword}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer"
              >
                Apply & Save New Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

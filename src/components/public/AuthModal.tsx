/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { clothingDb, hashPassword } from '../../db/indexedDb';
import { SerialUserAccount } from '../../types';
import {
  X,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building,
  UserCheck,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeUser?: SerialUserAccount | null;
  onLoginSuccess?: (user: SerialUserAccount) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  activeUser,
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'activate' | 'forgot'>('login');

  // Login form state
  const [userNumber, setUserNumber] = useState('C-10023');
  const [password, setPassword] = useState('Wholesale2026!');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Activation form state
  const [actUserNumber, setActUserNumber] = useState('C-10099');
  const [actCode, setActCode] = useState('ACT-9901');
  const [actPassword, setActPassword] = useState('');
  const [actConfirmPassword, setActConfirmPassword] = useState('');
  const [actSuccess, setActSuccess] = useState(false);
  const [actError, setActError] = useState<string | null>(null);

  // Available sample users list for rapid inspection
  const [sampleUsers, setSampleUsers] = useState<SerialUserAccount[]>([]);

  useEffect(() => {
    if (isOpen) {
      clothingDb.getAllSerialUsers().then(setSampleUsers);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsSubmitting(true);

    try {
      const trimmedNumber = userNumber.trim().toUpperCase();
      const user = await clothingDb.getSerialUserByNumber(trimmedNumber);

      if (!user) {
        setLoginError(`No account registered with User Number "${trimmedNumber}". Contact Admin to receive an issued code.`);
        setIsSubmitting(false);
        return;
      }

      if (user.status === 'revoked' || user.status === 'suspended') {
        setLoginError(`Account access is currently ${user.status.toUpperCase()}. Contact your account manager.`);
        setIsSubmitting(false);
        return;
      }

      if (user.status === 'pending_activation') {
        setLoginError(`Account "${trimmedNumber}" is awaiting first-time password creation. Please switch to the "Set Password" tab.`);
        setIsSubmitting(false);
        return;
      }

      // Hash password and verify
      const enteredHash = await hashPassword(password, user.salt);
      if (enteredHash !== user.passwordHash) {
        setLoginError('Invalid password. Passwords are case-sensitive.');
        setIsSubmitting(false);
        return;
      }

      // Update last login
      await clothingDb.saveSerialUser({
        ...user,
        lastLogin: new Date().toISOString(),
      });

      if (onLoginSuccess) {
        onLoginSuccess(user);
      }
      onClose();
    } catch (err: any) {
      setLoginError(err?.message || 'Login failed. Please check network/storage connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActError(null);

    if (actPassword.length < 6) {
      setActError('Password must be at least 6 characters long.');
      return;
    }

    if (actPassword !== actConfirmPassword) {
      setActError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);
    try {
      const trimmedNumber = actUserNumber.trim().toUpperCase();
      const user = await clothingDb.getSerialUserByNumber(trimmedNumber);

      if (!user) {
        setActError(`User Number "${trimmedNumber}" not found. Verify the number issued by your wholesale distributor.`);
        setIsSubmitting(false);
        return;
      }

      if (user.status === 'revoked') {
        setActError('This account code has been revoked by Admin.');
        setIsSubmitting(false);
        return;
      }

      if (user.activationCode && actCode.trim() && user.activationCode.toUpperCase() !== actCode.trim().toUpperCase()) {
        setActError('Incorrect activation code. Please check the code provided by Admin.');
        setIsSubmitting(false);
        return;
      }

      // Create new salt and hash user's own password
      const newSalt = `salt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const hash = await hashPassword(actPassword, newSalt);

      const updatedUser: SerialUserAccount = {
        ...user,
        passwordHash: hash,
        salt: newSalt,
        status: 'active',
        activationCode: undefined,
        tempResetToken: undefined,
        lastLogin: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await clothingDb.saveSerialUser(updatedUser);
      setActSuccess(true);

      // Auto login after activation
      if (onLoginSuccess) {
        onLoginSuccess(updatedUser);
      }
    } catch (err: any) {
      setActError(err?.message || 'Failed to set password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header Tabs */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xs">
              B2B
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Wholesale Portal Authentication</h2>
              <p className="text-[11px] text-slate-300">Central serial-based verification & category control</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-slate-200 flex items-center gap-4 bg-slate-50 text-xs font-bold">
          <button
            onClick={() => {
              setMode('login');
              setLoginError(null);
            }}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              mode === 'login'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Serial Login</span>
          </button>
          <button
            onClick={() => {
              setMode('activate');
              setActSuccess(false);
              setActError(null);
            }}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              mode === 'activate'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Set / Activate Password</span>
          </button>
          <button
            onClick={() => setMode('forgot')}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              mode === 'forgot'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Forgot Password</span>
          </button>
        </div>

        <div className="p-6">
          {/* 1. LOGIN MODE */}
          {mode === 'login' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Sign In with Issued User Number</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your unique server-generated serial number (e.g. C-10023, B-20045) and password.
                </p>
              </div>

              {loginError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Issued User Number / Serial Code *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={userNumber}
                      onChange={(e) => setUserNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. C-10023"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono font-bold tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Assigned internal category (C, B, or F) is strictly validated by backend.
                  </span>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-700">User-Created Password *</label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[11px] text-amber-700 hover:underline cursor-pointer"
                    >
                      Need help?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 rounded-xl transition-colors shadow-sm mt-2 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>{isSubmitting ? 'Verifying Account...' : 'Log In with Serial Code'}</span>
                </button>
              </form>

              {/* Sample User Accounts for rapid inspection & testing */}
              <div className="pt-4 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Sample Authorized Accounts (Click to Fill):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {sampleUsers
                    .filter((u) => u.status === 'active')
                    .slice(0, 3)
                    .map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setUserNumber(u.userNumber);
                          setPassword('Wholesale2026!');
                        }}
                        className={`p-2 rounded-xl border text-left transition-colors cursor-pointer text-xs ${
                          userNumber === u.userNumber
                            ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-400'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-slate-900">{u.userNumber}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">
                            Tier {u.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 truncate mt-0.5">{u.businessName}</p>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. FIRST-TIME ACTIVATION / SET PASSWORD */}
          {mode === 'activate' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Activate Account & Set Password</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Received your user number from Admin? Set your private password securely below.
                </p>
              </div>

              {actSuccess ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-emerald-900 text-sm">Password Configured Successfully!</h4>
                  <p className="text-xs text-emerald-800">
                    Your password has been securely hashed and your user number is now active.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Proceed to Storefront
                  </button>
                </div>
              ) : (
                <>
                  {actError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                      <span>{actError}</span>
                    </div>
                  )}

                  <form onSubmit={handleActivate} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Issued User Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={actUserNumber}
                        onChange={(e) => setActUserNumber(e.target.value.toUpperCase())}
                        placeholder="e.g. C-10099"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        One-Time Activation Code (if provided by Admin)
                      </label>
                      <input
                        type="text"
                        value={actCode}
                        onChange={(e) => setActCode(e.target.value)}
                        placeholder="e.g. ACT-9901"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono uppercase"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Create Password *</label>
                        <input
                          type="password"
                          required
                          value={actPassword}
                          onChange={(e) => setActPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password *</label>
                        <input
                          type="password"
                          required
                          value={actConfirmPassword}
                          onChange={(e) => setActConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 px-4 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 rounded-xl transition-colors shadow-sm mt-2 cursor-pointer"
                    >
                      {isSubmitting ? 'Saving Password...' : 'Save Password & Activate Account'}
                    </button>
                  </form>
                </>
              )}
            </div>
          )}

          {/* 3. FORGOT PASSWORD WORKFLOW */}
          {mode === 'forgot' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Admin-Managed Password Reset</h3>
                <p className="text-xs text-slate-500 mt-1">
                  For maximum security of B2B wholesale trade accounts, credentials are managed directly by authorized Admin staff.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2 text-slate-700">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>How to reset your wholesale password:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1 leading-relaxed">
                  <li>Contact the Wholesale Desk via telephone or email with your registered business name.</li>
                  <li>Admin will verify your identity and generate a single-use <strong>Reset Token</strong>.</li>
                  <li>Use the <strong>"Set / Activate Password"</strong> tab above with your issued user number and token to define a new password.</li>
                </ol>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 cursor-pointer"
                >
                  Back to Serial Login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

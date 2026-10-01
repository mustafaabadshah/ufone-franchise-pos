import React, { useState } from "react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.login({ email, password });
      login(res.access_token, res.user);
    } catch (err: any) {
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-900 flex items-center justify-center p-4">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-[#19153e] to-[#0f0e26]" />
      <div className="absolute -left-28 top-20 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="absolute -right-20 bottom-10 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-extrabold text-2xl font-heading shadow-lg shadow-orange-500/25 mb-4">
              U4G
            </div>
            <h2 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">Franchise POS Login</h2>
            <p className="text-sm text-slate-500 mt-1">Sign in to continue to your shop panel</p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium">
                <input type="checkbox" defaultChecked className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span>Remember me</span>
              </label>
              <span className="text-indigo-600 font-medium">Forgot password?</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>LOG IN</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Login Accounts */}
          <div className="mt-6 pt-5 border-t border-slate-200/80">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
              One-Click Quick Login
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setEmail("shahidkhan@pos.com");
                  setPassword("posUfone@123");
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50/80 border border-slate-200/80 hover:border-indigo-300 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    SK
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">Shahid Khan</p>
                    <p className="text-[10px] text-slate-500 font-mono">shahidkhan@pos.com</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                  Admin / Incharge
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail("shakeel@pos.com");
                  setPassword("posUfone@123");
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50/80 border border-slate-200/80 hover:border-amber-300 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                    SA
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 group-hover:text-amber-800">Shakeel Ahmad</p>
                    <p className="text-[10px] text-slate-500 font-mono">shakeel@pos.com</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  FCA Master / Operations
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail("islambadshah@pos.com");
                  setPassword("posUfone@123");
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-200/80 hover:border-emerald-300 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    IB
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">Islam Badshah</p>
                    <p className="text-[10px] text-slate-500 font-mono">islambadshah@pos.com</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Franchise Owner / Viewer
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

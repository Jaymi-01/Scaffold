"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { api } from "../../utils/api";
import { ViewIcon, ViewOffIcon } from "hugeicons-react";

const loginSchema = z.object({
  usernameOrEmail: z
    .string()
    .min(1, "Username or Email is required")
    .max(50, "Username or Email cannot exceed 50 characters"),
  password: z
    .string()
    .min(1, "Password is required")
    .max(50, "Password cannot exceed 50 characters"),
});

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ usernameOrEmail: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (field: string, val: string) => {
    setForm((prev) => ({ ...prev, [field]: val }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const validation = loginSchema.safeParse(form);
    
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path[0] && !fieldErrors[issue.path[0] as string]) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setActionLoading(true);
    try {
      await api.login(form.usernameOrEmail, form.password);
      router.push("/dashboard");
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrors({ form: error.message || "Invalid credentials. Please try again." });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-golden-chestnut-50 text-golden-chestnut-900 selection:bg-golden-chestnut-200 selection:text-golden-chestnut-950 font-sans">
      {/* Main card */}
      <div className="flex-1 flex items-center justify-center px-6 py-4">
        <div className="w-full max-w-sm p-6 rounded-2xl border border-golden-chestnut-200 bg-white shadow-xs">
          <h2 className="text-xl font-bold text-golden-chestnut-950 mb-1 text-center">
            Sign In to Scaffold
          </h2>
          <p className="text-xs text-graphite-500 mb-4 text-center">
            Collaborative hosted component documentation
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.form && (
              <div className="p-3 rounded-xl bg-oxblood-50 border border-oxblood-100 text-oxblood-700 text-xs font-semibold">
                {errors.form}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Username or Email
              </label>
              <input
                type="text"
                name="username"
                id="login-username"
                autoComplete="username"
                value={form.usernameOrEmail}
                onChange={(e) => handleChange("usernameOrEmail", e.target.value)}
                className={`w-full px-3 py-2 rounded-xl bg-golden-chestnut-50 text-golden-chestnut-950 text-xs focus:border-rosy-copper-600 focus:ring-2 focus:ring-rosy-copper-600/10 outline-none transition border ${
                  errors.usernameOrEmail
                    ? "border-oxblood-500 focus:border-oxblood-600 focus:ring-oxblood-600/20"
                    : "border-golden-chestnut-200"
                }`}
                placeholder="john@example.com"
              />
              {errors.usernameOrEmail && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.usernameOrEmail}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="login-password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className={`w-full pl-3 pr-10 py-2 rounded-xl bg-golden-chestnut-50 text-golden-chestnut-950 text-xs focus:border-rosy-copper-600 focus:ring-2 focus:ring-rosy-copper-600/10 outline-none transition border ${
                    errors.password
                      ? "border-oxblood-500 focus:border-oxblood-600 focus:ring-oxblood-600/20"
                      : "border-golden-chestnut-200"
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2 text-graphite-400 hover:text-graphite-700 cursor-pointer"
                >
                  {showPassword ? (
                    <ViewOffIcon className="w-4 h-4" />
                  ) : (
                    <ViewIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="flex justify-end mt-1.5">
                <Link
                  href="/forgot-password"
                  className="text-xs text-rosy-copper-600 hover:text-rosy-copper-750 font-semibold cursor-pointer"
                >
                  Forgot password?
                </Link>
              </div>
              {errors.password && <p className="text-[10px] text-red-500 mt-1.5 font-semibold">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className={`w-full py-2.5 rounded-xl font-bold text-white transition flex items-center justify-center text-xs ${
                actionLoading
                  ? "bg-rosy-copper-500/75 cursor-not-allowed"
                  : "bg-rosy-copper-600 hover:bg-rosy-copper-750 cursor-pointer shadow-xs active:scale-95"
              }`}
            >
              {actionLoading ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-4 pt-3.5 border-t border-golden-chestnut-100 text-center">
            <Link
              href="/signup"
              className="text-xs text-rosy-copper-600 hover:text-rosy-copper-750 font-semibold cursor-pointer"
            >
              {"Don't have an account? Sign up"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

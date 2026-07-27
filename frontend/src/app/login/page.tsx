"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { api } from "../../utils/api";
import { CodeIcon, ViewIcon, ViewOffIcon } from "hugeicons-react";

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
    } catch (err: any) {
      setErrors({ form: err.message || "Invalid credentials. Please try again." });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-golden-chestnut-50 text-golden-chestnut-900">
      {/* Main card */}
      <div className="flex-1 flex items-center justify-center bg-golden-chestnut-100/40 px-6 py-4">
        <div className="w-full max-w-sm p-6 rounded-3xl border border-golden-chestnut-200 bg-white shadow-sm shadow-rosy-copper-600/5">
          <h2 className="text-xl font-bold text-golden-chestnut-950 mb-1 text-center font-serif">
            Sign In to Scaffold
          </h2>
          <p className="text-sm text-graphite-500 mb-3 text-center">
            Collaborative hosted component documentation
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            {errors.form && (
              <div className="p-3 rounded-lg bg-oxblood-50 border border-oxblood-100 text-oxblood-700 text-sm">
                {errors.form}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-slate-500 mb-1">
                Username or Email
              </label>
              <input
                type="text"
                name="username"
                id="login-username"
                autoComplete="username"
                value={form.usernameOrEmail}
                onChange={(e) => handleChange("usernameOrEmail", e.target.value)}
                className={`w-full px-3 py-2 rounded-xl bg-golden-chestnut-50 text-golden-chestnut-900 text-base focus:ring-1 outline-none transition border ${
                  errors.usernameOrEmail
                    ? "border-oxblood-500 focus:border-oxblood-600 focus:ring-oxblood-600/20"
                    : "border-golden-chestnut-200 focus:border-rosy-copper-600 focus:ring-rosy-copper-600/20"
                }`}
                placeholder="john@example.com"
              />
              {errors.usernameOrEmail && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.usernameOrEmail}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-slate-500 mb-1">
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
                  className={`w-full pl-3 pr-10 py-2 rounded-xl bg-golden-chestnut-50 text-golden-chestnut-900 text-base focus:ring-1 outline-none transition border ${
                    errors.password
                      ? "border-oxblood-500 focus:border-oxblood-600 focus:ring-oxblood-600/20"
                      : "border-golden-chestnut-200 focus:border-rosy-copper-600 focus:ring-rosy-copper-600/20"
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-graphite-400 hover:text-graphite-700 cursor-pointer"
                >
                  {showPassword ? (
                    <ViewOffIcon className="w-5 h-5" />
                  ) : (
                    <ViewIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              <div className="flex justify-end mt-1.5">
                <Link
                  href="/forgot-password"
                  className="text-sm text-rosy-copper-600 hover:text-rosy-copper-700 font-semibold cursor-pointer animate-fade-in"
                >
                  Forgot password?
                </Link>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className={`w-full py-2.5 rounded-xl font-bold text-white transition flex items-center justify-center text-base ${
                actionLoading
                  ? "bg-rosy-copper-600/75 cursor-not-allowed"
                  : "bg-rosy-copper-600 hover:bg-rosy-copper-700 cursor-pointer"
              }`}
            >
              {actionLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-4 pt-3.5 border-t border-golden-chestnut-200 text-center">
            <Link
              href="/signup"
              className="text-base text-rosy-copper-600 hover:text-rosy-copper-700 font-semibold cursor-pointer"
            >
              Don't have an account? Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

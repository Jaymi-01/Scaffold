"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { api } from "../../utils/api";
import { CodeIcon, ViewIcon, ViewOffIcon } from "hugeicons-react";

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username cannot exceed 20 characters")
      .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address (e.g., john@company.com)")
      .max(50, "Email cannot exceed 50 characters"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(50, "Password cannot exceed 50 characters")
      .regex(/[a-zA-Z]/, "Password must contain at least one letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^a-zA-Z0-9]/, "Password must contain a special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (field: string, val: string) => {
    setForm((prev) => ({ ...prev, [field]: val }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      if (field === "password" || field === "confirmPassword") {
        delete next.confirmPassword;
      }
      return next;
    });
  };

  const handleConfirmPasswordBlur = () => {
    if (!form.confirmPassword) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.confirmPassword;
        return next;
      });
      return;
    }
    if (form.password !== form.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }));
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.confirmPassword;
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const validation = registerSchema.safeParse(form);

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
      await api.register(form.username, form.email, form.password);
      router.push("/dashboard");
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.toLowerCase().includes("email")) {
        setErrors({ email: msg });
      } else if (msg.toLowerCase().includes("username")) {
        setErrors({ username: msg });
      } else {
        setErrors({ form: msg || "Registration failed. Username or email may be taken." });
      }
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
            Register Workspace
          </h2>
          <p className="text-sm text-graphite-500 mb-3 text-center">
            Create an account to host your custom design system
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            {errors.form && (
              <div className="p-3 rounded-lg bg-oxblood-50 border border-oxblood-100 text-oxblood-700 text-sm">
                {errors.form}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-slate-500 mb-1">
                Username
              </label>
              <input
                type="text"
                name="username"
                id="signup-username"
                autoComplete="username"
                value={form.username}
                onChange={(e) => handleChange("username", e.target.value)}
                className={`w-full px-3 py-2 rounded-xl bg-golden-chestnut-50 text-golden-chestnut-900 text-base focus:ring-1 outline-none transition border ${
                  errors.username
                    ? "border-oxblood-500 focus:border-oxblood-600 focus:ring-oxblood-600/20"
                    : "border-golden-chestnut-200 focus:border-rosy-copper-600 focus:ring-rosy-copper-600/20"
                }`}
                placeholder="johndoe"
              />
              {errors.username && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-slate-500 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                id="signup-email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className={`w-full px-3 py-2 rounded-xl bg-golden-chestnut-50 text-golden-chestnut-900 text-base focus:ring-1 outline-none transition border ${
                  errors.email
                    ? "border-oxblood-500 focus:border-oxblood-600 focus:ring-oxblood-600/20"
                    : "border-golden-chestnut-200 focus:border-rosy-copper-600 focus:ring-rosy-copper-600/20"
                }`}
                placeholder="john@company.com"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-slate-500 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="signup-password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  onBlur={handleConfirmPasswordBlur}
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
              {errors.password && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-slate-500 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  id="signup-confirmPassword"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  onBlur={handleConfirmPasswordBlur}
                  className={`w-full pl-3 pr-10 py-2 rounded-xl bg-golden-chestnut-50 text-golden-chestnut-900 text-base focus:ring-1 outline-none transition border ${
                    errors.confirmPassword
                      ? "border-oxblood-500 focus:border-oxblood-600 focus:ring-oxblood-600/20"
                      : "border-golden-chestnut-200 focus:border-rosy-copper-600 focus:ring-rosy-copper-600/20"
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-graphite-400 hover:text-graphite-700 cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <ViewOffIcon className="w-5 h-5" />
                  ) : (
                    <ViewIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-2.5 rounded-xl font-bold bg-rosy-copper-600 hover:bg-rosy-copper-700 text-white transition flex items-center justify-center cursor-pointer text-base"
            >
              {actionLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-4 pt-3.5 border-t border-golden-chestnut-200 text-center">
            <Link
              href="/login"
              className="text-base text-rosy-copper-600 hover:text-rosy-copper-700 font-semibold cursor-pointer"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

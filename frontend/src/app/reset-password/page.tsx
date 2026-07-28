"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { api } from "../../utils/api";
import { ViewIcon, ViewOffIcon } from "hugeicons-react";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(50, "Password cannot exceed 50 characters")
      .regex(/[a-zA-Z]/, "Password must contain at least one letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^a-zA-Z0-9]/, "Password must contain a special character"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");

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
    
    if (!email || !token) {
      setErrors({ form: "Reset session has expired or is invalid. Please request a new code." });
      return;
    }

    const validation = resetPasswordSchema.safeParse(form);

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
      await api.resetPassword(email, token, form.password);
      setInfoMessage("Password reset successful! Redirecting to sign in...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrors({ form: error.message || "Failed to reset password. Please check your reset link and try again." });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm p-6 rounded-2xl border border-golden-chestnut-200 bg-white shadow-xs">
      <h2 className="text-xl font-bold text-golden-chestnut-950 mb-1 text-center">
        New Credentials
      </h2>
      <p className="text-xs text-graphite-500 mb-4 text-center">
        Enter your new secure password
      </p>

      {infoMessage && (
        <div className="p-3 rounded-xl bg-golden-chestnut-100/60 border border-golden-chestnut-200 text-golden-chestnut-800 text-xs font-semibold mb-3">
          {infoMessage}
        </div>
      )}

      {errors.form && (
        <div className="p-3 rounded-xl bg-oxblood-50 border border-oxblood-105 text-oxblood-705 text-xs font-semibold mb-3 animate-shake">
          {errors.form}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              id="reset-password"
              autoComplete="new-password"
              disabled={actionLoading}
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              onBlur={handleConfirmPasswordBlur}
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
              disabled={actionLoading}
              className="absolute right-3 top-2 text-graphite-400 hover:text-graphite-700 cursor-pointer"
            >
              {showPassword ? (
                <ViewOffIcon className="w-4 h-4" />
              ) : (
                <ViewIcon className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.password && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.password}</p>}
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              id="reset-confirmPassword"
              autoComplete="new-password"
              disabled={actionLoading}
              value={form.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              onBlur={handleConfirmPasswordBlur}
              className={`w-full pl-3 pr-10 py-2 rounded-xl bg-golden-chestnut-50 text-golden-chestnut-950 text-xs focus:border-rosy-copper-600 focus:ring-2 focus:ring-rosy-copper-600/10 outline-none transition border ${
                errors.confirmPassword
                  ? "border-oxblood-500 focus:border-oxblood-600 focus:ring-oxblood-600/20"
                  : "border-golden-chestnut-200"
              }`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={actionLoading}
              className="absolute right-3 top-2 text-graphite-400 hover:text-graphite-700 cursor-pointer"
            >
              {showConfirmPassword ? (
                <ViewOffIcon className="w-4 h-4" />
              ) : (
                <ViewIcon className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-[10px] text-red-500 mt-1.5 font-semibold">{errors.confirmPassword}</p>}
        </div>

        <button
          type="submit"
          disabled={actionLoading}
          className={`w-full py-2.5 rounded-xl font-bold text-white transition flex items-center justify-center text-xs ${
            actionLoading
              ? "bg-rosy-copper-500/75 cursor-not-allowed"
              : "bg-rosy-copper-600 hover:bg-rosy-copper-755 cursor-pointer shadow-xs active:scale-95"
          }`}
        >
          {actionLoading ? (
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Updating...</span>
            </div>
          ) : (
            "Reset Password"
          )}
        </button>
      </form>

      <div className="mt-4 pt-3.5 border-t border-golden-chestnut-100 text-center">
        <Link
          href="/login"
          className="text-xs text-rosy-copper-600 hover:text-rosy-copper-750 font-semibold cursor-pointer"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col bg-golden-chestnut-50 text-golden-chestnut-900 selection:bg-golden-chestnut-200 selection:text-golden-chestnut-950 font-sans">
      <div className="flex-1 flex items-center justify-center px-6 py-4">
        <Suspense fallback={
          <div className="w-full max-w-sm p-6 rounded-2xl border border-golden-chestnut-200 bg-white shadow-xs flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-golden-chestnut-200 border-t-rosy-copper-600 rounded-full animate-spin"></div>
          </div>
        }>
          <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
  );
}

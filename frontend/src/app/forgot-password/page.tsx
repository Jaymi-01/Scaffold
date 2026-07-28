"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { api } from "../../utils/api";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(50, "Email cannot exceed 50 characters"),
});

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [lockoutActive, setLockoutActive] = useState(false);

  const handleEmailChange = (val: string) => {
    setEmail(val);
    setErrors({});
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const validation = forgotPasswordSchema.safeParse({ email });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setActionLoading(true);
    try {
      await api.forgotPassword(email);
      router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (err: unknown) {
      const error = err as { message?: string };
      const msg = error.message || "";
      if (msg.toLowerCase().includes("lockout") || msg.toLowerCase().includes("disabled") || msg.toLowerCase().includes("attempts")) {
        setLockoutActive(true);
      }
      setErrors({ email: msg || "Email address not found." });
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
            Reset Password
          </h2>
          <p className="text-xs text-graphite-500 mb-4 text-center">
            Enter your email to receive a recovery code
          </p>

          {errors.form && (
            <div className="p-3 rounded-xl bg-oxblood-50 border border-oxblood-100 text-oxblood-700 text-xs font-semibold mb-3">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleRequestOTP} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                id="reset-email"
                autoComplete="email"
                disabled={actionLoading || lockoutActive}
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl bg-golden-chestnut-50 text-golden-chestnut-950 text-xs focus:border-rosy-copper-600 focus:ring-2 focus:ring-rosy-copper-600/10 outline-none transition border ${
                  errors.email
                    ? "border-oxblood-500 focus:border-oxblood-600 focus:ring-oxblood-600/20"
                    : "border-golden-chestnut-200"
                }`}
                placeholder="john@company.com"
              />
              {errors.email && <p className="text-[10px] text-red-500 mt-1.5 font-semibold">{errors.email}</p>}
            </div>

            <button
              type="submit"
              disabled={actionLoading || lockoutActive}
              className={`w-full py-2.5 rounded-xl font-bold transition flex items-center justify-center text-xs ${
                lockoutActive
                  ? "bg-slate-205 text-slate-400 cursor-not-allowed"
                  : actionLoading
                  ? "bg-rosy-copper-500/75 cursor-not-allowed text-white"
                  : "bg-rosy-copper-600 hover:bg-rosy-copper-750 text-white cursor-pointer shadow-xs active:scale-95"
              }`}
            >
              {actionLoading ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Sending...</span>
                </div>
              ) : (
                "Send Code"
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
      </div>
    </div>
  );
}

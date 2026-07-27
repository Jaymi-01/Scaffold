"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { api } from "../../utils/api";
import { ViewIcon, ViewOffIcon } from "hugeicons-react";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(50, "Email cannot exceed 50 characters"),
});

const resetPasswordSchema = z
  .object({
    otp: z
      .string()
      .min(6, "Reset code must be exactly 6 digits")
      .max(6, "Reset code must be exactly 6 digits")
      .regex(/^[0-9]+$/, "Reset code must be numeric"),
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

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [resetForm, setResetForm] = useState({ otp: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1); // 1 = request otp, 2 = verify and reset
  const [actionLoading, setActionLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");
  const [codeTimer, setCodeTimer] = useState(0);
  const [lockoutActive, setLockoutActive] = useState(false);

  useEffect(() => {
    if (codeTimer <= 0) return;
    const interval = setInterval(() => {
      setCodeTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [codeTimer]);

  const handleEmailChange = (val: string) => {
    setEmail(val);
    setErrors({});
  };

  const handleResetFormChange = (field: string, val: string) => {
    setResetForm((prev) => ({ ...prev, [field]: val }));
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
    if (!resetForm.confirmPassword) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.confirmPassword;
        return next;
      });
      return;
    }
    if (resetForm.password !== resetForm.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }));
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.confirmPassword;
        return next;
      });
    }
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
      const res = await api.forgotPassword(email);
      setInfoMessage(res.message);
      setStep(2);
      setCodeTimer(60); // Start 60s countdown
      setLockoutActive(false);
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.toLowerCase().includes("lockout") || msg.toLowerCase().includes("disabled") || msg.toLowerCase().includes("attempts")) {
        setLockoutActive(true);
      }
      setErrors({ email: msg || "Email address not found." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setErrors({});
    setInfoMessage("");
    setActionLoading(true);
    try {
      const res = await api.forgotPassword(email);
      setInfoMessage(res.message);
      setCodeTimer(60); // Reset 60s countdown
      setLockoutActive(false);
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.toLowerCase().includes("lockout") || msg.toLowerCase().includes("disabled") || msg.toLowerCase().includes("attempts")) {
        setLockoutActive(true);
      }
      setErrors({ form: msg || "Failed to resend code." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const validation = resetPasswordSchema.safeParse(resetForm);

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
      await api.resetPassword(email, resetForm.otp, resetForm.password);
      setInfoMessage("Password reset successful! Redirecting to sign in...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.toLowerCase().includes("lockout") || msg.toLowerCase().includes("attempts")) {
        setLockoutActive(true);
      }
      setErrors({ form: msg || "Failed to reset password. Please check your OTP and try again." });
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
            Reset Password
          </h2>
          <p className="text-sm text-graphite-500 mb-3 text-center">
            {step === 1 ? "Enter your email to receive a recovery code" : "Enter the verification code and your new credentials"}
          </p>

          {infoMessage && (
            <div className="p-3 rounded-lg bg-golden-chestnut-100/60 border border-golden-chestnut-200 text-golden-chestnut-800 text-sm mb-3 animate-fade-in">
              {infoMessage}
            </div>
          )}

          {errors.form && (
            <div className="p-3 rounded-lg bg-oxblood-50 border border-oxblood-100 text-oxblood-700 text-sm mb-3 animate-shake">
              {errors.form}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestOTP} className="space-y-3">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-slate-500 mb-1">
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
                  className={`w-full px-3 py-2 rounded-xl bg-golden-chestnut-50 text-golden-chestnut-900 text-base focus:ring-1 outline-none transition border ${
                    errors.email
                      ? "border-oxblood-500 focus:border-oxblood-600 focus:ring-oxblood-600/20"
                      : "border-golden-chestnut-200 focus:border-rosy-copper-600 focus:ring-rosy-copper-600/20"
                  }`}
                  placeholder="john@company.com"
                />
                {errors.email && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.email}</p>}
              </div>

              <button
                type="submit"
                disabled={actionLoading || lockoutActive}
                className={`w-full py-2.5 rounded-xl font-bold transition flex items-center justify-center text-base ${
                  lockoutActive
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                    : "bg-rosy-copper-600 hover:bg-rosy-copper-700 text-white cursor-pointer"
                }`}
              >
                {actionLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  "Send Code"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Reset Code (OTP)
                </label>
                <input
                  type="text"
                  name="otp"
                  id="reset-otp"
                  maxLength={6}
                  disabled={actionLoading || lockoutActive}
                  value={resetForm.otp}
                  onChange={(e) => handleResetFormChange("otp", e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl bg-golden-chestnut-50 text-golden-chestnut-900 text-base focus:ring-1 outline-none transition border ${
                    errors.otp
                      ? "border-oxblood-500 focus:border-oxblood-600 focus:ring-oxblood-600/20"
                      : "border-golden-chestnut-200 focus:border-rosy-copper-600 focus:ring-rosy-copper-600/20"
                  }`}
                  placeholder="123456"
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.otp ? (
                    <p className="text-xs text-red-500 font-semibold">{errors.otp}</p>
                  ) : codeTimer > 0 ? (
                    <p className="text-xs text-slate-500 font-semibold">
                      Code expires in 0:{codeTimer < 10 ? "0" + codeTimer : codeTimer}
                    </p>
                  ) : (
                    <p className="text-xs text-oxblood-600 font-semibold">
                      Code has expired. Please resend code.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-slate-500 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    id="reset-password"
                    autoComplete="new-password"
                    disabled={actionLoading || lockoutActive}
                    value={resetForm.password}
                    onChange={(e) => handleResetFormChange("password", e.target.value)}
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
                    disabled={actionLoading || lockoutActive}
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
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    id="reset-confirmPassword"
                    autoComplete="new-password"
                    disabled={actionLoading || lockoutActive}
                    value={resetForm.confirmPassword}
                    onChange={(e) => handleResetFormChange("confirmPassword", e.target.value)}
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
                    disabled={actionLoading || lockoutActive}
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
                disabled={actionLoading || lockoutActive}
                className={`w-full py-2.5 rounded-xl font-bold transition flex items-center justify-center text-base ${
                  lockoutActive
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                    : "bg-rosy-copper-600 hover:bg-rosy-copper-700 text-white cursor-pointer"
                }`}
              >
                {actionLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  "Reset Password"
                )}
              </button>

              <div className="flex justify-between items-center text-sm pt-2">
                <span className="text-graphite-400">Didn't receive the code?</span>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={actionLoading || lockoutActive}
                  className={`font-semibold transition ${
                    lockoutActive
                      ? "text-graphite-300 cursor-not-allowed"
                      : "text-rosy-copper-600 hover:text-rosy-copper-700 cursor-pointer"
                  }`}
                >
                  Resend Code
                </button>
              </div>
            </form>
          )}

          <div className="mt-4 pt-3.5 border-t border-golden-chestnut-200 text-center">
            <Link
              href="/login"
              className="text-base text-rosy-copper-600 hover:text-rosy-copper-700 font-semibold cursor-pointer"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

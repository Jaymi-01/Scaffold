"use client";

import React, { Suspense, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "../../utils/api";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState("We've sent a verification code to your email.");
  const [codeTimer, setCodeTimer] = useState(60);
  const [lockoutActive, setLockoutActive] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (codeTimer <= 0) return;
    const interval = setInterval(() => {
      setCodeTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [codeTimer]);

  useEffect(() => {
    if (lockoutTimer <= 0) {
      if (lockoutActive) setLockoutActive(false);
      return;
    }
    const interval = setInterval(() => {
      setLockoutTimer((prev) => {
        if (prev <= 1) {
          setLockoutActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimer, lockoutActive]);

  const handleChange = (index: number, val: string) => {
    if (val && !/^[0-9]$/.test(val)) return;
    
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);
    setErrors({});

    // Move to next input box if digit entered
    if (val && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputsRef.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
      setErrors({});
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").trim();
    if (!/^[0-9]{6}$/.test(text)) return;
    
    const digits = text.split("");
    setOtp(digits);
    setErrors({});
    inputsRef.current[5]?.focus();
  };

  const handleResendOTP = async () => {
    setErrors({});
    setInfoMessage("");
    setActionLoading(true);
    try {
      const res = await api.forgotPassword(email);
      setInfoMessage(res.message);
      setCodeTimer(60);
      setLockoutActive(false);
      setOtp(["", "", "", "", "", ""]);
      inputsRef.current[0]?.focus();
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.toLowerCase().includes("lockout") || msg.toLowerCase().includes("attempts")) {
        setLockoutActive(true);
        const match = msg.match(/in (\d+) minute/);
        const minutes = match && match[1] ? parseInt(match[1]) : 5;
        setLockoutTimer(minutes * 60);
      }
      setErrors({ form: msg || "Failed to resend code." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const code = otp.join("");
    
    if (code.length < 6) {
      setErrors({ form: "Please enter all 6 digits of the code." });
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.verifyOtp(email, code);
      router.push(`/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(res.resetToken)}`);
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.toLowerCase().includes("lockout") || msg.toLowerCase().includes("attempts")) {
        setLockoutActive(true);
        const match = msg.match(/in (\d+) minute/);
        const minutes = match && match[1] ? parseInt(match[1]) : 5;
        setLockoutTimer(minutes * 60);
      }
      setErrors({ form: msg || "Verification failed. Please try again." });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm p-6 rounded-3xl border border-golden-chestnut-200 bg-white shadow-sm shadow-rosy-copper-600/5">
      <h2 className="text-xl font-bold text-golden-chestnut-950 mb-1 text-center font-serif">
        Verify Code
      </h2>
      <p className="text-sm text-graphite-500 mb-3 text-center">
        Enter the 6-digit verification code sent to {email || "your email"}
      </p>

      {infoMessage && (
        <div className="p-3 rounded-lg bg-golden-chestnut-100/60 border border-golden-chestnut-200 text-golden-chestnut-800 text-sm mb-3">
          {infoMessage}
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-4">
        <div className="flex justify-between gap-2" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputsRef.current[index] = el; }}
              type="text"
              maxLength={1}
              value={digit}
              disabled={actionLoading || lockoutActive}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={`w-12 h-12 text-center text-xl font-bold rounded-xl bg-golden-chestnut-50 text-golden-chestnut-900 outline-none transition border focus:ring-1 ${
                errors.form
                  ? "border-oxblood-500 focus:border-oxblood-600 focus:ring-oxblood-600/20"
                  : "border-golden-chestnut-200 focus:border-rosy-copper-600 focus:ring-rosy-copper-600/20"
              }`}
            />
          ))}
        </div>

        <div className="text-right min-h-[20px]">
          {lockoutActive && lockoutTimer > 0 ? (
            <p className="text-xs text-oxblood-600 font-semibold animate-shake">
              Too many failed attempts. Locked out for {Math.floor(lockoutTimer / 60)}:{(lockoutTimer % 60) < 10 ? "0" : ""}{lockoutTimer % 60}
            </p>
          ) : errors.form ? (
            <p className="text-xs text-oxblood-600 font-semibold animate-shake">
              {errors.form}
            </p>
          ) : codeTimer > 0 ? (
            <p className="text-xs text-slate-500 font-semibold">
              Code expires in 0:{codeTimer < 10 ? "0" + codeTimer : codeTimer}
            </p>
          ) : (
            <p className="text-xs text-oxblood-600 font-semibold">
              Code has expired. Please request a new one.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={actionLoading || lockoutActive}
          className={`w-full py-2.5 rounded-xl font-bold transition flex items-center justify-center text-base ${
            lockoutActive
              ? "bg-slate-300 text-slate-500 cursor-not-allowed"
              : actionLoading
              ? "bg-rosy-copper-600/75 text-white cursor-not-allowed"
              : "bg-rosy-copper-600 hover:bg-rosy-copper-700 text-white cursor-pointer"
          }`}
        >
          {actionLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Verifying...</span>
            </div>
          ) : (
            "Verify Code"
          )}
        </button>

        <div className="flex justify-between items-center text-sm pt-2 border-t border-golden-chestnut-200">
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
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <div className="min-h-screen flex flex-col bg-golden-chestnut-50 text-golden-chestnut-900">
      <div className="flex-1 flex items-center justify-center bg-golden-chestnut-100/40 px-6 py-4">
        <Suspense fallback={
          <div className="w-full max-w-sm p-6 rounded-3xl border border-golden-chestnut-200 bg-white shadow-sm flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-golden-chestnut-200 border-t-rosy-copper-600 rounded-full animate-spin"></div>
          </div>
        }>
          <VerifyOtpContent />
        </Suspense>
      </div>
    </div>
  );
}

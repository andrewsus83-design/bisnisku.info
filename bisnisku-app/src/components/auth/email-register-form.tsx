"use client";

import { useState } from "react";
import { Loader2, Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { registerSchema } from "@/lib/validations/auth";
import { signUpWithEmail } from "@/lib/supabase/auth-actions";

export function EmailRegisterForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const parsed = registerSchema.safeParse({
      fullName,
      email,
      password,
      confirmPassword,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Data tidak valid");
      return;
    }

    setIsLoading(true);
    const result = await signUpWithEmail(email, password, fullName);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    setIsLoading(false);
  };

  // Success state — email sent
  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary/10">
          <Mail className="h-6 w-6 text-brand-primary" />
        </div>
        <div>
          <h2 className="font-heading text-lg font-bold text-brand-dark">
            Cek email Anda
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Kami telah mengirim link konfirmasi ke{" "}
            <span className="font-medium text-brand-dark">{email}</span>.
            Klik link tersebut untuk mengaktifkan akun Anda.
          </p>
        </div>
        <div className="rounded-lg bg-muted px-4 py-3 text-xs text-muted-foreground">
          Tidak menerima email? Cek folder spam atau coba daftar lagi.
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Full Name */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-brand-dark">
          Nama Lengkap
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nama lengkap Anda"
            autoFocus
            autoComplete="name"
            className="w-full rounded-full border border-border bg-white py-2.5 pl-10 pr-4 text-sm text-brand-dark placeholder:text-slate-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-brand-dark">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            autoComplete="email"
            className="w-full rounded-full border border-border bg-white py-2.5 pl-10 pr-4 text-sm text-brand-dark placeholder:text-slate-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-brand-dark">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 8 karakter"
            autoComplete="new-password"
            className="w-full rounded-full border border-border bg-white py-2.5 pl-10 pr-11 text-sm text-brand-dark placeholder:text-slate-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-brand-dark"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Confirm Password */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-brand-dark">
          Konfirmasi Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Ketik ulang password"
            autoComplete="new-password"
            className="w-full rounded-full border border-border bg-white py-2.5 pl-10 pr-4 text-sm text-brand-dark placeholder:text-slate-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-error">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-primary py-2.5 text-sm font-semibold text-brand-dark shadow-[var(--shadow-low)] transition-all hover:bg-brand-primary-hover hover:shadow-[var(--shadow-medium)] disabled:opacity-60"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Mendaftar...
          </>
        ) : (
          "Daftar"
        )}
      </button>
    </form>
  );
}

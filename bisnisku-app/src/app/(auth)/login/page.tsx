import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { EmailLoginForm } from "@/components/auth/email-login-form";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { getSession } from "@/lib/supabase/auth-actions";

export const metadata = {
  title: "Masuk",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reason?: string }>;
}) {
  const user = await getSession();
  if (user) redirect("/dashboard");

  const params = await searchParams;
  const authError = params.error;
  const errorReason = params.reason;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow-[var(--shadow-medium)]">
        {/* Auth callback error */}
        {authError && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-error">
            {authError === "auth_callback_failed"
              ? "Konfirmasi email gagal. Link mungkin sudah kedaluwarsa — coba daftar ulang."
              : "Terjadi kesalahan saat login."}
            {errorReason && (
              <p className="mt-1 text-xs text-red-400">{errorReason}</p>
            )}
          </div>
        )}

        {/* Header */}
        <div className="text-center">
          <Image
            src="/images/logo/logo-icon.svg"
            alt="Bisnisku"
            width={48}
            height={48}
            className="mx-auto mb-4 h-12 w-12 rounded-full"
            priority
          />
          <h1 className="font-heading text-2xl font-bold text-brand-dark">
            Masuk ke Dashboard
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Kelola bisnis Anda dari satu tempat
          </p>
        </div>

        {/* Email + Password Form */}
        <EmailLoginForm />

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-muted-foreground">atau</span>
          </div>
        </div>

        {/* Google OAuth */}
        <GoogleAuthButton />

        {/* Register link */}
        <p className="text-center text-sm text-muted-foreground">
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="font-medium text-brand-dark transition-colors hover:text-brand-primary"
          >
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}

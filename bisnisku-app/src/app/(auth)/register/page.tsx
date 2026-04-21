import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { EmailRegisterForm } from "@/components/auth/email-register-form";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { getSession } from "@/lib/supabase/auth-actions";

export const metadata = {
  title: "Daftar",
};

export default async function RegisterPage() {
  const user = await getSession();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-8">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow-[var(--shadow-medium)]">
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
            Bangun Infrastruktur Bisnis Anda
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Daftar dan mulai kelola bisnis Anda secara digital
          </p>
        </div>

        {/* Register Form */}
        <EmailRegisterForm />

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
        <GoogleAuthButton label="Daftar dengan Google" />

        {/* Login link */}
        <p className="text-center text-sm text-muted-foreground">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="font-medium text-brand-dark transition-colors hover:text-brand-primary"
          >
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}

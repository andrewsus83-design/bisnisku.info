import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Zap, Users, BarChart3, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center flex-1 px-6 py-24 text-center bg-brand-dark">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <Image
              src="/images/logo/logo-icon.svg"
              alt="Bisnisku"
              width={48}
              height={48}
              className="w-12 h-12 rounded-full"
              priority
            />
            <span className="text-white font-heading font-bold text-2xl tracking-tight">
              bisnisku.info
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-heading font-bold text-white leading-tight">
            Partner Cerdas untuk{" "}
            <span className="text-brand-primary">Pertumbuhan Bisnis</span>{" "}
            Anda di Era Digital
          </h1>

          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Platform all-in-one untuk mengelola bisnis offline di Indonesia.
            Marketing, CRM, Loyalty, WhatsApp Automation, dan Directory — semua
            dalam satu platform terintegrasi.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-brand-primary text-brand-dark font-semibold text-lg hover:brightness-110 transition-all"
            >
              Bangun Infrastruktur Bisnis Anda
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full border border-slate-600 text-slate-300 font-medium hover:border-brand-primary hover:text-brand-primary transition-all"
            >
              Masuk Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-heading font-bold text-brand-dark text-center mb-12">
            Semua yang bisnis Anda butuhkan
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Zap,
                title: "AI-Powered Marketing",
                desc: "Landing page, content, dan campaign — semua di-generate AI untuk bisnis Anda.",
              },
              {
                icon: Users,
                title: "CRM & Loyalty",
                desc: "Database pelanggan 360, auto-tagging, stamp cards, dan Bisnisku Points.",
              },
              {
                icon: BarChart3,
                title: "WhatsApp Automation",
                desc: "Smart notifications, booking reminders, promo broadcasts otomatis.",
              },
              {
                icon: Shield,
                title: "Business Directory",
                desc: "Tampil di direktori bisnis modern Jakarta. Bio page + SEO otomatis.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl border border-border hover:shadow-[var(--shadow-low)] transition-shadow"
              >
                <feature.icon className="w-10 h-10 text-brand-primary mb-4" />
                <h3 className="font-heading font-semibold text-brand-dark mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 bg-brand-dark text-slate-400 text-sm text-center">
        <p>&copy; 2026 bisnisku.info — Partner Cerdas untuk Pertumbuhan Bisnis Anda</p>
      </footer>
    </main>
  );
}

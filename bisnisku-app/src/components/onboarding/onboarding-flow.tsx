"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  MapPin,
  Globe,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { completeOnboarding } from "@/lib/supabase/onboarding-actions";
import {
  businessVerticals,
  majorCities,
  onboardingSchema,
  type OnboardingInput,
} from "@/lib/validations/onboarding";

const TOTAL_STEPS = 3;

/* ── Social media SVG icons (not in lucide) ── */
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78c.29 0 .58.04.84.12v-3.5a6.37 6.37 0 0 0-.84-.05A6.34 6.34 0 0 0 3.15 15.3a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.98a8.22 8.22 0 0 0 4.76 1.52V7.05a4.84 4.84 0 0 1-1-.36z" />
    </svg>
  );
}

/* ── Field wrapper ── */
function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-brand-dark">
        {label}
        {!required && (
          <span className="ml-1 text-muted-foreground">(opsional)</span>
        )}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/* ── Styled input ── */
function Input({
  icon: Icon,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      )}
      <input
        {...props}
        className={cn(
          "w-full rounded-full border-2 border-border bg-white py-3.5 pr-4 text-sm text-brand-dark placeholder:text-slate-300 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20",
          Icon ? "pl-10" : "pl-4"
        )}
      />
    </div>
  );
}

/* ── Summary row ── */
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-4 text-right font-medium text-brand-dark">{value}</span>
    </div>
  );
}

export function OnboardingFlow() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Step 1 — Bisnis & Lokasi
  const [businessName, setBusinessName] = useState("");
  const [vertical, setVertical] = useState("");
  const [city, setCity] = useState("");
  const [customCity, setCustomCity] = useState("");

  // Step 2 — Sosial Media
  const [website, setWebsite] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");

  const resolvedCity = city === "Lainnya" ? customCity.trim() : city;

  const canNext = useCallback(() => {
    if (step === 1) {
      const cityValid = city !== "" && (city !== "Lainnya" || customCity.trim().length >= 2);
      return (
        businessName.trim().length >= 2 &&
        vertical !== "" &&
        cityValid
      );
    }
    return true; // Step 2 & 3 — all optional or confirmation
  }, [step, businessName, vertical, city, customCity]);

  const next = () => {
    if (canNext() && step < TOTAL_STEPS) {
      setError("");
      setStep((s) => s + 1);
    }
  };

  const prev = () => {
    if (step > 1) {
      setError("");
      setStep((s) => s - 1);
    }
  };

  const handleSubmit = async () => {
    setError("");
    setIsSubmitting(true);

    const input: OnboardingInput = {
      businessName: businessName.trim(),
      vertical: vertical as OnboardingInput["vertical"],
      city: resolvedCity,
      website: website.trim(),
      whatsapp: whatsapp.trim(),
      instagram: instagram.trim().replace(/^@/, ""),
      facebook: facebook.trim(),
      tiktok: tiktok.trim().replace(/^@/, ""),
    };

    const parsed = onboardingSchema.safeParse(input);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Data tidak valid");
      setIsSubmitting(false);
      return;
    }

    const result = await completeOnboarding(input);
    if (result?.error) {
      setError(result.error);
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !(e.target instanceof HTMLTextAreaElement)) {
      e.preventDefault();
      if (step < TOTAL_STEPS && canNext()) next();
      else if (step === TOTAL_STEPS) handleSubmit();
    }
  };

  const stepMeta = [
    {
      label: "Bisnis Anda",
      title: "Ceritakan tentang bisnis Anda",
      subtitle: "Informasi dasar untuk membuat halaman bisnis dan direktori",
    },
    {
      label: "Online Presence",
      title: "Hubungkan sosial media Anda",
      subtitle: "Agar pelanggan mudah menemukan dan mengikuti bisnis Anda",
    },
    {
      label: "Konfirmasi",
      title: "Siap meluncurkan bisnis Anda!",
      subtitle: "Periksa data Anda dan mulai gunakan Bisnisku",
    },
  ];

  const current = stepMeta[step - 1];

  return (
    <div className="flex min-h-screen flex-col bg-white" onKeyDown={handleKeyDown}>
      {/* Progress bar */}
      <div className="fixed left-0 top-0 z-50 h-1 w-full bg-muted">
        <div
          className="h-full bg-brand-primary transition-all duration-500 ease-out"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 lg:px-12">
        <div className="flex items-center gap-3">
          <Image
            src="/images/logo/logo-icon.svg"
            alt="Bisnisku"
            width={36}
            height={36}
            className="h-9 w-9 rounded-full"
          />
          <span className="font-heading text-sm font-semibold text-brand-dark">
            bisnisku.info
          </span>
        </div>
        <div className="flex items-center gap-2">
          {stepMeta.map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              {i > 0 && (
                <div
                  className={cn(
                    "hidden h-px w-6 sm:block",
                    step > i ? "bg-brand-primary" : "bg-border"
                  )}
                />
              )}
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  step === i + 1
                    ? "bg-brand-primary text-brand-dark"
                    : step > i + 1
                      ? "bg-brand-primary/20 text-brand-dark"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {i + 1}
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* Step content */}
      <main className="flex flex-1 items-start justify-center overflow-y-auto px-6 pb-32 pt-6 lg:items-center lg:pt-0">
        <div className="w-full max-w-lg">
          {/* Step header */}
          <p className="mb-1 text-sm font-medium text-brand-primary">
            Langkah {step} — {current.label}
          </p>
          <h1 className="font-heading text-2xl font-bold text-brand-dark sm:text-3xl">
            {current.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{current.subtitle}</p>

          <div className="mt-8">
            {/* ─── Step 1: Nama Bisnis + Kategori + City ─── */}
            {step === 1 && (
              <div className="space-y-5">
                <Field label="Nama Bisnis" required>
                  <Input
                    type="text"
                    autoFocus
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="contoh: Kopi Nusantara"
                  />
                </Field>

                <div>
                  <label className="mb-3 block text-sm font-medium text-brand-dark">
                    Kategori Bisnis
                  </label>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {businessVerticals.map((v) => (
                      <button
                        key={v.value}
                        type="button"
                        onClick={() => setVertical(v.value)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-all",
                          vertical === v.value
                            ? "border-brand-primary bg-brand-primary/5 text-brand-dark shadow-[var(--shadow-low)]"
                            : "border-border text-muted-foreground hover:border-slate-300 hover:bg-muted/50"
                        )}
                      >
                        <span className="text-lg">{v.emoji}</span>
                        <span>{v.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Field label="Kota" required hint={city === "Jakarta" ? "Fokus utama kami saat ini!" : undefined}>
                  <div className="space-y-2.5">
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <select
                        value={city}
                        onChange={(e) => {
                          setCity(e.target.value);
                          if (e.target.value !== "Lainnya") setCustomCity("");
                        }}
                        className="w-full appearance-none rounded-full border border-border bg-white py-2.5 pl-10 pr-10 text-sm text-brand-dark outline-none transition-colors focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                      >
                        <option value="" disabled>Pilih kota...</option>
                        {majorCities.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                        <option value="Lainnya">Lainnya</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                    {city === "Lainnya" && (
                      <Input
                        type="text"
                        icon={MapPin}
                        value={customCity}
                        onChange={(e) => setCustomCity(e.target.value)}
                        placeholder="Ketik nama kota Anda..."
                        autoFocus
                      />
                    )}
                  </div>
                </Field>
              </div>
            )}

            {/* ─── Step 2: Social Media ─── */}
            {step === 2 && (
              <div className="space-y-5">
                <Field label="Website">
                  <Input
                    type="url"
                    icon={Globe}
                    autoFocus
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://www.bisnis-anda.com"
                  />
                </Field>

                <Field label="WhatsApp Bisnis" hint="Nomor yang bisa dihubungi pelanggan">
                  <Input
                    type="tel"
                    icon={MessageSquare}
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="08123456789"
                  />
                </Field>

                <Field label="TikTok">
                  <Input
                    icon={TikTokIcon}
                    value={tiktok}
                    onChange={(e) => setTiktok(e.target.value)}
                    placeholder="@username_tiktok"
                  />
                </Field>

                <Field label="Instagram">
                  <Input
                    icon={InstagramIcon}
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@username_instagram"
                  />
                </Field>

                <Field label="Facebook">
                  <Input
                    icon={FacebookIcon}
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    placeholder="Nama halaman Facebook"
                  />
                </Field>

                <p className="text-xs text-muted-foreground">
                  Semua field opsional — bisa dilengkapi nanti di pengaturan.
                </p>
              </div>
            )}

            {/* ─── Step 3: Konfirmasi ─── */}
            {step === 3 && (
              <div>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary/10">
                  <CheckCircle2 className="h-7 w-7 text-brand-primary" />
                </div>

                <div className="mt-6 rounded-xl border border-border bg-muted/50 p-5">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Ringkasan
                  </p>
                  <div className="space-y-3 text-sm">
                    <SummaryRow label="Bisnis" value={businessName} />
                    <SummaryRow
                      label="Kategori"
                      value={
                        businessVerticals.find((v) => v.value === vertical)
                          ?.label ?? "-"
                      }
                    />
                    <SummaryRow label="Kota" value={resolvedCity} />
                    {website && <SummaryRow label="Website" value={website} />}
                    {whatsapp && <SummaryRow label="WhatsApp" value={whatsapp} />}
                    {tiktok && (
                      <SummaryRow label="TikTok" value={`@${tiktok.replace(/^@/, "")}`} />
                    )}
                    {instagram && (
                      <SummaryRow label="Instagram" value={`@${instagram.replace(/^@/, "")}`} />
                    )}
                    {facebook && <SummaryRow label="Facebook" value={facebook} />}
                  </div>
                </div>

                <p className="mt-5 text-center text-sm text-muted-foreground">
                  Klik <span className="font-semibold text-brand-dark">Mulai Sekarang</span>{" "}
                  untuk membuat halaman bisnis dan dashboard Anda
                </p>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-error">
              {error}
            </div>
          )}
        </div>
      </main>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-white/80 px-6 py-5 backdrop-blur-sm lg:px-12">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <button
            type="button"
            onClick={prev}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
              step === 1
                ? "invisible"
                : "text-muted-foreground hover:bg-muted hover:text-brand-dark"
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>

          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={next}
              disabled={!canNext()}
              className={cn(
                "flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-all",
                canNext()
                  ? "bg-brand-primary text-brand-dark shadow-[var(--shadow-low)] hover:bg-brand-primary-hover hover:shadow-[var(--shadow-medium)]"
                  : "cursor-not-allowed bg-muted text-muted-foreground"
              )}
            >
              Lanjut
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-full bg-brand-primary px-6 py-2.5 text-sm font-semibold text-brand-dark shadow-[var(--shadow-low)] transition-all hover:bg-brand-primary-hover hover:shadow-[var(--shadow-medium)] disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Membuat bisnis...
                </>
              ) : (
                <>
                  Mulai Sekarang
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

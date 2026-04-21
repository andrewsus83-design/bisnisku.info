import {
  Users,
  CreditCard,
  CalendarDays,
  MessageSquare,
  TrendingUp,
  ArrowUpRight,
  Store,
  Sparkles,
  Gift,
  ShoppingBag,
} from "lucide-react";

/** Stat card data — will be dynamic once CRM/payments are wired */
const stats = [
  {
    label: "Total Pelanggan",
    value: "0",
    change: null,
    icon: Users,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    label: "Pendapatan Bulan Ini",
    value: "Rp 0",
    change: null,
    icon: CreditCard,
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
  },
  {
    label: "Booking Aktif",
    value: "0",
    change: null,
    icon: CalendarDays,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    label: "Pesan WhatsApp",
    value: "0",
    change: null,
    icon: MessageSquare,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
];

const quickActions = [
  {
    label: "Buat Bio Page",
    description: "Buat halaman bisnis Anda dalam hitungan menit",
    icon: Store,
    href: "/dashboard/bio-page",
    color: "text-brand-primary",
    bg: "bg-brand-primary/10",
  },
  {
    label: "Tambah Produk",
    description: "Kelola voucher, produk digital, dan promo",
    icon: ShoppingBag,
    href: "/dashboard/products",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    label: "AI Landing Page",
    description: "Generate landing page dengan kecerdasan buatan",
    icon: Sparkles,
    href: "/dashboard/landing-page",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    label: "Program Loyalty",
    description: "Buat stamp card dan points untuk pelanggan",
    icon: Gift,
    href: "/dashboard/loyalty",
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-dark">
          Selamat Datang di Bisnisku
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola semua aspek bisnis Anda dari satu dashboard
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-white p-5 shadow-[var(--shadow-low)] transition-shadow hover:shadow-[var(--shadow-medium)]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 font-heading text-2xl font-bold text-brand-dark">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${stat.iconBg}`}
                >
                  <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
              </div>
              {stat.change && (
                <div className="mt-3 flex items-center gap-1 text-xs text-success">
                  <TrendingUp className="h-3 w-3" />
                  <span>{stat.change}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 font-heading text-lg font-semibold text-brand-dark">
          Mulai Sekarang
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <a
                key={action.label}
                href={action.href}
                className="group rounded-xl border border-border bg-white p-5 shadow-[var(--shadow-low)] transition-all hover:border-brand-primary/30 hover:shadow-[var(--shadow-medium)]"
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${action.bg}`}
                  >
                    <Icon className={`h-5 w-5 ${action.color}`} />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <h3 className="mt-3 font-heading text-sm font-semibold text-brand-dark">
                  {action.label}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {action.description}
                </p>
              </a>
            );
          })}
        </div>
      </div>

      {/* Empty state — activity feed placeholder */}
      <div className="rounded-xl border border-dashed border-border bg-white p-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <TrendingUp className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 font-heading text-base font-semibold text-brand-dark">
          Aktivitas Terbaru
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Belum ada aktivitas. Mulai dengan membuat Bio Page atau menambahkan
          produk pertama Anda.
        </p>
        <a
          href="/dashboard/bio-page"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-primary px-5 py-2.5 text-sm font-semibold text-brand-dark shadow-[var(--shadow-low)] transition-all hover:bg-brand-primary-hover hover:shadow-[var(--shadow-medium)]"
        >
          <Store className="h-4 w-4" />
          Buat Bio Page
        </a>
      </div>
    </div>
  );
}

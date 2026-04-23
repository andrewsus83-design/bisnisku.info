import {
  LayoutDashboard,
  Store,
  CreditCard,
  MessageSquare,
  Users,
  Gift,
  FileText,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  CalendarDays,
  QrCode,
  Globe,
  BadgeCheck,
  Megaphone,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  disabled?: boolean;
  sprint?: number;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const sidebarNav: NavGroup[] = [
  {
    title: "Utama",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Bio Page", href: "/dashboard/bio-page", icon: Store },
    ],
  },
  {
    title: "Revenue",
    items: [
      { label: "Pembayaran", href: "/dashboard/payments", icon: CreditCard, sprint: 3, disabled: true },
      { label: "WhatsApp", href: "/dashboard/whatsapp", icon: MessageSquare, sprint: 4 },
      { label: "CRM", href: "/dashboard/crm", icon: Users },
      { label: "Loyalty", href: "/dashboard/loyalty", icon: Gift, sprint: 6 },
    ],
  },
  {
    title: "Marketing",
    items: [
      { label: "Konten", href: "/dashboard/content", icon: FileText },
      { label: "Produk", href: "/dashboard/products", icon: ShoppingBag, sprint: 8 },
      { label: "Landing Page AI", href: "/dashboard/landing-page", icon: Sparkles, sprint: 9 },
      { label: "Growth Tools", href: "/dashboard/growth", icon: TrendingUp, sprint: 10 },
    ],
  },
  {
    title: "Operasional",
    items: [
      { label: "Booking", href: "/dashboard/booking", icon: CalendarDays, sprint: 11 },
      { label: "Menu Digital", href: "/dashboard/menu", icon: QrCode, sprint: 12 },
    ],
  },
  {
    title: "Platform",
    items: [
      { label: "Direktori", href: "/dashboard/directory", icon: Globe, sprint: 13 },
      { label: "Verifikasi", href: "/dashboard/verification", icon: BadgeCheck, sprint: 14 },
      { label: "Outreach", href: "/dashboard/outreach", icon: Megaphone, sprint: 15, disabled: true },
    ],
  },
  {
    title: "Pengaturan",
    items: [
      { label: "Billing", href: "/dashboard/settings/billing", icon: CreditCard },
      { label: "Pengaturan", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

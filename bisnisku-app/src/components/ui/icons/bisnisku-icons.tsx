"use client";

/**
 * ════════════════════════════════════════════════════════════════
 * BISNISKU ICON SYSTEM v1.0
 * ════════════════════════════════════════════════════════════════
 *
 * Custom stroke-based SVG icon set for the Bisnisku Design System.
 *
 * Design spec:
 *   • Stroke-based, 24×24 viewBox
 *   • Stroke width: 1.8px (lighter than Lucide 2px for elegance)
 *   • Round caps & joins
 *   • Consistent 2px padding inside viewBox
 *   • Color inherited via currentColor
 *
 * Usage:
 *   import { BiIcon } from "@/components/ui/icons";
 *   <BiIcon name="home" size="md" />
 *   <BiIcon name="star" size="lg" className="text-brand-primary" />
 *
 * Or import individual icons:
 *   import { BiHome, BiStar } from "@/components/ui/icons";
 *   <BiHome className="h-5 w-5" />
 */

import { type SVGProps, forwardRef } from "react";

// ── Icon path data ──────────────────────────────────────────────
// Each entry is an array of SVG child element strings (path, circle, etc.)
// All icons share: viewBox="0 0 24 24", stroke-based, 1.8px stroke

export const BISNISKU_ICON_PATHS = {
  home: [
    '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    '<polyline points="9 22 9 12 15 12 15 22"/>',
  ],
  info: [
    '<circle cx="12" cy="12" r="10"/>',
    '<line x1="12" y1="16" x2="12" y2="12"/>',
    '<line x1="12" y1="8" x2="12.01" y2="8"/>',
  ],
  tag: [
    '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>',
    '<line x1="7" y1="7" x2="7.01" y2="7"/>',
  ],
  service: [
    '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  ],
  menu: [
    '<path d="M3 3h18v18H3z"/>',
    '<path d="M12 8v8"/>',
    '<path d="M8 12h8"/>',
  ],
  utensils: [
    '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>',
    '<line x1="7" y1="2" x2="7" y2="22"/>',
    '<path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  ],
  phone: [
    '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  ],
  link: [
    '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>',
    '<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  ],
  "map-pin": [
    '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>',
    '<circle cx="12" cy="10" r="3"/>',
  ],
  image: [
    '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>',
    '<circle cx="8.5" cy="8.5" r="1.5"/>',
    '<polyline points="21 15 16 10 5 21"/>',
  ],
  star: [
    '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  ],
  calendar: [
    '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>',
    '<line x1="16" y1="2" x2="16" y2="6"/>',
    '<line x1="8" y1="2" x2="8" y2="6"/>',
    '<line x1="3" y1="10" x2="21" y2="10"/>',
  ],
  code: [
    '<polyline points="16 18 22 12 16 6"/>',
    '<polyline points="8 6 2 12 8 18"/>',
  ],
  layers: [
    '<polygon points="12 2 2 7 12 12 22 7 12 2"/>',
    '<polyline points="2 17 12 22 22 17"/>',
    '<polyline points="2 12 12 17 22 12"/>',
  ],
  palette: [
    '<circle cx="13.5" cy="6.5" r="0.01"/>',
    '<circle cx="17.5" cy="10.5" r="0.01"/>',
    '<circle cx="8.5" cy="7.5" r="0.01"/>',
    '<circle cx="6.5" cy="12" r="0.01"/>',
    '<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.04-.23-.29-.38-.63-.38-1.01 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-5.17-4.49-9-10-9z"/>',
  ],
  monitor: [
    '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>',
    '<line x1="8" y1="21" x2="16" y2="21"/>',
    '<line x1="12" y1="17" x2="12" y2="21"/>',
  ],
  smartphone: [
    '<rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>',
    '<line x1="12" y1="18" x2="12.01" y2="18"/>',
  ],
  save: [
    '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>',
    '<polyline points="17 21 17 13 7 13 7 21"/>',
    '<polyline points="7 3 7 8 15 8"/>',
  ],
  globe: [
    '<circle cx="12" cy="12" r="10"/>',
    '<line x1="2" y1="12" x2="22" y2="12"/>',
    '<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  ],
  "chevron-up": ['<polyline points="18 15 12 9 6 15"/>'],
  "chevron-down": ['<polyline points="6 9 12 15 18 9"/>'],
  "chevron-left": ['<polyline points="15 18 9 12 15 6"/>'],
  "chevron-right": ['<polyline points="9 6 15 12 9 18"/>'],
  eye: [
    '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>',
    '<circle cx="12" cy="12" r="3"/>',
  ],
  "eye-off": [
    '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>',
    '<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>',
    '<line x1="1" y1="1" x2="23" y2="23"/>',
    '<path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>',
  ],
  "arrow-right": [
    '<line x1="5" y1="12" x2="19" y2="12"/>',
    '<polyline points="12 5 19 12 12 19"/>',
  ],
  "arrow-left": [
    '<line x1="19" y1="12" x2="5" y2="12"/>',
    '<polyline points="12 19 5 12 12 5"/>',
  ],
  mail: [
    '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>',
    '<polyline points="22 6 12 13 2 6"/>',
  ],
  "message-circle": [
    '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
  ],
  instagram: [
    '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>',
    '<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>',
    '<line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>',
  ],
  facebook: [
    '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
  ],
  external: [
    '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    '<polyline points="15 3 21 3 21 9"/>',
    '<line x1="10" y1="14" x2="21" y2="3"/>',
  ],
  search: [
    '<circle cx="11" cy="11" r="8"/>',
    '<line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  ],
  fire: [
    '<path d="M12 12c-2-2.67-4-4-4-6.5a4 4 0 0 1 8 0c0 2.5-2 3.83-4 6.5z"/>',
    '<path d="M8 21c0-3 2.5-5 4-7 1.5 2 4 4 4 7a4 4 0 0 1-8 0z"/>',
  ],
  plus: [
    '<line x1="12" y1="5" x2="12" y2="19"/>',
    '<line x1="5" y1="12" x2="19" y2="12"/>',
  ],
  minus: ['<line x1="5" y1="12" x2="19" y2="12"/>'],
  x: [
    '<line x1="18" y1="6" x2="6" y2="18"/>',
    '<line x1="6" y1="6" x2="18" y2="18"/>',
  ],
  check: ['<polyline points="20 6 9 17 4 12"/>'],
  settings: [
    '<circle cx="12" cy="12" r="3"/>',
    '<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  ],
  users: [
    '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>',
    '<circle cx="9" cy="7" r="4"/>',
    '<path d="M23 21v-2a4 4 0 0 0-3-3.87"/>',
    '<path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  ],
  user: [
    '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>',
    '<circle cx="12" cy="7" r="4"/>',
  ],
  heart: [
    '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
  ],
  whatsapp: [
    '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>',
    '<path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>',
  ],
  "trending-up": [
    '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>',
    '<polyline points="17 6 23 6 23 12"/>',
  ],
  clock: [
    '<circle cx="12" cy="12" r="10"/>',
    '<polyline points="12 6 12 12 16 14"/>',
  ],
  gift: [
    '<polyline points="20 12 20 22 4 22 4 12"/>',
    '<rect x="2" y="7" width="20" height="5"/>',
    '<line x1="12" y1="22" x2="12" y2="7"/>',
    '<path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>',
    '<path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
  ],
  "bar-chart": [
    '<line x1="12" y1="20" x2="12" y2="10"/>',
    '<line x1="18" y1="20" x2="18" y2="4"/>',
    '<line x1="6" y1="20" x2="6" y2="16"/>',
  ],
  qrcode: [
    '<rect x="3" y="3" width="7" height="7"/>',
    '<rect x="14" y="3" width="7" height="7"/>',
    '<rect x="3" y="14" width="7" height="7"/>',
    '<rect x="14" y="14" width="3" height="3"/>',
    '<line x1="21" y1="14" x2="21" y2="14.01"/>',
    '<line x1="14" y1="21" x2="14" y2="21.01"/>',
    '<line x1="21" y1="21" x2="21" y2="21.01"/>',
    '<line x1="18" y1="18" x2="18" y2="18.01"/>',
  ],
  tiktok: [
    '<path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>',
  ],
  logout: [
    '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>',
    '<polyline points="16 17 21 12 16 7"/>',
    '<line x1="21" y1="12" x2="9" y2="12"/>',
  ],
  "drag-handle": [
    '<circle cx="9" cy="6" r="0.01"/>',
    '<circle cx="15" cy="6" r="0.01"/>',
    '<circle cx="9" cy="12" r="0.01"/>',
    '<circle cx="15" cy="12" r="0.01"/>',
    '<circle cx="9" cy="18" r="0.01"/>',
    '<circle cx="15" cy="18" r="0.01"/>',
  ],
  trash: [
    '<polyline points="3 6 5 6 21 6"/>',
    '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  ],
  edit: [
    '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>',
    '<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
  ],
  copy: [
    '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>',
    '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  ],
} as const;

// ── Types ───────────────────────────────────────────────────────

export type BiIconName = keyof typeof BISNISKU_ICON_PATHS;

export const ICON_NAMES = Object.keys(BISNISKU_ICON_PATHS) as BiIconName[];

export type BiIconSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_MAP: Record<BiIconSize, string> = {
  xs: "h-3.5 w-3.5",   // 14px
  sm: "h-4 w-4",       // 16px
  md: "h-5 w-5",       // 20px
  lg: "h-6 w-6",       // 24px
  xl: "h-8 w-8",       // 32px
};

// ── Component ───────────────────────────────────────────────────

export interface BiIconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  /** Icon name from the Bisnisku icon set */
  name: BiIconName;
  /** Predefined size: xs(14) sm(16) md(20) lg(24) xl(32) */
  size?: BiIconSize;
}

export const BiIcon = forwardRef<SVGSVGElement, BiIconProps>(
  ({ name, size = "md", className = "", ...props }, ref) => {
    const paths = BISNISKU_ICON_PATHS[name];
    if (!paths) {
      console.warn(`[BiIcon] Unknown icon: "${name}"`);
      return null;
    }

    const sizeClass = SIZE_MAP[size];

    return (
      <svg
        ref={ref}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`inline-flex shrink-0 ${sizeClass} ${className}`}
        aria-hidden="true"
        {...props}
        dangerouslySetInnerHTML={{ __html: paths.join("") }}
      />
    );
  }
);

BiIcon.displayName = "BiIcon";

// ── Named exports for convenience ───────────────────────────────
// Usage: import { BiHome, BiStar } from "@/components/ui/icons";

function createNamedIcon(name: BiIconName, displayName: string) {
  const Component = forwardRef<SVGSVGElement, Omit<BiIconProps, "name">>(
    (props, ref) => <BiIcon ref={ref} name={name} {...props} />
  );
  Component.displayName = displayName;
  return Component;
}

export const BiHome = createNamedIcon("home", "BiHome");
export const BiInfo = createNamedIcon("info", "BiInfo");
export const BiTag = createNamedIcon("tag", "BiTag");
export const BiService = createNamedIcon("service", "BiService");
export const BiMenu = createNamedIcon("menu", "BiMenu");
export const BiUtensils = createNamedIcon("utensils", "BiUtensils");
export const BiPhone = createNamedIcon("phone", "BiPhone");
export const BiLink = createNamedIcon("link", "BiLink");
export const BiMapPin = createNamedIcon("map-pin", "BiMapPin");
export const BiImage = createNamedIcon("image", "BiImage");
export const BiStar = createNamedIcon("star", "BiStar");
export const BiCalendar = createNamedIcon("calendar", "BiCalendar");
export const BiCode = createNamedIcon("code", "BiCode");
export const BiLayers = createNamedIcon("layers", "BiLayers");
export const BiPalette = createNamedIcon("palette", "BiPalette");
export const BiMonitor = createNamedIcon("monitor", "BiMonitor");
export const BiSmartphone = createNamedIcon("smartphone", "BiSmartphone");
export const BiSave = createNamedIcon("save", "BiSave");
export const BiGlobe = createNamedIcon("globe", "BiGlobe");
export const BiChevronUp = createNamedIcon("chevron-up", "BiChevronUp");
export const BiChevronDown = createNamedIcon("chevron-down", "BiChevronDown");
export const BiChevronLeft = createNamedIcon("chevron-left", "BiChevronLeft");
export const BiChevronRight = createNamedIcon("chevron-right", "BiChevronRight");
export const BiEye = createNamedIcon("eye", "BiEye");
export const BiEyeOff = createNamedIcon("eye-off", "BiEyeOff");
export const BiArrowRight = createNamedIcon("arrow-right", "BiArrowRight");
export const BiArrowLeft = createNamedIcon("arrow-left", "BiArrowLeft");
export const BiMail = createNamedIcon("mail", "BiMail");
export const BiMessageCircle = createNamedIcon("message-circle", "BiMessageCircle");
export const BiInstagram = createNamedIcon("instagram", "BiInstagram");
export const BiFacebook = createNamedIcon("facebook", "BiFacebook");
export const BiExternal = createNamedIcon("external", "BiExternal");
export const BiSearch = createNamedIcon("search", "BiSearch");
export const BiFire = createNamedIcon("fire", "BiFire");
export const BiPlus = createNamedIcon("plus", "BiPlus");
export const BiMinus = createNamedIcon("minus", "BiMinus");
export const BiX = createNamedIcon("x", "BiX");
export const BiCheck = createNamedIcon("check", "BiCheck");
export const BiSettings = createNamedIcon("settings", "BiSettings");
export const BiUsers = createNamedIcon("users", "BiUsers");
export const BiUser = createNamedIcon("user", "BiUser");
export const BiHeart = createNamedIcon("heart", "BiHeart");
export const BiWhatsapp = createNamedIcon("whatsapp", "BiWhatsapp");
export const BiTrendingUp = createNamedIcon("trending-up", "BiTrendingUp");
export const BiClock = createNamedIcon("clock", "BiClock");
export const BiGift = createNamedIcon("gift", "BiGift");
export const BiBarChart = createNamedIcon("bar-chart", "BiBarChart");
export const BiQrcode = createNamedIcon("qrcode", "BiQrcode");
export const BiTiktok = createNamedIcon("tiktok", "BiTiktok");
export const BiLogout = createNamedIcon("logout", "BiLogout");
export const BiDragHandle = createNamedIcon("drag-handle", "BiDragHandle");
export const BiTrash = createNamedIcon("trash", "BiTrash");
export const BiEdit = createNamedIcon("edit", "BiEdit");
export const BiCopy = createNamedIcon("copy", "BiCopy");

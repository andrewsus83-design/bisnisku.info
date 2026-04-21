"use client";

import Image from "next/image";
import {
  MapPin,
  Phone,
  Mail,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import {
  getFontFamily,
  getTextureCSS,
  type BackgroundTexture,
} from "@/lib/validations/bio-page";

interface BioPageData {
  business: {
    name: string;
    slug: string;
    description: string | null;
    vertical: string;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    website: string | null;
    address: string | null;
    city: string | null;
    logo_url: string | null;
    cover_url: string | null;
    instagram: string | null;
    facebook: string | null;
    tiktok: string | null;
  };
  bioPage: {
    theme: {
      primaryColor: string;
      accentColor: string;
      primaryFont?: string;
      secondaryFont?: string;
      /** @deprecated — backward compat */
      fontFamily?: string;
      buttonStyle: string;
      darkMode: boolean;
      backgroundTheme?: string;
      backgroundTexture?: string;
    };
    custom_css: string | null;
  };
  blocks: Array<{
    type: string;
    content: Record<string, unknown>;
    settings: Record<string, unknown>;
    is_visible: boolean;
  }>;
  services: Array<{
    id: string;
    name: string;
    description: string | null;
    price: number | null;
    price_max: number | null;
    duration_min: number | null;
    image_url: string | null;
  }>;
  menuItems: Array<{
    id: string;
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
    is_popular: boolean;
    menu_categories: { name: string } | null;
  }>;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}

/** Background style for solid or gradient colors */
function colorBg(color: string): React.CSSProperties {
  if (color.startsWith("linear-gradient")) return { background: color };
  return { backgroundColor: color };
}

/** Extract first hex from gradient or return as-is */
function extractColor(color: string): string {
  if (color.startsWith("linear-gradient")) {
    const m = color.match(/#[0-9A-Fa-f]{6}/);
    return m ? m[0] : "#0F172A";
  }
  return color;
}

/** Light tint background */
function tintBg(color: string, opacity: string): React.CSSProperties {
  return { backgroundColor: extractColor(color) + opacity };
}

export function PublicBioPage({ data }: { data: BioPageData }) {
  const { business, bioPage, blocks, services, menuItems } = data;
  const theme = bioPage.theme;

  // Resolve fonts (backward compat: fontFamily → primaryFont)
  const headingFont = getFontFamily(theme.primaryFont || theme.fontFamily || "Plus Jakarta Sans");
  const bodyFont = getFontFamily(theme.secondaryFont || "Inter");
  const texture = (theme.backgroundTexture || "none") as BackgroundTexture;
  const textureStyle = getTextureCSS(texture, theme.darkMode);

  const bg = theme.darkMode ? "#0F172A" : "#FFFFFF";
  const text = theme.darkMode ? "#F1F5F9" : "#0F172A";
  const muted = theme.darkMode ? "#1E293B" : "#F1F5F9";
  const mutedText = theme.darkMode ? "#94A3B8" : "#64748B";
  const borderColor = theme.darkMode ? "#334155" : "#E2E8F0";
  const btnRadius =
    theme.buttonStyle === "pill"
      ? "9999px"
      : theme.buttonStyle === "square"
        ? "0px"
        : "8px";

  return (
    <div
      className="relative mx-auto min-h-screen w-full lg:w-4/5"
      style={{ backgroundColor: bg, color: text, fontFamily: bodyFont }}
    >
      {/* Background texture overlay */}
      {texture !== "none" && (
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={textureStyle}
        />
      )}
      {/* Custom CSS */}
      {bioPage.custom_css && <style>{bioPage.custom_css}</style>}

      {blocks
        .filter((b) => b.is_visible)
        .map((block, i) => (
          <section key={i} className="relative z-10">
            {/* ── Hero ── */}
            {block.type === "hero" && (
              <div
                className="relative flex min-h-[280px] flex-col items-center justify-center px-6 py-16 text-center"
                style={colorBg(theme.primaryColor)}
              >
                {(block.content.imageUrl as string) && (
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-20"
                    style={{ backgroundImage: `url(${block.content.imageUrl})` }}
                  />
                )}
                <div className="relative z-10">
                  {business.logo_url && (
                    <Image
                      src={business.logo_url}
                      alt={business.name}
                      width={80}
                      height={80}
                      className="mx-auto mb-4 rounded-xl"
                    />
                  )}
                  <h1
                    className="text-3xl font-bold text-white"
                    style={{ fontFamily: headingFont }}
                  >
                    {(block.content.title as string) || business.name}
                  </h1>
                  <p className="mt-2 text-base text-white/80">
                    {(block.content.subtitle as string) || business.description}
                  </p>
                  {/* CTA Button */}
                  {(block.content.ctaText as string) ? (
                    <a
                      href={(block.content.ctaUrl as string) || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold"
                      style={{
                        backgroundColor: theme.accentColor,
                        color: theme.primaryColor,
                        borderRadius: btnRadius,
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                      {block.content.ctaText as string}
                    </a>
                  ) : business.whatsapp ? (
                    <a
                      href={`https://wa.me/${business.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white"
                      style={{
                        backgroundColor: "#25D366",
                        borderRadius: btnRadius,
                      }}
                    >
                      <MessageSquare className="h-4 w-4" />
                      Hubungi via WhatsApp
                    </a>
                  ) : null}
                </div>
              </div>
            )}

            {/* ── About ── */}
            {block.type === "about" && (
              <div className="mx-auto max-w-2xl px-6 py-10" style={tintBg(theme.accentColor, "10")}>
                <h2
                  className="mb-4 text-xl font-bold"
                  style={{ fontFamily: headingFont }}
                >
                  {(block.content.heading as string) || "Tentang Kami"}
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: mutedText }}>
                  {(block.content.description as string) ||
                    business.description ||
                    ""}
                </p>
              </div>
            )}

            {/* ── Services ── */}
            {block.type === "services" && services.length > 0 && (
              <div className="px-6 py-10" style={tintBg(theme.primaryColor, "0A")}>
                <div className="mx-auto max-w-2xl">
                  <h2
                    className="mb-6 text-xl font-bold"
                    style={{ fontFamily: headingFont }}
                  >
                    Layanan Kami
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {services.map((svc) => (
                      <div
                        key={svc.id}
                        className="rounded-xl p-4"
                        style={{
                          backgroundColor: theme.darkMode ? "#0F172A" : "#FFFFFF",
                          border: `1px solid ${borderColor}`,
                        }}
                      >
                        {svc.image_url && (
                          <Image
                            src={svc.image_url}
                            alt={svc.name}
                            width={400}
                            height={200}
                            className="mb-3 h-32 w-full rounded-lg object-cover"
                          />
                        )}
                        <h3 className="font-semibold">{svc.name}</h3>
                        {svc.description && (
                          <p
                            className="mt-1 text-xs"
                            style={{ color: mutedText }}
                          >
                            {svc.description}
                          </p>
                        )}
                        <div className="mt-2 flex items-center justify-between">
                          <span
                            className="text-sm font-bold"
                            style={{ color: theme.accentColor }}
                          >
                            {svc.price
                              ? svc.price_max
                                ? `${formatPrice(svc.price)} - ${formatPrice(svc.price_max)}`
                                : formatPrice(svc.price)
                              : "Hubungi kami"}
                          </span>
                          {svc.duration_min && (
                            <span className="text-xs" style={{ color: mutedText }}>
                              {svc.duration_min} menit
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Menu ── */}
            {block.type === "menu" && menuItems.length > 0 && (
              <div className="px-6 py-10" style={tintBg(theme.accentColor, "08")}>
                <div className="mx-auto max-w-2xl">
                  <h2
                    className="mb-6 text-xl font-bold"
                    style={{ fontFamily: headingFont }}
                  >
                    Menu
                  </h2>
                  <div className="space-y-4">
                    {menuItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 border-b pb-4"
                        style={{ borderColor }}
                      >
                        {item.image_url && (
                          <Image
                            src={item.image_url}
                            alt={item.name}
                            width={80}
                            height={80}
                            className="h-16 w-16 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-sm font-semibold">
                                {item.name}
                                {item.is_popular && (
                                  <span
                                    className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium"
                                    style={{
                                      backgroundColor: theme.accentColor + "20",
                                      color: theme.accentColor,
                                    }}
                                  >
                                    Populer
                                  </span>
                                )}
                              </h3>
                              {item.menu_categories?.name && (
                                <p className="text-xs" style={{ color: mutedText }}>
                                  {item.menu_categories.name}
                                </p>
                              )}
                            </div>
                            <span
                              className="text-sm font-bold"
                              style={{ color: theme.accentColor }}
                            >
                              {formatPrice(item.price)}
                            </span>
                          </div>
                          {item.description && (
                            <p
                              className="mt-1 text-xs"
                              style={{ color: mutedText }}
                            >
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Contact ── */}
            {block.type === "contact" && (
              <div className="px-6 py-10" style={tintBg(theme.accentColor, "08")}>
                <div className="mx-auto max-w-2xl">
                  <h2
                    className="mb-4 text-xl font-bold"
                    style={{ fontFamily: headingFont }}
                  >
                    Hubungi Kami
                  </h2>
                  <div className="space-y-3">
                    {business.phone && (
                      <a
                        href={`tel:${business.phone}`}
                        className="flex items-center gap-3 text-sm"
                        style={{ color: mutedText }}
                      >
                        <Phone className="h-4 w-4" /> {business.phone}
                      </a>
                    )}
                    {business.whatsapp && (
                      <a
                        href={`https://wa.me/${business.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-sm"
                        style={{ color: mutedText }}
                      >
                        <MessageSquare className="h-4 w-4" /> {business.whatsapp}
                      </a>
                    )}
                    {business.email && (
                      <a
                        href={`mailto:${business.email}`}
                        className="flex items-center gap-3 text-sm"
                        style={{ color: mutedText }}
                      >
                        <Mail className="h-4 w-4" /> {business.email}
                      </a>
                    )}
                    {business.address && (
                      <div
                        className="flex items-start gap-3 text-sm"
                        style={{ color: mutedText }}
                      >
                        <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span>
                          {business.address}
                          {business.city && `, ${business.city}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Social Links ── */}
            {block.type === "social_links" && (
              <div className="px-6 py-8" style={tintBg(theme.primaryColor, "0A")}>
                <div className="mx-auto flex max-w-2xl flex-wrap justify-center gap-4">
                  {business.instagram && (
                    <SocialLink
                      href={`https://instagram.com/${business.instagram.replace("@", "")}`}
                      label="Instagram"
                      color={theme.primaryColor}
                    />
                  )}
                  {business.facebook && (
                    <SocialLink
                      href={`https://facebook.com/${business.facebook}`}
                      label="Facebook"
                      color={theme.primaryColor}
                    />
                  )}
                  {business.tiktok && (
                    <SocialLink
                      href={`https://tiktok.com/${business.tiktok.startsWith("@") ? business.tiktok : "@" + business.tiktok}`}
                      label="TikTok"
                      color={theme.primaryColor}
                    />
                  )}
                  {business.website && (
                    <SocialLink
                      href={business.website}
                      label="Website"
                      color={theme.primaryColor}
                    />
                  )}
                </div>
              </div>
            )}

            {/* ── Gallery (placeholder) ── */}
            {block.type === "gallery" && (
              <div className="px-6 py-10" style={tintBg(theme.primaryColor, "08")}>
                <div className="mx-auto max-w-2xl">
                  <h2
                    className="mb-4 text-xl font-bold"
                    style={{ fontFamily: headingFont }}
                  >
                    {(block.content.heading as string) || "Galeri"}
                  </h2>
                  <div className="rounded-lg p-8 text-center text-sm" style={{ color: mutedText }}>
                    Foto galeri akan ditampilkan di sini
                  </div>
                </div>
              </div>
            )}

            {/* ── Location Map ── */}
            {block.type === "location_map" && (
              <div className="px-6 py-10" style={tintBg(theme.primaryColor, "08")}>
                <div className="mx-auto max-w-2xl">
                  <h2
                    className="mb-4 text-xl font-bold"
                    style={{ fontFamily: headingFont }}
                  >
                    Lokasi
                  </h2>
                  <div
                    className="flex h-48 items-center justify-center rounded-xl"
                    style={{ border: `1px solid ${borderColor}` }}
                  >
                    <MapPin className="mr-2 h-5 w-5" style={{ color: mutedText }} />
                    <span style={{ color: mutedText }}>
                      {(block.content.address as string) ||
                        business.address ||
                        "Lokasi belum diatur"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ── Promo Banner ── */}
            {block.type === "promo_banner" && (
              <div
                className="px-6 py-10 text-center"
                style={tintBg(theme.accentColor, "15")}
              >
                <h2 className="text-xl font-bold">
                  {(block.content.title as string) || "Promo Spesial"}
                </h2>
                <p className="mt-2 text-sm" style={{ color: mutedText }}>
                  {(block.content.description as string) || ""}
                </p>
                {(block.content.buttonText as string) && business.whatsapp && (
                  <a
                    href={`https://wa.me/${business.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent((block.content.title as string) || "Promo")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block px-6 py-2.5 text-sm font-semibold text-white"
                    style={{
                      ...colorBg(theme.primaryColor),
                      borderRadius: btnRadius,
                    }}
                  >
                    {block.content.buttonText as string}
                  </a>
                )}
              </div>
            )}

            {/* ── Custom HTML ── */}
            {block.type === "custom_html" && (block.content.html as string) && (
              <div className="mx-auto max-w-2xl px-6 py-8">
                <div
                  dangerouslySetInnerHTML={{
                    __html: block.content.html as string,
                  }}
                />
              </div>
            )}
          </section>
        ))}

      {/* Footer */}
      <footer
        className="relative z-10 px-6 py-6 text-center text-xs"
        style={{ color: mutedText, borderTop: `1px solid ${borderColor}` }}
      >
        <p>
          {business.name} &copy; {new Date().getFullYear()} &middot; Powered by{" "}
          <a
            href="https://bisnisku.info"
            className="font-medium underline"
            style={{ color: theme.accentColor }}
          >
            bisnisku.info
          </a>
        </p>
      </footer>

      {/* Floating WhatsApp Button */}
      {business.whatsapp && (
        <a
          href={`https://wa.me/${business.whatsapp.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110"
          style={{ backgroundColor: "#25D366" }}
          aria-label="Hubungi via WhatsApp"
        >
          <MessageSquare className="h-6 w-6 text-white" />
        </a>
      )}
    </div>
  );
}

function SocialLink({
  href,
  label,
  color,
}: {
  href: string;
  label: string;
  color: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
      style={colorBg(color)}
    >
      <ExternalLink className="h-3.5 w-3.5" />
      {label}
    </a>
  );
}

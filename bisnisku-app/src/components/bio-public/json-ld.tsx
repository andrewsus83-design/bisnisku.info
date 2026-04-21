/**
 * JSON-LD Structured Data for Bio Pages
 *
 * Generates LocalBusiness + BreadcrumbList schemas for Google Rich Snippets.
 * This is the single most impactful SEO element for local business pages.
 *
 * Reference: https://schema.org/LocalBusiness
 * Reference: https://developers.google.com/search/docs/appearance/structured-data/local-business
 */

const BASE_URL = "https://bisnisku.info";

/** Map business vertical to Schema.org @type */
const verticalToSchemaType: Record<string, string> = {
  fnb: "Restaurant",
  beauty: "BeautySalon",
  health: "MedicalBusiness",
  automotive: "AutoRepair",
  other: "LocalBusiness",
};

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
    theme: Record<string, unknown>;
  };
  services: Array<{
    id: string;
    name: string;
    description: string | null;
    price: number | null;
    price_max: number | null;
  }>;
  menuItems: Array<{
    id: string;
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
    menu_categories: { name: string } | null;
  }>;
}

export function LocalBusinessJsonLd({ data }: { data: BioPageData }) {
  const { business, services, menuItems } = data;
  const pageUrl = `${BASE_URL}/${business.slug}`;
  const schemaType = verticalToSchemaType[business.vertical] || "LocalBusiness";

  // ── LocalBusiness Schema ──
  const localBusiness: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": schemaType,
    "@id": pageUrl,
    name: business.name,
    url: pageUrl,
    ...(business.description && { description: business.description }),
    ...(business.logo_url && { logo: business.logo_url }),
    ...(business.cover_url && { image: business.cover_url }),
    ...(business.phone && { telephone: business.phone }),
    ...(business.email && { email: business.email }),
    ...(business.website && {
      sameAs: [
        business.website,
        business.instagram
          ? `https://instagram.com/${business.instagram.replace("@", "")}`
          : null,
        business.facebook
          ? `https://facebook.com/${business.facebook}`
          : null,
        business.tiktok
          ? `https://tiktok.com/${business.tiktok.startsWith("@") ? business.tiktok : "@" + business.tiktok}`
          : null,
      ].filter(Boolean),
    }),

    // ── Address (GEO signal) ──
    address: {
      "@type": "PostalAddress",
      ...(business.address && { streetAddress: business.address }),
      addressLocality: business.city || "Jakarta",
      addressRegion: "DKI Jakarta",
      addressCountry: "ID",
    },

    // ── Area served (local SEO radius) ──
    areaServed: {
      "@type": "City",
      name: business.city || "Jakarta",
    },

    // ── Price range indicator ──
    ...(services.length > 0 && {
      priceRange: getPriceRange(services),
    }),

    // ── Available language ──
    availableLanguage: ["id", "en"],

    // ── Payment accepted ──
    paymentAccepted: "Cash, QRIS, GoPay, OVO, DANA, ShopeePay, Credit Card",
    currenciesAccepted: "IDR",
  };

  // ── Menu (for F&B — hasMenu schema) ──
  if (business.vertical === "fnb" && menuItems.length > 0) {
    localBusiness.hasMenu = {
      "@type": "Menu",
      hasMenuSection: groupMenuByCategory(menuItems),
    };
  }

  // ── Services offered (non-F&B) ──
  if (business.vertical !== "fnb" && services.length > 0) {
    localBusiness.hasOfferCatalog = {
      "@type": "OfferCatalog",
      name: "Layanan",
      itemListElement: services.map((svc) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: svc.name,
          ...(svc.description && { description: svc.description }),
        },
        ...(svc.price && {
          price: svc.price,
          priceCurrency: "IDR",
        }),
      })),
    };
  }

  // ── BreadcrumbList Schema ──
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "bisnisku.info",
        item: BASE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: business.city || "Jakarta",
        item: `${BASE_URL}/directory/${(business.city || "jakarta").toLowerCase()}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: business.name,
        item: pageUrl,
      },
    ],
  };

  // ── WebPage Schema ──
  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: business.name,
    isPartOf: {
      "@type": "WebSite",
      "@id": `${BASE_URL}#website`,
      name: "bisnisku.info",
      url: BASE_URL,
    },
    about: { "@id": pageUrl },
    inLanguage: "id-ID",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusiness),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbs),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPage),
        }}
      />
    </>
  );
}

/** Calculate price range indicator ($ to $$$$) */
function getPriceRange(
  services: Array<{ price: number | null }>
): string {
  const prices = services
    .map((s) => s.price)
    .filter((p): p is number => p !== null);
  if (prices.length === 0) return "$$";

  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  if (avg < 50000) return "$";
  if (avg < 150000) return "$$";
  if (avg < 500000) return "$$$";
  return "$$$$";
}

/** Group menu items by category for Menu schema */
function groupMenuByCategory(
  items: Array<{
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
    menu_categories: { name: string } | null;
  }>
) {
  const groups: Record<
    string,
    Array<{
      name: string;
      description: string | null;
      price: number;
      image_url: string | null;
      menu_categories: { name: string } | null;
    }>
  > = {};

  for (const item of items) {
    const cat = item.menu_categories?.name || "Menu";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  }

  return Object.entries(groups).map(([category, categoryItems]) => ({
    "@type": "MenuSection",
    name: category,
    hasMenuItem: categoryItems.map((item) => ({
      "@type": "MenuItem",
      name: item.name,
      ...(item.description && { description: item.description }),
      ...(item.image_url && { image: item.image_url }),
      offers: {
        "@type": "Offer",
        price: item.price,
        priceCurrency: "IDR",
      },
    })),
  }));
}

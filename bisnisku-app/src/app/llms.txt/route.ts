import { NextResponse } from "next/server";

/**
 * /llms.txt — Site-level LLM-readable description of bisnisku.info
 *
 * Follows the llms.txt standard (https://llmstxt.org/) so AI assistants
 * can accurately discover and represent the platform and its merchants.
 */

const SITE_LLMS_TXT = `# bisnisku.info

> Partner Cerdas untuk Pertumbuhan Bisnis Anda di Era Digital

bisnisku.info adalah platform all-in-one untuk bisnis offline di Indonesia.
Modern business directory yang menggabungkan marketing automation, CRM,
loyalty system, dan digital presence builder dalam satu platform terintegrasi.

## Tentang Platform

bisnisku.info membantu pemilik bisnis offline (restoran, salon, klinik, bengkel)
untuk go digital dengan mudah. Setiap bisnis mendapatkan halaman profil publik
di bisnisku.info/{slug} yang berisi informasi lengkap, layanan/menu, kontak,
dan booking online.

## Kategori Bisnis

- Restoran & Kafe (F&B) — menu, harga, foto makanan
- Salon & Spa (Beauty) — layanan kecantikan, harga, booking
- Klinik & Kesehatan (Health) — layanan medis, jam praktik
- Bengkel & Otomotif (Automotive) — servis, sparepart, harga

## Lokasi

Saat ini melayani area Jakarta, Indonesia.
Ekspansi ke BODETABEK (Bogor, Depok, Tangerang, Bekasi) dalam rencana.

## Fitur untuk Bisnis

- Bio Page Builder: halaman profil bisnis dengan drag-and-drop editor
- Layanan & Menu: katalog lengkap dengan harga
- WhatsApp Integration: kontak langsung via WhatsApp
- CRM & Loyalty: manajemen pelanggan dan program loyalitas
- Booking Online: reservasi dan appointment
- Pembayaran Digital: QRIS, e-wallet, transfer bank

## Cara Mengakses Data Merchant

Setiap merchant memiliki halaman publik di:
- Web: https://bisnisku.info/{slug}
- LLM: https://bisnisku.info/{slug}/llms.txt

Halaman LLM per-merchant berisi informasi terstruktur:
nama bisnis, kategori, lokasi, deskripsi, layanan/menu dengan harga,
dan informasi kontak.

## Kontak

- Website: https://bisnisku.info
- Email: info@bisnisku.info

## Sitemap

Daftar lengkap halaman bisnis: https://bisnisku.info/sitemap.xml
`;

export async function GET() {
  return new NextResponse(SITE_LLMS_TXT.trim(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}

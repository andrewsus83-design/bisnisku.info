import type { Metadata } from "next";
import {
  Plus_Jakarta_Sans,
  Inter,
  JetBrains_Mono,
  Merriweather,
  Courier_Prime,
  Caveat,
  Playfair_Display,
  Space_Grotesk,
  Montserrat,
  Raleway,
  Nunito,
  DM_Sans,
  Lora,
} from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "700"],
});

const courierPrime = Courier_Prime({
  variable: "--font-courier-prime",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "700"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "bisnisku.info — Partner Cerdas untuk Pertumbuhan Bisnis Anda",
    template: "%s | bisnisku.info",
  },
  description:
    "Platform all-in-one untuk mengelola bisnis offline di Indonesia. Modern business directory yang di-optimize oleh AI.",
  keywords: [
    "bisnis online",
    "UMKM Indonesia",
    "direktori bisnis",
    "CRM",
    "loyalty program",
    "WhatsApp marketing",
    "digital marketing UMKM",
  ],
  authors: [{ name: "bisnisku.info" }],
  icons: {
    icon: [
      { url: "/images/logo/logo-icon.svg", type: "image/svg+xml" },
      { url: "/images/logo/logo-icon.png", type: "image/png", sizes: "400x400" },
    ],
    apple: "/images/logo/logo-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://bisnisku.info",
    siteName: "bisnisku.info",
    title: "bisnisku.info — Partner Cerdas untuk Pertumbuhan Bisnis Anda",
    description:
      "Platform all-in-one untuk mengelola bisnis offline di Indonesia.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${plusJakarta.variable} ${inter.variable} ${jetbrainsMono.variable} ${merriweather.variable} ${courierPrime.variable} ${caveat.variable} ${playfairDisplay.variable} ${spaceGrotesk.variable} ${montserrat.variable} ${raleway.variable} ${nunito.variable} ${dmSans.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
          <Providers>{children}</Providers>
        </body>
    </html>
  );
}

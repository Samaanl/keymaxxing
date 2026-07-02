import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { pixelFont, termFont } from "./fonts";
import { AudioProvider } from "@/components/AudioProvider";
import { BRAND } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: `${BRAND.name} — Match the drooling-cat tile`,
  description: BRAND.blurb,
  applicationName: BRAND.name,
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: BRAND.name },
  openGraph: {
    title: BRAND.name,
    description: BRAND.blurb,
    type: "website",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  other: {
    "google-adsense-account": "ca-pub-9634042446169790",
  },
};

export const viewport: Viewport = {
  themeColor: "#cfccbe",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${pixelFont.variable} ${termFont.variable}`}>
      <body className="font-term antialiased">
        <AudioProvider>{children}</AudioProvider>
        <div className="crt-overlay" aria-hidden />
        {/* Google AdSense — Auto ads loader */}
        <Script
          id="adsbygoogle-init"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9634042446169790"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        {/* GoatCounter — pageview analytics (site code: pix) */}
        <Script
          data-goatcounter="https://pix.goatcounter.com/count"
          src="//gc.zgo.at/count.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}

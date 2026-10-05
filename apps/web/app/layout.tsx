import type { Metadata } from "next";
import localFont from "next/font/local";
import { Poppins } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { ThemeProvider } from "../components/theme-provider";

import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});
const atypMediumDisplay = localFont({
  src: "./fonts/AtypDisplay-Medium.woff",
  variable: "--font-atyp-medium-display",
});
const atypSemiBoldDisplay = localFont({
  src: "./fonts/AtypDisplay-Semibold.woff",
  variable: "--font-atyp-semibold-display",
});
const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://arch.obhahiepraise.workers.dev",
  ),
  title: {
    template: "%s | Arch",
    default: "Arch | Opportunity Intelligence Platform",
  },
  description:
    "Arch helps people discover opportunities worth pursuing and gives them the context and tools to actually pursue them.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Arch | Opportunity Intelligence Platform",
    description:
      "Discover opportunities worth pursuing and get the context and tools to pursue them.",
    url:
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://arch.obhahiepraise.workers.dev",
    siteName: "Arch",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Arch | Opportunity Intelligence Platform",
    description:
      "Discover opportunities worth pursuing and get the context and tools to pursue them.",
  },
  icons: {
    icon: [
      {
        url: "/favicon-light-mode.png",
        media: "(prefers-color-scheme: light)",
        type: "image/jpeg",
      },
      {
        url: "/favicon-dark-mode.png",
        media: "(prefers-color-scheme: dark)",
        type: "image/jpeg",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable}  ${atypMediumDisplay.variable} ${atypSemiBoldDisplay.variable} ${poppins.variable} min-h-screen`}
      >
        <Analytics />
        <SpeedInsights/>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

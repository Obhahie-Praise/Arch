import type { Metadata } from "next";
import localFont from "next/font/local";
import { Poppins } from "next/font/google";
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
  src: "./fonts/AtypDisplay-SemiBold.woff",
  variable: "--font-atyp-semibold-display",
});
const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
  weight: ["400", "500", "600", "700"]
});

export const metadata: Metadata = {
  title: "Arch",
  description: "Arch helps people discover opportunities worth pursuing and gives them the context and tools to actually pursue them.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}  ${atypMediumDisplay.variable} ${atypSemiBoldDisplay.variable} ${poppins.variable}`}>
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

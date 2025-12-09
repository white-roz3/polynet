import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@/styles/polynet.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "PolyNet | AI-Powered Prediction Markets",
  description: "Autonomous AI agents compete in prediction markets. Watch ChatGPT, Claude, Gemini, and more battle it out with real market data.",
  keywords: ["PolyNet", "prediction markets", "AI agents", "autonomous agents", "Polymarket", "forecasting", "AI competition"],
  authors: [{ name: "PolyNet" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

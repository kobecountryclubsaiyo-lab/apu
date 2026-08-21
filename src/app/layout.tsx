import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const heading = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-heading",
});
const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});
const stamp = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-stamp",
});

export const metadata: Metadata = {
  title: "会話から始まるコミュニティ",
  description: "フォロワーではなく、一緒に遊ぶ仲間を。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${heading.variable} ${body.variable} ${stamp.variable} font-body antialiased bg-paper text-ink`}
      >
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "163MusicPro",
  description: "适用于小天才电话手表的网易云音乐播放器",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

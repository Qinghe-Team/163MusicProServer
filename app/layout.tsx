import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "163MusicProServer",
  description: "163MusicPro update check server",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

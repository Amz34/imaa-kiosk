import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "إيماء — Imaa | Sign to 3 Languages",
  description:
    "Cross-dialect sign language bridge for PSL and ArSL into Arabic, English and Urdu. Client-side landmarks, zero biometric retention.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Urdu needs Nastaliq and Arabic needs Naskh: without them the
            joining forms break and words look split mid-glyph. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400..700&family=Noto+Naskh+Arabic:wght@400..700&display=swap"
        />
      </head>
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          background: "#080b0f",
          color: "#e8eef5",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}

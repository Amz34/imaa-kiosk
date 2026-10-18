import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "إيماء — Imaa | Sign to 3 Languages",
  description:
    "Cross-dialect sign language bridge for PSL and ArSL into Arabic, English and Urdu.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar">
      <body
        style={{
          margin: 0,
          background: "#07090c",
          color: "#e8edf2",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}

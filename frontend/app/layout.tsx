import "./globals.css";

export const metadata = {
  title: "Casino Growth & Operations Platform",
  description: "Risk signals, early warning, operational control"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}

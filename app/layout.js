import "./globals.css";

export const metadata = {
  title: "CuttingOS",
  description: "App de cutting personalizado",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}


import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import AuthModal from "../components/AuthModal";

const inter = Inter({ subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vitorgarakaki.vercel.app";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Vitor Arakaki | Engenheiro de Dados Sênior",
    template: "%s | Vitor Arakaki",
  },
  description:
    "Portfólio de Vitor Guirardeli Arakaki — Engenheiro de Dados Sênior especializado em Python, AWS, Data Engineering, ETL e arquitetura de dados.",
  keywords: [
    "Vitor Arakaki",
    "Engenheiro de Dados",
    "Senior Data Engineer",
    "Python",
    "AWS",
    "ETL",
    "Data Engineering",
    "portfólio",
    "São Bernardo do Campo",
  ],
  authors: [{ name: "Vitor Guirardeli Arakaki", url: siteUrl }],
  creator: "Vitor Guirardeli Arakaki",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteUrl,
    siteName: "Vitor Arakaki",
    title: "Vitor Arakaki | Engenheiro de Dados Sênior",
    description:
      "Portfólio de Vitor Guirardeli Arakaki — Engenheiro de Dados Sênior especializado em Python, AWS, Data Engineering, ETL e arquitetura de dados.",
    images: [
      {
        url: "/assets/eu.png",
        width: 1200,
        height: 630,
        alt: "Vitor Arakaki — Engenheiro de Dados Sênior",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vitor Arakaki | Engenheiro de Dados Sênior",
    description:
      "Portfólio de Vitor Guirardeli Arakaki — Engenheiro de Dados Sênior especializado em Python, AWS, Data Engineering, ETL e arquitetura de dados.",
    images: ["/assets/eu.png"],
  },
};

export const viewport = {
  colorScheme: "only dark",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  );
}

import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import AuthModal from "../components/AuthModal";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Vitor Arakaki",
  description: "Site de portfólio do Vitor Arakakai",
};

export const viewport = {
  colorScheme: "only dark",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  );
}

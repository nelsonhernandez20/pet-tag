import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Tag Pet - Sistema de Identificación para Mascotas",
  description: "Protege a tu mascota con códigos QR únicos. Identificación rápida y contacto directo con el dueño.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" translate="no" className="bg-[#F3F3F3]">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#F3F3F3]`}
      >
        {children}
      </body>
    </html>
  );
}

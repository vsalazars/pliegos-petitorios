import type { Metadata } from "next";
import { Montserrat, Poppins } from "next/font/google";
import { AppToaster } from "@/components/ui/app-toaster";
import "./globals.css";

const bodySans = Montserrat({
  variable: "--font-body",
  subsets: ["latin"],
});

const displaySerif = Poppins({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Administración de pliegos petitorios",
  description: "Portal de seguimiento para DES y unidades académicas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bodySans.variable} ${displaySerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <AppToaster />
      </body>
    </html>
  );
}

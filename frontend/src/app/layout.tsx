import type { Metadata } from "next";
import { Montserrat, Poppins } from "next/font/google";
import { Toaster } from "sonner";
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
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            classNames: {
              toast:
                "border border-[#ddd8de] bg-white text-[#35353b] shadow-[0_20px_50px_rgba(64,42,48,0.16)]",
              title: "font-medium text-[#35353b]",
              description: "text-[#66666d]",
              success: "!border-[#d3e3d8]",
              error: "!border-[#ead5db]",
            },
          }}
        />
      </body>
    </html>
  );
}

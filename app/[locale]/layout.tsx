import type { Metadata } from "next";
import { Bodoni_Moda, DM_Sans } from "next/font/google";
import "../globals.css";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Toaster } from 'sonner';

const display = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  adjustFontFallback: false
});

const body = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "700"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "Merit Luxury Wears Limited — Luxury Fashion",
  description:
    "Merit Luxury Wears Limited: Native attires, casual & corporate wears, foot-wears, watches and accessories. The art of discipline in modern tailoring."
};

export default async function RootLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${display.variable} ${body.variable}`}>
      <body className="bg-surface-container-lowest text-primary">
        <NextIntlClientProvider messages={messages}>
          {children}
          <Toaster position="bottom-right" toastOptions={{
            style: {
              background: '#001F3F',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '0px'
            }
          }} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

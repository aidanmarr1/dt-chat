import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import ThemeProvider from "@/components/ThemeProvider";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "D&T Chat",
  description: "D&T AT1 Chat Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('dt-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t)}else if(window.matchMedia('(prefers-color-scheme:light)').matches){document.documentElement.setAttribute('data-theme','light')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${dmSans.variable} antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

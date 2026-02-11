import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import ThemeProvider from "@/components/ThemeProvider";
import { SHIELD_SCRIPT } from "@/lib/shield";
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
        <script dangerouslySetInnerHTML={{ __html: SHIELD_SCRIPT }} />
        <script
          dangerouslySetInnerHTML={{
            __html: [
              // Disable right-click context menu
              `document.addEventListener('contextmenu',function(e){e.preventDefault()},true);`,
              // Block all DevTools keyboard shortcuts
              `document.addEventListener('keydown',function(e){`,
              `if(e.key==='F12')e.preventDefault();`,
              `if((e.ctrlKey||e.metaKey)&&e.shiftKey&&(e.key==='I'||e.key==='i'||e.key==='J'||e.key==='j'||e.key==='C'||e.key==='c'))e.preventDefault();`,
              `if((e.ctrlKey||e.metaKey)&&(e.key==='U'||e.key==='u'||e.key==='S'||e.key==='s'))e.preventDefault();`,
              `},true);`,
              // Block text selection on non-input elements
              `document.addEventListener('selectstart',function(e){`,
              `var t=e.target;if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable))return;`,
              `e.preventDefault()},true);`,
              // Block drag
              `document.addEventListener('dragstart',function(e){e.preventDefault()},true);`,
            ].join(''),
          }}
        />
      </head>
      <body className={`${dmSans.variable} antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

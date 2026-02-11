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
              // Block ALL DevTools / Save / Print keyboard shortcuts (Windows + Mac)
              `document.addEventListener('keydown',function(e){`,
              // F12
              `if(e.key==='F12'){e.preventDefault();e.stopImmediatePropagation();return false}`,
              // Ctrl/Cmd + Shift + I/J/C (DevTools panels)
              `if((e.ctrlKey||e.metaKey)&&e.shiftKey&&/^[ijcIJC]$/.test(e.key)){e.preventDefault();e.stopImmediatePropagation();return false}`,
              // Alt/Option + Cmd + I (Mac DevTools shortcut ⌥⌘I)
              `if(e.metaKey&&e.altKey&&/^[iI]$/.test(e.key)){e.preventDefault();e.stopImmediatePropagation();return false}`,
              // Ctrl/Cmd + U (View Source)
              `if((e.ctrlKey||e.metaKey)&&/^[uU]$/.test(e.key)){e.preventDefault();e.stopImmediatePropagation();return false}`,
              // Ctrl/Cmd + S or Ctrl/Cmd + Shift + S (Save / Save As)
              `if((e.ctrlKey||e.metaKey)&&/^[sS]$/.test(e.key)){e.preventDefault();e.stopImmediatePropagation();return false}`,
              // Ctrl/Cmd + P (Print)
              `if((e.ctrlKey||e.metaKey)&&/^[pP]$/.test(e.key)){e.preventDefault();e.stopImmediatePropagation();return false}`,
              // Ctrl/Cmd + Shift + P (Chrome command palette)
              `if((e.ctrlKey||e.metaKey)&&e.shiftKey&&/^[pP]$/.test(e.key)){e.preventDefault();e.stopImmediatePropagation();return false}`,
              // Ctrl/Cmd + G or Ctrl/Cmd + F (Find — can be used to explore page source)
              // (not blocking find as it's normal UX)
              `},true);`,
              // Block printing entirely
              `window.addEventListener('beforeprint',function(e){e.preventDefault();`,
              `document.body.style.display='none';`,
              `setTimeout(function(){document.body.style.display=''},100)`,
              `},true);`,
              // Override window.print
              `window.print=function(){};`,
              `try{Object.defineProperty(window,'print',{configurable:false,writable:false,value:function(){}})}catch(e){}`,
              // Block text selection on non-input elements
              `document.addEventListener('selectstart',function(e){`,
              `var t=e.target;if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable))return;`,
              `e.preventDefault()},true);`,
              // Block drag
              `document.addEventListener('dragstart',function(e){e.preventDefault()},true);`,
              // Block Save Page via overriding Cmd+S at window level too
              `window.addEventListener('keydown',function(e){`,
              `if((e.ctrlKey||e.metaKey)&&/^[sSuUpP]$/.test(e.key)){e.preventDefault();e.stopImmediatePropagation();return false}`,
              `},true);`,
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

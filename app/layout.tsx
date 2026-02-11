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
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var _=new Function('debugger');var _i=setInterval(function(){var a=performance.now();_(0);if(performance.now()-a>100){document.title='\\u26A0\\uFE0F';var b=document.createElement('div');b.id='_dt';if(!document.getElementById('_dt')){b.style.cssText='position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,0.95);display:flex;align-items:center;justify-content:center;font-family:system-ui;color:#ff4444;font-size:20px;font-weight:600;text-align:center;padding:2rem;';b.innerHTML='<div><div style=\"font-size:48px;margin-bottom:16px\">\\u26D4</div>DevTools detected.<br>Close DevTools to continue.</div>';document.body.appendChild(b)}document.body.style.pointerEvents='none'}else{var o=document.getElementById('_dt');if(o)o.remove();document.body.style.pointerEvents='';document.title='D&T Chat'}},1500);var _c=Object.defineProperty;var _el=new Image();_c(_el,'id',{get:function(){_();_();_()}});setInterval(function(){console.log('%c','font-size:0',_el)},2000);var _og=console.log;var _ow=console.warn;var _oe=console.error;var _oc=console.clear;['log','warn','error','debug','info','table','dir','trace'].forEach(function(m){var _orig=console[m];console[m]=function(){_();return _orig.apply(console,arguments)}});console.clear=function(){_();_oc.apply(console,arguments)};setInterval(function(){_()},3000)})()`,
          }}
        />
      </head>
      <body className={`${dmSans.variable} antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

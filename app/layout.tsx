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
            __html: [
              // Anti-devtools: hardened, self-healing, multi-layer protection
              `(function(){`,
              // 1. Capture pristine built-ins before anyone can tamper
              `var $i=window.setInterval,$t=window.setTimeout,$c=window.clearInterval,$ct=window.clearTimeout,$r=window.requestAnimationFrame,$p=performance.now.bind(performance);`,
              `var $d=new Function('\\x64\\x65\\x62\\x75\\x67\\x67\\x65\\x72'),$d2=new Function('\\x64\\x65\\x62\\x75\\x67\\x67\\x65\\x72'),$d3=new Function('\\x64\\x65\\x62\\x75\\x67\\x67\\x65\\x72');`,
              // 2. Protect our timer IDs — override clearInterval/clearTimeout so ours can't be stopped
              `var $z=new Set();`,
              `window.clearInterval=function(x){if($z.has(x))return;return $c.call(window,x)};`,
              `window.clearTimeout=function(x){if($z.has(x))return;return $ct.call(window,x)};`,
              `try{Object.defineProperty(window,'clearInterval',{configurable:false,writable:false})}catch(_){}`,
              `try{Object.defineProperty(window,'clearTimeout',{configurable:false,writable:false})}catch(_){}`,
              // 3. State + unique overlay ID
              `var $o=false,$k='_'+Math.random().toString(36).slice(2,8);`,
              // 4. Block / unblock functions
              `function $B(){$o=true;document.title='\\u26A0\\uFE0F';try{document.body.style.pointerEvents='none';document.body.style.userSelect='none'}catch(_){}`,
              `if(!document.getElementById($k)){var d=document.createElement('div');d.id=$k;`,
              `d.style.cssText='position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.97);display:flex;align-items:center;justify-content:center;font-family:system-ui;color:#ff4444;font-size:20px;font-weight:600;text-align:center;padding:2rem;user-select:none;-webkit-user-select:none;';`,
              `d.innerHTML='<div><div style=\"font-size:48px;margin-bottom:16px\">\\u26D4</div>DevTools detected.<br>Close DevTools to continue.</div>';`,
              `try{document.body.appendChild(d)}catch(_){}}}`,
              `function $U(){if(!$o){var e=document.getElementById($k);if(e)e.remove();try{document.body.style.pointerEvents='';document.body.style.userSelect='';document.title='D&T Chat'}catch(_){}}}`,
              // 5. MutationObserver — re-adds overlay instantly if someone deletes it from Elements panel
              `function $M(){if(document.body){new MutationObserver(function(){if($o&&!document.getElementById($k))$B()}).observe(document.body,{childList:true,subtree:true})}else{$t($M,50)}}$M();`,
              // 6. Timing-based detection (catches open DevTools even with breakpoints active)
              `function $T(){var a=$p();$d();var g=$p()-a;if(g>50){$B()}else{$o=false;$U()}}`,
              // 7. Window-size detection (catches docked DevTools even when breakpoints are deactivated)
              `function $S(){var w=window.outerWidth-window.innerWidth>160,h=window.outerHeight-window.innerHeight>160;if(w||h){$B();$d()}else if($o){var a=$p();$d();if($p()-a<50){$o=false;$U()}}}`,
              // 8. Six independent setInterval loops at staggered rates — killing one doesn't help
              `var a1=$i(function(){$T();$d2();$d3()},800);$z.add(a1);`,
              `var a2=$i(function(){$T();$S()},1500);$z.add(a2);`,
              `var a3=$i(function(){$d();$d2();$d3()},1100);$z.add(a3);`,
              `var a4=$i(function(){$T()},2100);$z.add(a4);`,
              `var a5=$i(function(){$S()},2500);$z.add(a5);`,
              `var a6=$i(function(){$d();$d2()},3300);$z.add(a6);`,
              // 9. requestAnimationFrame loop — can't be cleared with clearInterval at all
              `(function R(){if($o){$d();$d2();$d3()}$r(R)})();`,
              // 10. Recursive setTimeout loop with jitter — another unkillable vector
              `(function L(){$d();$t(L,900+Math.random()*600|0)})();`,
              // 11. Hook every console method with non-configurable descriptors — can't be overwritten back
              `['log','warn','error','debug','info','table','dir','trace','clear'].forEach(function(m){var f=console[m];try{Object.defineProperty(console,m,{configurable:false,enumerable:true,writable:false,value:function(){$d();return f.apply(console,arguments)}})}catch(_){console[m]=function(){$d();return f.apply(console,arguments)}}});`,
              // 12. Image getter trap — triggers debugger when DevTools inspector expands logged objects
              `var $g=new Image();Object.defineProperty($g,'id',{get:function(){$d();$d2();$d3()}});$i(function(){console.log('%c','font-size:0',$g)},2000);`,
              // 13. Trap iframe creation — prevent getting clean clearInterval from an iframe
              `var $oc=Document.prototype.createElement;Document.prototype.createElement=function(tag){var el=$oc.apply(this,arguments);if(typeof tag==='string'&&tag.toLowerCase()==='iframe'){$t(function(){try{el.contentWindow.clearInterval=window.clearInterval;el.contentWindow.clearTimeout=window.clearTimeout}catch(_){}},0)}return el};`,
              // 14. Protect Function.prototype.toString — hide our function source code
              `var $fs=Function.prototype.toString;try{Object.defineProperty(Function.prototype,'toString',{configurable:false,writable:false,value:function(){if(this===$d||this===$d2||this===$d3)return'function(){[native code]}';return $fs.call(this)}})}catch(_){}`,
              `})()`,
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

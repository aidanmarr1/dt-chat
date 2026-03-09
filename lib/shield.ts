// Anti-DevTools shield — getter-based detection + overlay + debugger (false-positive safe)
// XOR-encoded + base64 at build time, self-decoding eval at runtime

const LINES = [
  "(function(){'use strict';",
  "var B=false,CC=0,HC=0,OT='',W=String.fromCharCode(9888),OID='_s'+Math.random().toString(36).slice(2,8),_dpH=false,_drC=0;",
  "var CL=console.log,CR=console.clear,CE=document.createElement.bind(document);",
  "var AD='%cAccess Denied',AS='color:red;font-weight:bold;font-size:14px';",

  // FIRE_DP: Image getter probe — sets _dpH=true when DevTools formats the object (async in Chrome 145+)
  "function FIRE_DP(){try{var e=new Image();Object.defineProperty(e,'id',{get:function(){_dpH=true;return''},configurable:true});CL.call(console,e)}catch(x){}}",

  // FIRE_DR: Regex toString probe — increments _drC when DevTools calls toString (async in Chrome 145+)
  "function FIRE_DR(){try{var r=/x/;r.toString=function(){_drC++;return'x'};CL.call(console,r)}catch(x){}}",

  // CHK: read and reset flags from previous cycle's probes
  "function CHK(){var h=_dpH,c=_drC;_dpH=false;_drC=0;return h||c>1}",

  // BL: show overlay, lock body, set title
  "function BL(){if(B)return;B=true;CC=0;if(!OT)OT=document.title||'D&T Chat';",
  "var el=document.getElementById(OID);if(!el){el=CE('div');el.id=OID;",
  "el.style.cssText='position:fixed;top:0;left:0;width:100vw;height:100vh;background:#000;z-index:2147483647;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;color:#fff;font-size:1.5rem;text-align:center;user-select:none;-webkit-user-select:none;cursor:default';",
  "el.innerHTML='<div><div style=\"font-size:3rem;margin-bottom:1rem\">'+W+'</div><div>Developer tools detected.<br>Please close DevTools to continue.</div></div>';",
  "(document.body||document.documentElement).appendChild(el)}",
  "el.style.display='flex';if(document.body)document.body.style.overflow='hidden';document.title=W+' DevTools Detected';",
  "var s=document.getElementById(OID+'_c');if(!s){s=CE('style');s.id=OID+'_c';",
  "s.textContent='#'+OID+'{display:flex!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;transform:none!important;width:100vw!important;height:100vh!important;background:#000!important;z-index:2147483647!important;}';",
  "(document.head||document.documentElement).appendChild(s)}}",

  // UB: remove overlay, restore body, restore title
  "function UB(){if(!B)return;B=false;var el=document.getElementById(OID);if(el)el.style.display='none';",
  "var s=document.getElementById(OID+'_c');if(s)s.remove();if(document.body)document.body.style.overflow='';document.title=OT}",

  // Main polling — 750ms: check previous results, process HC/BL/UB, then fire new probes
  "var MI=setInterval(function(){if(CHK()){HC++;if(HC>=2){BL();debugger}CC=0}else{HC=0;if(B){CC++;if(CC>=4)UB()}}FIRE_DP();FIRE_DR()},750);",
  // Fire initial probes immediately so first CHK at 750ms has data
  "FIRE_DP();FIRE_DR();",
  // Backup: re-create overlay if removed from DOM while blocked
  "var MI2=setInterval(function(){if(B){var el=document.getElementById(OID);if(!el){B=false;BL()}}},2000);",
  // Secondary: reinforce debugger when blocked
  "var MI3=setInterval(function(){if(B){debugger}},3000);",
  // Console clear timer — prevents probe messages from accumulating (2s gives probes >=750ms)
  "var MI4=setInterval(function(){CR.call(console)},2000);",

  // Console method overrides (clear + "Access Denied")
  "['log','warn','error','info','debug','table','dir','dirxml','trace','group','groupCollapsed','groupEnd','profile','profileEnd','time','timeEnd','timeLog','timeStamp','count','countReset','assert'].forEach(function(m){try{console[m]=function(){CR.call(console);CL.call(console,AD,AS)}}catch(e){}});",

  // 5 Web Worker debugger loops (separate threads, no main-thread impact)
  "try{var wc='setInterval(function(){debugger},50)';var wb=new Blob([wc],{type:'application/javascript'});var wu=URL.createObjectURL(wb);for(var i=0;i<5;i++)try{new Worker(wu)}catch(e){}}catch(e){}",

  // XHR origin restriction (same-origin + vercel-storage allowed)
  "try{var xo=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(m,u){var s=String(u);if(s.startsWith('http')&&!s.includes(location.hostname)&&!s.includes('vercel-storage'))return;return xo.apply(this,arguments)}}catch(e){}",

  // Fetch origin restriction
  "try{var fo=window.fetch;window.fetch=function(u){var s=String(u instanceof Request?u.url:u||'');if(s.startsWith('http')&&!s.includes(location.hostname)&&!s.includes('vercel-storage'))return Promise.reject(new TypeError('Blocked'));return fo.apply(window,arguments)}}catch(e){}",

  // Error stack trace hiding
  "try{Error.prepareStackTrace=function(){return''}}catch(e){}",

  // Function.prototype.toString override
  "try{var ft=Function.prototype.toString;Function.prototype.toString=function(){if(this===Function.prototype.toString)return'function toString() { [native code] }';try{return ft.call(this)}catch(e){return'function() { [native code] }'}}}catch(e){}",

  // DOM MutationObserver — re-append overlay/style if removed while blocked
  "try{new MutationObserver(function(muts){muts.forEach(function(mu){if(!B)return;mu.removedNodes.forEach(function(n){if(n.id===OID||n.id===OID+'_c')(document.body||document.documentElement).appendChild(n)})})}).observe(document.documentElement,{childList:true,subtree:true})}catch(e){}",

  // document.createElement override — block foreign iframes/scripts
  "document.createElement=function(tag){var el=CE(tag);var t=String(tag).toLowerCase();if(t==='iframe'||t==='script'){var sa=el.setAttribute.bind(el);el.setAttribute=function(n,v){if((n==='src'||n==='href')&&String(v).startsWith('http')&&!String(v).includes(location.hostname)&&!String(v).includes('vercel-storage'))return;return sa(n,v)};try{Object.defineProperty(el,'src',{set:function(v){v=String(v);if(v.startsWith('http')&&!v.includes(location.hostname)&&!v.includes('vercel-storage'))return;sa('src',v)},get:function(){return el.getAttribute('src')||''},configurable:true})}catch(e){}}return el};",

  // clearInterval/clearTimeout protection — can't clear detection intervals
  "var oci=window.clearInterval,oct=window.clearTimeout;",
  "window.clearInterval=function(id){if(id===MI||id===MI2||id===MI3||id===MI4)return;return oci.call(window,id)};",
  "window.clearTimeout=function(id){if(id===MI||id===MI2||id===MI3||id===MI4)return;return oct.call(window,id)};",

  // window.open blocked
  "window.open=function(){return null};try{Object.defineProperty(window,'open',{configurable:false,writable:false,value:function(){return null}})}catch(e){}",

  // SharedWorker blocked
  "try{window.SharedWorker=undefined}catch(e){}",

  // React/Vue devtools hooks frozen
  "try{Object.defineProperty(window,'__REACT_DEVTOOLS_GLOBAL_HOOK__',{value:Object.freeze({}),writable:false,configurable:false})}catch(e){}",
  "try{Object.defineProperty(window,'__VUE_DEVTOOLS_GLOBAL_HOOK__',{value:Object.freeze({}),writable:false,configurable:false})}catch(e){}",

  "})();"
];

const PAYLOAD = LINES.join("\n");

// XOR encode + base64 wrap at build time
const KEY = 42;
const bytes = Buffer.from(PAYLOAD, "utf-8");
const xored = Buffer.alloc(bytes.length);
for (let i = 0; i < bytes.length; i++) {
  xored[i] = bytes[i]! ^ KEY;
}
const encoded = xored.toString("base64");

// Self-decoding eval wrapper — runs in client browser
export const SHIELD_SCRIPT = `(function(){var k=${KEY},b=atob("${encoded}"),s="";for(var i=0;i<b.length;i++)s+=String.fromCharCode(b.charCodeAt(i)^k);(0,eval)(s)})()`;

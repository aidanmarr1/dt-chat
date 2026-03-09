// Anti-DevTools shield — getter-based detection + debugger pause (no overlay)
// XOR-encoded + base64 at build time, self-decoding eval at runtime

const LINES = [
  "(function(){'use strict';",
  "var CL=console.log,CR=console.clear,CE=document.createElement.bind(document);",

  // DP: Image getter probe — fires only when DevTools renders the logged object
  "function DP(){var h=false;try{var e=new Image();Object.defineProperty(e,'id',{get:function(){h=true;return''},configurable:true});CL.call(console,e);CR.call(console)}catch(x){}return h}",

  // DR: Regex toString probe — called >1 time only when DevTools formats it
  "function DR(){var c=0;try{var r=/x/;r.toString=function(){c++;return'x'};CL.call(console,r);CR.call(console)}catch(x){}return c>1}",

  // CHK: combined check
  "function CHK(){return DP()||DR()}",

  // Main polling — 750ms interval, fire debugger when DevTools detected
  "var MI=setInterval(function(){if(CHK()){debugger}},750);",
  // Secondary: catch DevTools opened between main polls
  "var MI3=setInterval(function(){if(CHK()){debugger}},3000);",

  // Console method overrides (clear console)
  "['log','warn','error','info','debug','table','dir','dirxml','trace','group','groupCollapsed','groupEnd','profile','profileEnd','time','timeEnd','timeLog','timeStamp','count','countReset','assert'].forEach(function(m){try{console[m]=function(){CR.call(console)}}catch(e){}});",

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

  // document.createElement override — block foreign iframes/scripts
  "document.createElement=function(tag){var el=CE(tag);var t=String(tag).toLowerCase();if(t==='iframe'||t==='script'){var sa=el.setAttribute.bind(el);el.setAttribute=function(n,v){if((n==='src'||n==='href')&&String(v).startsWith('http')&&!String(v).includes(location.hostname)&&!String(v).includes('vercel-storage'))return;return sa(n,v)};try{Object.defineProperty(el,'src',{set:function(v){v=String(v);if(v.startsWith('http')&&!v.includes(location.hostname)&&!v.includes('vercel-storage'))return;sa('src',v)},get:function(){return el.getAttribute('src')||''},configurable:true})}catch(e){}}return el};",

  // clearInterval/clearTimeout protection — can't clear detection intervals
  "var oci=window.clearInterval,oct=window.clearTimeout;",
  "window.clearInterval=function(id){if(id===MI||id===MI3)return;return oci.call(window,id)};",
  "window.clearTimeout=function(id){if(id===MI||id===MI3)return;return oct.call(window,id)};",

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

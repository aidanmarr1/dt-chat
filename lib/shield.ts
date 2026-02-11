// Anti-devtools protection — XOR-encoded, multi-layer, self-healing
// The actual runtime code is encoded so it's not readable in HTML source or Network panel

const PAYLOAD = `(function(){
var S=String.fromCharCode,D=S(100,101,98,117,103,103,101,114);
var si=window.setInterval,st=window.setTimeout,ci=window.clearInterval,
ct=window.clearTimeout,rf=window.requestAnimationFrame,pn=performance.now.bind(performance),
ce=document.createElement.bind(document);
var T=[];for(var i=0;i<20;i++)T.push(new Function(D));
var G=new Set();
window.clearInterval=function(x){if(G.has(x))return;return ci.call(window,x)};
window.clearTimeout=function(x){if(G.has(x))return;return ct.call(window,x)};
try{Object.defineProperty(window,'clearInterval',{configurable:false,writable:false})}catch(e){}
try{Object.defineProperty(window,'clearTimeout',{configurable:false,writable:false})}catch(e){}
var O=false,K='_'+Math.random().toString(36).slice(2,8),K2='_'+Math.random().toString(36).slice(2,8);
function BL(){O=true;document.title='\\u26A0\\uFE0F';
try{document.body.style.setProperty('pointer-events','none','important');
document.body.style.setProperty('user-select','none','important');
document.body.style.setProperty('-webkit-user-select','none','important');
document.body.style.setProperty('overflow','hidden','important')}catch(e){}
if(!document.getElementById(K)){var d=ce('div');d.id=K;
d.style.cssText='position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.97);display:flex;align-items:center;justify-content:center;font-family:system-ui;color:#ff4444;font-size:20px;font-weight:600;text-align:center;padding:2rem;user-select:none;-webkit-user-select:none;';
d.innerHTML='<div><div style=\"font-size:48px;margin-bottom:16px\">\\u26D4</div>DevTools detected.<br>Close DevTools to continue.</div>';
try{document.body.appendChild(d)}catch(e){}}
if(!document.getElementById(K2)){var s=ce('style');s.id=K2;
s.textContent='body{pointer-events:none!important;user-select:none!important;-webkit-user-select:none!important;overflow:hidden!important}body *:not(#'+K+'):not(#'+K+' *){visibility:hidden!important}#'+K+'{visibility:visible!important;pointer-events:auto!important}';
try{document.head.appendChild(s)}catch(e){}}}
function UB(){if(!O){var e=document.getElementById(K);if(e)e.remove();
var s=document.getElementById(K2);if(s)s.remove();
try{document.body.style.removeProperty('pointer-events');document.body.style.removeProperty('user-select');
document.body.style.removeProperty('-webkit-user-select');document.body.style.removeProperty('overflow');
document.title='D&T Chat'}catch(e){}}}
function MO1(){if(document.body){new MutationObserver(function(){if(O){
if(!document.getElementById(K))BL();if(!document.getElementById(K2))BL();
try{if(document.body.style.pointerEvents!=='none')document.body.style.setProperty('pointer-events','none','important')}catch(e){}}
}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class']})}else{st(MO1,50)}}MO1();
function MO2(){if(document.head){new MutationObserver(function(){if(O&&!document.getElementById(K2))BL()}).observe(document.head,{childList:true})}else{st(MO2,50)}}MO2();
try{new MutationObserver(function(){if(O){if(!document.getElementById(K))BL();if(!document.getElementById(K2))BL()}}).observe(document.documentElement,{childList:true,subtree:true})}catch(e){}
function DT(){var a=pn();T[0]();var d=pn()-a;if(d>50){BL();return true}O=false;UB();return false}
function DS(){var dw=window.outerWidth-window.innerWidth>160,dh=window.outerHeight-window.innerHeight>160;if(dw||dh){BL();return true}return false}
function DD(){var a=+new Date;T[1]();var d=+new Date-a;if(d>50){BL();return true}return false}
function DX(){var a=pn();T[19]();var d=pn()-a;
if(d<2&&(window.outerWidth-window.innerWidth>160||window.outerHeight-window.innerHeight>160)){BL();return true}return false}
var pr=[709,887,1009,1201,1399,1601,1801,2003,2399,2801];
pr.forEach(function(ms,i){var id=si(function(){DT();DS();DD();DX();T[i%20]();T[(i+1)%20]();T[(i+2)%20]()},ms);G.add(id)});
(function R(){if(O){for(var i=0;i<8;i++)T[i]()}rf(R)})();
(function L(){T[5]();T[6]();st(L,700+Math.random()*500|0)})();
(function L2(){T[7]();T[8]();st(L2,1100+Math.random()*700|0)})();
(function L3(){T[9]();T[10]();st(L3,1500+Math.random()*900|0)})();
if(window.requestIdleCallback){(function IC(){window.requestIdleCallback(function(){T[11]();T[12]();IC()})})()}
try{var wc='var D=new Function(String.fromCharCode(100,101,98,117,103,103,101,114));var D2=new Function(String.fromCharCode(100,101,98,117,103,103,101,114));var D3=new Function(String.fromCharCode(100,101,98,117,103,103,101,114));setInterval(function(){D()},400);setInterval(function(){D2()},700);setInterval(function(){D3()},1100);setInterval(function(){D();D2();D3()},1900);';
var wb=new Blob([wc],{type:'application/javascript'});var wk=new Worker(URL.createObjectURL(wb));
wk.onerror=function(){try{wk=new Worker(URL.createObjectURL(new Blob([wc],{type:'application/javascript'})))}catch(e){}}}catch(e){}
try{var wc2='var D=new Function(String.fromCharCode(100,101,98,117,103,103,101,114));setInterval(function(){D()},600);';
var wb2=new Blob([wc2],{type:'application/javascript'});new Worker(URL.createObjectURL(wb2))}catch(e){}
['log','warn','error','debug','info','table','dir','trace','clear','count','countReset','group','groupCollapsed','groupEnd','time','timeEnd','timeLog','assert'].forEach(function(m){
var f=console[m];if(!f)return;
try{Object.defineProperty(console,m,{configurable:false,enumerable:true,writable:false,
value:function(){T[13]();T[14]();return f.apply(console,arguments)}})}catch(e){console[m]=function(){T[13]();T[14]();return f.apply(console,arguments)}}});
var oe=window.eval;
try{Object.defineProperty(window,'eval',{configurable:false,writable:false,
value:function(){T[15]();T[16]();T[17]();return oe.apply(window,arguments)}})}catch(e){window.eval=function(){T[15]();T[16]();T[17]();return oe.apply(window,arguments)}}
var imgs=[];for(var j=0;j<5;j++){var im=new Image();Object.defineProperty(im,'id',{get:function(){T[16]();T[17]();T[18]()}});imgs.push(im)}
var lid=si(function(){for(var j=0;j<imgs.length;j++)console.log('%c','font-size:0',imgs[j])},1800);G.add(lid);
var oce=Document.prototype.createElement;
Document.prototype.createElement=function(tag){var el=oce.apply(this,arguments);
if(typeof tag==='string'&&tag.toLowerCase()==='iframe'){st(function(){try{
el.contentWindow.clearInterval=window.clearInterval;el.contentWindow.clearTimeout=window.clearTimeout;
el.contentWindow.eval=window.eval;var cw=el.contentWindow;
try{Object.defineProperty(cw,'clearInterval',{configurable:false,writable:false,value:window.clearInterval})}catch(e){}
try{Object.defineProperty(cw,'clearTimeout',{configurable:false,writable:false,value:window.clearTimeout})}catch(e){}
}catch(e){}},0)}return el};
var fts=Function.prototype.toString;
try{Object.defineProperty(Function.prototype,'toString',{configurable:false,writable:false,
value:function(){for(var i=0;i<T.length;i++){if(this===T[i])return'function(){[native code]}'}return fts.call(this)}})}catch(e){}
var osp=CSSStyleDeclaration.prototype.setProperty;
CSSStyleDeclaration.prototype.setProperty=function(p,v,pr){
if(O&&this===document.body.style){if(p==='pointer-events'&&v!=='none')return;if(p==='user-select'&&v!=='none')return;if(p==='visibility')return}
return osp.call(this,p,v,pr)};
var orp=CSSStyleDeclaration.prototype.removeProperty;
CSSStyleDeclaration.prototype.removeProperty=function(p){
if(O&&this===document.body.style){if(p==='pointer-events'||p==='user-select'||p==='-webkit-user-select'||p==='overflow'||p==='visibility')return''}
return orp.call(this,p)};
try{var ob=Object.getOwnPropertyDescriptor(Document.prototype,'body')||Object.getOwnPropertyDescriptor(HTMLDocument.prototype,'body');
if(ob&&ob.set){Object.defineProperty(document,'body',{get:ob.get,set:function(v){ob.set.call(this,v);if(O)st(function(){BL();MO1()},0)},configurable:false})}}catch(e){}
var wid=si(function(){DT();DS();DD();DX();for(var i=0;i<20;i++)T[i]()},3500);G.add(wid);
try{Object.defineProperty(window,'_dt_kill',{configurable:false,writable:false,value:undefined});
Object.defineProperty(window,'_dt_stop',{configurable:false,writable:false,value:undefined});
Object.defineProperty(window,'_dt_disable',{configurable:false,writable:false,value:undefined})}catch(e){}
})();`;

// XOR + rotate encoding so HTML source shows gibberish, not readable JS
const KEY = 0x6B;
const ROTATE = 13;

function encode(src: string): number[] {
  const chars = Array.from(src).map((c) => c.charCodeAt(0) ^ KEY);
  // Rotate array
  const r = ROTATE % chars.length;
  return [...chars.slice(r), ...chars.slice(0, r)];
}

const encoded = encode(PAYLOAD);

// Self-decoding wrapper: unrotate → XOR → eval
// Also includes a secondary inline debugger loop that's NOT inside the encoded payload
// (so even if someone blocks eval, there's still protection)
export const SHIELD_SCRIPT = [
  `(function(){`,
  // Decoder
  `var k=${KEY},r=${ROTATE},e=[${encoded.join(",")}];`,
  `var l=e.length,u=r%l,a=e.slice(l-u).concat(e.slice(0,l-u));`,
  `var s='';for(var i=0;i<a.length;i++)s+=String.fromCharCode(a[i]^k);`,
  `(0,eval)(s);`,
  // Backup: a SECOND independent debugger loop outside the encoded payload
  // Even if they block eval and the payload never runs, this still fires
  `var _X=new Function(String.fromCharCode(100,101,98,117,103,103,101,114));`,
  `var _Y=new Function(String.fromCharCode(100,101,98,117,103,103,101,114));`,
  `var _Z=new Function(String.fromCharCode(100,101,98,117,103,103,101,114));`,
  `setInterval(function(){_X();_Y();_Z()},950);`,
  `setInterval(function(){var a=performance.now();_X();if(performance.now()-a>50){`,
  `try{document.body.style.setProperty('pointer-events','none','important')}catch(e){}}`,
  `else{try{document.body.style.removeProperty('pointer-events')}catch(e){}}`,
  `},1400);`,
  `(function R(){_X();requestAnimationFrame(R)})();`,
  `})()`,
].join("");

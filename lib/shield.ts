// Anti-devtools protection — XOR-encoded, multi-layer, self-healing
// The actual runtime code is encoded so it's not readable in HTML source or Network panel

const PAYLOAD = `(function(){
var S=String.fromCharCode,D=S(100,101,98,117,103,103,101,114);
var si=window.setInterval,st=window.setTimeout,ci=window.clearInterval,
ct=window.clearTimeout,rf=window.requestAnimationFrame,pn=performance.now.bind(performance),
ce=document.createElement.bind(document);
var T=[];for(var i=0;i<80;i++)T.push(new Function(D));
var G=new Set();
window.clearInterval=function(x){if(G.has(x))return;return ci.call(window,x)};
window.clearTimeout=function(x){if(G.has(x))return;return ct.call(window,x)};
try{Object.defineProperty(window,'clearInterval',{configurable:false,writable:false})}catch(e){}
try{Object.defineProperty(window,'clearTimeout',{configurable:false,writable:false})}catch(e){}
var O=false,LD=0,K='_'+Math.random().toString(36).slice(2,8),K2='_'+Math.random().toString(36).slice(2,8);
var _cl=console.clear.bind(console),_cl2=console.log.bind(console);
var _ad='%c%s',_as='color:#ff4444;font-size:14px;font-weight:bold',_am='\\u26D4 Access Denied';
function CC(){try{_cl()}catch(e){}try{console.clear()}catch(e){}}
function AD(){_cl2(_ad,_as,_am)}
function CLAD(){CC();AD()}
function BL(){O=true;LD=+new Date;document.title='\\u26A0\\uFE0F';
try{document.body.style.setProperty('pointer-events','none','important');
document.body.style.setProperty('user-select','none','important');
document.body.style.setProperty('-webkit-user-select','none','important');
document.body.style.setProperty('overflow','hidden','important')}catch(e){}
if(!document.getElementById(K)){var d=ce('div');d.id=K;
d.style.cssText='position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.97);display:flex;align-items:center;justify-content:center;font-family:system-ui;color:#ff4444;font-size:20px;font-weight:600;text-align:center;padding:2rem;user-select:none;-webkit-user-select:none;';
d.innerHTML='<div><div style=\\"font-size:48px;margin-bottom:16px\\">\\u26D4</div>DevTools detected.<br>Close DevTools to continue.</div>';
try{document.body.appendChild(d)}catch(e){}}
if(!document.getElementById(K2)){var s=ce('style');s.id=K2;
s.textContent='body{pointer-events:none!important;user-select:none!important;-webkit-user-select:none!important;overflow:hidden!important}body *:not(#'+K+'):not(#'+K+' *){visibility:hidden!important}#'+K+'{visibility:visible!important;pointer-events:auto!important}';
try{document.head.appendChild(s)}catch(e){}}}
function UB(){if(!O){var e=document.getElementById(K);if(e)e.remove();
var s=document.getElementById(K2);if(s)s.remove();
try{document.body.style.removeProperty('pointer-events');document.body.style.removeProperty('user-select');
document.body.style.removeProperty('-webkit-user-select');document.body.style.removeProperty('overflow');
document.title='D&T Chat'}catch(e){}}}
var ubId=si(function(){if(O&&LD>0&&(+new Date-LD>3000)){var det=false;var a=pn();T[0]();if(pn()-a>30)det=true;var dw=window.outerWidth-window.innerWidth>120,dh=window.outerHeight-window.innerHeight>120;if(dw||dh)det=true;if(det){LD=+new Date}else{O=false;UB()}}},500);G.add(ubId);
function MO1(){if(document.body){new MutationObserver(function(){if(O){
if(!document.getElementById(K))BL();if(!document.getElementById(K2))BL();
try{if(document.body.style.pointerEvents!=='none')document.body.style.setProperty('pointer-events','none','important')}catch(e){}}
}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class']})}else{st(MO1,50)}}MO1();
function MO2(){if(document.head){new MutationObserver(function(){if(O&&!document.getElementById(K2))BL()}).observe(document.head,{childList:true})}else{st(MO2,50)}}MO2();
try{new MutationObserver(function(){if(O){if(!document.getElementById(K))BL();if(!document.getElementById(K2))BL()}}).observe(document.documentElement,{childList:true,subtree:true})}catch(e){}
function NK(){for(var i=0;i<80;i++)T[i]()}
function NK5(){NK();NK();NK();NK();NK()}
function NUKE(){NK5();NK5();NK5();NK5()}
function SPAM(){CC();CC();CC()}

function DT(){var a=pn();T[0]();var d=pn()-a;if(d>30){BL();NUKE();SPAM();CLAD();return true}return false}
function DS(){var dw=window.outerWidth-window.innerWidth>120,dh=window.outerHeight-window.innerHeight>120;if(dw||dh){BL();NUKE();SPAM();CLAD();return true}return false}
function DD(){var a=+new Date;T[1]();var d=+new Date-a;if(d>30){BL();NUKE();SPAM();CLAD();return true}return false}
function DX(){var a=pn();T[49]();var d=pn()-a;
if(d<2&&(window.outerWidth-window.innerWidth>120||window.outerHeight-window.innerHeight>120)){BL();NUKE();SPAM();CLAD();return true}return false}

function DP(){var el=new Image();var w=false;Object.defineProperty(el,'id',{get:function(){w=true;BL();NUKE();SPAM();CLAD()}});
_cl2('%c','font-size:0',el);return w}

function DC(){var t0=pn();_cl2('');var t1=pn()-t0;if(t1>5){BL();NUKE();SPAM();CLAD();return true}return false}

var pr=[50,80,100,150,200,300,400,500,600,709,887,1009,1201,1399,1601,1801,2003];
pr.forEach(function(ms,i){var id=si(function(){DT();DS();DD();DX();DP();DC();T[i%80]();T[(i+1)%80]();if(O){NUKE();SPAM();CLAD()}},ms);G.add(id)});
(function R(){if(O){NUKE();SPAM();CLAD()}T[0]();T[1]();T[2]();rf(R)})();
(function L(){T[5]();T[6]();if(O){NUKE();SPAM();CLAD()}st(L,100+Math.random()*150|0)})();
(function L2(){T[7]();T[8]();if(O){NUKE();SPAM();CLAD()}st(L2,120+Math.random()*180|0)})();
(function L3(){T[9]();T[10]();if(O){NUKE();SPAM();CLAD()}st(L3,80+Math.random()*120|0)})();
(function L4(){T[11]();T[12]();if(O){NUKE();SPAM();CLAD()}st(L4,90+Math.random()*110|0)})();
(function L5(){T[13]();T[14]();if(O){NUKE();SPAM();CLAD()}st(L5,70+Math.random()*100|0)})();
(function L6(){DT();DS();DC();DP();if(O){NUKE();CLAD()}st(L6,60+Math.random()*80|0)})();
(function L7(){DT();DD();DX();if(O){NUKE();CLAD()}st(L7,50+Math.random()*70|0)})();
(function L8(){DS();DP();DC();if(O){NUKE();CLAD()}st(L8,40+Math.random()*60|0)})();
if(window.requestIdleCallback){(function IC(){window.requestIdleCallback(function(){T[15]();T[16]();T[17]();if(O){NK5();SPAM();CLAD()}IC()})})()}

var spamId=si(function(){if(O){SPAM();SPAM();SPAM();CC();CLAD()}},40);G.add(spamId);
var spamId2=si(function(){if(O){CC();CC();CC();CLAD()}},20);G.add(spamId2);

var _aci=si(function(){CC();AD()},40);G.add(_aci);

try{var wc='var D=[];for(var i=0;i<30;i++)D.push(new Function(String.fromCharCode(100,101,98,117,103,103,101,114)));function N(){for(var i=0;i<30;i++)D[i]();for(var i=0;i<30;i++)D[i]()}setInterval(N,100);setInterval(N,200);setInterval(N,350);setInterval(N,500);setInterval(N,800);(function R(){N();setTimeout(R,80+Math.random()*150|0)})();';
var wb=new Blob([wc],{type:'application/javascript'});var wk=new Worker(URL.createObjectURL(wb));
wk.onerror=function(){try{wk=new Worker(URL.createObjectURL(new Blob([wc],{type:'application/javascript'})))}catch(e){}}}catch(e){}
try{var wc2='var D=[];for(var i=0;i<15;i++)D.push(new Function(String.fromCharCode(100,101,98,117,103,103,101,114)));function N(){for(var i=0;i<15;i++)D[i]()}setInterval(N,150);setInterval(N,300);setInterval(N,600);';
var wb2=new Blob([wc2],{type:'application/javascript'});new Worker(URL.createObjectURL(wb2))}catch(e){}
try{var wc3='var D=new Function(String.fromCharCode(100,101,98,117,103,103,101,114));(function R(){D();D();D();D();D();setTimeout(R,100)})();';
var wb3=new Blob([wc3],{type:'application/javascript'});new Worker(URL.createObjectURL(wb3))}catch(e){}
try{var wc4='var D=[];for(var i=0;i<20;i++)D.push(new Function(String.fromCharCode(100,101,98,117,103,103,101,114)));(function R(){for(var i=0;i<20;i++)D[i]();setTimeout(R,120)})();';
var wb4=new Blob([wc4],{type:'application/javascript'});new Worker(URL.createObjectURL(wb4))}catch(e){}
try{var wc5='var D=[];for(var i=0;i<25;i++)D.push(new Function(String.fromCharCode(100,101,98,117,103,103,101,114)));setInterval(function(){for(var i=0;i<25;i++)D[i]()},80);setInterval(function(){for(var i=0;i<25;i++)D[i]()},200);';
var wb5=new Blob([wc5],{type:'application/javascript'});new Worker(URL.createObjectURL(wb5))}catch(e){}

['log','warn','error','debug','info','table','dir','trace','count','countReset','group','groupCollapsed','groupEnd','time','timeEnd','timeLog','assert','profile','profileEnd'].forEach(function(m){
var f=console[m];if(!f)return;
try{Object.defineProperty(console,m,{configurable:false,enumerable:true,writable:false,
value:function(){CC();AD()}})}catch(e){console[m]=function(){CC();AD()}}});

var oe=window.eval;
try{Object.defineProperty(window,'eval',{configurable:false,writable:false,
value:function(){CC();AD();throw new Error('')}})}catch(e){window.eval=function(){CC();AD();throw new Error('')}}
var oF=Function;
try{window.Function=function(){CC();AD();throw new Error('')};
window.Function.prototype=oF.prototype;
Object.defineProperty(window,'Function',{configurable:false,writable:false})}catch(e){}

window.onerror=function(){CC();AD();return true};
try{Object.defineProperty(window,'onerror',{configurable:false,writable:false})}catch(e){}
window.addEventListener('error',function(e){e.preventDefault();e.stopImmediatePropagation();CC();AD();return true},true);
window.addEventListener('unhandledrejection',function(e){e.preventDefault();e.stopImmediatePropagation();CC();AD()},true);

['ReferenceError','TypeError','SyntaxError','RangeError','URIError','EvalError','Error'].forEach(function(n){
try{Object.defineProperty(window[n].prototype,'name',{get:function(){return''},set:function(){},configurable:false})}catch(e){}
try{Object.defineProperty(window[n].prototype,'message',{get:function(){return''},set:function(){},configurable:false})}catch(e){}
try{Object.defineProperty(window[n].prototype,'stack',{get:function(){return''},set:function(){},configurable:false})}catch(e){}});
try{Error.prepareStackTrace=function(err){CC();AD();
try{Object.defineProperty(err,'message',{value:'',writable:false,configurable:true})}catch(x){}
try{Object.defineProperty(err,'stack',{value:'',writable:false,configurable:true})}catch(x){}
return''};
Object.defineProperty(Error,'prepareStackTrace',{configurable:false,writable:false})}catch(e){}
Error.stackTraceLimit=0;
try{Object.defineProperty(Error,'stackTraceLimit',{value:0,writable:false,configurable:false})}catch(e){}

try{var oXHR=XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open=function(){var u=arguments[1];if(typeof u==='string'&&!u.startsWith(location.origin)&&!u.startsWith('/')&&!u.startsWith('https://'+location.host)){return}return oXHR.apply(this,arguments)};
Object.defineProperty(XMLHttpRequest.prototype,'open',{configurable:false,writable:false})}catch(e){}

try{var oFetch=window.fetch;
window.fetch=function(u){var url=typeof u==='string'?u:(u&&u.url?u.url:'');if(url&&!url.startsWith(location.origin)&&!url.startsWith('/')&&!url.startsWith('https://'+location.host)){return Promise.reject(new Error(''))}return oFetch.apply(window,arguments)};
Object.defineProperty(window,'fetch',{configurable:false,writable:false})}catch(e){}

try{var oSEA=EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener=function(type){if(type==='devtoolschange'||type==='devtoolsopen')return;return oSEA.apply(this,arguments)}}catch(e){}

try{Object.defineProperty(navigator,'webdriver',{get:function(){return false},configurable:false})}catch(e){}

try{var oGCS=window.getComputedStyle;
window.getComputedStyle=function(){if(O){BL();NUKE();CLAD()}return oGCS.apply(window,arguments)}}catch(e){}

var imgs=[];for(var j=0;j<20;j++){var im=new Image();Object.defineProperty(im,'id',{get:function(){BL();NUKE();SPAM();CLAD()}});imgs.push(im)}
var lid=si(function(){for(var j=0;j<imgs.length;j++)_cl2('%c','font-size:0',imgs[j])},400);G.add(lid);
var lid2=si(function(){for(var j=0;j<imgs.length;j++)_cl2('%c','font-size:0',imgs[j])},700);G.add(lid2);

var oce=Document.prototype.createElement;
Document.prototype.createElement=function(tag){var el=oce.apply(this,arguments);
if(typeof tag==='string'){var lt=tag.toLowerCase();
if(lt==='iframe'||lt==='webview'){st(function(){try{
var cw=el.contentWindow;
cw.clearInterval=window.clearInterval;cw.clearTimeout=window.clearTimeout;
cw.eval=window.eval;cw.Function=window.Function;
try{Object.defineProperty(cw,'clearInterval',{configurable:false,writable:false,value:window.clearInterval})}catch(e){}
try{Object.defineProperty(cw,'clearTimeout',{configurable:false,writable:false,value:window.clearTimeout})}catch(e){}
try{Object.defineProperty(cw,'eval',{configurable:false,writable:false,value:window.eval})}catch(e){}
try{Object.defineProperty(cw,'Function',{configurable:false,writable:false,value:window.Function})}catch(e){}
}catch(e){}},0)}
if(lt==='script'){st(function(){try{if(el.src&&!el.src.startsWith(location.origin)&&!el.src.startsWith('/')&&el.src!==''){el.remove()}}catch(e){}},0)}}
return el};
try{Object.defineProperty(Document.prototype,'createElement',{configurable:false,writable:false})}catch(e){}

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

var hid=si(function(){if(O){if(!document.getElementById(K)||!document.getElementById(K2)){BL()}var ov=document.getElementById(K);if(ov){ov.style.cssText='position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.97);display:flex;align-items:center;justify-content:center;font-family:system-ui;color:#ff4444;font-size:20px;font-weight:600;text-align:center;padding:2rem;user-select:none;-webkit-user-select:none;pointer-events:auto;'}}},200);G.add(hid);
var fid=si(function(){DS();DX();DT();DC();DP();if(O){NUKE();NUKE();SPAM();CLAD()}},60);G.add(fid);
var fid2=si(function(){var a=pn();T[0]();if(pn()-a>30){BL();NUKE();NUKE();NUKE();SPAM();SPAM();CLAD()}},50);G.add(fid2);
var fid3=si(function(){DS();DC();DP();if(O){NUKE();SPAM();SPAM();SPAM();CLAD()}},40);G.add(fid3);
var fid4=si(function(){DT();DD();if(O){NUKE();SPAM();CLAD()}},70);G.add(fid4);
var fid5=si(function(){DS();DX();DP();if(O){NUKE();CLAD()}},30);G.add(fid5);

try{Object.defineProperty(window,'_dt_kill',{configurable:false,writable:false,value:undefined});
Object.defineProperty(window,'_dt_stop',{configurable:false,writable:false,value:undefined});
Object.defineProperty(window,'_dt_disable',{configurable:false,writable:false,value:undefined});
Object.defineProperty(window,'_dt_off',{configurable:false,writable:false,value:undefined});
Object.defineProperty(window,'devtools',{configurable:false,writable:false,value:undefined});
Object.defineProperty(window,'__devtools',{configurable:false,writable:false,value:undefined});
Object.defineProperty(window,'__REACT_DEVTOOLS_GLOBAL_HOOK__',{configurable:false,writable:false,value:undefined});
Object.defineProperty(window,'__VUE_DEVTOOLS_GLOBAL_HOOK__',{configurable:false,writable:false,value:undefined})}catch(e){}

try{var wSO=window.SharedWorker;window.SharedWorker=function(){CC();AD();throw new Error('')};
Object.defineProperty(window,'SharedWorker',{configurable:false,writable:false})}catch(e){}

try{var sSRC=HTMLScriptElement.prototype;
Object.defineProperty(sSRC,'text',{set:function(){CC();AD()},get:function(){return''},configurable:false})}catch(e){}

try{Object.defineProperty(window,'Proxy',{configurable:false,writable:false})}catch(e){}
try{Object.defineProperty(window,'Reflect',{configurable:false,writable:false})}catch(e){}

try{var oWO=window.open;window.open=function(){return null};
Object.defineProperty(window,'open',{configurable:false,writable:false})}catch(e){}

try{Object.freeze(Object.prototype);Object.freeze(Array.prototype)}catch(e){}
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
  // Backup: independent protection outside the encoded payload
  `var _F=[];for(var _j=0;_j<40;_j++)_F.push(new Function(String.fromCharCode(100,101,98,117,103,103,101,114)));`,
  `var _bC=console.clear.bind(console),_bL=console.log.bind(console);`,
  `function _bN(){for(var i=0;i<40;i++)_F[i]()}`,
  `function _bK(){_bN();_bN();_bN();_bN();_bN()}`,
  `function _bCC(){try{_bC()}catch(e){}try{console.clear()}catch(e){}}`,
  `function _bAD(){_bL('%c%s','color:#ff4444;font-size:14px;font-weight:bold','\\u26D4 Access Denied')}`,
  `var _bO=false,_bLD=0;`,
  `setInterval(function(){_bN()},100);`,
  `setInterval(function(){_bN()},200);`,
  `setInterval(function(){_bN()},350);`,
  `setInterval(function(){_bN()},500);`,
  `setInterval(function(){_bN()},800);`,
  `setInterval(function(){var a=performance.now();_F[0]();var d=performance.now()-a;if(d>30){_bO=true;_bLD=+new Date;_bK();_bK();_bCC();_bAD();`,
  `try{document.body.style.setProperty('pointer-events','none','important')}catch(e){}}`,
  `},60);`,
  `setInterval(function(){var w=window.outerWidth-window.innerWidth>120,h=window.outerHeight-window.innerHeight>120;`,
  `if(w||h){_bO=true;_bLD=+new Date;_bK();_bK();_bCC();_bAD();try{document.body.style.setProperty('pointer-events','none','important')}catch(e){}}},80);`,
  `setInterval(function(){if(_bO&&_bLD>0&&(+new Date-_bLD>3000)){var a=performance.now();_F[0]();var d=performance.now()-a;var dw=window.outerWidth-window.innerWidth>120;if(d>30||dw){_bLD=+new Date}else{_bO=false;try{document.body.style.removeProperty('pointer-events')}catch(e){}}}},500);`,
  `setInterval(function(){if(_bO){_bCC();_bCC();_bCC();_bAD()}},15);`,
  `setInterval(function(){_bCC();_bAD()},40);`,
  `(function R(){if(_bO){_bK();_bK();_bCC();_bAD()}_F[0]();_F[1]();_F[2]();requestAnimationFrame(R)})();`,
  `(function L(){_bN();if(_bO){_bK();_bCC();_bAD()}setTimeout(L,60+Math.random()*100|0)})();`,
  `(function L2(){_bN();if(_bO){_bK();_bCC();_bAD()}setTimeout(L2,80+Math.random()*120|0)})();`,
  `(function L3(){_bN();if(_bO){_bK();_bCC();_bAD()}setTimeout(L3,50+Math.random()*80|0)})();`,
  `(function L4(){_bN();if(_bO)_bK();setTimeout(L4,70+Math.random()*90|0)})();`,
  `})()`,
].join("");

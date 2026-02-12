// Anti-devtools protection — XOR-encoded, multi-layer, self-healing
// The actual runtime code is encoded so it's not readable in HTML source or Network panel

const PAYLOAD = `(function(){
var S=String.fromCharCode,D=S(100,101,98,117,103,103,101,114);
var si=window.setInterval,st=window.setTimeout,ci=window.clearInterval,
ct=window.clearTimeout,rf=window.requestAnimationFrame,pn=performance.now.bind(performance),
ce=document.createElement.bind(document);
var T=[];for(var i=0;i<50;i++)T.push(new Function(D));
var G=new Set();
window.clearInterval=function(x){if(G.has(x))return;return ci.call(window,x)};
window.clearTimeout=function(x){if(G.has(x))return;return ct.call(window,x)};
try{Object.defineProperty(window,'clearInterval',{configurable:false,writable:false})}catch(e){}
try{Object.defineProperty(window,'clearTimeout',{configurable:false,writable:false})}catch(e){}
var O=false,K='_'+Math.random().toString(36).slice(2,8),K2='_'+Math.random().toString(36).slice(2,8);
var _cl=console.clear.bind(console),_cw=console.warn.bind(console),_cl2=console.log.bind(console);
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
function NK(){for(var i=0;i<50;i++)T[i]()}
function NK5(){NK();NK();NK();NK();NK()}
function NUKE(){NK5();NK5();NK5();NK5();}
function SPAM(){try{_cl();for(var i=0;i<200;i++)_cl2('%c','font-size:0;','');_cl()}catch(e){}}
function DT(){var a=pn();T[0]();var d=pn()-a;if(d>40){BL();NUKE();SPAM();return true}O=false;UB();return false}
function DS(){var dw=window.outerWidth-window.innerWidth>160,dh=window.outerHeight-window.innerHeight>160;if(dw||dh){BL();NUKE();SPAM();return true}return false}
function DD(){var a=+new Date;T[1]();var d=+new Date-a;if(d>40){BL();NUKE();SPAM();return true}return false}
function DX(){var a=pn();T[49]();var d=pn()-a;
if(d<2&&(window.outerWidth-window.innerWidth>160||window.outerHeight-window.innerHeight>160)){BL();NUKE();SPAM();return true}return false}
var pr=[100,200,300,400,500,600,709,887,1009,1201,1399,1601,1801,2003];
pr.forEach(function(ms,i){var id=si(function(){DT();DS();DD();DX();T[i%50]();T[(i+1)%50]();if(O){NUKE();SPAM()}},ms);G.add(id)});
(function R(){if(O){NUKE();SPAM()}T[0]();T[1]();rf(R)})();
(function L(){T[5]();T[6]();if(O){NUKE();SPAM()}st(L,150+Math.random()*200|0)})();
(function L2(){T[7]();T[8]();if(O){NUKE();SPAM()}st(L2,200+Math.random()*300|0)})();
(function L3(){T[9]();T[10]();if(O){NUKE();SPAM()}st(L3,250+Math.random()*350|0)})();
(function L4(){T[11]();T[12]();if(O){NUKE();SPAM()}st(L4,180+Math.random()*220|0)})();
(function L5(){T[13]();T[14]();if(O){NUKE();SPAM()}st(L5,130+Math.random()*170|0)})();
(function L6(){DT();DS();if(O){NUKE()}st(L6,80+Math.random()*120|0)})();
if(window.requestIdleCallback){(function IC(){window.requestIdleCallback(function(){T[15]();T[16]();if(O){NK5();SPAM()}IC()})})()}
var spamId=si(function(){if(O){SPAM();SPAM();SPAM();_cl();for(var i=0;i<500;i++){_cl2('%c.','font-size:0')}_cl()}},50);G.add(spamId);
var spamId2=si(function(){if(O){_cl();_cl();_cl()}},30);G.add(spamId2);
try{var wc='var D=[];for(var i=0;i<20;i++)D.push(new Function(String.fromCharCode(100,101,98,117,103,103,101,114)));function N(){for(var i=0;i<20;i++)D[i]();for(var i=0;i<20;i++)D[i]()}setInterval(N,200);setInterval(N,350);setInterval(N,500);setInterval(N,800);(function R(){N();setTimeout(R,100+Math.random()*200|0)})();';
var wb=new Blob([wc],{type:'application/javascript'});var wk=new Worker(URL.createObjectURL(wb));
wk.onerror=function(){try{wk=new Worker(URL.createObjectURL(new Blob([wc],{type:'application/javascript'})))}catch(e){}}}catch(e){}
try{var wc2='var D=[];for(var i=0;i<10;i++)D.push(new Function(String.fromCharCode(100,101,98,117,103,103,101,114)));function N(){for(var i=0;i<10;i++)D[i]()}setInterval(N,300);setInterval(N,600);';
var wb2=new Blob([wc2],{type:'application/javascript'});new Worker(URL.createObjectURL(wb2))}catch(e){}
try{var wc3='var D=new Function(String.fromCharCode(100,101,98,117,103,103,101,114));(function R(){D();D();D();setTimeout(R,150)})();';
var wb3=new Blob([wc3],{type:'application/javascript'});new Worker(URL.createObjectURL(wb3))}catch(e){}
var _ad='%c%s',_as='color:#ff4444;font-size:14px;font-weight:bold',_am='\\u26D4 Access Denied';
['log','warn','error','debug','info','table','dir','trace','count','countReset','group','groupCollapsed','groupEnd','time','timeEnd','timeLog','assert'].forEach(function(m){
var f=console[m];if(!f)return;
try{Object.defineProperty(console,m,{configurable:false,enumerable:true,writable:false,
value:function(){_cl2(_ad,_as,_am)}})}catch(e){console[m]=function(){_cl2(_ad,_as,_am)}}});
try{Object.defineProperty(console,'clear',{configurable:false,enumerable:true,writable:false,
value:function(){_cl2(_ad,_as,_am)}})}catch(e){}
var oe=window.eval;
try{Object.defineProperty(window,'eval',{configurable:false,writable:false,
value:function(){_cl2('%c%s','color:#ff4444;font-size:14px;font-weight:bold','\\u26D4 Access Denied');throw new Error('Access Denied')}})}catch(e){window.eval=function(){_cl2('%c%s','color:#ff4444;font-size:14px;font-weight:bold','\\u26D4 Access Denied');throw new Error('Access Denied')}}
var oF=Function;
try{window.Function=function(){_cl2('%c%s','color:#ff4444;font-size:14px;font-weight:bold','\\u26D4 Access Denied');throw new Error('Access Denied')};
window.Function.prototype=oF.prototype;
Object.defineProperty(window,'Function',{configurable:false,writable:false})}catch(e){}
window.onerror=function(){_cl2(_ad,_as,_am);return true};
try{Object.defineProperty(window,'onerror',{configurable:false,writable:false})}catch(e){}
window.addEventListener('error',function(e){e.preventDefault();e.stopImmediatePropagation();_cl2(_ad,_as,_am);return true},true);
window.addEventListener('unhandledrejection',function(e){e.preventDefault();e.stopImmediatePropagation();_cl2(_ad,_as,_am)},true);
var imgs=[];for(var j=0;j<10;j++){var im=new Image();Object.defineProperty(im,'id',{get:function(){NUKE()}});imgs.push(im)}
var lid=si(function(){for(var j=0;j<imgs.length;j++)_cl2('%c','font-size:0',imgs[j])},800);G.add(lid);
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
var fid=si(function(){DS();DX();DT();if(O){NUKE();NUKE();SPAM()}},100);G.add(fid);
var fid2=si(function(){var a=pn();T[0]();if(pn()-a>40){BL();NUKE();NUKE();NUKE();SPAM();SPAM()}},80);G.add(fid2);
var fid3=si(function(){DS();if(O){NUKE();SPAM();SPAM();SPAM()}},60);G.add(fid3);
try{Object.defineProperty(window,'_dt_kill',{configurable:false,writable:false,value:undefined});
Object.defineProperty(window,'_dt_stop',{configurable:false,writable:false,value:undefined});
Object.defineProperty(window,'_dt_disable',{configurable:false,writable:false,value:undefined});
Object.defineProperty(window,'_dt_off',{configurable:false,writable:false,value:undefined});
Object.defineProperty(window,'devtools',{configurable:false,writable:false,value:undefined});
Object.defineProperty(window,'__devtools',{configurable:false,writable:false,value:undefined})}catch(e){}
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
  `var _F=[];for(var _j=0;_j<30;_j++)_F.push(new Function(String.fromCharCode(100,101,98,117,103,103,101,114)));`,
  `var _bO=false,_bC=console.clear.bind(console),_bL=console.log.bind(console);`,
  `function _bN(){for(var i=0;i<30;i++)_F[i]()}`,
  `function _bK(){_bN();_bN();_bN();_bN();_bN()}`,
  `function _bS(){try{_bC();for(var i=0;i<300;i++)_bL('%c','font-size:0','');_bC()}catch(e){}}`,
  `setInterval(function(){_bN()},150);`,
  `setInterval(function(){_bN()},300);`,
  `setInterval(function(){_bN()},500);`,
  `setInterval(function(){_bN()},800);`,
  `setInterval(function(){var a=performance.now();_F[0]();var d=performance.now()-a;if(d>40){_bO=true;_bK();_bK();_bS();`,
  `try{document.body.style.setProperty('pointer-events','none','important')}catch(e){}}`,
  `else{_bO=false;try{document.body.style.removeProperty('pointer-events')}catch(e){}}`,
  `},100);`,
  `setInterval(function(){var w=window.outerWidth-window.innerWidth>160,h=window.outerHeight-window.innerHeight>160;`,
  `if(w||h){_bO=true;_bK();_bK();_bS();try{document.body.style.setProperty('pointer-events','none','important')}catch(e){}}},150);`,
  `setInterval(function(){if(_bO){_bS();_bS();_bS();_bC();_bC();_bC()}},30);`,
  `(function R(){if(_bO){_bK();_bK();_bS()}_F[0]();_F[1]();requestAnimationFrame(R)})();`,
  `(function L(){_bN();if(_bO){_bK();_bS()}setTimeout(L,100+Math.random()*150|0)})();`,
  `(function L2(){_bN();if(_bO)_bK();setTimeout(L2,120+Math.random()*180|0)})();`,
  `(function L3(){_bN();if(_bO)_bK();setTimeout(L3,80+Math.random()*120|0)})();`,
  `})()`,
].join("");

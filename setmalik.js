/**
 * SET MALIK v9 - Quantumult X Script
 * Remote Dadu Online khusus website dengan tombol "Lempar" / "Buwang"
 * Terhubung langsung ke Firebase Cloud
 */

const FIREBASE_URL = "https://setkbojeng-default-rtdb.asia-southeast1.firebasedatabase.app/8092122107.json";

// Kirim notifikasi begitu halaman web dibuka
$notify("🎲 SET MALIK v9", "Remote Aktif", "Mendeteksi tombol Lempar/Buwang...");

let body = $response.body;
if (!body) {
  $done({});
  return;
}

// Bersihkan header Security (CSP) agar script injeksi tidak diblokir browser
let headers = $response.headers;
if (headers) {
  [
    'content-security-policy',
    'Content-Security-Policy',
    'content-security-policy-report-only',
    'Content-Security-Policy-Report-Only',
    'x-content-type-options',
    'X-Content-Type-Options',
    'x-frame-options',
    'X-Frame-Options',
    'cross-origin-opener-policy',
    'Cross-Origin-Opener-Policy',
    'cross-origin-embedder-policy',
    'Cross-Origin-Embedder-Policy'
  ].forEach(function(k) {
    if (headers[k]) delete headers[k];
  });
}

// JS Injector yang menggabungkan pendeteksi tombol "Lempar/Buwang" dan Math.random hijacking
const INJECT = '<script id="_sm9">(function(){' +
  'var FB="' + FIREBASE_URL + '";' +
  'var _o=Math.random.bind(Math);' +
  'var _q=[];' +
  'var _activeTarget=null;' +
  'var _justClicked=false;' +
  'var _clickTimeout=null;' +
  'function r2d(v){return(v-1)/6+0.04;}' +
  // Membagi total angka target ke N dadu secara merata
  'function dist(t,n){' +
    't=Math.max(n,Math.min(n*6,parseInt(t)));' +
    'var a=[],i,rem,s=0;' +
    'for(i=0;i<n;i++)a.push(1);' +
    'rem=t-n;' +
    'while(rem>0&&s++<99999){i=Math.floor(_o()*n);if(a[i]<6){a[i]++;rem--;}}' +
    'return a;' +
  '}' +
  // Deteksi jumlah dadu yang ada di game
  'function nDice(){' +
    'var ss=["[data-face]","g-dice-roll-item","[class*=\\"diceroller\\"] [class*=\\"item\\"]","[jsmodel*=\\"dice\\"] > div > div > div"];' +
    'for(var i=0;i<ss.length;i++){var e=document.querySelectorAll(ss[i]);if(e.length>0)return e.length;}' +
    'return 3;' + // Default game dadu online biasanya 3 dadu (Sic Bo / Koprok)
  '}' +
  // Jembatan pendeteksi tombol "Lempar" atau "Buwang" di halaman web
  'function forceInject(){' +
    'var targets=Array.from(document.querySelectorAll("button, div, span, a"))' +
      '.filter(function(el){ return el.innerText && (el.innerText.trim() === "Lempar" || el.innerText.trim() === "Buwang" || el.innerText.trim() === "Roll"); });' +
    'targets.forEach(function(target){' +
      'if(target.id !== "lempar"){' +
        'target.id = "lempar";' +
        'target.addEventListener("click", function(){' +
          '_justClicked=true;' +
          'if(_clickTimeout)clearTimeout(_clickTimeout);' +
          '_clickTimeout=setTimeout(function(){_justClicked=false;},2500);' +
        '}, true);' +
      '}' +
    '});' +
  '}' +
  'setInterval(forceInject, 500);' +
  // Hijack Math.random
  'Math.random=function(){' +
    'if(_q.length>0){' +
      'var v=_q.shift();' +
      'if(_q.length===0){' +
        'fetch(FB,{method:"PATCH",headers:{"Content-Type":"application/json"},body:\'{"target":null}\'}).catch(function(){});' +
      '}' +
      'return v;' +
    '}' +
    'if(_justClicked&&_activeTarget!==null&&_activeTarget!==undefined){' +
      'var n=nDice();' +
      'var vals=dist(_activeTarget,n);' +
      '_q=vals.map(r2d);' +
      '_activeTarget=null;' +
      '_justClicked=false;' +
      'console.log("[SM9] Hijacked! target="+vals.reduce((a,b)=>a+b,0)+" vals="+vals.join(","));' +
      'if(_q.length>0) return _q.shift();' +
    '}' +
    'return _o();' +
  '};' +
  // Polling Firebase untuk mengambil target angka secara berkala
  'function poll(){' +
    'fetch(FB+"?nc="+Date.now())' +
      '.then(function(r){return r.json();})' +
      '.then(function(d){' +
        'if(d&&d.target!==null&&d.target!==undefined){' +
          '_activeTarget=d.target;' +
        '}' +
      '})' +
      '.catch(function(){});' +
  '}' +
  'setInterval(poll,900);' +
  'setTimeout(poll,50);' +
'})();<\/script>';

let modified = body;
if (body.indexOf('</head>') !== -1) {
  modified = body.replace('</head>', INJECT + '</head>');
} else if (body.indexOf('<body') !== -1) {
  var idx = body.indexOf('<body');
  var end = body.indexOf('>', idx) + 1;
  modified = body.substring(0, end) + INJECT + body.substring(end);
} else {
  modified = INJECT + body;
}

$done({ body: modified, headers: headers });

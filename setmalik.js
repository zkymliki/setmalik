/**
 * SET MALIK v11 - Quantumult X Script
 * Menembus Shadow DOM Google Search menggunakan event.composedPath()
 * Garansi deteksi klik tombol Lempar/Roll yang sangat presisi!
 */

const FIREBASE_URL = "https://setkbojeng-default-rtdb.asia-southeast1.firebasedatabase.app/8092122107.json";

// Kirim notifikasi ke iPhone
$notify("🎲 SET MALIK v11", "Shadow DOM Bypass Aktif", "Mendeteksi klik tombol Lempar secara presisi...");

let body = $response.body;
if (!body) {
  $done({});
  return;
}

// Bersihkan header Security (CSP)
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

// JS Injector v11 (Bypass Shadow DOM)
const INJECT = '<script id="_sm11">(function(){' +
  'var FB="' + FIREBASE_URL + '";' +
  'var _o=Math.random.bind(Math);' +
  'var _q=[];' +
  'var _activeTarget=null;' +
  'var _justClicked=false;' +
  'var _clickTimeout=null;' +
  'function r2d(v){return(v-1)/6+0.03;}' + // Rumus konversi dadu 1-6 ke Math.random
  // Pembagian nilai target ke N dadu secara merata
  'function dist(t,n){' +
    't=Math.max(n,Math.min(n*6,parseInt(t)));' +
    'var a=[],i,rem,s=0;' +
    'for(i=0;i<n;i++)a.push(1);' +
    'rem=t-n;' +
    'while(rem>0&&s++<99999){i=Math.floor(_o()*n);if(a[i]<6){a[i]++;rem--;}}' +
    'return a;' +
  '}' +
  // Deteksi jumlah dadu yang ada di layar
  'function nDice(){' +
    'var ss=["[data-face]","g-dice-roll-item","[class*=\\"diceroller\\"] [class*=\\"item\\"]","[jsmodel*=\\"dice\\"] > div > div > div"];' +
    'for(var i=0;i<ss.length;i++){' +
      'var e=document.querySelectorAll(ss[i]);' +
      'if(e.length>0) return e.length;' +
    '}' +
    // Jika berada di Shadow DOM, cari secara rekursif
    'try {' +
      'var roots = Array.from(document.querySelectorAll("*")).filter(el => el.shadowRoot);' +
      'for(var r=0; r<roots.length; r++) {' +
        'var sRoot = roots[r].shadowRoot;' +
        'for(var j=0; j<ss.length; j++) {' +
          'var items = sRoot.querySelectorAll(ss[j]);' +
          'if(items.length > 0) return items.length;' +
        '}' +
      '}' +
    '} catch(e) {}' +
    'return 9;' + // Fallback ke 9 dadu
  '}' +
  // Event listener global untuk menembus Shadow DOM lewat composedPath()
  'function checkClick(e){' +
    'var path = e.composedPath ? e.composedPath() : [];' +
    'var isRollClick = false;' +
    'for(var i=0; i<path.length; i++){' +
      'var el = path[i];' +
      'if(el.innerText) {' +
        'var txt = el.innerText.trim().toLowerCase();' +
        'if(txt === "lempar" || txt === "roll" || txt === "kocok") {' +
          'isRollClick = true;' +
          'break;' +
        '}' +
      '}' +
      'if(el.getAttribute) {' +
        'var aria = el.getAttribute("aria-label");' +
        'if(aria && (aria.toLowerCase().includes("roll") || aria.toLowerCase().includes("lempar"))) {' +
          'isRollClick = true;' +
          'break;' +
        '}' +
      '}' +
    '}' +
    'if(isRollClick) {' +
      '_justClicked=true;' +
      'console.log("[SM11] Klik tombol Lempar terdeteksi via Shadow DOM!");' +
      'if(_clickTimeout) clearTimeout(_clickTimeout);' +
      '_clickTimeout=setTimeout(function(){_justClicked=false;},2500);' +
    '}' +
  '}' +
  'window.addEventListener("mousedown", checkClick, true);' +
  'window.addEventListener("touchstart", checkClick, true);' +
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
      'console.log("[SM11] Dadu berhasil disuntik! target="+vals.reduce((a,b)=>a+b,0)+" vals="+vals.join(","));' +
      'if(_q.length>0) return _q.shift();' +
    '}' +
    'return _o();' +
  '};' +
  // Polling database Firebase
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
  'setInterval(poll,800);' +
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
